// Profile frame cost of a shot at full resolution under different feature toggles.
import { createRequire } from 'module';
import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const { chromium } = createRequire('/opt/node-tools/node_modules/')('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [id, t, msaa = '4'] = process.argv.slice(2);
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json' };
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); res.end(d); }); }).listen(0);
const browser = await chromium.launch({ args: ['--use-angle=vulkan', '--enable-features=Vulkan', '--ignore-gpu-blocklist'], env: { ...process.env, VK_ICD_FILENAMES: '/usr/share/vulkan/icd.d/lvp_icd.json' } });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', (e) => console.error('[pageerror]', e.message));
await page.goto(`http://127.0.0.1:${server.address().port}/index.html?w=1920&h=1080&msaa=${msaa}`);
await page.waitForFunction('window.__ready === true', null, { timeout: 300000 });
const res = await page.evaluate(([id, t]) => {
  const W = window.world;
  const sync = () => { const gl = W.renderer.getContext(); const px = new Uint8Array(4); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); };
  const time = (label, setup, undo) => {
    setup && setup(); window.renderShot(id, t); sync();
    const t0 = performance.now(); for (let i = 0; i < 3; i++) { window.renderShot(id, t + i * 0.04); sync(); } const ms = (performance.now() - t0) / 3;
    undo && undo(); return [label, Math.round(ms)];
  };
  const out = [];
  out.push(time('baseline'));
  out.push(time('no bloom', () => { W.post.bloom.enabled = false; }, () => { W.post.bloom.enabled = true; }));
  out.push(time('no shadows', () => { W.renderer.shadowMap.enabled = false; }, () => { W.renderer.shadowMap.enabled = true; }));
  out.push(time('no ocean', () => { W.sets.ocean.visible = false; }, () => { W.sets.ocean.visible = true; }));
  out.push(time('no sky', () => { W.sets.sky.visible = false; }, () => { W.sets.sky.visible = true; }));
  out.push(time('no rig', () => { W.sets.rig.visible = false; }, () => { W.sets.rig.visible = true; }));
  return out;
}, [id, +t]);
console.log(id, JSON.stringify(res));
await browser.close(); server.close();
