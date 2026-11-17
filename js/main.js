/* Renders the page from js/data.js: hero, project deck, path timeline, skills,
   resume tab, the floating blossom menu, and the scroll-linked motion. */
(function () {
  const { h, clamp, reduced } = Site;
  const D = window.PORTFOLIO;
  const $ = (id) => document.getElementById(id);
  const PETAL = "M0-2 C-5-4 -6-9 -2.5-11 L0-9.6 L2.5-11 C6-9 5-4 0-2Z";
  const flowerSvg = () => '<svg viewBox="-12 -12 24 24"><g>' + [0, 72, 144, 216, 288].map((a) => `<path transform="rotate(${a})" d="${PETAL}"/>`).join("") + "</g></svg>";
  const mark = () => h("span.mark", { "aria-hidden": "true", html: flowerSvg() });

  /* ---------- Hero: name, one line, a few facts, the tree ---------- */
  const H = D.hero;
  $("hero-name").textContent = D.profile.name;
  $("hero-tag").textContent = H.tagline;
  H.facts.forEach((f) => $("hero-facts").append(h("li", null, mark(), f)));
  $("hero-links").append(
    h("a.button.button-hot", { href: "#work", text: "See the work" }),
    h("a.button.button-line", { href: "#resume", text: "Resume" }),
    h("a.button.button-line", { href: D.profile.github, text: "GitHub", target: "_blank", rel: "noopener" }),
    h("a.button.button-line", { href: D.profile.linkedin, text: "LinkedIn", target: "_blank", rel: "noopener" }),
    h("a.button.button-line", { href: "mailto:" + D.profile.email, text: "Email" }));
  const tree = Tree($("tree"));
  Petals($("petals"), tree);
  /* Highlights: four numbers, with a "see more" link under each group. */
  H.highlights.forEach((x, i) => $("highlights").append(h("div.hl.hl-" + i, null, h("b", { text: x.big }), h("span", { text: x.small }))));
  H.more.forEach((m, i) => $("highlights").append(h("a.hl-more.hl-more-" + i, { href: m.href }, mark(), m.text)));

  /* ---------- Skills: plain boxes, sorted by type ---------- */
  D.skills.forEach((g) => $("skill-grid").append(h("div.skill-box", null, h("h3", { text: g.group }), h("ul.chips.chips-ink", null, g.items.map((t) => h("li", { text: t }))))));

  /* ---------- Project deck ---------- */
  const tabsEl = $("deck-tabs"), stage = $("deck-stage");
  let current = -1;
  const sheets = D.projects.map((p, i) => {
    const demoStage = h("div.demo-stage");
    const frame = h("div.demo", null,
      h("div.demo-bar", null, h("span.demo-dot"), h("span", { text: p.demoLabel || "Running in your browser" })),
      demoStage, p.demoNote && h("p.demo-note", { text: p.demoNote }));
    const el = h("article.sheet" + (p.wide ? ".wide" : ""), { id: "sheet-" + p.id, role: "tabpanel", "aria-labelledby": "tab-" + p.id, hidden: true },
      h("div.sheet-text", null,
        h("div.sheet-lead", null,
          h("p.status", null, mark(), p.status),
          h("h3", { text: p.name }),
          h("p.sheet-hook", { text: p.hook || p.summary })),
        h("div.sheet-meta", null,
          h("ul.stack", null, p.stack.map((t) => Array.isArray(t) ? h("li", null, h("strong", { text: t[0] }), h("span", { text: t[1] })) : h("li", null, h("strong", { text: t })))),
          p.links.length ? h("p.sheet-links", null, p.links.map((l) => h("a.text-link", { href: l.href, text: l.text, target: "_blank", rel: "noopener" }))) : null,
          h("details.sheet-more", null, h("summary", { text: "How it works" }),
            h("p", { text: p.summary }), h("ul.built", null, p.built.map((b) => h("li", { text: b })))))),
      h("div.sheet-demo", null, frame));
    stage.append(el);
    const tab = h("button.deck-tab", { type: "button", role: "tab", id: "tab-" + p.id, "aria-controls": "sheet-" + p.id, "aria-selected": "false", tabindex: "-1", onclick: () => show(i, true) },
      h("span.deck-tag", { text: p.tag }), h("span.deck-name", { text: p.name }));
    tabsEl.append(tab);
    return { p, el, tab, frame, demoStage, api: null };
  });
  const slider = h("span.deck-slider", { "aria-hidden": "true", html: flowerSvg() });
  tabsEl.append(slider);

  function startDemo(s) {
    if (!s.api) {
      const mount = Site.getDemo(s.p.demo);
      try { s.api = mount ? mount(s.demoStage) : {}; }
      catch (err) { console.error(err); s.demoStage.append(h("p.demo-fail", { text: "This demo could not start in your browser." })); s.api = {}; }
    }
    s.api.start && s.api.start();
  }
  const stopDemo = (s) => s.api && s.api.stop && s.api.stop();
  let deckVisible = false;

  function show(i, user) {
    i = (i + sheets.length) % sheets.length;
    if (i === current) return;
    const prev = sheets[current], next = sheets[i], dir = current < 0 ? 0 : (i > current ? 1 : -1);
    current = i;
    sheets.forEach((s, k) => { s.tab.setAttribute("aria-selected", String(k === i)); s.tab.tabIndex = k === i ? 0 : -1; });
    if (prev) { stopDemo(prev); prev.el.hidden = true; prev.el.classList.remove("enter-fwd", "enter-back"); }
    next.el.hidden = false;
    if (dir && !reduced) { void next.el.offsetWidth; next.el.classList.add(dir > 0 ? "enter-fwd" : "enter-back"); }
    if (deckVisible) startDemo(next);
    moveSlider();
    const n = sheets.length, a = sheets[(i - 1 + n) % n].p.name, b = sheets[(i + 1) % n].p.name;
    $("deck-prev").textContent = "Back to " + a; $("deck-next").textContent = "Next: " + b;
    $("deck-count").textContent = (i + 1) + " of " + n;
    if (user) { next.tab.scrollIntoView({ block: "nearest", inline: "center", behavior: reduced ? "auto" : "smooth" }); onScroll(); }
  }
  function moveSlider() {
    const t = sheets[current].tab;
    slider.style.transform = `translate(${t.offsetLeft + Math.min(t.offsetWidth / 2, 60) - 11}px, 0) rotate(${current * 144}deg)`;
  }
  $("deck-prev").addEventListener("click", () => show(current - 1, true));
  $("deck-next").addEventListener("click", () => show(current + 1, true));
  tabsEl.addEventListener("keydown", (e) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault(); show(current + step, true); sheets[current].tab.focus();
  });
  new IntersectionObserver(([e]) => {
    deckVisible = e.isIntersecting;
    if (current < 0) return;
    deckVisible ? startDemo(sheets[current]) : stopDemo(sheets[current]);
  }, { rootMargin: "200px 0px" }).observe(stage);
  show(0);

  /* ---------- Path timeline: education first, then experience, each with its own growing branch ---------- */
  const paths = [["school", "Education"], ["work", "Experience"]].map(([kind, title]) => {
    const fill = h("i"), list = h("div.path", null, h("div.path-line", { "aria-hidden": "true" }, fill));
    const stops = D.experience.filter((x) => x.kind === kind).map((x) => {
      const el = h("div.path-stop", { "data-kind": kind }, h("span.path-node", { "aria-hidden": "true", html: flowerSvg() }),
        h("div.path-when", null, h("p", { text: x.when })),
        /* For school entries the degree is the headline and the school sits under it. */
        h("div.path-body", null, h("h3", { text: kind === "school" ? x.role : x.org }), h("p.path-role", { text: kind === "school" ? x.org : x.role }), h("ul.built", null, x.points.map((t) => h("li", { text: t })))));
      list.append(el); return el;
    });
    $("path-groups").append(h("div.path-group", null, h("h3.path-title", { text: title }), list));
    return { list, fill, stops };
  });

  /* ---------- Contact ---------- */
  const out = (href, text) => h("a.text-link", { href, text, target: "_blank", rel: "noopener" });
  $("foot-links").append(
    h("a.text-link", { href: "mailto:" + D.profile.email, text: D.profile.email }),
    out(D.profile.github, "GitHub"), out(D.profile.linkedin, "LinkedIn"),
    h("a.text-link", { href: "#resume", text: "Resume" }));

  /* ---------- Resume tab ---------- */
  const R = D.resume;
  const rsec = (title, ...kids) => h("section.r-sec", { id: "resume-" + title.toLowerCase().split(" ")[0] }, h("h2", { text: title }), ...kids);
  const rrow = (title, sub, when, body) => h("div.r-row", null,
    h("div.r-head", null, h("h3", null, title, sub ? h("span.r-sub", { text: ", " + sub }) : null), when ? h("span.r-when", { text: when }) : null), body);
  const points = (list) => h("ul.built", null, list.map((t) => h("li", { text: t })));
  $("resume-body").append(
    h("header.r-top", null,
      h("h1", { text: D.profile.name }),
      h("p.r-contact", null,
        h("a", { href: "mailto:" + D.profile.email, text: D.profile.email }),
        h("a", { href: D.profile.linkedin, text: "linkedin.com/in/archisaarora", target: "_blank", rel: "noopener" }),
        h("a", { href: D.profile.github, text: "github.com/archisaarora", target: "_blank", rel: "noopener" })),
      h("a.button", { href: D.profile.resumePdf, target: "_blank", rel: "noopener", text: "Open the PDF" })),
    rsec("Education", ...R.education.map((e) => rrow(e.title, e.org, e.when, h("p", { text: e.detail })))),
    rsec("Professional experience", ...D.experience.filter((x) => x.kind === "work").map((x) => rrow(x.org, x.role, x.dates, points(x.points)))),
    rsec("Leadership", ...R.leadership.map((l) => rrow(l.title, "", l.when, h("p", { text: l.detail })))),
    rsec("Projects", ...D.projects.filter((p) => p.resume).map((p) => rrow(p.name, p.stack.map((t) => Array.isArray(t) ? t[0] : t).join(" | "), "", points(p.resumePoints || p.built)))),
    rsec("Awards and certifications", h("ul.r-awards", null, R.awards.map(([a, b]) => h("li", null, h("strong", { text: a }), " ", b)))),
    rsec("Skills", h("dl.r-skills", null, D.skills.flatMap((g) => [h("dt", { text: g.group }), h("dd", { text: g.items.join(", ") })]))));

  /* ---------- Floating blossom menu ---------- */
  const dialBtn = $("dial-btn"), dialMenu = $("dial-menu"), dialFlower = $("dial-flower");
  dialFlower.innerHTML = [0, 72, 144, 216, 288].map((a) => `<path transform="rotate(${a})" d="${PETAL}"/>`).join("");
  const places = [["top", "Top"], ["work", "Work"], ["path", "Path"], ["skills", "Skills"], ["contact", "Contact"], ["resume", "Resume"]];
  places.forEach(([id, text], i) => dialMenu.append(h("a", { href: "#" + id, text, style: `--i:${places.length - 1 - i}`, onclick: () => setDial(false) })));
  function setDial(open) { dialMenu.hidden = !open; dialBtn.setAttribute("aria-expanded", String(open)); }
  dialBtn.addEventListener("click", () => setDial(dialMenu.hidden));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !dialMenu.hidden) { setDial(false); dialBtn.focus(); } });
  document.addEventListener("click", (e) => { if (!dialMenu.hidden && !$("dial").contains(e.target)) setDial(false); });

  /* ---------- Routing: #resume is its own view, #p-<id> opens a project, anything else is a section ---------- */
  const home = $("view-home"), resume = $("view-resume");
  function route() {
    let name = location.hash.replace("#", "");
    const onResume = name === "resume" || name.startsWith("resume-");
    home.hidden = onResume; resume.hidden = !onResume;
    document.body.classList.toggle("on-resume", onResume);
    if (onResume) {
      const sec = name !== "resume" && document.getElementById(name);       /* e.g. #resume-awards jumps to that part of the resume */
      requestAnimationFrame(() => { if (sec) sec.scrollIntoView(); else window.scrollTo(0, 0); onScroll(); });
      return;
    }
    if (name.startsWith("p-")) { const i = sheets.findIndex((s) => s.p.id === name.slice(2)); if (i >= 0) show(i); name = "work"; }
    const target = name && name !== "top" ? document.getElementById(name) : null;
    requestAnimationFrame(() => { if (target) target.scrollIntoView({ behavior: "auto" }); else if (name === "top") window.scrollTo(0, 0); moveSlider(); onScroll(); });
  }
  window.addEventListener("hashchange", route);

  /* ---------- Scroll-linked motion ---------- */
  const nav = $("nav"), heroEl = $("hero");
  const sections = ["skills", "work", "path"].map((id) => ({ id, el: $(id), link: document.querySelector(`.nav nav a[href="#${id}"]`) }));
  const resumeLink = document.querySelector('.nav nav a[href="#resume"]');
  function onScroll() {
    const vh = window.innerHeight, y = window.scrollY, onResume = document.body.classList.contains("on-resume");
    const dark = !onResume && y < heroEl.offsetHeight - 60;
    nav.classList.toggle("on-light", !dark);
    resumeLink.toggleAttribute("aria-current", onResume);
    for (const s of sections) { const r = s.el.getBoundingClientRect(); s.link.toggleAttribute("aria-current", !onResume && r.top < vh * 0.5 && r.bottom > vh * 0.5); }
    const max = document.documentElement.scrollHeight - vh;
    dialFlower.setAttribute("transform", `rotate(${(max > 0 ? (y / max) * 720 : 0).toFixed(1)})`);
    $("dial").classList.toggle("on-dark", dark || (!onResume && y > $("contact").offsetTop - vh + 80));
    if (onResume) return;

    /* Deck: the demo swings flat as the stage rises into view. */
    const cur = sheets[current];
    if (cur && !reduced) {
      const r = cur.el.getBoundingClientRect(), t = clamp((vh - r.top) / (vh * 0.6)), k = 1 - t * t * (3 - 2 * t), a = cur.p.wide ? 0.4 : 1;
      cur.frame.style.transform = k > 0.001 ? `perspective(1600px) rotateY(${(-24 * k * a).toFixed(2)}deg) rotateZ(${(2 * k * a).toFixed(2)}deg) translateX(${(60 * k).toFixed(1)}px)` : "";
    }
    /* Path: each branch grows with the scroll and each stop blooms when the branch reaches it. */
    for (const p of paths) {
      const pr = p.list.getBoundingClientRect(), reach = clamp((vh * 0.62 - pr.top) / pr.height);
      p.fill.style.transform = `scaleY(${reduced ? 1 : reach.toFixed(4)})`;
      for (const el of p.stops) el.classList.toggle("reached", reduced || el.offsetTop + 14 <= reach * pr.height);
    }
  }
  let ticking = false;
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; onScroll(); }); } }, { passive: true });
  window.addEventListener("resize", () => { moveSlider(); onScroll(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveSlider);
  route();
  onScroll();
})();
