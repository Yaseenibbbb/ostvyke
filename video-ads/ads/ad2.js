// AD 2 — "ONE CARD. CHANGE THE FIGHT." · card mechanic · 12.5 s · 9:16
(() => {
const { clamp, prog, spring, lerp } = E;
const T = { cards: 1.7, flip: 2.45, slam: 3.0, sweep: 3.75, swap: 5.05, hand: 6.4, end: 8.9, dur: 12.5 };
const PANEL_Y = 560;
const B = new E.Board({ seed: 44, y0: 850 });
const ad = { duration: T.dur, cues: { T } };
ad.assets = ['background', 'hero-sigil', 'ambient-smoke', 'panel-clean', 'EnemyHPBarTarget_Fill', 'gem-red', 'gem-blue', 'gem-gold', 'gem-green', 'gem-purple',
  'card-back', 'card-back-left', 'card-back-right', 'card-featured', 'spell-arcane', 'spell-thunder', 'spell-storm', 'logo-hi', 'play-normal', 'knight'];
// obstacle cells (r,c)
const OBS = [[0, 2], [0, 5], [1, 1], [1, 3], [1, 6], [2, 0], [2, 4], [2, 7], [3, 2], [3, 5], [4, 1], [4, 3], [4, 6], [5, 0], [5, 4], [5, 7]];
const breakT = (r, c) => T.sweep + 0.1 + r * 0.11 + Math.abs(c - 3.5) * 0.012;
let hits = [], swapO, endS;
ad.setup = () => {
  const centre = o => -Math.abs(o.a[1] + o.b[1] - 7) - Math.abs(o.a[0] + o.b[0] - 5) * 0.8;
  swapO = B.options().sort((p, q) => q.n - p.n || centre(q) - centre(p))[0];
  endS = B.swap(T.swap, swapO.a, swapO.b);
  let hp = 200; hits = B.events.map((e, i) => { const d = i === 0 ? 48 : 22; return { t: e.t + 0.42, dmg: d }; });
  ad.cues.events = B.events.map(e => ({ t: e.t, n: e.n, depth: e.depth })); ad.cues.hits = hits; ad.cues.breaks = OBS.map(([r, c]) => breakT(r, c));
  window.__dbg = { swapO, endS, ev: B.events.map(e => [e.t.toFixed(2), e.n]) };
};
const hpAt = (t, lag = 0) => { let hp = 200; for (const h of hits) hp -= h.dmg * prog(t, h.t + lag, h.t + lag + (lag ? 0.35 : 0.18)); return hp; };

// a cursed stone slab sitting on a cell
const slab = (ctx, t, x, y, k) => {
  const s = 112;
  ctx.save(); ctx.translate(x, y);
  const g = ctx.createLinearGradient(0, -s / 2, 0, s / 2); g.addColorStop(0, '#7a7084'); g.addColorStop(1, '#2c2634');
  ctx.shadowColor = 'rgba(170,80,255,0.95)'; ctx.shadowBlur = 26 + 10 * Math.sin(t * 4 + k);
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-s / 2, -s / 2, s, s, 14); ctx.fill(); ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(190,140,255,0.8)'; ctx.lineWidth = 4; ctx.stroke();
  ctx.strokeStyle = 'rgba(20,10,30,0.8)'; ctx.lineWidth = 4; ctx.beginPath();
  const R = E.rng(k * 7 + 3); let px = -s / 2 + 10 + R() * 30, py = -s / 2 + 8; ctx.moveTo(px, py);
  for (let i = 0; i < 4; i++) { px += (R() - 0.3) * 30; py += 22 + R() * 6; ctx.lineTo(px, py); } ctx.stroke();
  ctx.restore();
};

ad.draw = (ctx, t) => {
  const evs = B.events;
  const shakes = [{ t: T.slam, amp: 22, dur: 0.45 }, ...OBS.map(([r, c]) => ({ t: breakT(r, c), amp: 6, dur: 0.25 })), ...evs.map(e => ({ t: e.t, amp: 4 + e.n * 1.5, dur: 0.3 }))];
  const sh = E.shake(t, shakes), z = 1 + E.punch(t, [{ t: T.slam, amp: 0.03 }, { t: T.sweep + 0.1, amp: 0.02 }, ...hits.map(h => ({ t: h.t, amp: 0.012 }))]);
  const handP = prog(t, T.hand - 0.25, T.hand + 0.25, E.ease.io);
  const outP = prog(t, T.end - 0.45, T.end + 0.1, E.ease.inn);

  E.bg(ctx, t, { warm: 0.18 + 0.15 * (0.5 + 0.5 * Math.sin(t * 7)) * (1 - prog(t, T.cards, T.cards + 0.4)) });
  E.smoke(ctx, t, 0.22, 2);

  if (outP < 1) {
    ctx.save(); ctx.globalAlpha = 1 - outP;
    ctx.translate(E.W / 2 + sh.x, 1000 + sh.y); ctx.rotate(sh.r); ctx.scale(z, z); ctx.translate(-E.W / 2, -1000);

    // board + obstacles (board sinks back when the hand is shown)
    const inP = spring(t, -0.4, 150, 22);
    const boardDim = 0.85 * prog(t, T.cards, T.cards + 0.3) * (1 - prog(t, T.sweep - 0.1, T.sweep + 0.2)) + 0.7 * handP;
    ctx.save(); ctx.translate(0, (1 - inP) * 160 + handP * 60); ctx.globalAlpha *= clamp(inP * 1.5) * (1 - 0.8 * handP);
    B.render(ctx, t, { dim: () => boardDim, highlight: (g, tt) => { const [x, y] = B.pos(g, tt); const r = Math.round((y - B.y0) / B.cell - 0.5); const d = tt - (T.sweep + 0.1 + r * 0.11); return d > -0.05 && d < 0.3 ? 1 - Math.abs(d - 0.08) / 0.25 : 0; } });
    OBS.forEach(([r, c], k) => {
      const bt = breakT(r, c), x = B.px(c), y = B.py(r);
      if (t < bt) { ctx.save(); ctx.globalAlpha *= 1 - boardDim * 0.6; slab(ctx, t, x, y, k); ctx.restore(); }
      E.shards(ctx, t, bt, x, y, [150, 140, 170], 9, k + 40, 0.9);
      E.shards(ctx, t, bt, x, y, [255, 200, 120], 5, k + 90, 0.6);
    });
    // flame sweep line
    const sp = prog(t, T.sweep, T.sweep + 0.85, E.ease.io);
    if (sp > 0 && sp < 1) {
      const yy = B.y0 - 40 + sp * (B.rows * B.cell + 80);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(0, yy - 120, 0, yy + 40); g.addColorStop(0, 'rgba(255,140,40,0)'); g.addColorStop(0.75, 'rgba(255,190,90,0.75)'); g.addColorStop(0.92, 'rgba(255,250,225,1)'); g.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.fillStyle = g; ctx.fillRect(B.x0 - 30, yy - 120, B.cols * B.cell + 60, 160); ctx.restore();
    }
    ctx.restore();

    // boss panel
    const pIn = spring(t, -0.3, 170, 24);
    const pulse = t < T.swap ? 0.5 + 0.5 * Math.sin(t * 14) : 0;
    ctx.save(); ctx.translate(0, (1 - pIn) * -260 - handP * 40); ctx.globalAlpha *= 1 - handP * 0.6;
    E.bossPanel(ctx, t, { y: PANEL_Y, hp: hpAt(t), ghost: hpAt(t, 0.25), max: 200, attack: t < T.swap + 0.25 ? 'ATTACK IN 1 MOVE' : 'ATTACK IN 3 MOVES',
      attackCol: pulse ? `rgb(255,${Math.round(235 - 175 * pulse)},${Math.round(225 - 185 * pulse)})` : '#f2efe6', alpha: clamp(pIn * 1.6),
      portraitFlash: hits.reduce((a, h) => a + 0.5 * (t > h.t ? Math.max(0, 1 - (t - h.t) / 0.25) : 0), 0) });
    ctx.restore();
    evs.forEach((e, i) => E.orb(ctx, t, e.t + 0.05, e.t + 0.42, e.x, e.y, 640, PANEL_Y + 120, E.GEMCOL[e.color], i + 5));
    hits.forEach((h, i) => { E.dmg(ctx, t, h.t, 640 + (i % 2 ? 90 : -90), PANEL_Y + 90, '-' + h.dmg); E.ring(ctx, t, h.t, 640, PANEL_Y + 120, 300, '255,120,90', 0.45, 10); });

    // hesitating finger, then the real swap
    const ax = B.px(swapO.a[1]), ay = B.py(swapO.a[0]), bx = B.px(swapO.b[1]), by = B.py(swapO.b[0]);
    E.touch(ctx, t, [{ t: 0, x: 300, y: 1300 }, { t: 0.5, x: 420, y: 1180 }, { t: 0.95, x: 700, y: 1250 }, { t: 1.4, x: 560, y: 1380 }], 0.05, 1.55);
    E.touch(ctx, t, [{ t: T.swap - 0.32, x: ax + 30, y: ay + 60 }, { t: T.swap - 0.06, x: ax, y: ay, down: true }, { t: T.swap + 0.2, x: bx, y: by, down: true }, { t: T.swap + 0.34, x: bx + 30, y: by + 50 }], T.swap - 0.45, T.swap + 0.45);

    // ---- the cards ----
    if (t > T.cards && t < T.sweep + 0.4) {
      const up = spring(t, T.cards, 160, 20);
      const flipP = prog(t, T.flip, T.flip + 0.32, E.ease.io);
      const slamP = spring(t, T.slam, 210, 19);
      const burn = prog(t, T.sweep - 0.15, T.sweep + 0.25, E.ease.inn);
      // side cards fan out then drop away
      const away = prog(t, T.slam - 0.15, T.slam + 0.25, E.ease.inn);
      [['card-back-left', -260, -0.22], ['card-back-right', 260, 0.22]].forEach(([n, dx, rot], i) => {
        E.draw(ctx, n, 540 + dx * 1.15 * up + dx * away * 0.8, 1230 + (1 - up) * 700 + away * 500, 400, { rot: rot * up, alpha: 1 - away });
      });
      // centre card flips (scaleX through 0) then slams to centre
      const sx = Math.abs(Math.cos(flipP * Math.PI));
      const face = flipP > 0.5;
      const cy = lerp(1200 + (1 - up) * 700, 1190, slamP), w = lerp(360, 500, slamP);
      if (slamP > 0.02) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(540, cy, 0, 540, cy, 600); g.addColorStop(0, `rgba(255,190,90,${0.45 * clamp(slamP) * (1 - burn)})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, cy - 600, 1080, 1200); ctx.restore(); }
      ctx.save(); ctx.translate(540, cy - burn * 260); ctx.scale(1 + burn * 0.25, 1 + burn * 0.25); ctx.globalAlpha *= 1 - burn;
      if (face) E.draw(ctx, 'card-featured', 0, 0, w * 1.12, { sx });
      else E.draw(ctx, 'card-back', 0, 0, w, { sx });
      if (face) E.draw(ctx, 'card-featured', 0, 0, w * 1.12, { sx, comp: 'lighter', alpha: clamp(1 - (t - T.flip - 0.16) / 0.3) * 0.8 });
      ctx.restore();
      E.ring(ctx, t, T.slam + 0.05, 540, 1190, 620, '255,210,140', 0.55, 18);
      E.flash(ctx, t, T.sweep - 0.05, 0.4, '255,220,160', 0.5);
    }

    // ---- your hand: spells ----
    if (t > T.hand - 0.1) {
      const sp = [['spell-arcane', 'ARCANE', 'BOLT'], ['spell-thunder', 'THUNDER', 'BOLT'], ['spell-storm', 'HOLY', 'STORM']];
      sp.forEach(([n, a, b], i) => {
        const p = spring(t, T.hand + 0.12 + i * 0.16, 200, 17), x = 210 + i * 330, y = 1130;
        ctx.save(); ctx.translate(x, y + (1 - p) * 300); ctx.globalAlpha *= clamp(p * 2);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 230); g.addColorStop(0, 'rgba(0,0,0,0.7)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(-230, -230, 460, 560);
        E.draw(ctx, n, 0, 0, 290, { scale: 0.9 + 0.1 * p });
        E.text(ctx, a, 0, 200, { size: 46, color: E.SILVER }); E.text(ctx, b, 0, 252, { size: 46, color: E.SILVER });
        ctx.restore();
        E.ring(ctx, t, T.hand + 0.2 + i * 0.16, x, y, 240, '255,210,140', 0.45, 8);
      });
    }
    ctx.restore();
  }

  const Y = 400;
  E.title(ctx, t, [{ text: 'ONE MOVE LEFT', size: 112, color: E.RED }], 540, Y, -0.32, T.cards - 0.15);
  E.title(ctx, t, [{ text: 'PLAY YOUR CARD', size: 104 }], 540, Y, T.cards, T.sweep - 0.25);
  E.title(ctx, t, [{ text: 'ONE CARD.', size: 88, color: E.SILVER }, { text: 'CHANGE THE FIGHT.', size: 84 }], 540, Y - 60, T.sweep - 0.05, T.hand - 0.3);
  E.title(ctx, t, [{ text: 'YOUR HAND.', size: 92, color: E.SILVER }, { text: 'YOUR STRATEGY.', size: 92 }], 540, Y - 60, T.hand, T.end - 0.5);

  if (t > T.end - 0.2) {
    const a = prog(t, T.end - 0.2, T.end + 0.25), kp = spring(t, T.end - 0.1, 90, 20);
    ctx.save(); ctx.globalAlpha = a;
    E.draw(ctx, 'knight', 560, 1560 + (1 - kp) * 200, 1150, { alpha: 0.8 * a, filter: 'brightness(0.85) contrast(1.1)' });
    const fade = ctx.createLinearGradient(0, 900, 0, 1920); fade.addColorStop(0, 'rgba(6,5,6,0)'); fade.addColorStop(0.55, 'rgba(6,5,6,0.85)'); fade.addColorStop(1, 'rgba(6,5,6,1)'); ctx.fillStyle = fade; ctx.fillRect(0, 900, 1080, 1020);
    // the card returns beside the logo
    const cp = spring(t, T.end + 0.3, 180, 18);
    E.draw(ctx, 'card-featured', 540, 940, 220, { scale: cp, rot: -0.06 });
    ctx.restore();
    E.endCard(ctx, t, T.end, 'ONE CARD. CHANGE THE FIGHT.', { logoY: 520, tagY: 1150, ctaY: 1300, tagSize: 52 });
  }
  E.embers(ctx, t, 30, 8, 0.9);
  E.vignette(ctx, 0.8);
  E.grain(ctx, t);
};
window.AD = ad;
})();
