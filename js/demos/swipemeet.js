/* SwipeMeet stand-in: you are a Swiper browsing Guest posts. Drag right to send a request. All people here are made up. */
Site.registerDemo("swipemeet", function (root) {
  const { h } = Site;
  const REQUESTS = [
    { name: "Maya", year: "Class of 2028", hall: "Hill House", when: "Thursday, 6:30 pm", note: "Out of swipes until Monday. Happy to talk about CIS 1210.", matches: true },
    { name: "Jordan", year: "Class of 2027", hall: "1920 Commons", when: "Friday, 12:15 pm", note: "Transfer student, still finding my way around the dining halls.", matches: false },
    { name: "Priya", year: "Class of 2029", hall: "Kings Court English House", when: "Saturday, 11:00 am", note: "Brunch before the Hack4Impact work session?", matches: true },
    { name: "Sam", year: "Class of 2028", hall: "Lauder College House", when: "Sunday, 6:00 pm", note: "Looking for a dinner buddy after rehearsal.", matches: true }
  ];
  let queue = [], offered = 0, scheduled = 0;
  const deck = h("div.sm-deck");
  const msg = h("p.sm-msg", { "aria-live": "polite" });
  const passBtn = h("button.d-btn", { type: "button", text: "Pass", onclick: () => decide(false) });
  const offerBtn = h("button.d-btn.solid", { type: "button", text: "Send a request", onclick: () => decide(true) });
  root.append(h("div.sm", null, deck, h("div.d-row", null, passBtn, offerBtn), msg));

  function reset() { queue = REQUESTS.slice(); offered = 0; scheduled = 0; msg.textContent = "You have guest swipes to share. Drag a post right to send a request, left to pass."; render(); }

  function render() {
    deck.replaceChildren();
    passBtn.disabled = offerBtn.disabled = !queue.length;
    if (!queue.length) {
      deck.append(h("div.sm-empty", null,
        h("p", { text: `That's every post. ${offered} requests sent, ${scheduled} accepted.` }),
        h("button.d-btn", { type: "button", text: "Start again", onclick: reset })));
      return;
    }
    queue.slice(0, 2).reverse().forEach((r, k, arr) => {
      const top = k === arr.length - 1;
      const card = h("div.sm-card", null,
        h("span.sm-role", { text: "Guest post" }),
        h("h4", { text: r.name }), h("span", { text: r.year }), h("p", { text: r.note }),
        h("div.sm-meta", { text: r.hall + ", " + r.when }));
      if (!top) card.style.transform = "scale(.95) translateY(12px)";
      else drag(card);
      deck.append(card);
    });
  }

  function drag(card) {
    let x0 = 0, dx = 0, down = false;
    card.addEventListener("pointerdown", (e) => { down = true; x0 = e.clientX; dx = 0; card.setPointerCapture(e.pointerId); card.classList.add("drag"); });
    card.addEventListener("pointermove", (e) => { if (!down) return; dx = e.clientX - x0; card.style.transform = `translateX(${dx}px) rotate(${dx / 14}deg)`; });
    const up = () => { if (!down) return; down = false; card.classList.remove("drag"); if (Math.abs(dx) > 90) decide(dx > 0); else card.style.transform = ""; };
    card.addEventListener("pointerup", up); card.addEventListener("pointercancel", up);
  }

  function decide(offer) {
    const r = queue[0]; if (!r) return;
    const card = deck.lastElementChild;
    passBtn.disabled = offerBtn.disabled = true;
    card.style.transform = `translateX(${offer ? 420 : -420}px) rotate(${offer ? 26 : -26}deg)`; card.style.opacity = "0";
    if (offer) {
      offered++;
      if (r.matches) { scheduled++; msg.textContent = `${r.name} accepted. In the real app this opens a private chat to settle the date, time and dining hall (${r.hall}, ${r.when}).`; }
      else msg.textContent = `Request sent to ${r.name}. They can accept or decline.`;
    } else msg.textContent = `Passed on ${r.name}'s post.`;
    setTimeout(() => { queue.shift(); render(); }, 300);
  }

  reset();
  return {};
});
