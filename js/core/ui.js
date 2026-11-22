// Utilidades de interfaz compartidas: crear elementos, modales, avisos y confirmaciones.
// (No se usan alert/confirm/prompt del navegador: no funcionan en todos los visores.)
import { sfx } from './audio.js';

// h('div', { class: 'x', onclick: fn, dataset: { id: 1 }, style: { color: 'red' } }, hijo1, 'texto', [más, hijos])
export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) { children.unshift(attrs); attrs = null; }
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  append(el, children);
  return el;
}
function append(el, kids) {
  for (const c of kids) {
    if (c === null || c === undefined || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}
export function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }

export function appRoot() { return document.getElementById('app'); }
export function overlayRoot() {
  let r = document.getElementById('overlay');
  if (!r) { r = h('div', { id: 'overlay', class: 'overlay-root' }); appRoot().append(r); }
  return r;
}

// Botón con sonido. kind: '' | 'sun' | 'leaf' | 'sky' | 'grape' | 'ghost'
export function button(label, { kind = '', small = false, block = false, icon = '', onClick, sound = 'tap', attrs = {} } = {}) {
  const cls = ['btn', kind && `btn--${kind}`, small && 'btn--sm', block && 'btn--block'].filter(Boolean).join(' ');
  return h('button', { type: 'button', class: cls, ...attrs, onclick: e => { if (sound) sfx(sound); onClick?.(e); } },
    icon ? h('span', { 'aria-hidden': 'true' }, icon) : null, label);
}
export function iconButton(icon, label, onClick, { sound = 'tap', attrs = {} } = {}) {
  return h('button', { type: 'button', class: 'icon-btn', 'aria-label': label, title: label, ...attrs, onclick: e => { if (sound) sfx(sound); onClick?.(e); } }, icon);
}

// Modal. body: Node | string | Array. buttons: [{ label, kind, icon, onClick, keepOpen }]
// Devuelve { el, close(), closed: Promise }
export function modal({ title = '', body = '', buttons = [], dismissible = true, className = '', icon = '' } = {}) {
  let done;
  const closed = new Promise(r => { done = r; });
  const box = h('div', { class: `modal ${className}`.trim(), role: 'dialog', 'aria-modal': 'true', 'aria-label': title || 'Mensaje' },
    icon ? h('div', { style: { fontSize: '3rem', textAlign: 'center', lineHeight: '1' }, 'aria-hidden': 'true' }, icon) : null,
    title ? h('h2', { class: 'modal__title' }, title) : null,
    h('div', { class: 'modal__body' }, typeof body === 'string' ? h('p', { style: { textAlign: 'center' } }, body) : body),
    buttons.length ? h('div', { class: 'modal__actions' }, buttons.map(b => button(b.label, {
      kind: b.kind, icon: b.icon, small: b.small,
      onClick: () => { const keep = b.onClick?.(); if (!b.keepOpen && keep !== false) close(b.value); },
    }))) : null);
  const scrim = h('div', { class: 'modal-scrim', onclick: e => { if (dismissible && e.target === scrim) close(); } }, box);
  function close(value) {
    if (!scrim.isConnected) return;
    scrim.remove();
    done(value);
  }
  overlayRoot().append(scrim);
  box.querySelector('button')?.focus({ preventScroll: true });
  return { el: box, close, closed };
}

export function confirmDialog(text, { yes = 'Sí', no = 'No', title = '', icon = '', kind = '' } = {}) {
  const m = modal({ title, icon, body: text, dismissible: false, buttons: [
    { label: no, kind: 'ghost', value: false },
    { label: yes, kind, value: true },
  ] });
  return m.closed.then(v => !!v);
}

let stack = null;
export function toast(text, { icon = '', ms = 2200 } = {}) {
  if (!stack || !stack.isConnected) { stack = h('div', { class: 'toast-stack', 'aria-live': 'polite' }); overlayRoot().append(stack); }
  const t = h('div', { class: 'toast' }, icon ? h('span', { 'aria-hidden': 'true' }, icon) : null, text);
  stack.append(t);
  while (stack.children.length > 3) stack.firstChild.remove();
  setTimeout(() => { t.classList.add('is-out'); setTimeout(() => t.remove(), 260); }, ms);
  return t;
}

// Barra de medidor: meter(72, 'var(--st-fe)')
export function meter(value, color) {
  const m = h('div', { class: 'meter' }, h('i'));
  m.style.setProperty('--v', Math.round(value));
  if (color) m.style.setProperty('--c', color);
  m.set = v => m.style.setProperty('--v', Math.round(v));
  return m;
}

export const reduceMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Ajusta el ancho de la columna de la app al espacio disponible (formato vertical tipo teléfono).
export function fitApp() {
  const root = document.documentElement;
  const vw = root.clientWidth || window.innerWidth, vh = root.clientHeight || window.innerHeight;
  const w = Math.max(280, Math.min(vw, 540, Math.round(vh * 0.72)));
  root.style.setProperty('--app-w', `${w}px`);
}
