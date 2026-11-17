/* Rocket telemetry demo: a simulated flight pushed through the real packet format.
   Each state packet is packed into the same 41-byte little-endian layout the flight
   computer sends ("<BBIBBiii4hiihBH" in ground/telemetry_protocol.py), protected by the
   same CRC-16/CCITT-FALSE, sent through a lossy pretend radio, then decoded and plotted.
   The flight itself is invented; the real dashboard is a PyQt5 desktop app. */
Site.registerDemo("telemetry", function (root) {
  const { h, fit, loop, colors } = Site;
  const PHASES = ["STARTUP", "BOOST", "COAST", "DESCENT", "TOUCHDOWN"];
  const RATE = 5, SPEED = 4, DEPLOY_ALT = 121;        /* packets per second, playback speed, main chute altitude (m) */
  let rand = Site.rng(19), flightNo = 0, past = [], sim, link, trace, lastPkt = null, lastRaw = null, acc = 0, pause = 0;

  /* ---------- the protocol ---------- */
  function crc16(bytes, n) {
    let crc = 0xFFFF;
    for (let i = 0; i < n; i++) { crc ^= bytes[i] << 8; for (let k = 0; k < 8; k++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF; }
    return crc;
  }
  function encodeState(s) {
    const buf = new ArrayBuffer(41), v = new DataView(buf); let o = 0;
    v.setUint8(o, 0x01); o += 1; v.setUint8(o, s.seq & 255); o += 1; v.setUint32(o, s.t_ms, true); o += 4;
    v.setUint8(o, s.phase); o += 1; v.setUint8(o, s.flags); o += 1;
    v.setInt32(o, Math.round(s.alt * 100), true); o += 4; v.setInt32(o, Math.round(s.vel * 100), true); o += 4; v.setInt32(o, Math.round(s.baro * 100), true); o += 4;
    for (const q of s.q) { v.setInt16(o, Math.round(q * 10000), true); o += 2; }
    v.setInt32(o, 0, true); o += 4; v.setInt32(o, 0, true); o += 4;                 /* lat, lon: no GPS fix in this demo */
    v.setInt16(o, Math.round(s.accel * 100), true); o += 2; v.setUint8(o, s.deployReason); o += 1;
    const bytes = new Uint8Array(buf); v.setUint16(o, crc16(bytes, 39), true);
    return bytes;
  }
  function decodeState(bytes) {
    if (bytes.length < 41) return null;
    const v = new DataView(bytes.buffer, bytes.byteOffset, 41);
    if (v.getUint8(0) !== 0x01 || v.getUint16(39, true) !== crc16(bytes, 39)) return null;      /* wrong type or failed CRC: drop it */
    const flags = v.getUint8(7);
    return { seq: v.getUint8(1), t: v.getUint32(2, true) / 1000, phase: v.getUint8(6), armed: !!(flags & 1), deployed: !!(flags & 2),
      alt: v.getInt32(8, true) / 100, vel: v.getInt32(12, true) / 100, baro: v.getInt32(16, true) / 100, accel: v.getInt16(35, true) / 100, crc: v.getUint16(39, true) };
  }

  /* ---------- an invented flight ---------- */
  function newFlight() {
    flightNo++;
    sim = { t: 0, alt: 0, vel: 0, phase: 0, deployed: false, seq: 0, sinceTx: 0, done: 0, burn: 2.0 + rand() * 0.5, thrust: 52 + rand() * 14, est: 0 };
    link = { got: 0, lost: 0, bad: 0, lastSeq: -1, rssi: -52 };
    trace = { t: [], alt: [], baro: [], apogee: 0 };
    lastPkt = null; lastRaw = null;
  }
  function stepSim(dt) {
    const s = sim; s.t += dt;
    let a = 0;
    if (s.phase === 0) { if (s.t > 2) s.phase = 1; }
    else if (s.phase === 1) { a = s.thrust - 9.81 - 0.0009 * s.vel * s.vel; if (s.t > 2 + s.burn) s.phase = 2; }
    else if (s.phase === 2) { a = -9.81 - 0.0011 * s.vel * Math.abs(s.vel); if (s.vel < 0) s.phase = 3; }
    else if (s.phase === 3) {
      if (!s.deployed && s.alt <= DEPLOY_ALT) s.deployed = true;                    /* main parachute at 121 m, as in the firmware's simulated flight */
      a = -9.81 + (s.deployed ? 0.27 : 0.016) * s.vel * s.vel;
      if (s.alt <= 0) { s.alt = 0; s.vel = 0; s.phase = 4; }
    } else s.done += dt;
    if (s.phase > 0 && s.phase < 4) { s.vel += a * dt; s.alt = Math.max(0, s.alt + s.vel * dt); }
    s.accel = Math.abs(a + 9.81);
    s.sinceTx += dt;
    while (s.sinceTx >= 1 / RATE) { s.sinceTx -= 1 / RATE; transmit(); }
  }
  function transmit() {
    const s = sim, baro = s.alt + rand.gauss() * 2.2;
    s.est += (s.alt - s.est) * 0.85;                                               /* stand-in for the onboard filter's altitude */
    const raw = encodeState({ seq: s.seq++, t_ms: Math.round(s.t * 1000), phase: s.phase, flags: (s.phase >= 1 ? 1 : 0) | (s.deployed ? 2 : 0) | 16 | 32,
      alt: s.est, vel: s.vel, baro, q: [1, 0, 0, 0], accel: s.accel, deployReason: s.deployed ? 1 : 0 });
    /* The radio: weaker with altitude, some packets never arrive, a few arrive damaged. */
    link.rssi = -52 - 18 * Math.log10(1 + s.alt / 40) + rand.gauss() * 1.5;
    const pLost = Math.min(0.3, 0.03 + Math.max(0, -link.rssi - 70) * 0.012);
    if (rand() < pLost) return;
    if (rand() < 0.02) raw[5 + Math.floor(rand() * 30)] ^= 1 << Math.floor(rand() * 8);
    receive(raw);
  }
  function receive(raw) {
    const p = decodeState(raw);
    lastRaw = raw;
    if (!p) { link.bad++; lastPkt = null; return; }
    if (link.lastSeq >= 0) link.lost += ((p.seq - link.lastSeq + 256) % 256) - 1;   /* gaps in the sequence number are lost packets */
    link.lastSeq = p.seq; link.got++; lastPkt = p;
    trace.t.push(p.t); trace.alt.push(p.alt); trace.baro.push(p.baro); trace.apogee = Math.max(trace.apogee, p.alt);
  }

  /* ---------- layout ---------- */
  const chart = h("canvas", { style: "height:260px", role: "img", "aria-label": "Altitude over time from decoded packets, with the previous flight for comparison" });
  const phaseRow = h("ol.tm-phases", { "aria-label": "Flight phase" }, PHASES.map((p) => h("li", { text: p.toLowerCase() })));
  const hex = h("pre.tm-hex", { "aria-label": "Bytes of the latest packet" });
  const fields = h("dl.tm-fields");
  const stat = (label) => { const b = h("b", { text: "0" }); return { el: h("div.d-stat", null, b, h("span", { text: label })), b }; };
  const sAlt = stat("altitude"), sVel = stat("vertical speed"), sGot = stat("packets decoded"), sLost = stat("lost in the air"), sBad = stat("failed the CRC check"), sRssi = stat("signal strength");
  const pastNote = h("p.tm-past");
  root.append(h("div.tm", null,
    h("div", null, phaseRow, chart, h("div.d-stats", null, sAlt.el, sVel.el, sGot.el, sLost.el, sBad.el, sRssi.el),
      h("div.d-row", null, h("button.d-btn.solid", { type: "button", text: "Launch again", onclick: relaunch }), pastNote)),
    h("div.tm-side", null, h("p.tm-cap", { text: "Latest packet off the radio: 41 bytes" }), hex, h("p.tm-cap", { text: "Decoded" }), fields)));

  function relaunch() { if (trace && trace.t.length > 20) { past.unshift(trace); past.length = Math.min(past.length, 3); } newFlight(); pause = 0; }

  /* ---------- drawing ---------- */
  function draw() {
    const { ctx, w, h: hh } = fit(chart); ctx.clearRect(0, 0, w, hh);
    const prev = past[0], tMax = Math.max(45, prev ? prev.t[prev.t.length - 1] : 0, trace.t[trace.t.length - 1] || 0), aMax = Math.max(400, prev ? prev.apogee : 0, trace.apogee) * 1.12;
    const X = (t) => 44 + t / tMax * (w - 56), Y = (a) => hh - 22 - a / aMax * (hh - 34);
    ctx.font = "10px IBM Plex Mono, monospace"; ctx.lineWidth = 1;
    for (let k = 0; k <= 4; k++) { const a = aMax * k / 4; ctx.strokeStyle = colors.faint; ctx.beginPath(); ctx.moveTo(44, Y(a)); ctx.lineTo(w - 12, Y(a)); ctx.stroke(); ctx.fillStyle = colors.dim; ctx.fillText(Math.round(a) + " m", 4, Y(a) + 3); }
    for (let t = 0; t <= tMax; t += 10) ctx.fillText(t + " s", X(t) - 8, hh - 6);
    ctx.setLineDash([4, 4]); ctx.strokeStyle = "rgba(246,237,221,.5)"; ctx.beginPath(); ctx.moveTo(44, Y(DEPLOY_ALT)); ctx.lineTo(w - 12, Y(DEPLOY_ALT)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = colors.dim; ctx.fillText("main chute " + DEPLOY_ALT + " m", w - 120, Y(DEPLOY_ALT) - 5);
    const line = (tr, key, color, width) => { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); tr.t.forEach((t, i) => i ? ctx.lineTo(X(t), Y(tr[key][i])) : ctx.moveTo(X(t), Y(tr[key][i]))); ctx.stroke(); };
    if (prev) line(prev, "alt", "rgba(246,237,221,.28)", 1.5);
    ctx.fillStyle = "rgba(246,237,221,.45)"; trace.t.forEach((t, i) => ctx.fillRect(X(t) - 1, Y(trace.baro[i]) - 1, 2, 2));
    line(trace, "alt", colors.blossom, 2);

    const p = lastPkt;
    [...phaseRow.children].forEach((li, i) => { li.toggleAttribute("aria-current", !!p && i === p.phase); li.classList.toggle("done", !!p && i < p.phase); });
    sAlt.b.textContent = p ? p.alt.toFixed(0) + " m" : "n/a"; sVel.b.textContent = p ? (p.vel >= 0 ? "+" : "") + p.vel.toFixed(0) + " m/s" : "n/a";
    sGot.b.textContent = link.got; sLost.b.textContent = link.lost; sBad.b.textContent = link.bad; sRssi.b.textContent = Math.round(link.rssi) + " dBm";
    pastNote.textContent = prev ? `Faint line: flight ${flightNo - 1}, apogee ${Math.round(prev.apogee)} m. This one: ${Math.round(trace.apogee)} m.` : "Launch again to compare a flight with the one before it.";
    if (lastRaw) {
      const hx = [...lastRaw].map((b) => b.toString(16).padStart(2, "0"));
      hex.textContent = [hx.slice(0, 14), hx.slice(14, 28), hx.slice(28)].map((r) => r.join(" ")).join("\n");
      hex.classList.toggle("bad", !p);
      const rows = p ? [["sequence", p.seq], ["time", p.t.toFixed(1) + " s"], ["phase", PHASES[p.phase]], ["filter altitude", p.alt.toFixed(1) + " m"], ["barometer altitude", p.baro.toFixed(1) + " m"], ["parachute", p.deployed ? "deployed" : p.armed ? "armed" : "safe"], ["CRC-16", "0x" + p.crc.toString(16).toUpperCase().padStart(4, "0") + " ok"]]
        : [["CRC-16", "mismatch: packet dropped"]];
      fields.replaceChildren(...rows.flatMap(([k, v]) => [h("dt", { text: k }), h("dd", { text: String(v) })]));
    }
  }

  newFlight();
  if (Site.reduced) { while (sim.phase < 4) stepSim(0.02); draw(); return {}; }
  let paint = 0;
  return loop((dt) => {
    if (sim.phase === 4 && sim.done > 1) { pause += dt; if (pause > 5) relaunch(); }        /* next flight starts on its own */
    else { acc += dt * SPEED; while (acc >= 0.02) { acc -= 0.02; stepSim(0.02); } }
    paint += dt; if (paint > 0.08) { paint = 0; draw(); }
  });
});
