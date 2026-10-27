// Builds the global timeline from the script and the measured narration durations,
// and provides the per-frame scene state object (S) that scene draw functions receive.
'use strict';
const { clamp, ease, LAYOUT, FPS } = require('./core');

const LEAD = 0.55;        // silence at the start of each scene
const TAIL = 0.6;         // silence at the end of each scene
const AUDIO_DELAY = 0.25; // narration starts this long after its beat
const GAP = 0.55;         // pause after each narration clip

function estimate(say) {
  const words = String(say || '').split(/\s+/).filter(Boolean).length;
  return Math.max(1.2, words / 2.6);
}

function buildTimeline(chapters, durations = {}) {
  let gt = 0, termIndex = 0;
  const out = { chapters: [], scenes: [], total: 0, termTotal: 0 };
  for (const ch of chapters) {
    const chStart = gt;
    for (const sc of ch.scenes) {
      let t = sc.layout === 'chapter' ? 0.4 : LEAD;
      sc.beats.forEach((b, i) => {
        b.id = `${ch.id}.${sc.id}.${i}`;
        const ad = durations[b.id] != null ? durations[b.id] : estimate(b.say);
        b.audioDur = ad;
        b.start = t;
        b.audioStart = gt + t + AUDIO_DELAY;
        b.dur = Math.max(b.min || 0, AUDIO_DELAY + ad + (b.gap != null ? b.gap : GAP)) + (b.hold || 0);
        t += b.dur;
        if (b.term && !b.noCount) { termIndex++; b.termIndex = termIndex; }
      });
      sc.start = gt;
      sc.dur = t + (sc.tail != null ? sc.tail : TAIL);
      sc.key = `${ch.id}.${sc.id}`;
      sc.chapterId = ch.id;
      // frame bounds (cumulative rounding keeps audio and video in sync)
      sc.f0 = Math.round(sc.start * FPS);
      sc.f1 = Math.round((sc.start + sc.dur) * FPS);
      out.scenes.push(sc);
      gt += sc.dur;
    }
    out.chapters.push({ id: ch.id, num: ch.num, title: ch.title, start: chStart, end: gt });
  }
  out.total = gt;
  out.termTotal = termIndex;
  return out;
}

function makeS(sc, t, gt) {
  const beats = sc.beats;
  const n = beats.length;
  let bi = -1;
  for (let i = 0; i < n; i++) if (t >= beats[i].start) bi = i;
  const start = (i) => (i < n ? beats[i].start : sc.dur);
  const end = (i) => (i < n ? beats[i].start + beats[i].dur : sc.dur);
  const R = sc.layout === 'full' ? LAYOUT.stageFull : LAYOUT.stage;
  const S = {
    t, gt, dur: sc.dur, bi, n,
    bt: bi >= 0 ? t - beats[bi].start : t,
    bd: bi >= 0 ? beats[bi].dur : (n ? beats[0].start : 0),
    beats, W: R.w, H: R.h,
    start, end,
    since: (i) => t - start(i),
    on: (i) => t >= start(i),
    cur: (i) => bi === i,
    // eased progress of an animation that starts `delay` s after beat i and lasts d s
    p: (i, d = 0.8, delay = 0, e = ease.inOut) => e(clamp((t - start(i) - delay) / d)),
    // progress through beat i's narration (0..1)
    q: (i) => clamp((t - start(i)) / Math.max(0.1, (beats[Math.min(i, n - 1)] || {}).dur || 1)),
    // highlight factor: rises when beat i starts, falls when it ends
    hl: (i, j = i) => {
      const a = clamp((t - start(i)) / 0.4);
      const b = 1 - clamp((t - end(j)) / 0.5);
      return ease.out(Math.min(a, b));
    },
    // appear-and-stay
    vis: (i, d = 0.5, delay = 0) => ease.out(clamp((t - start(i) - delay) / d)),
    // value that steps through keyframes defined per beat: kf = {beatIndex: value}
    step: (kf, d = 0.8) => {
      const keys = Object.keys(kf).map(Number).sort((a, b) => a - b);
      let v = kf[keys[0]];
      for (const k of keys) {
        if (k === keys[0]) continue;
        const pr = ease.inOut(clamp((t - start(k)) / d));
        if (pr <= 0) break;
        v = v + (kf[k] - v) * pr;
      }
      return v;
    },
  };
  return S;
}

module.exports = { buildTimeline, makeS, estimate, LEAD, TAIL, AUDIO_DELAY, GAP };
