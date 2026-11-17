/* The hero: a cherry tree drawn from a seeded random recipe (so it is the same
   tree on every visit), and the petals that fall from it and drift across the site.
   The petals blow toward wherever the pointer is, and now and then a small bird crosses the tree. */
(function () {
  const { clamp, reduced } = Site;
  const NS = "http://www.w3.org/2000/svg";
  const PINKS = ["#F6B3C4", "#EE8FAB", "#E8668D", "#FAD3DC", "#F29DB5", "#FBE9E4"];

  window.Tree = function initTree(mount) {
    const rand = Site.rng(31);
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 600 640"); svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "A cherry tree in bloom, dropping petals");
    const tips = [], wood = [], bloom = [];

    function branch(x, y, ang, len, w, depth) {
      const ex = x + Math.cos(ang) * len, ey = y - Math.sin(ang) * len;
      const bend = (rand() - 0.5) * len * 0.5, mx = (x + ex) / 2 - Math.sin(ang) * bend, my = (y + ey) / 2 - Math.cos(ang) * bend;
      wood.push(`<path d="M${x.toFixed(1)} ${y.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}" stroke-width="${w.toFixed(1)}"/>`);
      if (depth >= 2) cluster(ex, ey, depth >= 4 ? 9 : 5, depth >= 4 ? 40 : 26);
      if (depth >= 4) { tips.push([ex, ey]); return; }
      const kids = depth < 2 ? 3 : 2 + (rand() < 0.35 ? 1 : 0);
      for (let k = 0; k < kids; k++) {
        const spread = (k / (kids - 1) - 0.5) * (depth === 0 ? 1.5 : 1.25) + (rand() - 0.5) * 0.3;
        branch(ex, ey, ang + spread, len * (0.68 + rand() * 0.14), Math.max(1.5, w * 0.6), depth + 1);
      }
    }
    function cluster(cx, cy, n, r) {
      for (let i = 0; i < n; i++) {
        const a = rand() * 6.283, d = Math.sqrt(rand()) * r;
        bloom.push(`<circle cx="${(cx + Math.cos(a) * d).toFixed(1)}" cy="${(cy + Math.sin(a) * d * 0.8).toFixed(1)}" r="${(8 + rand() * 15).toFixed(1)}" fill="${PINKS[Math.floor(rand() * PINKS.length)]}" opacity="${(0.72 + rand() * 0.26).toFixed(2)}"/>`);
      }
    }
    branch(300, 604, Math.PI / 2 + 0.06, 150, 26, 0);

    let fallen = "";
    for (let i = 0; i < 46; i++) { const x = 300 + (rand() - 0.5) * 520 * Math.sqrt(rand()); fallen += `<ellipse cx="${x.toFixed(0)}" cy="${(606 + rand() * 16).toFixed(0)}" rx="${(4 + rand() * 5).toFixed(1)}" ry="2.4" fill="${PINKS[Math.floor(rand() * 5)]}" opacity="${(0.5 + rand() * 0.4).toFixed(2)}" transform="rotate(${(rand() * 40 - 20).toFixed(0)} ${x.toFixed(0)} 610)"/>`; }

    svg.innerHTML = `
      <defs><linearGradient id="sun" x1="0" y1="0" x2="0.3" y2="1">
        <stop class="sun-a" offset="0"/><stop class="sun-b" offset=".55"/><stop class="sun-c" offset="1"/></linearGradient></defs>
      <circle class="tree-sun" cx="300" cy="300" r="262" fill="url(#sun)"/>
      <ellipse class="tree-ground" cx="300" cy="612" rx="290" ry="13"/>
      <g class="tree-sway"><g class="tree-wood">${wood.join("")}</g><g class="tree-bloom">${bloom.join("")}</g></g>
      <g>${fallen}</g>`;
    mount.append(svg);

    return {
      /* Branch tips in screen pixels, for spawning petals. */
      tips() {
        const r = svg.getBoundingClientRect(), s = Math.min(r.width / 600, r.height / 640);
        const ox = r.left + (r.width - 600 * s) / 2, oy = r.top + (r.height - 640 * s) / 2;
        return { onScreen: r.bottom > 80 && r.top < window.innerHeight, points: tips.map(([x, y]) => [ox + x * s, oy + y * s]) };
      },
      rect() { return svg.getBoundingClientRect(); },
      el: svg
    };
  };

  /* Petals on a fixed see-through layer over the whole site. While the tree is on
     screen they fall from its branches; further down the page they drift in from the top.
     The wind blows from the tree toward the pointer, so the whole flurry bends the way the mouse goes. */
  window.Petals = function initPetals(canvas, tree) {
    if (reduced) { canvas.remove(); return; }
    const { fit } = Site, rand = Site.rng(7);
    const count = window.innerWidth < 700 ? 16 : 32;
    const mouse = { x: 0, y: 0, on: false }, wind = { x: 0, y: 0 };
    let lastY = window.scrollY, lastT = 0;

    function spawn(p) {
      const t = tree.tips();
      if (t.onScreen) { const pt = t.points[Math.floor(rand() * t.points.length)]; p.x = pt[0] + (rand() - 0.5) * 60; p.y = pt[1] + (rand() - 0.5) * 40; }
      else { p.x = rand() * window.innerWidth; p.y = -20; }
      p.r = 5 + rand() * 8; p.a = rand() * 6.28; p.va = (rand() - 0.5) * 2; p.fall = 26 + rand() * 38; p.sway = rand() * 6.28;
      p.vx = 0; p.vy = p.fall; p.o = 0.32 + rand() * 0.38; p.c = PINKS[Math.floor(rand() * 5)]; p.light = 0.6 + rand() * 0.8;   /* lighter petals follow the wind more */
      return p;
    }
    const petals = Array.from({ length: count }, () => { const p = spawn({}); p.y += rand() * window.innerHeight * 0.8; return p; });

    window.addEventListener("pointermove", (e) => { if (e.pointerType === "touch") return; mouse.x = e.clientX; mouse.y = e.clientY; mouse.on = true; }, { passive: true });

    /* ---- the bird: a small dark silhouette that crosses in front of the tree every so often ---- */
    let bird = null, nextBird = 5 + rand() * 6;
    function launchBird() {
      const r = tree.rect(), dir = rand() < 0.5 ? 1 : -1;
      bird = { x: dir > 0 ? r.left - 60 : r.right + 60, end: dir > 0 ? r.right + 80 : r.left - 80, y: r.top + r.height * (0.12 + rand() * 0.3), dir, speed: 70 + rand() * 35, t: 0, bob: 10 + rand() * 12, climb: (rand() - 0.6) * 14 };
    }
    function drawBird(ctx, dt) {
      const b = bird; b.t += dt; b.x += b.dir * b.speed * dt;
      const glide = Math.sin(b.t * 0.9) > 0.55;                                  /* a few beats, then a short glide */
      const flap = glide ? 0.25 : Math.sin(b.t * 13), y = b.y + Math.sin(b.t * 1.7) * b.bob + b.climb * b.t - flap * 1.5;
      ctx.save(); ctx.translate(b.x, y); ctx.scale(b.dir, 1); ctx.fillStyle = "#14020A"; ctx.strokeStyle = "#14020A"; ctx.lineCap = "round";
      ctx.beginPath(); ctx.ellipse(0, 0, 6.5, 2.6, -0.12, 0, 6.3); ctx.fill();                   /* body */
      ctx.beginPath(); ctx.arc(6.2, -1.6, 2.1, 0, 6.3); ctx.fill();                              /* head */
      ctx.beginPath(); ctx.moveTo(8, -1.7); ctx.lineTo(10.6, -1.1); ctx.lineTo(8, -0.8); ctx.fill();   /* beak */
      ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-11.5, -1.6); ctx.lineTo(-11, 1.4); ctx.fill();   /* tail */
      ctx.beginPath(); ctx.moveTo(-1.5, -0.5); ctx.quadraticCurveTo(-1, -6 - flap * 5, -6.5, -9 * flap - 1); ctx.quadraticCurveTo(0.5, -3 * flap - 1, 3, -0.5); ctx.fill();   /* wing */
      ctx.restore();
      if ((b.dir > 0 && b.x > b.end) || (b.dir < 0 && b.x < b.end)) { bird = null; nextBird = 11 + rand() * 12; }
    }

    function draw(t) {
      requestAnimationFrame(draw);
      const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016); lastT = t;
      const { ctx, w, h } = fit(canvas);
      ctx.clearRect(0, 0, w, h);
      if (document.body.classList.contains("on-resume")) return;
      const dy = window.scrollY - lastY; lastY = window.scrollY;
      const nearTree = tree.tips().onScreen, fade = nearTree ? 1 : 0.5;         /* quieter once you are reading the page */
      /* One wind for every petal: it points from the tree (or the middle of the screen) to the pointer,
         stronger the further away the pointer is, and it turns smoothly rather than snapping. */
      let tx = 0, ty = 0;
      if (mouse.on) {
        const r = tree.rect(), ox = nearTree ? r.left + r.width / 2 : w / 2, oy = nearTree ? r.top + r.height * 0.4 : h / 2;
        const dx = mouse.x - ox, dyy = mouse.y - oy, dist = Math.hypot(dx, dyy) || 1, power = 85 * Math.min(1, dist / 420);
        tx = (dx / dist) * power; ty = (dyy / dist) * power * 0.55;
      }
      wind.x += (tx - wind.x) * Math.min(1, dt * 2.2); wind.y += (ty - wind.y) * Math.min(1, dt * 2.2);
      for (const p of petals) {
        p.sway += dt * 1.6;
        const aimX = Math.sin(p.sway) * 20 + wind.x * p.light, aimY = Math.max(8, p.fall + wind.y * p.light);   /* always still falling a little */
        p.vx += (aimX - p.vx) * Math.min(1, dt * 1.8); p.vy += (aimY - p.vy) * Math.min(1, dt * 1.8);
        p.x += p.vx * dt; p.y += p.vy * dt - dy * 0.12; p.a += (p.va + p.vx * 0.012) * dt;
        if (p.y > h + 24 || p.y < -60 || p.x < -40 || p.x > w + 40) spawn(p);
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.scale(1, 0.5 + 0.5 * Math.cos(p.a * 1.7));
        ctx.beginPath(); ctx.moveTo(0, -p.r); ctx.bezierCurveTo(p.r, -p.r * 0.6, p.r * 0.8, p.r * 0.8, 0, p.r); ctx.bezierCurveTo(-p.r * 0.8, p.r * 0.8, -p.r, -p.r * 0.6, 0, -p.r);
        ctx.globalAlpha = p.o * fade; ctx.fillStyle = p.c; ctx.fill(); ctx.restore();
      }
      if (bird) drawBird(ctx, dt);
      else if (nearTree && (nextBird -= dt) <= 0) launchBird();
    }
    requestAnimationFrame(draw);
  };
})();
