// Immediate-mode HTML overlay. Each frame, the active shot calls these methods with the
// shot-local time; elements are created lazily by key and hidden when not used in a frame.
import * as THREE from 'three';
import { clamp, sstep, easeOut, win } from './util.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const _v = new THREE.Vector3();

export class Overlay {
  constructor(root, W = 1920, H = 1080) {
    this.root = root; this.W = W; this.H = H;
    this.els = new Map(); this.used = new Set();
    this.svg = document.createElementNS(SVGNS, 'svg');
    this.svg.setAttribute('class', 'lines');
    this.svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    root.appendChild(this.svg);
  }

  begin(camera) { this.camera = camera; this.used.clear(); }

  end() {
    for (const [k, e] of this.els) {
      const vis = this.used.has(k);
      if (e.nodeType === 1) {
        if (e instanceof SVGElement) e.style.display = vis ? '' : 'none';
        else e.style.display = vis ? '' : 'none';
      }
    }
  }

  reset() {
    for (const [, e] of this.els) e.remove();
    this.els.clear();
  }

  _el(key, cls, html, parent = this.root) {
    this.used.add(key);
    let e = this.els.get(key);
    if (!e) {
      e = document.createElement('div');
      e.className = 'ov ' + cls;
      if (html != null) e.innerHTML = html;
      parent.appendChild(e);
      this.els.set(key, e);
    }
    return e;
  }

  _svg(key, tag, attrs) {
    this.used.add(key);
    let e = this.els.get(key);
    if (!e) {
      e = document.createElementNS(SVGNS, tag);
      this.svg.appendChild(e);
      this.els.set(key, e);
    }
    for (const a in attrs) e.setAttribute(a, attrs[a]);
    return e;
  }

  project(p) {
    const v = typeof p === 'function' ? p() : p;
    this.camera.updateMatrixWorld();
    _v.copy(v).project(this.camera);
    return { x: (_v.x + 1) / 2 * this.W, y: (1 - _v.y) / 2 * this.H, ok: _v.z < 1 && _v.z > -1 };
  }

  /** Big centered chapter card. */
  chapter(n, title, t, t0 = 0.25, t1 = 2.5) {
    const a = win(t, t0, t1, 0.5);
    if (a <= 0) return;
    const e = this._el('chap', 'chap', `<div class="num">${String(n).padStart(2, '0')}</div><div class="ttl">${title}</div><div class="bar"></div>`);
    e.style.opacity = a;
    const k = easeOut(clamp((t - t0) / 1.2));
    e.querySelector('.ttl').style.transform = `translateY(${(1 - k) * 18}px)`;
    e.querySelector('.ttl').style.letterSpacing = `${0.06 + (1 - k) * 0.08}em`;
    e.querySelector('.bar').style.width = `${k * 220}px`;
  }

  /** Main title card. */
  title(key, { kicker = '', big = '', sub = '' }, t, t0, t1) {
    const a = win(t, t0, t1, 0.8);
    if (a <= 0) return;
    const e = this._el(key, 'mtitle', `<div class="kicker">${kicker}</div><div class="big">${big}</div><div class="sub">${sub}</div>`);
    e.style.opacity = a;
    const k = easeOut(clamp((t - t0) / 2.0));
    e.querySelector('.big').style.transform = `scale(${0.94 + 0.06 * k})`;
    e.querySelector('.big').style.letterSpacing = `${0.03 + (1 - k) * 0.12}em`;
  }

  /**
   * Callout label anchored to a 3D point with a leader line.
   * side: 'right' | 'left' | 'up' | 'down' (where the text sits relative to the anchor)
   */
  label(key, { at, text, sub = '', side = 'right', dx = 70, dy = -40, color }, t, t0, t1) {
    const a = win(t, t0, t1, 0.45);
    if (a <= 0) return;
    const p = this.project(at);
    if (!p.ok) return;
    const grow = easeOut(clamp((t - t0) / 0.5));
    const sx = side === 'left' ? -Math.abs(dx) : side === 'right' ? Math.abs(dx) : dx;
    const ex = p.x + sx * grow, ey = p.y + dy * grow;
    const col = color || 'var(--accent)';
    const line = this._svg(key + ':l', 'polyline', {
      points: `${p.x},${p.y} ${ex},${ey} ${ex + (side === 'left' ? -18 : side === 'right' ? 18 : 0) * grow},${ey}`,
      fill: 'none', stroke: color || '#ffb23f', 'stroke-width': 2.2, opacity: a,
    });
    line.style.filter = 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))';
    this._svg(key + ':d', 'circle', { cx: p.x, cy: p.y, r: 5.5, fill: '#fff', stroke: color || '#ffb23f', 'stroke-width': 3, opacity: a });
    this._svg(key + ':r', 'circle', { cx: p.x, cy: p.y, r: 5.5 + 14 * clamp((t - t0) / 0.8), fill: 'none', stroke: '#fff', 'stroke-width': 1.5, opacity: a * (1 - clamp((t - t0) / 0.8)) });
    const e = this._el(key, 'lbl ' + side, `<div class="t"></div><div class="s"></div>`);
    e.querySelector('.t').innerHTML = text;
    e.querySelector('.s').innerHTML = sub;
    e.querySelector('.s').style.display = sub ? '' : 'none';
    e.querySelector('.t').style.color = col === 'var(--accent)' ? '' : col;
    const ta = sstep(t0 + 0.25, t0 + 0.6, t) * a;
    e.style.opacity = ta;
    const gap = side === 'left' ? -26 : side === 'right' ? 26 : 0;
    const gy = side === 'up' ? -12 : side === 'down' ? 12 : 0;
    e.style.left = `${ex + gap}px`;
    e.style.top = `${ey + gy}px`;
  }

  /** Large animated number. value counts up from `from` during the first 1.2 s. */
  stat(key, { x, y, value, from = 0, decimals = 0, unit = '', label = '', desc = '', align = 'left', panel = false }, t, t0, t1) {
    const a = win(t, t0, t1, 0.5);
    if (a <= 0) return;
    const e = this._el(key, 'stat' + (panel ? ' panel' : ''), `<div class="v"><span></span><small></small></div><div class="l"></div><div class="d"></div>`);
    const k = easeOut(clamp((t - t0) / 1.3));
    const v = from + (value - from) * k;
    e.querySelector('.v span').textContent = v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    e.querySelector('.v small').textContent = unit;
    e.querySelector('.l').textContent = label;
    e.querySelector('.d').innerHTML = desc;
    e.querySelector('.d').style.display = desc ? '' : 'none';
    e.style.opacity = a;
    e.style.textAlign = align;
    e.style.left = `${x}px`; e.style.top = `${y}px`;
    e.style.transform = `translate(${align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0'}, ${(1 - easeOut(clamp((t - t0) / 0.8))) * 24}px)`;
  }

  /** Lower-left location/topic tag. */
  tag(key, { text, sub = '' }, t, t0, t1) {
    const a = win(t, t0, t1, 0.5);
    if (a <= 0) return;
    const e = this._el(key, 'tag', `<div class="rule"></div><div class="t">${text}</div><div class="s">${sub}</div>`);
    e.style.opacity = a;
    e.querySelector('.rule').style.width = `${64 * easeOut(clamp((t - t0) / 0.7))}px`;
  }

  /** Staggered list panel. items: [[title, sub], ...] */
  list(key, { x, y, head = '', items, stagger = 0.35, panel = false, width }, t, t0, t1) {
    const a = win(t, t0, t1, 0.5);
    if (a <= 0) return;
    const html = (head ? `<div class="h">${head}</div>` : '') + items.map(([i, s]) => `<div class="i">${i}${s ? `<span>${s}</span>` : ''}</div>`).join('');
    const e = this._el(key, 'list' + (panel ? ' panel' : ''), html);
    e.style.left = `${x}px`; e.style.top = `${y}px`; e.style.opacity = a;
    if (width) e.style.width = `${width}px`;
    e.querySelectorAll('.i').forEach((el, i) => {
      const k = easeOut(clamp((t - t0 - 0.2 - i * stagger) / 0.5));
      el.style.opacity = k;
      el.style.transform = `translateX(${(1 - k) * -24}px)`;
    });
  }

  /** Generic HTML block at a screen position (or anchored to 3D with `at`). */
  html(key, { x = 0, y = 0, at, cls = '', html = '', style = {} }, t, t0, t1, fade = 0.45) {
    const a = win(t, t0, t1, fade);
    if (a <= 0) return null;
    const e = this._el(key, cls, html);
    if (e.__html !== html) { e.innerHTML = html; e.__html = html; }
    let px = x, py = y;
    if (at) { const p = this.project(at); if (!p.ok) return null; px = p.x + x; py = p.y + y; }
    e.style.left = `${px}px`; e.style.top = `${py}px`; e.style.opacity = a;
    Object.assign(e.style, style);
    return e;
  }

  /** Line between two 3D points (or screen points if given as {x,y}). */
  line(key, a3, b3, t, t0, t1, { color = '#ffb23f', width = 2, dash = '' } = {}) {
    const a = win(t, t0, t1, 0.4);
    if (a <= 0) return;
    const pa = a3.x !== undefined && a3.isVector3 === undefined && a3.z === undefined ? { ...a3, ok: true } : this.project(a3);
    const pb = b3.x !== undefined && b3.isVector3 === undefined && b3.z === undefined ? { ...b3, ok: true } : this.project(b3);
    if (!pa.ok || !pb.ok) return;
    const k = easeOut(clamp((t - t0) / 0.6));
    this._svg(key, 'line', { x1: pa.x, y1: pa.y, x2: pa.x + (pb.x - pa.x) * k, y2: pa.y + (pb.y - pa.y) * k, stroke: color, 'stroke-width': width, opacity: a, 'stroke-dasharray': dash });
  }
}
