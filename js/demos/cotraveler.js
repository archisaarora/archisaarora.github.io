/* Co-traveler detection on simulated walkers.
   Each tick every walker emits one location ping. Pings are bucketed into a
   spatial hash grid whose cell size equals the distance threshold, so a ping is
   only compared with pings in its own and the eight neighbouring cells.
   A pair's score rises each tick they are seen together and falls each tick they
   aren't, so people who merely cross paths fade out. A pair is flagged while its
   score is at least `minOverlap`. */
Site.registerDemo("cotraveler", function (root) {
  const { h, fit, loop, colors } = Site;
  const W = 1500, H = 800, BLOCK = 100, N = 80, TICK = 10; /* metres, metres, metres, walkers, seconds per ping */
  let seed = 11, rand, walkers, truth, counts, flagged, pings, checks, brute, ticks, acc = 0;
  let dist = 30, minOverlap = 12;

  const canvas = h("canvas", { style: "height:300px", role: "img", "aria-label": "Simulated walkers on a street grid; detected co-travelers are linked" });
  const stat = (label) => { const b = h("b", { text: "0" }); return { el: h("div.d-stat", null, b, h("span", { text: label })), b }; };
  const sPings = stat("pings processed"), sSave = stat("fewer comparisons than brute force"), sFound = stat("pairs flagged / real pairs"), sPrec = stat("precision"), sRec = stat("recall");
  const distOut = h("output", { text: dist + " m" }), minOut = h("output", { text: minOverlap });
  root.append(canvas,
    h("div.d-row", null,
      h("label.d-field", null, "Distance", h("input", { type: "range", min: 10, max: 90, step: 5, value: dist, oninput: (e) => { dist = +e.target.value; distOut.textContent = dist + " m"; clearCounts(); } }), distOut),
      h("label.d-field", null, "Score needed", h("input", { type: "range", min: 2, max: 40, value: minOverlap, oninput: (e) => { minOverlap = +e.target.value; minOut.textContent = minOverlap; clearCounts(); } }), minOut),
      h("button.d-btn", { type: "button", text: "New crowd", onclick: () => { seed++; reset(); } })),
    h("div.d-stats", null, sPings.el, sSave.el, sFound.el, sPrec.el, sRec.el));

  const corner = () => ({ x: Math.round(rand() * (W / BLOCK)) * BLOCK, y: Math.round(rand() * (H / BLOCK)) * BLOCK });
  const key = (a, b) => a < b ? a * 1000 + b : b * 1000 + a;

  function reset() {
    rand = Site.rng(seed * 7919);
    walkers = []; truth = new Set();
    const groups = [2, 2, 3, 2, 2];
    let id = 0;
    for (const size of groups) {            /* hidden groups: followers shadow a leader */
      const c = corner(), lead = id;
      for (let k = 0; k < size; k++, id++) {
        walkers.push({ id, x: c.x, y: c.y, goal: corner(), speed: 1.3, lead: k ? lead : -1, ox: (rand() - 0.5) * 16, oy: (rand() - 0.5) * 16, px: c.x, py: c.y });
        for (let j = lead; j < id; j++) truth.add(key(j, id));
      }
    }
    for (; id < N; id++) { const c = corner(); walkers.push({ id, x: c.x, y: c.y, goal: corner(), speed: 1.0 + rand() * 0.7, lead: -1, px: c.x, py: c.y }); }
    pings = 0; ticks = 0; clearCounts();
  }
  function clearCounts() { counts = new Map(); flagged = new Set(); checks = 0; brute = 0; }

  function walk(w, dt) {                    /* along x, then along y, like streets */
    if (w.lead >= 0) { const L = walkers[w.lead]; w.x = L.x + w.ox; w.y = L.y + w.oy; return; }
    let step = w.speed * dt;
    const dx = w.goal.x - w.x, dy = w.goal.y - w.y;
    if (Math.abs(dx) > 0.5) w.x += Math.sign(dx) * Math.min(step, Math.abs(dx));
    else if (Math.abs(dy) > 0.5) w.y += Math.sign(dy) * Math.min(step, Math.abs(dy));
    else w.goal = corner();
  }

  function detect() {
    const grid = new Map(), cell = dist, d2 = dist * dist, seen = new Set();
    for (const w of walkers) {              /* a ping is the true position plus a few metres of GPS error */
      w.px = w.x + rand.gauss() * 3; w.py = w.y + rand.gauss() * 3;
      const k = Math.floor(w.px / cell) * 4096 + Math.floor(w.py / cell);
      (grid.get(k) || grid.set(k, []).get(k)).push(w);
    }
    for (const w of walkers) {
      const cx = Math.floor(w.px / cell), cy = Math.floor(w.py / cell);
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
        const bucket = grid.get((cx + i) * 4096 + (cy + j)); if (!bucket) continue;
        for (const o of bucket) {
          if (o.id <= w.id) continue;
          checks++;
          const ex = o.px - w.px, ey = o.py - w.py;
          if (ex * ex + ey * ey <= d2) {
            const k = key(w.id, o.id), c = Math.min(60, (counts.get(k) || 0) + 1);
            counts.set(k, c); seen.add(k); if (c >= minOverlap) flagged.add(k);
          }
        }
      }
    }
    for (const [k, c] of counts) {
      if (seen.has(k)) continue;
      if (c <= 1) counts.delete(k); else counts.set(k, c - 1);
      if (c - 1 < minOverlap) flagged.delete(k);
    }
    pings += walkers.length; brute += (N * (N - 1)) / 2; ticks++;
  }

  function draw() {
    const { ctx, w, h: hh } = fit(canvas);
    const s = Math.min(w / (W + 60), hh / (H + 60)), ox = (w - W * s) / 2, oy = (hh - H * s) / 2;
    const X = (x) => ox + x * s, Y = (y) => oy + y * s;
    ctx.clearRect(0, 0, w, hh);
    ctx.strokeStyle = colors.faint; ctx.lineWidth = 1; ctx.beginPath();
    for (let x = 0; x <= W; x += BLOCK) { ctx.moveTo(X(x), Y(0)); ctx.lineTo(X(x), Y(H)); }
    for (let y = 0; y <= H; y += BLOCK) { ctx.moveTo(X(0), Y(y)); ctx.lineTo(X(W), Y(y)); }
    ctx.stroke();
    const hot = new Set();
    for (const k of flagged) {
      const a = walkers[Math.floor(k / 1000)], b = walkers[k % 1000], real = truth.has(k);
      ctx.strokeStyle = real ? colors.blossom : "rgba(255,156,138,.7)"; ctx.lineWidth = 2; ctx.setLineDash(real ? [] : [4, 4]);
      ctx.beginPath(); ctx.moveTo(X(a.x), Y(a.y)); ctx.lineTo(X(b.x), Y(b.y)); ctx.stroke();
      hot.add(a.id); hot.add(b.id);
    }
    ctx.setLineDash([]);
    for (const p of walkers) {
      const on = hot.has(p.id);
      ctx.fillStyle = on ? colors.blossom : colors.dim; ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), on ? 4.5 : 2.5, 0, 6.3); ctx.fill();
      if (on) { ctx.strokeStyle = "rgba(243,188,200,.35)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), 9, 0, 6.3); ctx.stroke(); }
    }
  }

  function stats() {
    let tp = 0; for (const k of flagged) if (truth.has(k)) tp++;
    sPings.b.textContent = pings.toLocaleString();
    sSave.b.textContent = checks ? Math.round(brute / checks) + "x" : "0x";
    sFound.b.textContent = flagged.size + " / " + truth.size;
    sPrec.b.textContent = flagged.size ? Math.round((100 * tp) / flagged.size) + "%" : "n/a";
    sRec.b.textContent = Math.round((100 * tp) / truth.size) + "%";
  }

  reset();
  const SPEED = 40;                         /* simulated seconds per real second */
  const run = loop((dt) => {
    const simDt = dt * SPEED;
    for (const w of walkers) walk(w, simDt);
    acc += simDt;
    while (acc >= TICK) { acc -= TICK; detect(); }
    draw(); stats();
  });
  draw();
  if (Site.reduced) { for (let i = 0; i < 600; i++) { for (const w of walkers) walk(w, TICK); detect(); } draw(); stats(); return {}; }
  return run;
});
