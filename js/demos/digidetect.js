/* DigiDetect, as it appears in the portfolio: trains js/lib/nn.js on MNIST digits in
   the visitor's browser, then classifies whatever they draw. Full project:
   https://github.com/archisaarora/DigiDetect The dataset (data/digits.js) loads on demand. */
Site.registerDemo("digidetect", function (root) {
  const { h, fit, loop, colors } = Site;
  const BATCH = 32, EPOCHS = 12;
  let data = null, net = null, order = [], cursor = 0, epoch = 0, step = 0, training = false, hidden = 64, lr = 0.08;
  let accHist = [], lossHist = [], lossAvg = 0, seed = 1;

  /* ---- layout ---- */
  const chart = h("canvas", { style: "height:150px", role: "img", "aria-label": "Test accuracy and training loss while the network trains" });
  const tiles = h("canvas", { style: "height:92px", role: "img", "aria-label": "What 24 hidden units have learned to look for" });
  const pad = h("canvas.sc-pad", { width: 196, height: 196, role: "img", "aria-label": "Drawing pad: draw a digit from 0 to 9", tabindex: "0" });
  const bars = h("div.sc-bars");
  const barEls = Array.from({ length: 10 }, (_, d) => { const fill = h("i"); const row = h("div.sc-bar", null, h("span", { text: d }), h("div", null, fill)); bars.append(row); return { row, fill }; });
  const verdict = h("p.sc-verdict", { "aria-live": "polite", text: "Draw a digit" });
  const stat = (label) => { const b = h("b", { text: "0" }); return { el: h("div.d-stat", null, b, h("span", { text: label })), b }; };
  const sAcc = stat("accuracy on 1,000 unseen digits"), sEpoch = stat("passes over the data"), sLoss = stat("training loss");
  const toggle = h("button.d-btn.solid", { type: "button", text: "Pause", onclick: () => setTraining(!training) });
  const hidSel = h("select", { "aria-label": "Hidden units", onchange: (e) => { hidden = +e.target.value; reset(); } },
    [32, 64, 128].map((n) => h("option", { value: n, text: n + " hidden units", selected: n === 64 })));
  const status = h("p.sc-status", { text: "Loading 6,000 handwritten digits…" });

  root.append(h("div.sc", null,
    h("div.sc-train", null, status, chart,
      h("div.d-stats", null, sAcc.el, sEpoch.el, sLoss.el),
      h("div.d-row", null, toggle, h("button.d-btn", { type: "button", text: "Train again from scratch", onclick: () => { seed++; reset(); } }), h("label.d-field", null, hidSel)),
      h("p.sc-cap", { text: "Each tile is one hidden unit: pink where ink raises its output, pale where ink lowers it." }), tiles),
    h("div.sc-try", null, pad,
      h("div.d-row", null, h("button.d-btn", { type: "button", text: "Clear", onclick: clearPad })),
      verdict, bars)));

  /* ---- data ---- */
  function loadData(done) {
    if (window.DIGITS) return done();
    const s = document.createElement("script"); s.src = "data/digits.js";
    s.onload = done; s.onerror = () => { status.textContent = "The digit dataset did not load. Check that data/digits.js is deployed."; };
    document.head.append(s);
  }

  function reset() {
    const rand = Site.rng(1000 + seed);
    net = new NN.MLP(data.train.dim, hidden, 10, rand);
    order = Array.from({ length: data.train.n }, (_, i) => i); shuffle(rand);
    cursor = 0; epoch = 0; step = 0; accHist = []; lossHist = []; lossAvg = 0; net._rand = rand;
    measure(); setTraining(true); classify();
  }
  function shuffle(rand) { for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); const t = order[i]; order[i] = order[j]; order[j] = t; } }
  function setTraining(on) {
    training = on && epoch < EPOCHS;
    toggle.textContent = training ? "Pause" : epoch >= EPOCHS ? "Finished" : "Resume"; toggle.disabled = epoch >= EPOCHS;
    status.textContent = training ? "Training now, in this tab" : epoch >= EPOCHS ? "Training finished. Draw a digit to test it." : "Paused";
  }
  function measure() {
    const acc = net.accuracy(data.test.x, data.test.y, data.test.n);
    accHist.push(acc); lossHist.push(lossAvg || 2.3);
    sAcc.b.textContent = (acc * 100).toFixed(1) + "%"; sEpoch.b.textContent = epoch + " of " + EPOCHS; sLoss.b.textContent = (lossAvg || 2.3).toFixed(2);
  }

  function trainSome() {
    for (let k = 0; k < 4 && training; k++) {
      const idx = order.slice(cursor, cursor + BATCH); cursor += BATCH; step++;
      const loss = net.trainBatch(data.train.x, data.train.y, idx, lr);
      lossAvg = lossAvg ? lossAvg * 0.95 + loss * 0.05 : loss;
      if (cursor >= data.train.n) { cursor = 0; epoch++; shuffle(net._rand); if (epoch >= EPOCHS) { measure(); setTraining(false); } }
      if (step % 20 === 0 && training) measure();
    }
  }

  /* ---- drawing ---- */
  function drawChart() {
    const { ctx, w, h: hh } = fit(chart);
    ctx.clearRect(0, 0, w, hh);
    const total = Math.ceil((data.train.n / BATCH) * EPOCHS / 20) + 2, X = (i) => 34 + (i / total) * (w - 44), Y = (v) => hh - 18 - v * (hh - 30);
    ctx.font = "10px IBM Plex Mono, monospace"; ctx.fillStyle = colors.dim; ctx.strokeStyle = colors.faint; ctx.lineWidth = 1;
    for (const v of [0, 0.5, 0.9, 1]) { ctx.beginPath(); ctx.moveTo(34, Y(v)); ctx.lineTo(w - 10, Y(v)); ctx.stroke(); ctx.fillText(Math.round(v * 100) + "%", 4, Y(v) + 3); }
    const line = (arr, color, scale) => { ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.beginPath(); arr.forEach((v, i) => { const y = Y(Math.min(1, v * scale)); i ? ctx.lineTo(X(i), y) : ctx.moveTo(X(i), y); }); ctx.stroke(); };
    line(lossHist, "rgba(246,237,221,.4)", 1 / 2.4); line(accHist, colors.blossom, 1);
    ctx.fillStyle = colors.blossom; ctx.fillText("accuracy", w - 70, Y(1) + 14); ctx.fillStyle = colors.dim; ctx.fillText("loss", w - 70, Y(1) + 27);
  }
  function drawTiles() {
    const { ctx, w, h: hh } = fit(tiles);
    ctx.clearRect(0, 0, w, hh);
    const cols = 12, rows = 2, side = 14, cell = Math.floor(Math.min((w - (cols - 1) * 4) / cols, (hh - 4) / rows)), px = cell / side;
    for (let u = 0; u < cols * rows && u < net.nHid; u++) {
      const x0 = (u % cols) * (cell + 4), y0 = Math.floor(u / cols) * (cell + 4), r = u * net.nIn;
      let m = 1e-6; for (let i = 0; i < net.nIn; i++) m = Math.max(m, Math.abs(net.W1[r + i]));
      for (let i = 0; i < net.nIn; i++) {
        const v = net.W1[r + i] / m;
        ctx.fillStyle = v > 0 ? `rgba(243,188,200,${v.toFixed(2)})` : `rgba(246,237,221,${(-v * 0.28).toFixed(2)})`;
        ctx.fillRect(x0 + (i % side) * px, y0 + Math.floor(i / side) * px, px + 0.5, px + 0.5);
      }
    }
  }

  /* ---- the drawing pad ---- */
  const pctx = pad.getContext("2d"), small = document.createElement("canvas"); small.width = small.height = 14;
  let drawing = false, last = null, hasInk = false;
  function clearPad() { pctx.fillStyle = "#22040C"; pctx.fillRect(0, 0, 196, 196); hasInk = false; verdict.textContent = "Draw a digit"; barEls.forEach((b) => { b.fill.style.width = "0"; b.row.classList.remove("top"); }); }
  const pos = (e) => { const r = pad.getBoundingClientRect(); return [(e.clientX - r.left) * 196 / r.width, (e.clientY - r.top) * 196 / r.height]; };
  pad.addEventListener("pointerdown", (e) => { drawing = true; last = pos(e); pad.setPointerCapture(e.pointerId); stroke(last); });
  pad.addEventListener("pointermove", (e) => { if (drawing) stroke(pos(e)); });
  const end = () => { drawing = false; };
  pad.addEventListener("pointerup", end); pad.addEventListener("pointercancel", end);
  function stroke(p) {
    pctx.strokeStyle = "#F6EDDD"; pctx.lineWidth = 15; pctx.lineCap = pctx.lineJoin = "round";
    pctx.beginPath(); pctx.moveTo(last[0], last[1]); pctx.lineTo(p[0] + 0.01, p[1]); pctx.stroke(); last = p; hasInk = true; classify();
  }

  /* Match MNIST's framing: crop to the ink, scale the long side to 10 of 14 pixels, centre on the centre of mass. */
  function classify() {
    if (!hasInk || !net) return;
    const img = pctx.getImageData(0, 0, 196, 196).data;
    let x0 = 196, y0 = 196, x1 = 0, y1 = 0, mx = 0, my = 0, m = 0;
    for (let y = 0; y < 196; y += 2) for (let x = 0; x < 196; x += 2) {
      const v = img[(y * 196 + x) * 4] - 34; if (v < 60) continue;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; mx += x * v; my += y * v; m += v;
    }
    if (!m) return;
    const scale = 10 / Math.max(x1 - x0, y1 - y0, 20), sctx = small.getContext("2d");
    sctx.fillStyle = "#000"; sctx.fillRect(0, 0, 14, 14); sctx.imageSmoothingEnabled = true; sctx.imageSmoothingQuality = "high";
    sctx.filter = "none";
    sctx.setTransform(scale, 0, 0, scale, 7 - (mx / m) * scale, 7 - (my / m) * scale); sctx.drawImage(pad, 0, 0); sctx.setTransform(1, 0, 0, 1, 0, 0);
    const d = sctx.getImageData(0, 0, 14, 14).data, x = new Float32Array(196);
    for (let i = 0; i < 196; i++) x[i] = Math.max(0, (d[i * 4] - 34) / 221);
    const p = net.forward(x); let best = 0;
    for (let k = 1; k < 10; k++) if (p[k] > p[best]) best = k;
    barEls.forEach((b, k) => { b.fill.style.width = (p[k] * 100).toFixed(1) + "%"; b.row.classList.toggle("top", k === best); });
    verdict.textContent = `Looks like a ${best} (${Math.round(p[best] * 100)}% sure)`;
  }

  clearPad();
  let ready = false, paint = 0;
  const run = loop((dt) => {
    if (!ready) return;
    if (training) trainSome();
    paint += dt; if (paint > 0.12) { paint = 0; drawChart(); drawTiles(); if (training) classify(); }
  });
  return {
    start() {
      if (!data) loadData(() => { data = { train: NN.decode(DIGITS.train, DIGITS.side), test: NN.decode(DIGITS.test, DIGITS.side) }; reset(); ready = true; drawChart(); drawTiles(); });
      run.start();
    },
    stop() { run.stop(); }
  };
});
