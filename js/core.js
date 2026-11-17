/* Small shared helpers and the demo registry. */
(function () {
  const demos = {};

  /* h("div.cls", {attrs}, ...children) -> element */
  function h(spec, attrs, ...kids) {
    const [tag, ...cls] = spec.split(".");
    const el = document.createElement(tag || "div");
    if (cls.length) el.className = cls.join(" ");
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === "text") el.textContent = v;
      else if (k === "html") el.innerHTML = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat()) {
      if (kid == null) continue;
      el.append(kid.nodeType ? kid : document.createTextNode(kid));
    }
    return el;
  }

  /* Size a canvas for the device pixel ratio. Returns {ctx, w, h} in CSS pixels. */
  function fit(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, hgt = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(hgt * dpr)) {
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(hgt * dpr);
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h: hgt };
  }

  /* Seeded random numbers so simulations can be replayed. */
  function rng(seed) {
    let s = seed >>> 0 || 1;
    const next = () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
    next.gauss = () => { let u = 0; while (u === 0) u = next(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283185307 * next()); };
    return next;
  }

  /* A loop that only runs while the demo is on screen. */
  function loop(step) {
    let id = 0, last = 0, on = false;
    const tick = (t) => { if (!on) return; const dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t; step(dt, t); id = requestAnimationFrame(tick); };
    return {
      start() { if (on) return; on = true; last = performance.now(); id = requestAnimationFrame(tick); },
      stop() { on = false; cancelAnimationFrame(id); }
    };
  }

  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  window.Site = {
    h, fit, rng, loop, clamp, ease, reduced,
    colors: { wine: "#4A0D1E", deep: "#2B0610", cream: "#F6EDDD", blossom: "#F3BCC8", cherry: "#D4728A", dim: "rgba(246,237,221,.45)", faint: "rgba(246,237,221,.14)" },
    /* A demo is a function (root) -> { start(), stop() }. */
    registerDemo(id, mount) { demos[id] = mount; },
    getDemo(id) { return demos[id]; }
  };
})();
