#!/usr/bin/env python3
"""Graba la voz de la narradora con una voz neuronal libre (Piper, es_MX «claude», licencia Apache-2.0).

Uso:
  node tools/narration-texts.mjs --json > /tmp/narracion.json
  python3 tools/gen-voice.py /tmp/narracion.json <modelo.onnx> assets/voz [--jobs 3]

Cada grupo se guarda como un paquete assets/voz/<grupo>.ogg: los audios Ogg Opus de sus frases, uno detrás de
otro. assets/voz/index.json dice, para cada paquete, qué frases trae y cuántos bytes ocupa cada una.
Las frases que ya están grabadas (mismo texto) se reutilizan, así que volver a correrlo solo graba lo nuevo.
"""
import json, os, subprocess, sys, tempfile, wave, re
from concurrent.futures import ProcessPoolExecutor

LENGTH = 1.08      # un poquito más pausado que lo normal: es para niños
NOISE = 0.62
NOISE_W = 0.78
BITRATE = '20k'
CACHE = None
_voice = None
_cfg = None


def _init(model):
    global _voice, _cfg
    import onnxruntime
    from piper import PiperVoice, SynthesisConfig
    opts = onnxruntime.SessionOptions()
    opts.intra_op_num_threads = 1
    opts.inter_op_num_threads = 1
    _voice = PiperVoice.load(model)
    try:
        _voice.session = onnxruntime.InferenceSession(model, sess_options=opts, providers=['CPUExecutionProvider'])
    except Exception:
        pass
    _cfg = SynthesisConfig(length_scale=LENGTH, noise_scale=NOISE, noise_w_scale=NOISE_W)


def speakable(text):
    t = text.replace('«', '').replace('»', '').replace('“', '').replace('”', '')
    t = re.sub(r'^([A-D]):$', lambda m: {'A': 'A.', 'B': 'Be.', 'C': 'Ce.', 'D': 'De.'}[m.group(1)], t)
    t = t.replace('Pbro.', 'Presbítero').replace('Av.', 'Avenida')
    if t.endswith(':'):
        t = t[:-1] + ','
    return t


def render(job):
    key, text, out = job
    if os.path.exists(out) and os.path.getsize(out) > 0:
        return key
    fd, wav_path = tempfile.mkstemp(suffix='.wav')
    os.close(fd)
    try:
        with wave.open(wav_path, 'wb') as w:
            _voice.synthesize_wav(speakable(text), w, syn_config=_cfg)
        # Suave: sin ruido grave, un toque de compresión y volumen parejo; 60 ms de silencio al final.
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav_path,
                        '-af', 'highpass=f=75,lowpass=f=8500,acompressor=threshold=-21dB:ratio=2.2:attack=8:release=180,'
                               'loudnorm=I=-17:TP=-2:LRA=9,apad=pad_dur=0.06',
                        '-ac', '1', '-ar', '24000', '-c:a', 'libopus', '-b:a', BITRATE, '-application', 'voip',
                        '-map_metadata', '-1', '-fflags', '+bitexact', '-flags:a', '+bitexact', out + '.tmp.ogg'], check=True)
        os.replace(out + '.tmp.ogg', out)
    finally:
        os.unlink(wav_path)
    return key


def main():
    src, model, dest = sys.argv[1], sys.argv[2], sys.argv[3]
    jobs = int(sys.argv[sys.argv.index('--jobs') + 1]) if '--jobs' in sys.argv else 3
    groups = json.load(open(src))
    cache = os.path.join(dest, '.cache')
    os.makedirs(cache, exist_ok=True)
    work = []
    for g in groups:
        for s in g['sentences']:
            work.append((s['key'], s['text'], os.path.join(cache, s['key'] + '.ogg')))
    todo = [w for w in work if not os.path.exists(w[2])]
    print(f'{len(work)} frases, {len(todo)} por grabar', flush=True)
    done = 0
    with ProcessPoolExecutor(max_workers=jobs, initializer=_init, initargs=(model,)) as ex:
        for _ in ex.map(render, todo, chunksize=8):
            done += 1
            if done % 200 == 0:
                print(f'  {done}/{len(todo)}', flush=True)
    # Paquetes por grupo + índice.
    index = []
    for f in os.listdir(dest):
        if f.endswith('.ogg') or f.endswith('.bin'):
            os.unlink(os.path.join(dest, f))
    total = 0
    for g in groups:
        parts = []
        with open(os.path.join(dest, g['group'] + '.ogg'), 'wb') as out:
            for s in g['sentences']:
                data = open(os.path.join(cache, s['key'] + '.ogg'), 'rb').read()
                out.write(data)
                parts.append(f"{s['key']}:{len(data)}")
                total += len(data)
        index.append([g['group'], ' '.join(parts)])
    json.dump({'v': 1, 'voice': 'es_MX-claude-high', 'packs': index}, open(os.path.join(dest, 'index.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    print(f'{len(index)} paquetes, {total / 1e6:.1f} MB', flush=True)


if __name__ == '__main__':
    main()
