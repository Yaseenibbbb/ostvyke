// AD 1 — "EVERY MATCH IS A BATTLE" · gameplay hook · 12 s · 9:16
(() => {
const { clamp, prog, spring, lerp } = E;
const T = {
  s1: 0.5, s2: 2.0, atk: 3.55, spell: 4.55, boltT: 5.2, s3: 6.7, end: 8.7, dur: 12.0,
};
const PANEL_Y = 560;
const B = new E.Board({ seed: 21, y0: 850 });
const ad = { duration: T.dur, cues: { T } };
ad.assets = ['background', 'hero-sigil', 'ambient-smoke', 'panel-clean', 'EnemyHPBarTarget_Fill', 'gem-red', 'gem-blue', 'gem-gold', 'gem-green', 'gem-purple', 'spell-thunder', 'logo-hi', 'play-normal', 'knight'];

let ev1, ev2, ev3, evB, swaps = [], hits = [], blastCells, end1, end2, end3;
ad.setup = () => {
  const centre = o => -Math.abs(o.a[1] + o.b[1] - 7) - Math.abs(o.a[0] + o.b[0] - 5) * 0.8;
  // move 1: a clean 3-match near the centre
  let o1 = B.options().filter(o => o.n === 3).sort((p, q) => centre(q) - centre(p))[0];
  swaps.push({ t: T.s1, ...o1 }); end1 = B.swap(T.s1, o1.a, o1.b); ev1 = B.events.slice();
  // move 2: the biggest match on the board
  let o2 = B.options().sort((p, q) => q.n - p.n || centre(q) - centre(p))[0];
  swaps.push({ t: T.s2, ...o2 }); const n0 = B.events.length; end2 = B.swap(T.s2, o2.a, o2.b); ev2 = B.events.slice(n0);
  // thunder bolt: 3x3 area
  blastCells = []; for (let r = 2; r <= 4; r++) for (let c = 3; c <= 5; c++) blastCells.push([r, c]);
  const n1 = B.events.length; B.blast(T.boltT + 0.08, blastCells, (r, c) => (Math.abs(r - 3) + Math.abs(c - 4)) * 0.025); evB = B.events.slice(n1);
  // move 3: finishing blow
  let o3 = B.options().sort((p, q) => q.n - p.n || centre(q) - centre(p))[0];
  swaps.push({ t: T.s3, ...o3 }); const n2 = B.events.length; end3 = B.swap(T.s3, o3.a, o3.b); ev3 = B.events.slice(n2);
  ad.cues.events = B.events.map(e => ({ t: e.t, n: e.n, depth: e.depth, x: e.x }));
  ad.cues.swaps = swaps.map(s => s.t); ad.cues.ends = [end1, end2, end3];
  // damage hits land when the orb reaches the boss bar
  const arrive = e => e.t + 0.42;
  hits = [
    { t: arrive(ev1[0]), dmg: 30 },
    ...ev2.map((e, i) => ({ t: arrive(e), dmg: i === 0 ? 34 : 18 })),
  ];
  const left = 200 - hits.reduce((a, h) => a + h.dmg, 0);
  hits.push({ t: T.boltT + 0.12, dmg: left - 44 });
  hits.push(...ev3.map((e, i, arr) => ({ t: arrive(e), dmg: i === arr.length - 1 ? 44 - 0 - (arr.length - 1) * 0 : 0 })));
  // make move 3 deliver exactly the remaining 44 on its first clear
  hits.splice(hits.length - ev3.length); hits.push({ t: arrive(ev3[0]), dmg: 44, kill: true });
  ad.cues.hits = hits;
  window.__dbg = { swaps, end1, end2, end3, hits, ev: B.events.map(e => [e.t.toFixed(2), e.n, e.depth]) };
};
const hpAt = (t, lag = 0) => { let hp = 200; for (const h of hits) hp -= h.dmg * prog(t, h.t + lag, h.t + lag + (lag ? 0.35 : 0.18), E.ease.out); return Math.max(0, hp); };
const killT = () => hits[hits.length - 1].t;
const movesText = t => {
  if (t < T.s1 + 0.25) return 'ATTACK IN 3 MOVES';
  if (t < T.s2 + 0.25) return 'ATTACK IN 2 MOVES';
  if (t < T.atk + 0.15) return 'ATTACK IN 1 MOVE';
  if (t < T.s3 + 0.25) return 'ATTACK IN 3 MOVES';
  return 'ATTACK IN 2 MOVES';
};

ad.draw = (ctx, t) => {
  const kt = killT();
  const shakes = [{ t: T.atk + 0.12, amp: 34, dur: 0.6 }, { t: T.boltT + 0.08, amp: 40, dur: 0.7 }, { t: kt, amp: 26, dur: 0.6 },
    ...B.events.map(e => ({ t: e.t, amp: 4 + e.n * 1.6, dur: 0.3 }))];
  const punches = [...hits.map(h => ({ t: h.t, amp: 0.012 })), { t: T.boltT + 0.08, amp: 0.04 }, { t: T.atk + 0.12, amp: 0.035 }];
  const sh = E.shake(t, shakes), z = 1 + E.punch(t, punches);
  const outP = prog(t, T.end - 0.45, T.end + 0.1, E.ease.inn); // gameplay leaves

  E.bg(ctx, t, { warm: 0.22 + 0.25 * prog(t, T.atk, T.atk + 0.2) * (1 - prog(t, T.atk + 0.4, T.atk + 1.2)) });
  E.smoke(ctx, t, 0.22);

  // ---------- gameplay layer ----------
  if (outP < 1) {
    ctx.save();
    ctx.globalAlpha = 1 - outP;
    ctx.translate(E.W / 2 + sh.x, 1000 + sh.y + outP * 220); ctx.rotate(sh.r); ctx.scale(z * (1 - outP * 0.08), z * (1 - outP * 0.08)); ctx.translate(-E.W / 2, -1000);
    // intro: board assembles in the first frames (already moving at frame 0)
    const inP = spring(t, -0.4, 150, 22);
    ctx.save(); ctx.translate(0, (1 - inP) * 160); ctx.globalAlpha *= clamp(inP * 1.5);
    const dimBoard = (g, tt) => 0.55 * prog(tt, T.atk + 0.05, T.atk + 0.15) * (1 - prog(tt, T.atk + 0.6, T.atk + 1.0)) + 0.45 * prog(tt, T.spell, T.spell + 0.2) * (1 - prog(tt, T.boltT, T.boltT + 0.15));
    B.render(ctx, t, { dim: dimBoard });
    ctx.restore();

    // boss panel
    const pIn = spring(t, -0.3, 170, 24);
    const lunge = Math.sin(clamp((t - T.atk) / 0.35) * Math.PI) * (t > T.atk && t < T.atk + 0.35 ? 1 : 0);
    const killP = prog(t, kt, kt + 0.5);
    const atkPulse = (t > T.s2 + 0.25 && t < T.atk + 0.15) ? 0.5 + 0.5 * Math.sin((t - T.s2) * 16) : 0;
    ctx.save();
    ctx.translate(E.W / 2, PANEL_Y + 114 + (1 - pIn) * -260 + lunge * 60); ctx.scale(1 + lunge * 0.08, 1 + lunge * 0.08); ctx.translate(-E.W / 2, -(PANEL_Y + 114));
    if (killP > 0) ctx.filter = `grayscale(${killP}) brightness(${1 - killP * 0.35})`;
    E.bossPanel(ctx, t, { y: PANEL_Y, hp: hpAt(t), ghost: hpAt(t, 0.25), max: 200, attack: movesText(t), attackCol: atkPulse ? `rgb(255,${Math.round(240 - 170 * atkPulse)},${Math.round(230 - 180 * atkPulse)})` : '#f2efe6', alpha: clamp(pIn * 1.6),
      portraitFlash: 0.7 * (1 - clamp((t - T.atk) / 0.5)) * (t > T.atk ? 1 : 0) + hits.reduce((a, h) => a + 0.5 * (t > h.t ? Math.max(0, 1 - (t - h.t) / 0.25) : 0), 0) });
    ctx.restore();

    // energy orbs from each match to the boss bar
    for (const [i, e] of B.events.entries()) {
      if (evB.includes(e)) continue;
      E.orb(ctx, t, e.t + 0.05, e.t + 0.42, e.x, e.y, 640, PANEL_Y + 120, E.GEMCOL[e.color], i + 3);
    }
    for (const [i, h] of hits.entries()) {
      E.dmg(ctx, t, h.t, 640 + (i % 2 ? 90 : -90), PANEL_Y + 90, '-' + h.dmg, E.RED, h.kill ? 120 : 92);
      E.ring(ctx, t, h.t, 640, PANEL_Y + 120, 300, '255,120,90', 0.45, 10);
    }

    // touch indicator for the three swaps
    const keys = []; for (const s of swaps) { const ax = B.px(s.a[1]), ay = B.py(s.a[0]), bx = B.px(s.b[1]), by = B.py(s.b[0]);
      keys.push({ t: s.t - 0.32, x: ax + 30, y: ay + 60, down: false }, { t: s.t - 0.06, x: ax, y: ay, down: true }, { t: s.t + 0.2, x: bx, y: by, down: true }, { t: s.t + 0.34, x: bx + 30, y: by + 50, down: false }); }
    E.touch(ctx, t, keys.slice(0, 4), 0, T.s1 + 0.45);
    E.touch(ctx, t, keys.slice(4, 8), T.s2 - 0.45, T.s2 + 0.45);
    E.touch(ctx, t, keys.slice(8, 12), T.s3 - 0.45, T.s3 + 0.45);

    // boss strikes back: claw slashes across the board
    E.slash(ctx, t, T.atk + 0.1, 540, 1200, -0.5, 1100);
    E.flash(ctx, t, T.atk + 0.1, 0.5, '255,40,30', 0.55);

    // thunder bolt spell
    const sp = spring(t, T.spell, 210, 17), spOut = prog(t, T.boltT - 0.18, T.boltT, E.ease.inn);
    if (t > T.spell && t < T.boltT + 0.05) {
      ctx.save(); ctx.translate(540, lerp(1150, 520, spOut)); const s = sp * (1 - spOut * 0.6);
      ctx.globalAlpha = 1 - spOut;
      const plate = ctx.createRadialGradient(0, 120, 0, 0, 120, 560); plate.addColorStop(0, 'rgba(8,4,12,0.92)'); plate.addColorStop(0.7, 'rgba(8,4,12,0.75)'); plate.addColorStop(1, 'rgba(8,4,12,0)'); ctx.fillStyle = plate; ctx.fillRect(-560, -440, 1120, 1120);
      const gl = ctx.createRadialGradient(0, 0, 0, 0, 0, 380); gl.addColorStop(0, 'rgba(170,110,255,0.55)'); gl.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gl; ctx.fillRect(-380, -380, 760, 760);
      E.draw(ctx, 'spell-thunder', 0, 0, 430, { scale: s });
      E.text(ctx, 'THUNDER BOLT', 0, 330, { size: 70, color: E.SILVER, alpha: clamp((t - T.spell - 0.15) * 5) });
      E.text(ctx, 'STRIKE A 3×3 AREA', 0, 400, { size: 40, color: E.GOLD, alpha: clamp((t - T.spell - 0.3) * 5) });
      ctx.restore();
    }
    const cx = B.px(4), cy = B.py(3);
    E.bolt(ctx, t, T.boltT, 560, 330, cx, cy, 7, 0.55, 18);
    E.bolt(ctx, t, T.boltT + 0.06, 380, 300, cx - 30, cy, 11, 0.4, 10);
    E.flash(ctx, t, T.boltT + 0.06, 0.45, '220,200,255', 0.7);
    E.ring(ctx, t, T.boltT + 0.08, cx, cy, 520, '210,180,255', 0.6, 22);

    // kill
    E.ring(ctx, t, kt, 640, PANEL_Y + 120, 700, '255,210,140', 0.7, 26);
    E.flash(ctx, t, kt, 0.5, '255,230,190', 0.6);
    ctx.restore();
  }

  // ---------- headlines (safe zone, top third) ----------
  const Y = 400;
  E.title(ctx, t, [{ text: 'MATCH GEMS', size: 116 }], 540, Y, -0.32, 1.62);
  E.title(ctx, t, [{ text: 'STRIKE THE BOSS', size: 104 }], 540, Y, 1.78, T.atk - 0.12);
  E.title(ctx, t, [{ text: 'IT STRIKES BACK', size: 104, color: E.RED }], 540, Y, T.atk + 0.08, T.spell - 0.1);
  E.title(ctx, t, [{ text: 'UNLEASH SPELLS', size: 104, color: E.SILVER }], 540, Y, T.spell + 0.05, T.s3 - 0.45);
  E.title(ctx, t, [{ text: 'FINISH IT', size: 124 }], 540, Y, T.s3 - 0.3, kt + 0.1);
  E.title(ctx, t, [{ text: 'BOSS DEFEATED', size: 108, color: E.GOLD, glow: 0.5 }], 540, Y, kt + 0.5, T.end - 0.5);

  // ---------- end card ----------
  if (t > T.end - 0.2) {
    const a = prog(t, T.end - 0.2, T.end + 0.25);
    ctx.save(); ctx.globalAlpha = a;
    // knight rises behind the logo
    const kp = spring(t, T.end - 0.1, 90, 20);
    E.draw(ctx, 'knight', 560, 1560 + (1 - kp) * 200, 1150, { alpha: 0.8 * a, filter: 'brightness(0.85) contrast(1.1)' });
    const fade = ctx.createLinearGradient(0, 900, 0, 1920); fade.addColorStop(0, 'rgba(6,5,6,0)'); fade.addColorStop(0.55, 'rgba(6,5,6,0.85)'); fade.addColorStop(1, 'rgba(6,5,6,1)'); ctx.fillStyle = fade; ctx.fillRect(0, 900, 1080, 1020);
    // gem trio
    [['gem-blue', 300, -1], ['gem-red', 540, 0], ['gem-purple', 780, 1]].forEach(([g, x, k], i) => {
      const gp = spring(t, T.end + 0.25 + i * 0.08, 200, 18);
      E.draw(ctx, g, x, 885 + Math.sin(t * 1.6 + i) * 10 - (k === 0 ? 20 : 0), k === 0 ? 210 : 150, { scale: gp, rot: k * 0.12 });
    });
    ctx.restore();
    E.endCard(ctx, t, T.end, 'EVERY MATCH IS A BATTLE', { logoY: 560, tagY: 1050, ctaY: 1215, tagSize: 56 });
  }
  E.embers(ctx, t, 34, 5, 0.9);
  E.vignette(ctx, 0.8);
  E.grain(ctx, t);
};
window.AD = ad;
})();
