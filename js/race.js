// The hole race: an animated leaderboard per session, and the strokes-behind-the-leader replay chart.

// Hole replay: strokes behind the leader after each hole, drawn up to the hole the race is on
function drawReplay(s, upto = HOLES) {
  const sr = rows.filter(r => r.s === s);
  const cum = sr.map(r => { let c = 0; return { p: r.p, v: [0, ...r.h.map(x => (c += x))] }; });
  const lead = cum[0].v.map((_, i) => Math.min(...cum.map(c => c.v[i])));
  const gaps = cum.map(c => ({ p: c.p, g: c.v.map((v, i) => v - lead[i]) }));
  const hi = Math.max(5, Math.ceil(Math.max(...gaps.flatMap(x => x.g)) / 5) * 5);
  const W = 960, H = 320, m = { l: 44, r: 190, t: 20, b: 36 };
  const x = i => m.l + i * (W - m.l - m.r) / HOLES;
  const y = v => m.t + v * (H - m.t - m.b) / hi;
  const line = (gp, from, to) => gp.g.slice(from, to + 1).map((v, i) => (i ? "L" : "M") + x(from + i) + " " + y(v)).join(" ");
  let g = "";
  for (let v = 0; v <= hi; v += hi > 10 ? 5 : 2) {
    g += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="${v === 0 ? "var(--ink)" : "var(--rule)"}"/>`;
    g += `<text x="${m.l - 8}" y="${y(v) + 4}" text-anchor="end">${v === 0 ? "lead" : "+" + v}</text>`;
  }
  for (let i = 0; i <= HOLES; i++) g += `<text x="${x(i)}" y="${H - 12}" text-anchor="middle"${i === upto ? ' style="fill:var(--ink);font-weight:500"' : ""}>${i === 0 ? "Start" : "Hole " + i}</text>`;
  if (upto < HOLES) g += `<line x1="${x(upto)}" x2="${x(upto)}" y1="${m.t - 8}" y2="${H - m.b}" stroke="var(--ink)" stroke-dasharray="3 4"/>`;
  gaps.forEach(gp => {
    const c = colorOf(gp.p);
    g += `<g data-player="${gp.p}">`;
    if (upto < HOLES) g += `<path d="${line(gp, upto, HOLES)}" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.22"/>`;
    if (upto > 0) g += `<path d="${line(gp, 0, upto)}" fill="none" stroke="${c}" stroke-width="2.25"/>`;
    gp.g.forEach((v, i) => { if (i && i <= upto) g += `<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="${c}" stroke="var(--paper)" stroke-width="1.5"><title>${gp.p} after hole ${i}: ${v ? v + " behind" : "leading"}</title></circle>`; });
    g += `</g>`;
  });
  // End labels, grouped when players finish level; faint until the race reaches the last hole
  const byGap = {};
  gaps.forEach(gp => (byGap[gp.g[HOLES]] = byGap[gp.g[HOLES]] || []).push(gp.p));
  let lastY = -Infinity;
  Object.keys(byGap).map(Number).sort((a, b) => a - b).forEach(v => {
    const ly = Math.max(y(v) + 4, lastY + 16); lastY = ly;
    const who = byGap[v].length === 1 ? ` data-player="${byGap[v][0]}"` : "";
    g += `<text${who} x="${x(HOLES) + 12}" y="${ly}" style="fill:var(--ink)"${upto < HOLES ? ' opacity="0.3"' : ""}>${byGap[v].join(", ")} ${v ? "+" + v : "wins"}</text>`;
  });
  el("replaychart").innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Strokes behind the leader after each hole, session ${s}">${g}</svg>`;
  applyFocus();
}

// Hole race: an animated leaderboard that plays a session back one hole at a time
const RACE_STEP_MS = 1300;
const reduceMotion = (() => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } })();
// Bars run on each session's worst final total, so the gaps stay readable on a phone
const race = { s: null, k: HOLES, order: [], timer: null, scale: 1 };
const shotColor = v => { const o = v - PAR; return o <= 0 ? "var(--heat-0)" : o <= 2 ? "var(--heat-1)" : o <= 4 ? "var(--heat-2)" : o <= 6 ? "var(--heat-3)" : "var(--heat-4)"; };

function setupRace(s, k) {
  stopRace();
  race.s = s;
  const sr = rows.filter(r => r.s === s);
  race.scale = Math.max(...sr.map(r => r.total));
  race.order = playerOrder.filter(p => sr.some(r => r.p === p));
  el("track").style.height = `calc(${sr.length} * var(--rowh))`;
  el("track").innerHTML = `<div class="track-axis" aria-hidden="true"><div class="par-line" id="parline"><span></span></div></div>` +
    race.order.map((p, i) => `<div class="lb-row" data-player="${p}" data-toggle style="--ring:${colorOf(p)};--i:${i};--f:0">
      <div class="lb-name"><span class="lb-rank"></span><b>${p}</b></div>
      <div class="lb-lane"><div class="lb-bar"></div><div class="lb-av">${avatarHTML(p)}</div><div class="lb-num"></div></div></div>`).join("");
  [...el("rtabs").children].forEach(b => b.setAttribute("aria-selected", String(+b.dataset.s === s)));
  raceStep(k);
}

function raceStep(k) {
  race.k = k;
  const s = race.s;
  const sr = rows.filter(r => r.s === s);
  const cum = sr.map(r => ({ p: r.p, v: r.h.slice(0, k).reduce((a, b) => a + b, 0), shot: r.h[k - 1] }));
  // Level players keep their previous order, so rows only move when the standings really change
  cum.sort((a, b) => a.v - b.v || race.order.indexOf(a.p) - race.order.indexOf(b.p));
  race.order = cum.map(c => c.p);
  const lead = cum[0].v;
  cum.forEach((c, i) => {
    const node = el("track").querySelector(`.lb-row[data-player="${c.p}"]`);
    const level = cum.filter(o => o.v === c.v).length > 1;
    node.style.setProperty("--i", i);
    node.style.setProperty("--f", c.v / race.scale);
    node.classList.toggle("lb-lead", k > 0 && c.v === lead);
    node.querySelector(".lb-rank").textContent = k ? (level ? "T" : "") + (cum.findIndex(o => o.v === c.v) + 1) : "";
    node.querySelector(".lb-num").innerHTML = k ? `<strong>${c.v}</strong> <span class="gap">${c.v === lead ? (level ? "level" : "leads") : "+" + (c.v - lead)}</span><span class="shot pop" style="background:${shotColor(c.shot)}" title="${c.p} took ${c.shot} on hole ${k}">${c.shot} on ${k}</span>` : "";
  });
  const pl = el("parline");
  pl.style.setProperty("--f", Math.min(1, PAR * k / race.scale));
  pl.querySelector("span").textContent = k ? `par ${PAR * k}` : "";
  pl.style.visibility = k ? "visible" : "hidden";

  const leaders = cum.filter(c => c.v === lead).map(c => c.p);
  el("stage").innerHTML = k === 0 ? `<small>Session ${s}</small>On the first tee`
    : k === HOLES ? `<small>Session ${s} · final</small>${leaders.join(" and ")} ${leaders.length > 1 ? "tie" : "wins"}`
    : `<small>Session ${s}</small>After hole ${k} of ${HOLES}`;
  const holeAvgNow = k ? sr.reduce((a, r) => a + r.h[k - 1], 0) / sr.length : 0;
  const margin = cum.length > 1 ? cum[1].v - lead : 0;
  el("racenote").textContent = k === 0 ? `${sr.length} players` : k === HOLES ? (margin ? `Won by ${margin}` : "Level at the top") : `Hole ${k} played at ${fmt(holeAvgNow)} on average`;
  el("rslider").value = k;
  el("rback").disabled = k === 0;
  el("rnext").disabled = k === HOLES;
  el("rplay").textContent = race.timer ? "Pause" : k === HOLES ? "Replay" : "Play";
  drawReplay(s, k);
}

function stopRace() {
  clearInterval(race.timer);
  race.timer = null;
  if (race.s !== null) el("rplay").textContent = race.k === HOLES ? "Replay" : "Play";
}
function playRace() {
  clearInterval(race.timer);
  if (race.k === HOLES) raceStep(0);
  race.timer = setInterval(() => {
    raceStep(race.k + 1);
    if (race.k >= HOLES) stopRace();
  }, RACE_STEP_MS);
  el("rplay").textContent = "Pause";
}
el("rplay").addEventListener("click", () => race.timer ? stopRace() : playRace());
el("rback").addEventListener("click", () => { stopRace(); raceStep(Math.max(0, race.k - 1)); });
el("rnext").addEventListener("click", () => { stopRace(); raceStep(Math.min(HOLES, race.k + 1)); });
el("rslider").addEventListener("input", e => { stopRace(); raceStep(+e.target.value); });
el("rtabs").innerHTML = sessions.map(s => `<button type="button" role="tab" data-s="${s}">Session ${s}</button>`).join("");
el("rtabs").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  if (reduceMotion) return setupRace(+b.dataset.s, HOLES);
  setupRace(+b.dataset.s, 0);
  playRace();
});
