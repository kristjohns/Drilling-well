// Render driver: loads the film page in headless Chromium (Mesa lavapipe for fast software
// WebGL) and renders stills or full shot segments piped straight into ffmpeg.
//
//   node tools/render.mjs stills --shots a,b --at 0.1,0.5,0.9 [--scale 0.5]
//   node tools/render.mjs video  --shots all [--workers 2] [--force]
import { createRequire } from 'module';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn, execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = createRequire('/opt/node-tools/node_modules/')('playwright')); }

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'out');
const args = process.argv.slice(2);
const mode = args[0];
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const flag = (k) => args.includes('--' + k);

const timeline = JSON.parse(fs.readFileSync(path.join(ROOT, 'build/timeline.json'), 'utf8'));
const FPS = timeline.fps;
let shots = opt('shots', 'all');
shots = shots === 'all' ? timeline.shots.map((s) => s.id) : shots.split(',');
const scale = +opt('scale', mode === 'stills' ? 0.5 : 1);
const W = Math.round(1920 * scale), H = Math.round(1080 * scale);
const workers = +opt('workers', 2);

const MIME = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json', '.wav': 'audio/wav' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
  fs.readFile(p, (e, d) => {
    if (e) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(d);
  });
}).listen(0);
const port = server.address().port;

async function openPage() {
  const browser = await chromium.launch({
    args: ['--use-angle=vulkan', '--enable-features=Vulkan', '--ignore-gpu-blocklist', '--disable-gpu-watchdog', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'],
    env: { ...process.env, VK_ICD_FILENAMES: '/usr/share/vulkan/icd.d/lvp_icd.json' },
  });
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !m.text().includes('GL Driver')) console.error('[console]', m.text().slice(0, 300)); });
  await page.goto(`http://127.0.0.1:${port}/index.html?w=${W}&h=${H}`);
  await page.waitForFunction('window.__ready === true', null, { timeout: 300000 });
  return { browser, page };
}

async function shot(page) {
  return page.screenshot({ type: 'jpeg', quality: 94, clip: { x: 0, y: 0, width: W, height: H } });
}

async function runStills() {
  fs.mkdirSync(path.join(OUT, 'stills'), { recursive: true });
  const ats = opt('at', '0.15,0.5,0.85').split(',').map(Number);
  const { browser, page } = await openPage();
  for (const id of shots) {
    const info = timeline.shots.find((s) => s.id === id);
    for (const a of ats) {
      const t = a <= 1 ? a * info.dur : a;      // fraction or absolute seconds
      const t0 = Date.now();
      await page.evaluate(([id, t]) => window.renderShot(id, t), [id, t]);
      const buf = await shot(page);
      const f = path.join(OUT, 'stills', `${id}_${String(a).replace('.', 'p')}.jpg`);
      fs.writeFileSync(f, buf);
      console.log(`${id} t=${t.toFixed(2)} -> ${path.relative(ROOT, f)} (${Date.now() - t0} ms)`);
    }
  }
  await browser.close();
}

/** Frame count of an existing segment, or -1 if it is missing or was rendered at another size. */
function segFrames(file) {
  try {
    const out = execFileSync('ffprobe', ['-v', 'error', '-count_packets', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,nb_read_packets', '-of', 'csv=p=0', file], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    const [w, h, n] = out.split(',').map(Number);
    return w === W && h === H ? n : -1;
  } catch { return -1; }
}

/** A cached frame is usable only if it is a complete JPEG (ends with the EOI marker). */
function cachedFrame(file) {
  try {
    const buf = fs.readFileSync(file);
    return buf.length > 2 && buf[buf.length - 2] === 0xff && buf[buf.length - 1] === 0xd9 ? buf : null;
  } catch { return null; }
}

async function runVideo() {
  const segDir = path.join(OUT, 'segments');
  // Every rendered frame is also kept here until its segment is encoded, so an interrupted
  // render resumes from the last finished frame instead of the start of the shot.
  const frameDir = path.join(OUT, 'frames');
  fs.mkdirSync(segDir, { recursive: true });
  const queue = shots
    .map((id) => timeline.shots.find((s) => s.id === id))
    .filter((s) => flag('force') || segFrames(path.join(segDir, `${s.id}.mp4`)) !== s.frames)
    .sort((a, b) => b.frames - a.frames);
  const framesOf = (s) => path.join(frameDir, `${s.id}@${W}x${H}`);
  if (flag('force')) for (const s of queue) fs.rmSync(framesOf(s), { recursive: true, force: true });
  console.log(`rendering ${queue.length} shots, ${queue.reduce((a, s) => a + s.frames, 0)} frames, ${workers} workers @ ${W}x${H}`);
  const t0 = Date.now();
  let done = 0;
  const work = async (wi) => {
    const { browser, page } = await openPage();
    while (queue.length) {
      const s = queue.shift();
      const file = path.join(segDir, `${s.id}.mp4`);
      const tmp = file + '.part.mp4';
      const fdir = framesOf(s);
      fs.mkdirSync(fdir, { recursive: true });
      const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-pix_fmt', 'yuv420p', '-r', String(FPS), tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
      const closed = new Promise((r) => ff.on('close', r));
      const ts = Date.now();
      let reused = 0;
      for (let f = 0; f < s.frames; f++) {
        const jf = path.join(fdir, `${String(f).padStart(5, '0')}.jpg`);
        let buf = cachedFrame(jf);
        if (buf) reused++;
        else {
          await page.evaluate(([id, t]) => window.renderShot(id, t), [s.id, f / FPS]);
          buf = await shot(page);
          fs.writeFileSync(jf + '.tmp', buf);
          fs.renameSync(jf + '.tmp', jf);
        }
        if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      }
      ff.stdin.end();
      const code = await closed;
      if (code !== 0) throw new Error(`ffmpeg exited with ${code} while encoding ${s.id}`);
      fs.renameSync(tmp, file);
      fs.rmSync(fdir, { recursive: true, force: true });
      const rendered = s.frames - reused;
      done += rendered;
      const el = (Date.now() - t0) / 1000, sec = (Date.now() - ts) / 1000;
      console.log(`[w${wi}] ${s.id}: ${rendered} frames in ${sec.toFixed(0)}s (${(rendered / sec).toFixed(2)} fps)${reused ? `, ${reused} reused` : ''} | total ${done} frames, ${(done / el).toFixed(2)} fps overall`);
    }
    await browser.close();
  };
  await Promise.all(Array.from({ length: Math.min(workers, Math.max(1, queue.length)) }, (_, i) => work(i)));
  console.log(`done in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
}

try {
  if (mode === 'stills') await runStills();
  else if (mode === 'video') await runVideo();
  else console.log('usage: render.mjs stills|video --shots ...');
} finally {
  server.close();
}
