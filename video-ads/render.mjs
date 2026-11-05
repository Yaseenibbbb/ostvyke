// node render.mjs <ad> stills t1 t2 ...   -> out/adN/stills.png (contact sheet)
// node render.mjs <ad> video [fps]         -> out/adN/video.mp4 (silent), out/adN/cues.json
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
const [ad, mode, ...rest] = process.argv.slice(2);
const dir = `out/ad${ad}`; fs.mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ args: ['--force-color-profile=srgb', '--font-render-hinting=none', '--disable-gpu-vsync'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('console', m => console.log('page:', m.text()));
page.on('pageerror', e => console.log('pageerror:', e.message));
await page.goto(`file://${process.cwd()}/index.html?ad=${ad}`);
await page.waitForFunction(() => window.ready || window.bootError, null, { timeout: 60000 });
const err = await page.evaluate(() => window.bootError); if (err) { console.log('boot error', err); process.exit(1); }
const dur = await page.evaluate(() => window.DURATION);
console.log('debug', JSON.stringify(await page.evaluate(() => window.__dbg ?? null)));
fs.writeFileSync(`${dir}/cues.json`, JSON.stringify(await page.evaluate(() => window.CUES), null, 1));
const shot = async (t) => { await page.evaluate(t => window.seek(t), t); return page.screenshot({ type: 'png' }); };
if (mode === 'stills') {
  const ts = rest.length ? rest.map(Number) : [];
  for (const t of ts) fs.writeFileSync(`${dir}/still_${t.toFixed(2)}.png`, await shot(t));
  console.log('stills done');
} else if (mode === 'video') {
  const fps = Number(rest[0] || 30); const n = Math.round(dur * fps);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', `${dir}/video.mp4`], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const buf = await shot(i / fps);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 60 === 0) console.log(`frame ${i}/${n} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  console.log('video done', n, 'frames');
}
await browser.close();
