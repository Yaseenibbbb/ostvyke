// AD 3 — "THE ORDER FIGHTS BACK" · bosses + leaderboard · 13.5 s · 9:16
(() => {
const { clamp, prog, spring, lerp } = E;
const T = { b1: 1.9, b2: 3.05, b3: 4.2, lineup: 5.35, play: 6.9, s1: 7.2, s2: 8.05, crypt: 9.1, end: 11.2, dur: 13.5 };
const BOSSES = [
  { img: 'boss-gatekeeper', name: 'THE GATEKEEPER', hp: 200, t: T.b1, dir: -1 },
  { img: 'boss-protector', name: 'PROTECTOR OF THE ORDER', hp: 480, t: T.b2, dir: 1 },
  { img: 'boss-alchemist', name: 'THE ALCHEMIST', hp: 280, t: T.b3, dir: -1 },
];
const B = new E.Board({ seed: 77, y0: 760 });
const ad = { duration: T.dur, cues: { T } };
ad.assets = ['background', 'hero-sigil', 'ambient-smoke', 'EnemyHPBarTarget_Fill', 'gem-red', 'gem-blue', 'gem-gold', 'gem-green', 'gem-purple',
  'boss-gatekeeper', 'boss-protector', 'boss-alchemist', 'knight', 'knight-ground-shadow', 'preview-leaderboard', 'crypt-crest', 'logo-hi', 'play-normal'];
let swaps = [];
ad.setup = () => {
  const centre = o => -Math.abs(o.a[1] + o.b[1] - 7) - Math.abs(o.a[0] + o.b[0] - 5) * 0.8;
  for (const st of [T.s1, T.s2]) { const o = B.options().sort((p, q) => q.n - p.n || centre(q) - centre(p))[0]; swaps.push({ t: st, ...o }); B.swap(st, o.a, o.b); }
  ad.cues.events = B.events.map(e => ({ t: e.t, n: e.n, depth: e.depth }));
  window.__dbg = { ev: B.events.map(e => [e.t.toFixed(2), e.n]) };
};

// framed boss portrait card with name + HP bar
const bossCard = (ctx, t, b, x, y, w, o = {}) => {
  ctx.save(); ctx.translate(x, y); ctx.globalAlpha *= o.alpha ?? 1; if (o.rot) ctx.rotate(o.rot);
  const h = w;
  ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 40;
  ctx.fillStyle = '#121014'; ctx.fillRect(-w / 2 - 14, -h / 2 - 14, w + 28, h + 28); ctx.shadowBlur = 0;
  ctx.drawImage(E.img[b.img], -w / 2, -h / 2, w, h);
  const fr = ctx.createLinearGradient(0, -h / 2, 0, h / 2); fr.addColorStop(0, '#d9b36a'); fr.addColorStop(0.5, '#7a5a2a'); fr.addColorStop(1, '#c9a25a');
  ctx.strokeStyle = fr; ctx.lineWidth = 8; ctx.strokeRect(-w / 2 - 6, -h / 2 - 6, w + 12, h + 12);
  ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 3; ctx.strokeRect(-w / 2 - 12, -h / 2 - 12, w + 24, h + 24);
  if (o.flash) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,220,180,${o.flash})`; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.globalCompositeOperation = 'source-over'; }
  if (o.info !== false) {
    const nameSize = b.name.length > 16 ? 50 : 60;
    E.text(ctx, b.name, 0, h / 2 + 100, { size: nameSize, color: E.GOLD, alpha: o.infoA ?? 1 });
    const bw = w * 1.05, fill = o.fill ?? 1;
    ctx.globalAlpha *= o.infoA ?? 1;
    ctx.fillStyle = '#1a0707'; ctx.strokeStyle = '#6b5434'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.roundRect(-bw / 2, h / 2 + 135, bw, 48, 8); ctx.fill(); ctx.stroke();
    ctx.drawImage(E.img.EnemyHPBarTarget_Fill, 0, 0, Math.max(1, 1649 * fill), 98, -bw / 2 + 4, h / 2 + 139, (bw - 8) * fill, 40);
    E.text(ctx, `${Math.round(b.hp * fill)}/${b.hp}`, 0, h / 2 + 172, { size: 32, color: '#f4efe6', stroke: false, ls: 1 });
  }
  ctx.restore();
};

ad.draw = (ctx, t) => {
  const bossHits = BOSSES.map(b => ({ t: b.t + 0.12, amp: 30, dur: 0.5 }));
  const sh = E.shake(t, [...bossHits, { t: 0.15, amp: 18, dur: 0.5 }, ...B.events.map(e => ({ t: e.t, amp: 4 + e.n * 1.5, dur: 0.3 }))]);
  const z = 1 + E.punch(t, BOSSES.map(b => ({ t: b.t + 0.12, amp: 0.03 })));

  E.bg(ctx, t, { warm: 0.28, dark: 0.66 });
  E.smoke(ctx, t, 0.3, 3);
  ctx.save(); ctx.translate(E.W / 2 + sh.x, E.H / 2 + sh.y); ctx.rotate(sh.r); ctx.scale(z, z); ctx.translate(-E.W / 2, -E.H / 2);

  // ---- 1. the knight: slow push-in out of darkness ----
  if (t < T.b1 + 0.4) {
    const out = prog(t, T.b1 - 0.25, T.b1 + 0.3, E.ease.inn);
    const push = 1 + 0.06 * (t / T.b1);
    const rise = spring(t, -0.5, 60, 16);
    ctx.save(); ctx.globalAlpha = 1 - out;
    E.draw(ctx, 'knight-ground-shadow', 540, 1960, 900, { alpha: 0.7 });
    E.draw(ctx, 'knight', 540 - out * 300, 1270 + (1 - rise) * 260, 1300 * push, { filter: `brightness(${0.45 + 0.5 * rise})` });
    ctx.restore();
  }

  // ---- 2. the gauntlet: each boss slams in, HP bar fills ----
  BOSSES.forEach((b, i) => {
    const next = i < 2 ? BOSSES[i + 1].t : T.lineup;
    if (t < b.t - 0.25 || t > next + 0.3) return;
    const inP = spring(t, b.t - 0.2, 240, 24), outP = prog(t, next - 0.18, next + 0.12, E.ease.inn);
    const x = 540 + b.dir * (1 - inP) * 900 - b.dir * outP * 1100, y = 1020;
    const fill = prog(t, b.t + 0.1, b.t + 0.75, E.ease.out);
    E.ring(ctx, t, b.t + 0.05, 540, 1000, 700, '255,190,120', 0.55, 20);
    bossCard(ctx, t, b, x, y, 560, { rot: b.dir * 0.05 * (1 - inP), fill, flash: 0.7 * clamp(1 - (t - b.t) / 0.25) * (t > b.t ? 1 : 0), infoA: prog(t, b.t, b.t + 0.2) * (1 - prog(t, next - 0.3, next - 0.15)) });
  });

  // ---- 3. line-up ----
  if (t > T.lineup - 0.15 && t < T.play + 0.3) {
    const out = prog(t, T.play - 0.2, T.play + 0.15, E.ease.inn);
    BOSSES.forEach((b, i) => {
      const p = spring(t, T.lineup - 0.1 + i * 0.1, 200, 20);
      bossCard(ctx, t, b, 200 + i * 340, 1000 + (1 - p) * 600, 300, { alpha: clamp(p * 2) * (1 - out), info: false, rot: (i - 1) * 0.04 });
      E.text(ctx, String(b.hp), 200 + i * 340, 1240, { size: 40, color: E.RED, alpha: clamp(p * 2) * (1 - out) });
      E.text(ctx, 'HP', 200 + i * 340, 1282, { size: 28, color: E.SILVER, alpha: clamp(p * 2) * (1 - out) });
    });
  }

  // ---- 4. gameplay ----
  if (t > T.play - 0.2 && t < T.crypt + 0.3) {
    const inP = spring(t, T.play - 0.15, 170, 22), out = prog(t, T.crypt - 0.2, T.crypt + 0.15, E.ease.inn);
    ctx.save(); ctx.globalAlpha *= clamp(inP * 1.5) * (1 - out); ctx.translate(0, (1 - inP) * 300 - out * 200);
    B.render(ctx, t);
    for (const s of swaps) {
      const ax = B.px(s.a[1]), ay = B.py(s.a[0]), bx = B.px(s.b[1]), by = B.py(s.b[0]);
      E.touch(ctx, t, [{ t: s.t - 0.3, x: ax + 30, y: ay + 60 }, { t: s.t - 0.06, x: ax, y: ay, down: true }, { t: s.t + 0.2, x: bx, y: by, down: true }, { t: s.t + 0.34, x: bx + 30, y: by + 50 }], s.t - 0.4, s.t + 0.42);
    }
    ctx.restore();
  }

  // ---- 5. the crypt of knights (real leaderboard capture) ----
  if (t > T.crypt - 0.2 && t < T.end + 0.2) {
    const inP = spring(t, T.crypt - 0.15, 150, 22), out = prog(t, T.end - 0.4, T.end, E.ease.inn);
    const scroll = prog(t, T.crypt + 0.3, T.end - 0.3, E.ease.io);
    ctx.save(); ctx.globalAlpha *= clamp(inP * 1.5) * (1 - out);
    const im = E.img['preview-leaderboard'], w = 1000, h = w * im.height / im.width;
    const y0 = 650 + (1 - inP) * 500 - scroll * 40;
    ctx.save(); ctx.beginPath(); ctx.roundRect(40, 640, 1000, 1000, 16); ctx.clip();
    ctx.drawImage(im, 40, y0, w, h);
    // gold shimmer down the ranks
    ctx.globalCompositeOperation = 'lighter';
    const sy = y0 + 150 + scroll * 700;
    const g = ctx.createLinearGradient(0, sy - 70, 0, sy + 70); g.addColorStop(0, 'rgba(255,200,110,0)'); g.addColorStop(0.5, 'rgba(255,200,110,0.22)'); g.addColorStop(1, 'rgba(255,200,110,0)');
    ctx.fillStyle = g; ctx.fillRect(40, sy - 70, 1000, 140);
    ctx.restore();
    const crest = spring(t, T.crypt + 0.1, 200, 16);
    E.draw(ctx, 'crypt-crest', 540, 610, 230, { scale: crest });
    ctx.restore();
  }
  ctx.restore();

  // ---- titles ----
  const Y = 400;
  E.title(ctx, t, [{ text: 'THE ORDER', size: 132, color: E.SILVER }, { text: 'FIGHTS BACK', size: 116 }], 540, Y - 70, -0.35, T.b1 - 0.3);
  E.title(ctx, t, [{ text: 'FACE THE BOSSES', size: 100 }], 540, Y, T.b1 - 0.1, T.lineup - 0.3);
  E.title(ctx, t, [{ text: 'DIFFERENT FOES.', size: 92, color: E.SILVER }, { text: 'DIFFERENT TACTICS.', size: 84 }], 540, Y - 60, T.lineup - 0.05, T.play - 0.3);
  E.title(ctx, t, [{ text: 'MATCH TO SURVIVE', size: 90 }], 540, Y, T.play - 0.05, T.crypt - 0.3);
  E.title(ctx, t, [{ text: 'LEAVE YOUR NAME', size: 92, color: E.SILVER }, { text: 'IN THE CRYPT', size: 92 }], 540, Y - 110, T.crypt - 0.05, T.end - 0.45);

  if (t > T.end - 0.2) {
    const a = prog(t, T.end - 0.2, T.end + 0.25), kp = spring(t, T.end - 0.1, 90, 20);
    ctx.save(); ctx.globalAlpha = a;
    E.draw(ctx, 'knight', 560, 1560 + (1 - kp) * 200, 1150, { alpha: 0.8 * a, filter: 'brightness(0.85) contrast(1.1)' });
    const fade = ctx.createLinearGradient(0, 900, 0, 1920); fade.addColorStop(0, 'rgba(6,5,6,0)'); fade.addColorStop(0.55, 'rgba(6,5,6,0.85)'); fade.addColorStop(1, 'rgba(6,5,6,1)'); ctx.fillStyle = fade; ctx.fillRect(0, 900, 1080, 1020);
    BOSSES.forEach((b, i) => { const p = spring(t, T.end + 0.3 + i * 0.08, 200, 18); bossCard(ctx, t, b, 300 + i * 240, 930, 150, { info: false, alpha: clamp(p * 2), rot: (i - 1) * 0.05 }); });
    ctx.restore();
    E.endCard(ctx, t, T.end, 'CAN YOU DEFEAT THE ORDER?', { logoY: 520, tagY: 1120, ctaY: 1285, tagSize: 50 });
  }
  E.embers(ctx, t, 46, 11, 1);
  E.vignette(ctx, 0.82);
  E.grain(ctx, t);
};
window.AD = ad;
})();
