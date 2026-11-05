// Order of the Gem ad engine. Everything is a pure function of time t (seconds).
// No timers, no Math.random, no state between frames: seek(t) always draws the same picture.
(() => {
const E = (window.E = {});
E.W = 1080; E.H = 1920; E.FPS = 30;

// ---------- math ----------
const clamp = (E.clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)));
const lerp = (E.lerp = (a, b, f) => a + (b - a) * f);
E.ease = {
  lin: x => x,
  out: x => 1 - Math.pow(1 - x, 4),           // arrivals
  out3: x => 1 - Math.pow(1 - x, 3),
  expo: x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  inn: x => x * x * x,                          // exits
  in2: x => x * x,
  io: x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  back: x => { const c = 1.25, c3 = c + 1; return 1 + c3 * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); },
};
const prog = (E.prog = (t, t0, t1, ease = E.ease.out) => {
  if (t <= t0) return 0; if (t >= t1) return 1; return ease((t - t0) / (t1 - t0));
});
// closed-form damped spring step response, 0 -> 1. k stiffness, d damping (mass 1)
const spring = (E.spring = (t, t0, k = 170, d = 26) => {
  const x = t - t0; if (x <= 0) return 0;
  const w0 = Math.sqrt(k), z = d / (2 * w0);
  if (z < 1) {
    const wd = w0 * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w0 * x) * (Math.cos(wd * x) + (z * w0 / wd) * Math.sin(wd * x));
  }
  return 1 - Math.exp(-w0 * x) * (1 + w0 * x);
});
E.rng = seed => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let r = Math.imul(seed ^ (seed >>> 15), 1 | seed); r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return ((r ^ (r >>> 14)) >>> 0) / 4294967296; };
const hash = (E.hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); });
// smooth value noise for shake/drift
E.noise = (x, seed = 0) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i + seed * 101), hash(i + 1 + seed * 101), u) * 2 - 1; };

// ---------- assets ----------
E.img = {};
E.load = async (names) => {
  const ff = new FontFace('Gothic', 'url(fonts/georgia.ttf)');
  await ff.load(); document.fonts.add(ff);
  await Promise.all(names.map(n => new Promise((res, rej) => {
    const im = new Image(); im.onload = () => { E.img[n] = im; res(); }; im.onerror = () => rej(n); im.src = 'assets/' + n + '.png';
  })));
  await document.fonts.ready;
};

E.draw = (ctx, name, cx, cy, w, o = {}) => {
  const im = typeof name === 'string' ? E.img[name] : name; if (!im) return;
  const h = o.h ?? (w * im.height / im.width);
  const a = o.alpha ?? 1; if (a <= 0.001) return;
  ctx.save(); ctx.globalAlpha *= a;
  if (o.comp) ctx.globalCompositeOperation = o.comp;
  if (o.filter) ctx.filter = o.filter;
  ctx.translate(cx, cy); if (o.rot) ctx.rotate(o.rot);
  const s = o.scale ?? 1, sx = (o.sx ?? 1) * s, sy = (o.sy ?? 1) * s; ctx.scale(sx, sy);
  ctx.drawImage(im, -w / 2, -h / 2, w, h); ctx.restore();
};

// ---------- colour / text ----------
E.GOLD = ['#fff0c2', '#f2c46b', '#c98a2e', '#8a5518'];
E.SILVER = ['#ffffff', '#e4e7ec', '#a9aeb8', '#6a6f78'];
E.RED = ['#ffd0c4', '#ff6a4d', '#d42a1e', '#7a0d08'];
const grad = (ctx, y, size, stops) => {
  const g = ctx.createLinearGradient(0, y - size * 0.8, 0, y + size * 0.15);
  stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); return g;
};
E.font = (size, weight = 'bold') => `${weight} ${size}px Gothic`;

// one line of text, letterspaced, with drop shadow + dark stroke for legibility over art
E.text = (ctx, str, x, y, o = {}) => {
  const size = o.size ?? 64;
  ctx.save();
  ctx.font = E.font(size, o.weight ?? 'bold');
  ctx.letterSpacing = (o.ls ?? 0.04 * size) + 'px';
  ctx.textAlign = o.align ?? 'center'; ctx.textBaseline = 'alphabetic';
  ctx.globalAlpha *= o.alpha ?? 1;
  if (o.shadow !== false) { ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = size * 0.35; ctx.shadowOffsetY = size * 0.06; }
  if (o.stroke !== false) { ctx.lineWidth = size * 0.07; ctx.strokeStyle = 'rgba(12,6,4,0.9)'; ctx.lineJoin = 'round'; ctx.strokeText(str, x, y); }
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = Array.isArray(o.color) ? grad(ctx, y, size, o.color) : (o.color ?? '#fff');
  ctx.fillText(str, x, y);
  if (o.glow) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= o.glow; ctx.filter = `blur(${size * 0.18}px)`; ctx.fillText(str, x, y); }
  ctx.restore();
};
E.measure = (ctx, str, size, ls) => { ctx.save(); ctx.font = E.font(size); ctx.letterSpacing = (ls ?? 0.04 * size) + 'px'; const w = ctx.measureText(str).width; ctx.restore(); return w; };

// Masked word rise: each word rises out of a mask on a stagger, exits upward.
// lines: [{text, color, size}] ; centred at x, first baseline y
E.title = (ctx, t, lines, x, y, t0, t1 = 1e9, o = {}) => {
  if (t < t0 || t > t1 + 0.6) return;
  const stagger = o.stagger ?? 0.075, dur = o.dur ?? 0.5;
  let wi = 0, yy = y;
  for (const L of lines) {
    const size = L.size ?? o.size ?? 96, ls = 0.05 * size;
    const words = L.text.split(' ');
    const space = E.measure(ctx, ' ', size, ls);
    const widths = words.map(w => E.measure(ctx, w, size, ls));
    const total = widths.reduce((a, b) => a + b, 0) + space * (words.length - 1);
    let xx = x - total / 2;
    words.forEach((w, i) => {
      const ws = t0 + (L.delay ?? 0) + wi * stagger;
      const p = spring(t, ws, 190, 24);
      const q = prog(t, t1 + wi * 0.035, t1 + wi * 0.035 + 0.28, E.ease.inn);
      const dy = (1 - p) * size * 1.05 - q * size * 1.1;
      ctx.save();
      ctx.beginPath(); ctx.rect(xx - size * 0.3, yy - size * 1.0, widths[i] + size * 0.6, size * 1.32); ctx.clip();
      ctx.translate(xx + widths[i] / 2, yy + dy); ctx.rotate((1 - Math.min(1, p)) * 0.05);
      E.text(ctx, w, 0, 0, { size, color: L.color ?? E.GOLD, alpha: clamp(p * 1.4) * (1 - q), glow: L.glow });
      ctx.restore();
      xx += widths[i] + space; wi++;
    });
    yy += (L.lh ?? size * 1.12);
  }
};

// ---------- atmosphere ----------
E.bg = (ctx, t, o = {}) => {
  const im = E.img.background; const s = E.H / im.height * (o.zoom ?? 1.08);
  const w = im.width * s, h = im.height * s;
  const dx = Math.sin(t * 0.13) * 30 + (o.pan ?? 0), dy = Math.cos(t * 0.11) * 14;
  ctx.drawImage(im, (E.W - w) / 2 + dx - (o.offset ?? 380), (E.H - h) / 2 + dy, w, h);
  ctx.fillStyle = `rgba(6,5,6,${o.dark ?? 0.62})`; ctx.fillRect(0, 0, E.W, E.H);
  if (o.sigil !== false) E.draw(ctx, 'hero-sigil', E.W / 2, o.sigilY ?? 820, 1500, { alpha: o.sigilA ?? 0.18, rot: t * 0.03 });
  if (o.warm) { const g = ctx.createRadialGradient(E.W / 2, o.warmY ?? 900, 0, E.W / 2, o.warmY ?? 900, 900); g.addColorStop(0, `rgba(140,30,24,${o.warm})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, E.W, E.H); }
};
E.smoke = (ctx, t, a = 0.35, seed = 1) => {
  for (let i = 0; i < 7; i++) {
    const r = hash(i + seed * 13), x = ((r * 1400 + t * (18 + 12 * hash(i + 4))) % 1500) - 210;
    const y = 300 + hash(i + 9 + seed) * 1400 + Math.sin(t * 0.3 + i) * 30;
    E.draw(ctx, 'ambient-smoke', x, y, 900 + 400 * hash(i + 2), { alpha: a * (0.5 + 0.5 * hash(i + 7)), rot: i + t * 0.02, comp: 'screen' });
  }
};
E.embers = (ctx, t, n = 40, seed = 3, a = 1) => {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const sp = 40 + 90 * hash(i * 3 + seed), life = E.H / sp + 2;
    const ph = ((t + hash(i + seed * 7) * life) % life);
    const y = E.H + 40 - ph * sp, x = hash(i * 5 + seed) * E.W + Math.sin(t * (0.6 + hash(i)) + i) * 40;
    const fl = 0.55 + 0.45 * Math.sin(t * (5 + 4 * hash(i + 2)) + i * 2);
    const r = 2 + 4 * hash(i * 11 + seed);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
    g.addColorStop(0, `rgba(255,190,110,${0.9 * fl * a})`); g.addColorStop(0.3, `rgba(255,110,40,${0.45 * fl * a})`); g.addColorStop(1, 'rgba(255,60,20,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
  }
  ctx.restore();
};
E.vignette = (ctx, a = 0.85) => {
  const g = ctx.createRadialGradient(E.W / 2, E.H * 0.46, E.W * 0.35, E.W / 2, E.H * 0.5, E.H * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, E.W, E.H);
};
E.flash = (ctx, t, t0, dur = 0.35, color = '255,240,210', peak = 0.85) => {
  const x = t - t0; if (x < 0 || x > dur) return;
  const a = peak * (x < 0.04 ? x / 0.04 : Math.pow(1 - (x - 0.04) / (dur - 0.04), 2));
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(${color},${a})`; ctx.fillRect(0, 0, E.W, E.H); ctx.restore();
};
E.grain = (ctx, t) => {
  // subtle film grain: deterministic per frame
  const f = Math.floor(t * E.FPS);
  if (!E._grain) { E._grain = []; for (let k = 0; k < 4; k++) { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const d = g.createImageData(256, 256); const R = E.rng(k + 9); for (let i = 0; i < d.data.length; i += 4) { const v = R() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 22; } g.putImageData(d, 0, 0); E._grain.push(c); } }
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = ctx.createPattern(E._grain[f % 4], 'repeat'); ctx.fillRect(0, 0, E.W, E.H); ctx.restore();
};

// camera shake from a list of hits [{t, amp, dur}]
E.shake = (t, hits) => {
  let x = 0, y = 0, r = 0;
  for (const h of hits) {
    const d = t - h.t; if (d < 0 || d > (h.dur ?? 0.5)) continue;
    const k = h.amp * Math.pow(1 - d / (h.dur ?? 0.5), 2);
    x += E.noise(d * 38, 1 + h.t) * k; y += E.noise(d * 38, 7 + h.t) * k; r += E.noise(d * 30, 3 + h.t) * k * 0.0009;
  }
  return { x, y, r };
};
// beat punch zoom: quick +amt then exp decay
E.punch = (t, hits) => { let z = 0; for (const h of hits) { const d = t - h.t; if (d >= 0 && d < 1.2) z += (h.amp ?? 0.02) * Math.exp(-d * 7) * Math.min(1, d / 0.03); } return z; };

// ---------- effects ----------
E.GEMCOL = { red: [235, 50, 58], blue: [70, 175, 250], gold: [250, 170, 40], green: [50, 210, 90], purple: [160, 80, 255] };
// shards burst: deterministic particles from (x,y) at t0
E.shards = (ctx, t, t0, x, y, col, n = 10, seed = 1, power = 1) => {
  const d = t - t0; if (d < 0 || d > 0.9) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const a = hash(i + seed * 17) * Math.PI * 2, v = (380 + 520 * hash(i * 3 + seed)) * power;
    const px = x + Math.cos(a) * v * d, py = y + Math.sin(a) * v * d + 1400 * d * d;
    const life = 1 - d / 0.9, s = (7 + 9 * hash(i + seed)) * life;
    ctx.save(); ctx.translate(px, py); ctx.rotate(a + d * 12);
    ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${life})`;
    ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.55, 0); ctx.lineTo(0, s); ctx.lineTo(-s * 0.55, 0); ctx.fill();
    ctx.restore();
  }
  // core flash
  const fr = 120 * power * (0.4 + d * 2), fa = Math.max(0, 1 - d / 0.3);
  const g = ctx.createRadialGradient(x, y, 0, x, y, fr); g.addColorStop(0, `rgba(255,255,240,${0.9 * fa})`); g.addColorStop(0.35, `rgba(${col[0]},${col[1]},${col[2]},${0.55 * fa})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(x - fr, y - fr, fr * 2, fr * 2);
  ctx.restore();
};
E.ring = (ctx, t, t0, x, y, r1 = 260, col = '255,210,140', dur = 0.5, w = 14) => {
  const d = (t - t0) / dur; if (d < 0 || d > 1) return;
  const r = r1 * E.ease.out3(d);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(${col},${(1 - d) * 0.9})`; ctx.lineWidth = w * (1 - d) + 1;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
};
// energy orb travelling on a curve from a to b, arriving at t1
E.orb = (ctx, t, t0, t1, ax, ay, bx, by, col, seed = 0) => {
  if (t < t0 || t > t1 + 0.05) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const cx = (ax + bx) / 2 + (hash(seed) - 0.5) * 500, cy = Math.min(ay, by) - 120;
  for (let k = 0; k < 9; k++) {
    const p = E.ease.in2(clamp((t - k * 0.012 - t0) / (t1 - t0)));
    const x = (1 - p) * (1 - p) * ax + 2 * (1 - p) * p * cx + p * p * bx, y = (1 - p) * (1 - p) * ay + 2 * (1 - p) * p * cy + p * p * by;
    const r = (26 - k * 2.4);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.2); g.addColorStop(0, `rgba(255,250,235,${0.9 - k * 0.08})`); g.addColorStop(0.4, `rgba(${col[0]},${col[1]},${col[2]},${0.7 - k * 0.06})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4);
  }
  ctx.restore();
};
// lightning bolt (seeded jagged path, flickers)
E.bolt = (ctx, t, t0, x0, y0, x1, y1, seed = 1, dur = 0.5, width = 10) => {
  const d = t - t0; if (d < 0 || d > dur) return;
  const flick = Math.floor(d * 30); const R = E.rng(seed * 100 + flick);
  const fade = d < 0.05 ? 1 : Math.pow(1 - (d - 0.05) / (dur - 0.05), 1.5);
  const path = (xa, ya, xb, yb, disp, depth, arr) => {
    if (depth === 0) { arr.push([xb, yb]); return; }
    const mx = (xa + xb) / 2 + (R() - 0.5) * disp, my = (ya + yb) / 2 + (R() - 0.5) * disp * 0.3;
    path(xa, ya, mx, my, disp / 2, depth - 1, arr); path(mx, my, xb, yb, disp / 2, depth - 1, arr);
  };
  const main = [[x0, y0]]; path(x0, y0, x1, y1, 260, 6, main);
  const stroke = (pts, w, a) => {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); pts.forEach(p => ctx.lineTo(p[0], p[1]));
    ctx.lineWidth = w; ctx.strokeStyle = `rgba(200,170,255,${a * 0.5})`; ctx.filter = `blur(${w}px)`; ctx.stroke();
    ctx.filter = 'none'; ctx.lineWidth = w * 0.35; ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.stroke();
  };
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  stroke(main, width, fade);
  for (let b = 0; b < 4; b++) { const i = 8 + Math.floor(R() * (main.length - 16)); const [bx, by] = main[i]; const br = [[bx, by]]; path(bx, by, bx + (R() - 0.5) * 380, by + 120 + R() * 260, 120, 4, br); stroke(br, width * 0.5, fade * 0.8); }
  ctx.restore();
};
// three-claw slash streaks
E.slash = (ctx, t, t0, cx, cy, ang = -0.6, len = 900, col = '255,70,50') => {
  const d = t - t0; if (d < 0 || d > 0.55) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(cx, cy); ctx.rotate(ang);
  for (let i = -1; i <= 1; i++) {
    const p = E.ease.expo(clamp((d - (i + 1) * 0.03) / 0.16)), fade = 1 - clamp((d - 0.18) / 0.37);
    const x0 = -len / 2, x1 = x0 + len * p, y = i * 70;
    const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(0.7, `rgba(${col},${fade})`); g.addColorStop(1, `rgba(255,240,220,${fade})`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, y); ctx.quadraticCurveTo((x0 + x1) / 2, y - 26, x1, y); ctx.quadraticCurveTo((x0 + x1) / 2, y + 8, x0, y); ctx.fill();
    ctx.filter = 'blur(14px)'; ctx.fill(); ctx.filter = 'none';
  }
  ctx.restore();
};
// floating damage number
E.dmg = (ctx, t, t0, x, y, str, col = E.RED, size = 88) => {
  const d = t - t0; if (d < 0 || d > 1.1) return;
  const s = 0.6 + 0.4 * spring(t, t0, 260, 14), a = 1 - prog(t, t0 + 0.75, t0 + 1.1, E.ease.in2);
  ctx.save(); ctx.translate(x, y - 90 * E.ease.out(clamp(d / 1.1))); ctx.scale(s, s);
  E.text(ctx, str, 0, 0, { size, color: col, alpha: a, glow: 0.4 }); ctx.restore();
};
// soft touch indicator: keys [{t,x,y,down}] ; moves with io between keys
E.touch = (ctx, t, keys, tIn, tOut) => {
  if (t < tIn || t > tOut) return;
  let k = 0; while (k < keys.length - 1 && t > keys[k + 1].t) k++;
  const a = keys[k], b = keys[Math.min(k + 1, keys.length - 1)];
  const p = b.t > a.t ? E.ease.io(clamp((t - a.t) / (b.t - a.t))) : 1;
  const x = lerp(a.x, b.x, p), y = lerp(a.y, b.y, p);
  const down = lerp(a.down ? 1 : 0, b.down ? 1 : 0, p);
  const al = prog(t, tIn, tIn + 0.15) * (1 - prog(t, tOut - 0.15, tOut));
  ctx.save(); ctx.globalAlpha = al;
  ctx.fillStyle = `rgba(255,255,255,${0.18 + 0.2 * down})`; ctx.beginPath(); ctx.arc(x, y, 46 - 10 * down, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 12; ctx.stroke();
  ctx.restore();
};

// ---------- match-3 board (real gem art, real rules) ----------
const COLORS = ['red', 'blue', 'gold', 'green', 'purple'];
E.Board = class {
  constructor(o) {
    Object.assign(this, { cols: 8, rows: 6, cell: 122, x0: 52, y0: 800, gem: 104, seed: 5 }, o);
    this.R = E.rng(this.seed); this.gems = []; this.events = []; this.nextId = 0;
    this.grid = [];
    for (let r = 0; r < this.rows; r++) { this.grid.push([]); for (let c = 0; c < this.cols; c++) {
      let col; do { col = COLORS[Math.floor(this.R() * 5)]; } while (
        (c >= 2 && this.grid[r][c - 1].color === col && this.grid[r][c - 2].color === col) ||
        (r >= 2 && this.grid[r - 1][c].color === col && this.grid[r - 2][c].color === col));
      this.grid[r].push(this._new(col, r, c, -1));
    } }
    if (o.layout) o.layout.forEach((row, r) => row.split('').forEach((ch, c) => { const m = { r: 'red', b: 'blue', g: 'gold', e: 'green', p: 'purple' }[ch]; if (m) this.grid[r][c].color = m; }));
  }
  px(c) { return this.x0 + this.cell * (c + 0.5); }
  py(r) { return this.y0 + this.cell * (r + 0.5); }
  _new(color, r, c, born, fromR) {
    const g = { id: this.nextId++, color, born, die: null, segs: [], x: this.px(c), y: this.py(fromR ?? r) };
    this.gems.push(g); return g;
  }
  _move(g, t0, t1, r, c, ease) { const s = { t0, t1, x0: g.x, y0: g.y, x1: this.px(c), y1: this.py(r), ease }; g.segs.push(s); g.x = s.x1; g.y = s.y1; }
  matches() {
    const m = new Set(), G = this.grid;
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      const col = G[r][c]?.color; if (!col) continue;
      let k = c; while (k < this.cols && G[r][k]?.color === col) k++; if (k - c >= 3) for (let j = c; j < k; j++) m.add(r + ',' + j);
      k = r; while (k < this.rows && G[k][c]?.color === col) k++; if (k - r >= 3) for (let j = r; j < k; j++) m.add(j + ',' + c);
    }
    return [...m].map(s => s.split(',').map(Number));
  }
  // find all swaps that produce a match, returns [{a:[r,c], b:[r,c], n}]
  options() {
    const out = [], G = this.grid;
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) for (const [dr, dc] of [[0, 1], [1, 0]]) {
      const r2 = r + dr, c2 = c + dc; if (r2 >= this.rows || c2 >= this.cols) continue;
      [G[r][c], G[r2][c2]] = [G[r2][c2], G[r][c]]; const n = this.matches().length; [G[r][c], G[r2][c2]] = [G[r2][c2], G[r][c]];
      if (n) out.push({ a: [r, c], b: [r2, c2], n, color: G[r2][c2].color });
    }
    return out;
  }
  swap(t, a, b) {
    const G = this.grid, A = G[a[0]][a[1]], B = G[b[0]][b[1]];
    this._move(A, t, t + 0.2, b[0], b[1], E.ease.io); this._move(B, t, t + 0.2, a[0], a[1], E.ease.io);
    G[a[0]][a[1]] = B; G[b[0]][b[1]] = A;
    return this.resolve(t + 0.2, 0);
  }
  // remove arbitrary cells (spells, cards) then let gravity + cascades run
  blast(t, cells, stagger = 0) { return this.resolve(t, 0, cells, stagger); }
  resolve(t, depth, forced, stagger = 0) {
    const cells = forced ?? this.matches(); if (!cells.length) return t;
    const G = this.grid; let cx = 0, cy = 0; const gone = [];
    let tLast = t;
    cells.forEach(([r, c], i) => { const g = G[r][c]; if (!g) return; const td = t + (stagger ? stagger(r, c) : 0); g.die = td; tLast = Math.max(tLast, td); gone.push({ x: this.px(c), y: this.py(r), color: g.color, t: td }); cx += this.px(c); cy += this.py(r); G[r][c] = null; });
    this.events.push({ t, n: gone.length, x: cx / gone.length, y: cy / gone.length, depth, gems: gone, color: gone[0]?.color });
    const tf = tLast + 0.2; let tEnd = tf;
    for (let c = 0; c < this.cols; c++) {
      let w = this.rows - 1;
      for (let r = this.rows - 1; r >= 0; r--) { const g = G[r][c]; if (g) { if (w !== r) { const dist = w - r; const d = 0.16 + 0.05 * Math.sqrt(dist); this._move(g, tf, tf + d, w, c, E.ease.in2); g.land = tf + d; tEnd = Math.max(tEnd, tf + d); G[w][c] = g; G[r][c] = null; } w--; } }
      const missing = w + 1;
      for (let k = 0; k <= w; k++) {
        const r = w - k; let col;
        let tries = 0; do { col = COLORS[Math.floor(this.R() * 5)]; tries++; } while (depth >= 1 && tries < 20 && this._wouldMatch(r, c, col));
        const g = this._new(col, r, c, tf, r - missing - 0.15);
        const d = 0.16 + 0.05 * Math.sqrt(missing); this._move(g, tf + k * 0.03, tf + k * 0.03 + d, r, c, E.ease.in2); g.land = tf + k * 0.03 + d; tEnd = Math.max(tEnd, g.land); G[r][c] = g;
      }
    }
    return this.resolve(tEnd + 0.04, depth + 1) || tEnd;
  }
  _wouldMatch(r, c, col) { const G = this.grid; const at = (rr, cc) => G[rr]?.[cc]?.color; return (at(r, c - 1) === col && at(r, c - 2) === col) || (at(r, c + 1) === col && at(r, c + 2) === col) || (at(r, c - 1) === col && at(r, c + 1) === col) || (at(r + 1, c) === col && at(r + 2, c) === col); }
  pos(g, t) {
    let x = g.segs.length ? g.segs[0].x0 : g.x, y = g.segs.length ? g.segs[0].y0 : g.y;
    for (const s of g.segs) { if (t >= s.t1) { x = s.x1; y = s.y1; } else if (t > s.t0) { const p = s.ease((t - s.t0) / (s.t1 - s.t0)); x = lerp(s.x0, s.x1, p); y = lerp(s.y0, s.y1, p); break; } else break; }
    return [x, y];
  }
  render(ctx, t, o = {}) {
    const W = this.cols * this.cell, H = this.rows * this.cell;
    if (o.panel !== false) { // board backing, like the game's dark stone field
      ctx.save(); ctx.fillStyle = 'rgba(20,18,20,0.72)'; ctx.strokeStyle = 'rgba(160,130,90,0.35)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(this.x0 - 16, this.y0 - 16, W + 32, H + 32, 18); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    ctx.save(); ctx.beginPath(); ctx.rect(this.x0 - 20, this.y0 - 8, W + 40, H + 30); ctx.clip();
    for (const g of this.gems) {
      if (g.born > t) { /* spawned later but drawn from fall start */ if (!g.segs.length || t < g.segs[0].t0) continue; }
      if (g.die !== null && t > g.die + 0.2) continue;
      const [x, y] = this.pos(g, t);
      let s = 1, a = 1, white = 0;
      if (g.die !== null && t > g.die - 0.06) { const d = t - g.die; s = d < 0 ? 1 + (d + 0.06) * 3 : (1.18 - d * 5.9); white = clamp(1 - Math.abs(d) / 0.12); s = Math.max(0, s); }
      let sy = 1, sx = 1; if (g.land && t > g.land && t < g.land + 0.14) { const q = (t - g.land) / 0.14; sy = 1 - 0.13 * Math.sin(q * Math.PI); sx = 1 + 0.08 * Math.sin(q * Math.PI); }
      const hi = o.highlight?.(g, t) ?? 0;
      const dim = o.dim?.(g, t) ?? 0;
      const yy = y + (this.gem * (1 - sy)) / 2;
      if (hi > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(x, y, 0, x, y, 80); gr.addColorStop(0, `rgba(255,240,200,${0.55 * hi})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.fillRect(x - 80, y - 80, 160, 160); ctx.restore(); }
      E.draw(ctx, 'gem-' + g.color, x, yy, this.gem, { scale: s * (1 + 0.08 * hi), sx, sy, alpha: a, filter: dim ? `brightness(${1 - dim * 0.7}) saturate(${1 - dim * 0.6})` : undefined });
      if (white > 0) E.draw(ctx, 'gem-' + g.color, x, yy, this.gem, { scale: s, alpha: white * 0.9, comp: 'lighter', filter: 'brightness(2.2)' });
    }
    ctx.restore();
    for (const ev of this.events) for (const [i, gm] of ev.gems.entries()) E.shards(ctx, t, gm.t, gm.x, gm.y, E.GEMCOL[gm.color], 7, gm.x * 0.37 + gm.y * 0.11 + i, 0.8);
  }
};

// ---------- boss panel (captured game UI with live HP) ----------
E.bossPanel = (ctx, t, o) => {
  const { x = 0, y = 600, s = 1, hp, max, attack, attackCol = '#f2efe6', alpha = 1 } = o;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(s, s);
  ctx.drawImage(E.img['panel-clean'], 0, 0, 1080, 228);
  if (o.portraitFlash) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,60,40,${o.portraitFlash})`; ctx.fillRect(18, 16, 196, 196); ctx.restore(); }
  const bx = 351, by = 99, bw = 591, bh = 41;
  const f = clamp(hp / max), ghost = clamp((o.ghost ?? hp) / max);
  ctx.fillStyle = 'rgba(255,220,200,0.55)'; ctx.fillRect(bx, by, bw * ghost, bh);
  ctx.drawImage(E.img.EnemyHPBarTarget_Fill, 0, 0, Math.max(1, 1649 * f), 98, bx, by, bw * f, bh);
  E.text(ctx, `${Math.round(hp)}/${max}`, 646, 129, { size: 30, color: '#f4efe6', stroke: false, ls: 1 });
  E.text(ctx, attack, 646, 190, { size: 32, color: attackCol, stroke: false, ls: 1 });
  ctx.restore();
};

// ---------- end card ----------
E.endCard = (ctx, t, t0, tag, o = {}) => {
  if (t < t0) return;
  const p = spring(t, t0, 120, 22);
  const ly = o.logoY ?? 760;
  // glow behind logo
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const gr = ctx.createRadialGradient(E.W / 2, ly, 0, E.W / 2, ly, 640); gr.addColorStop(0, `rgba(170,40,30,${0.38 * clamp(p)})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gr; ctx.fillRect(0, ly - 640, E.W, 1280); ctx.restore();
  const sc = 1.25 - 0.25 * p, w = 940;
  E.draw(ctx, 'logo-hi', E.W / 2, ly, w, { scale: sc + 0.012 * Math.sin((t - t0) * 1.4), alpha: clamp(p * 2), filter: p < 0.6 ? `blur(${(0.6 - p) * 20}px)` : undefined });
  // sheen sweep across the logo
  const sp = prog(t, t0 + 0.35, t0 + 1.25, E.ease.io);
  if (sp > 0 && sp < 1) {
    const c = E._sheen || (E._sheen = document.createElement('canvas')); c.width = 940; c.height = 536; const g = c.getContext('2d');
    g.clearRect(0, 0, 940, 536); g.drawImage(E.img['logo-hi'], 0, 0, 940, 536); g.globalCompositeOperation = 'source-in';
    const sx = -300 + sp * 1540; const lg = g.createLinearGradient(sx - 160, 0, sx + 160, 0); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, 'rgba(255,248,225,0.85)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = lg; g.fillRect(0, 0, 940, 536); g.globalCompositeOperation = 'source-over';
    E.draw(ctx, c, E.W / 2, ly, w, { scale: sc, comp: 'lighter' });
  }
  if (tag) E.title(ctx, t, [{ text: tag, size: o.tagSize ?? 58, color: E.GOLD }], E.W / 2, o.tagY ?? ly + 360, t0 + 0.45);
  // CTA
  const cp = spring(t, t0 + 0.9, 200, 16);
  if (cp > 0) {
    const pulse = 1 + 0.025 * Math.sin((t - t0 - 0.9) * 6.3);
    ctx.save(); ctx.translate(E.W / 2, o.ctaY ?? ly + 560); ctx.scale(cp * pulse, cp * pulse);
    E.draw(ctx, 'play-normal', 0, 0, 620);
    E.text(ctx, o.cta ?? 'PLAY NOW', 0, 22, { size: 64, color: E.GOLD, ls: 6 });
    ctx.restore();
  }
};

// ---------- page harness ----------
E.boot = async (ad) => {
  const cv = document.getElementById('c'); const ctx = cv.getContext('2d');
  await E.load(ad.assets);
  ad.setup?.();
  window.DURATION = ad.duration; window.CUES = ad.cues ?? {};
  window.seek = (t) => { ctx.save(); ctx.clearRect(0, 0, E.W, E.H); ad.draw(ctx, t); ctx.restore(); };
  window.seek(0); window.ready = true;
  // preview controls (render never uses these): space play/pause, arrows step
  if (!navigator.webdriver) {
    let t = 0, playing = true, last = performance.now();
    const loop = (now) => { if (playing) { t += (now - last) / 1000; if (t > ad.duration) t = 0; window.seek(t); } last = now; requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    addEventListener('keydown', e => { if (e.code === 'Space') playing = !playing; if (e.code === 'ArrowRight') { t += 1 / 30; window.seek(t); } if (e.code === 'ArrowLeft') { t -= 1 / 30; window.seek(t); } if (e.key === 'r') t = 0; });
  }
};
})();
