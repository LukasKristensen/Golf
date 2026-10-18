// Page behaviour that ties it together: scroll effects, the section rail, follow-a-player and startup.

// Scroll-in effects: sections rise in, lines draw themselves, bars grow, numbers count up
(function reveals() {
  if (reduceMotion || !("IntersectionObserver" in window)) return;
  const once = (nodes, fn, opts) => {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); fn(e.target); } }), opts || { threshold: 0.2 });
    nodes.forEach(n => n && io.observe(n));
  };
  const secs = [...document.querySelectorAll(".wrap > section")].filter(s => s.getBoundingClientRect().top > innerHeight);
  secs.forEach(s => s.classList.add("pre"));
  once(secs, s => { s.classList.add("revealed"); s.classList.remove("pre"); }, { threshold: 0.05 });

  const drawLines = box => box.querySelectorAll("path[fill='none']:not([stroke-dasharray])").forEach((p, i) => {
    const len = p.getTotalLength(); if (!len) return;
    p.style.strokeDasharray = len; p.style.strokeDashoffset = len;
    p.getBoundingClientRect();
    p.style.transition = `stroke-dashoffset 1.4s cubic-bezier(.3,.7,.2,1) ${i * 90}ms`;
    p.style.strokeDashoffset = 0;
    p.addEventListener("transitionend", () => { p.style.strokeDasharray = ""; p.style.transition = ""; }, { once: true });
  });
  once([el("trendchart"), el("racechart"), document.querySelector("#spotlight svg")], drawLines, { threshold: 0.4 });

  once([el("holechart")], box => box.querySelectorAll("rect").forEach((r, i) => {
    r.style.transformBox = "fill-box"; r.style.transformOrigin = "bottom"; r.style.transform = "scaleY(0)";
    r.getBoundingClientRect();
    r.style.transition = `transform 0.9s cubic-bezier(.3,.7,.2,1) ${i * 80}ms`; r.style.transform = "";
  }), { threshold: 0.4 });

  once([el("dotchart")], box => box.querySelectorAll(".hdot .mark").forEach((c, i) => {
    c.style.transformBox = "fill-box"; c.style.transformOrigin = "center"; c.style.transform = "scale(0)";
    c.getBoundingClientRect();
    c.style.transition = `transform 0.45s cubic-bezier(.3,1.5,.5,1) ${Math.min(i * 6, 900)}ms`; c.style.transform = "";
  }), { threshold: 0.25 });

  // Count the headline numbers up from zero
  el("stats").querySelectorAll(".v").forEach(n => {
    const m = n.textContent.match(/^(#?)(\d+(?:\.\d+)?)$/); if (!m) return;
    const end = +m[2], dec = (m[2].split(".")[1] || "").length, t0 = performance.now(), dur = 1100;
    const tick = t => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      n.textContent = m[1] + (end * e).toFixed(dec);
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
})();

// Section indicator: dots for each section on a side rail, a ball that rolls from tee to flag as you scroll,
// and the matching chip highlighted in the top menu
(function railSpy() {
  const links = [...document.querySelectorAll(".toc a")].map(a => ({ a, id: a.getAttribute("href").slice(1), label: a.textContent }))
    .filter(l => document.getElementById(l.id));
  const n = links.length, rail = el("rail"), toc = document.querySelector(".toc");
  rail.innerHTML = `<div class="rail-track"><div class="rail-fill"></div></div><span class="rail-tee"></span>
    ${links.map((l, i) => `<a class="rail-dot" href="#${l.id}" style="top:${i / (n - 1) * 100}%" aria-label="${l.label}"><span class="rail-label">${l.label}</span></a>`).join("")}
    <span class="rail-ball"></span>
    <svg class="rail-flag" viewBox="0 0 26 42" aria-hidden="true"><ellipse cx="4" cy="38" rx="7" ry="3" fill="var(--ink)" opacity="0.6"/><line x1="4" y1="38" x2="4" y2="6" stroke="var(--ink)" stroke-width="2"/><path d="M4 6 l18 6 l-18 6z" fill="var(--flag)"/></svg>
    <span class="rail-count"><b>01</b> / ${String(n).padStart(2, "0")}</span>`;
  const dots = [...rail.querySelectorAll(".rail-dot")], ball = rail.querySelector(".rail-ball"), count = rail.querySelector(".rail-count b");
  let current = -2, idle;
  function update() {
    const tops = links.map(l => el(l.id).getBoundingClientRect().top + scrollY);
    const max = document.documentElement.scrollHeight - innerHeight;
    const y = scrollY + innerHeight * 0.35;
    let k = -1;
    tops.forEach((t, i) => { if (t <= y) k = i; });
    let p = 0;
    if (k >= 0) {
      const end = k < n - 1 ? tops[k + 1] : max + innerHeight * 0.35;
      p = Math.min(1, (k + Math.max(0, Math.min(1, (y - tops[k]) / Math.max(1, end - tops[k])))) / (n - 1));
    }
    if (scrollY >= max - 2) { p = 1; k = n - 1; }
    rail.style.setProperty("--p", p);
    ball.style.setProperty("--rot", (scrollY * 0.6) + "deg");
    ball.classList.toggle("holed", p >= 0.999);
    toc.style.setProperty("--prog", (max > 0 ? scrollY / max * 100 : 0) + "%");
    if (k !== current) {
      current = k;
      dots.forEach((d, i) => { d.classList.toggle("active", i === k); d.classList.toggle("done", i < k); });
      links.forEach((l, i) => l.a.setAttribute("aria-current", String(i === k)));
      count.textContent = String(Math.max(1, k + 1)).padStart(2, "0");
      // Keep the active chip in view in the sideways-scrolling menu
      if (k >= 0) {
        const a = links[k].a;
        toc.scrollTo({ left: a.offsetLeft - toc.clientWidth / 2 + a.offsetWidth / 2, behavior: reduceMotion ? "auto" : "smooth" });
      }
    }
    // Show the active label while scrolling, then let it fade
    rail.classList.add("moving");
    clearTimeout(idle);
    idle = setTimeout(() => rail.classList.remove("moving"), 1400);
  }
  let queued = false;
  addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; update(); }); } }, { passive: true });
  addEventListener("resize", update);
  update();
})();

// Follow-a-player chips, summary and the shareable ?player= link
el("chips").innerHTML = players.map(x => `<button type="button" class="chip" aria-pressed="false" data-chip="${x.p}" style="--ring:${colorOf(x.p)}">${avatarHTML(x.p)}${x.p}</button>`).join("");
function setFocus(p) {
  focus = playerOrder.includes(p) ? p : null;
  [...el("chips").children].forEach(b => b.setAttribute("aria-pressed", String(b.dataset.chip === focus)));
  const x = players.find(x => x.p === focus);
  if (x) {
    const rank = regulars.findIndex(r => r.p === focus) + 1;
    el("focussummary").innerHTML = `<strong>${x.p}</strong>: ${x.rounds} round${x.rounds === 1 ? "" : "s"}, averaging <span class="num">${fmt(x.avg)}</span>`
      + (rank ? ` (${rank} of ${regulars.length} regulars)` : " (one round, not ranked)")
      + `, best <span class="num">${x.best}</span>, ${x.wins ? `${x.wins} win${x.wins === 1 ? "" : "s"}` : "no wins yet"}. Everyone else is faded below.`;
    el("following").textContent = `Following ${x.p} ✕`;
    el("following").style.setProperty("--ring", colorOf(x.p));
    el("following").setAttribute("aria-label", `Stop following ${x.p}`);
  } else {
    el("focussummary").textContent = "Pick a name to pick them out in every chart and table below.";
  }
  el("following").hidden = !x;
  showHole(courseHole);
  try {
    const u = new URL(location.href);
    x ? u.searchParams.set("player", x.p) : u.searchParams.delete("player");
    history.replaceState(null, "", u);
  } catch (e) {}
  applyFocus();
}
const toggleFocus = p => setFocus(p === focus ? null : p);
el("chips").addEventListener("click", e => { const b = e.target.closest("[data-chip]"); if (b) toggleFocus(b.dataset.chip); });
el("following").addEventListener("click", () => setFocus(null));
document.addEventListener("click", e => { const t = e.target.closest("[data-toggle]"); if (t) toggleFocus(t.dataset.player); });
document.addEventListener("keydown", e => {
  const t = e.target.closest && e.target.closest(".pcard[data-toggle]");
  if (t && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); toggleFocus(t.dataset.player); }
});

// Start the race on the latest session; it plays once the first time it scrolls into view
const latest = sessions[sessions.length - 1];
setupRace(latest, reduceMotion ? HOLES : 0);
if (!reduceMotion && "IntersectionObserver" in window) {
  const io = new IntersectionObserver(entries => {
    if (!entries.some(en => en.isIntersecting)) return;
    io.disconnect();
    if (race.s === latest && race.k === 0 && !race.timer) setTimeout(playRace, 400);
  }, { threshold: 0.5 });
  io.observe(el("track"));
} else if (!reduceMotion) setupRace(latest, HOLES);

let initial = null;
try { initial = new URL(location.href).searchParams.get("player"); } catch (e) {}
setFocus(initial);
