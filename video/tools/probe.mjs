// Debug helper: render one frame of a shot after running a JS snippet in the page.
//   node tools/probe.mjs <shot> <t> <out.jpg> "<js snippet using world>" [scale]
import { createRequire } from 'module';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { chromium } = createRequire('/opt/node-tools/node_modules/')('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [id, t, out, snippet = '', sc = '0.5'] = process.argv.slice(2);
const scale = +sc, W = Math.round(1920 * scale), H = Math.round(1080 * scale);
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); res.end(d); });
}).listen(0);
const browser = await chromium.launch({ args: ['--use-angle=vulkan', '--enable-features=Vulkan', '--ignore-gpu-blocklist'], env: { ...process.env, VK_ICD_FILENAMES: '/usr/share/vulkan/icd.d/lvp_icd.json' } });
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on('pageerror', (e) => console.error('[pageerror]', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.error('[console]', m.text().slice(0, 300)); });
await page.goto(`http://127.0.0.1:${server.address().port}/index.html?w=${W}&h=${H}`);
await page.waitForFunction('window.__ready === true', null, { timeout: 300000 });
const res = await page.evaluate(([id, t, snippet]) => {
  window.renderShot(id, t);              // prepare + first render
  const world = window.world;
  const r = snippet ? (new Function('world', 'THREE', snippet))(world, world.THREE) : null;
  window.renderShot(id, t);
  return r === undefined ? null : JSON.stringify(r);
}, [id, +t, snippet]);
if (res) console.log(res);
fs.writeFileSync(out, await page.screenshot({ type: 'jpeg', quality: 92 }));
await browser.close();
server.close();
