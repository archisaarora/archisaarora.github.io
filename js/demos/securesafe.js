/* SecureSafe walkthrough: the four steps a resident takes at the real door
   (login -> emailed PIN -> fingerprint -> servo), with the same routes and
   messages as backend/app.py. It is an explainer, not the app: nothing leaves the browser. */
Site.registerDemo("securesafe", function (root) {
  const { h } = Site;
  const STEPS = ["Log in", "One-time PIN", "Fingerprint", "Door opens"];
  let pin = "", timers = [];
  const stepper = h("ol.ss-steps", { "aria-label": "Unlock steps" }, STEPS.map((s) => h("li", { text: s })));
  const ui = h("div.ss-ui");
  const log = h("div.d-log", { "aria-live": "polite" });
  const door = h("div.ss-door", {
    html: `<svg viewBox="0 0 260 200" role="img" aria-label="Door with a servo-driven rack-and-pinion bolt">
      <rect x="56" y="24" width="124" height="158" fill="none" stroke="rgba(246,237,221,.35)" stroke-width="2"/>
      <rect x="176" y="92" width="10" height="18" fill="#22040C" stroke="rgba(246,237,221,.55)" stroke-width="1.2"/>
      <g class="ss-leaf">
        <rect x="62" y="30" width="112" height="146" rx="2" fill="#6A1B30" stroke="#F3BCC8" stroke-width="1.5"/>
        <rect x="76" y="44" width="50" height="118" fill="none" stroke="rgba(243,188,200,.3)"/>
        <rect x="134" y="84" width="38" height="50" rx="3" fill="#4A0D1E" stroke="rgba(243,188,200,.6)"/>
        <g class="ss-bolt"><rect x="140" y="96" width="44" height="9" rx="1.5" fill="#F6EDDD"/>
          <path d="M144 105v4M149 105v4M154 105v4M159 105v4M164 105v4" stroke="#F6EDDD" stroke-width="2"/></g>
        <g class="ss-gear"><circle cx="154" cy="119" r="9" fill="#C95F7A" stroke="#F6EDDD" stroke-width="1.5"/>
          <path d="M154 108v22M143 119h22M146 111l16 16M162 111l-16 16" stroke="#F6EDDD" stroke-width="1.5"/></g>
      </g>
      <rect x="198" y="88" width="24" height="34" rx="4" fill="none" stroke="rgba(246,237,221,.6)" stroke-width="1.2"/>
      <circle cx="210" cy="100" r="6" fill="none" stroke="#F3BCC8" stroke-width="1.2"/>
      <circle class="ss-led" cx="210" cy="114" r="2.5" fill="#FF9C8A"/>
      <text x="210" y="136" fill="rgba(246,237,221,.6)" font-size="8" text-anchor="middle" font-family="IBM Plex Mono, monospace">sensor</text>
      <text class="ss-state" x="118" y="194" fill="#F6EDDD" font-size="9" text-anchor="middle" font-family="IBM Plex Mono, monospace">locked</text>
    </svg>` });
  root.append(
    h("p.ss-intro", { text: "A walkthrough of how the lock works, one step at a time. Each button stands in for something a resident does at the real door." }),
    stepper,
    h("div.ss", null, ui, h("div", null, door, h("p.ss-cap", { text: "On the door: a servo turns the gear, the gear slides the bolt out of the frame, and the door is free to swing." }))),
    h("p.ss-cap", { text: "What the Raspberry Pi logs at each step:" }), log);
  const led = door.querySelector(".ss-led"), state = door.querySelector(".ss-state");

  function at(i) { [...stepper.children].forEach((li, k) => { li.classList.toggle("done", k < i); li.toggleAttribute("aria-current", k === i); }); }
  function say(text, cls) {
    const t = new Date().toLocaleTimeString([], { hour12: false });
    log.append(h("div" + (cls ? "." + cls : ""), { text: t + "  " + text }));
    log.scrollTop = log.scrollHeight;
  }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function setDoor(open) {
    door.classList.toggle("ss-open", open);
    led.setAttribute("fill", open ? "#F3BCC8" : "#FF9C8A"); state.textContent = open ? "unlocked, open" : "locked";
  }
  const field = (label, input) => h("label", null, label, input);

  function stepLogin() {
    at(0);
    const email = h("input", { type: "email", value: "resident@securesafe.demo", autocomplete: "off" });
    const pw = h("input", { type: "password", value: "demo-password", autocomplete: "off" });
    ui.replaceChildren(h("h4", { text: "Step 1. Log in" }),
      h("p", { text: "At the real door this is the web app served by the Raspberry Pi. A demo account is filled in for you." }),
      field("Email", email), field("Password", pw),
      h("button.ss-go", { type: "button", text: "Log in", onclick: () => {
        say("POST /login  200  session created, role: user");
        const n = new Uint32Array(1); crypto.getRandomValues(n);
        pin = String(100000 + (n[0] % 900000));
        say("GET /dashboard  302 -> /verify_pin  one-time PIN generated");
        say("SMTP  PIN mailed to " + (email.value || "the account email"));
        stepPin();
      } }));
  }

  function stepPin() {
    at(1);
    const input = h("input", { type: "text", inputmode: "numeric", maxlength: "6", placeholder: "6-digit PIN", autocomplete: "off" });
    const err = h("p.ss-err", { role: "alert" });
    const check = () => {
      if (input.value.trim() === pin) { say("POST /verify_pin  302 -> /dashboard  PIN verified", "ok"); stepFinger(); }
      else { err.textContent = "Incorrect PIN."; say("POST /verify_pin  200  incorrect PIN", "bad"); }
    };
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") check(); });
    ui.replaceChildren(h("h4", { text: "Step 2. One-time PIN" }),
      h("p", { text: "The Pi emails a fresh 6-digit PIN. No email is sent here; it lands in this pretend inbox instead." }),
      h("div.ss-mail", null, "Pretend inbox. Secure Login PIN: ", h("b", { text: pin }), ". Expires in 15 min."),
      field("PIN", input), err,
      h("button.ss-go", { type: "button", text: "Verify PIN", onclick: check }));
  }

  function stepFinger() {
    at(2);
    const who = h("select", null, h("option", { value: "yes", text: "An enrolled finger" }), h("option", { value: "no", text: "A finger that isn't enrolled" }));
    const pad = h("button.ss-pad", { type: "button", "aria-label": "Fingerprint sensor: press and hold" });
    const err = h("p.ss-err", { role: "alert" });
    let t0 = 0, raf = 0;
    const tick = () => {
      const f = Math.min(1, (performance.now() - t0) / 900);
      pad.style.setProperty("--fill", f * 100 + "%");
      if (f < 1) raf = requestAnimationFrame(tick); else scan();
    };
    const begin = (e) => { e.preventDefault(); if (raf) return; t0 = performance.now(); raf = requestAnimationFrame(tick); };
    const cancel = () => { cancelAnimationFrame(raf); raf = 0; pad.style.setProperty("--fill", "0%"); };
    pad.addEventListener("pointerdown", begin); pad.addEventListener("pointerup", cancel); pad.addEventListener("pointerleave", cancel);
    pad.addEventListener("keydown", (e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) begin(e); });
    pad.addEventListener("keyup", cancel);
    function scan() {
      raf = 0;
      say("UART  image captured, searching templates");
      if (who.value === "yes") {
        say("POST /validate  200  fingerprint matched", "ok");
        say("PCA9685  servo turning, bolt retracting");
        setDoor(true);
        later(() => say("Door open", "ok"), 2200);
        stepOpen();
      } else { cancel(); err.textContent = "Access denied"; say("POST /validate  200  access denied", "bad"); }
    }
    ui.replaceChildren(h("h4", { text: "Step 3. Fingerprint" }),
      h("p", { text: "The optical sensor compares the print with enrolled templates. Choose which finger to present, then press and hold the pad." }),
      field("Finger to present", who), pad, err);
  }

  function stepOpen() {
    at(3);
    ui.replaceChildren(h("h4", { text: "Step 4. The door opens" }),
      h("p", { text: "Both factors passed, so the Pi drove the servo: the gear pulled the bolt back and the linkage swung the door." }),
      h("button.ss-go", { type: "button", text: "Close the door and start over", onclick: () => {
        say("POST /closedoor  200  bolt extended"); setDoor(false); say("Session cleared"); stepLogin();
      } }));
  }

  say("Flask server ready. Fingerprint sensor initialised.");
  stepLogin();
  return { stop() { timers.forEach(clearTimeout); timers = []; } };
});
