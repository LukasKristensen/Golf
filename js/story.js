// Tooltip, hero spotlight, the scroll story and the every-hole dot chart.

// Shared hover tooltip for dot charts
const tip = el("tip");
function showTip(html, e) {
  tip.innerHTML = html; tip.hidden = false;
  const r = tip.getBoundingClientRect();
  tip.style.left = Math.min(innerWidth - r.width - 8, e.clientX + 14) + "px";
  tip.style.top = Math.max(8, e.clientY - r.height - 12) + "px";
}
const hideTip = () => (tip.hidden = true);

// Hero spotlight on the season leader, with a sparkline of their rounds
(function drawSpotlight() {
  const x = players[0];
  const w = 260, h = 46, lo = Math.min(...x.list.map(r => r.total)) - 3, hi = Math.max(...x.list.map(r => r.total)) + 3;
  const px = s => 6 + (s - 1) * (w - 12) / (sessions.length - 1), py = v => 6 + (v - lo) * (h - 12) / (hi - lo);
  const d = x.list.map((r, i) => (i ? "L" : "M") + px(r.s).toFixed(1) + " " + py(r.total).toFixed(1)).join(" ");
  const sp = el("spotlight");
  sp.style.setProperty("--ring", CARD_HEX[x.p]);
  sp.innerHTML = `${avatarHTML(x.p)}<span class="lbl">Season leader</span><span class="nm">${x.p}</span>
    <span class="ln">Averaging ${fmt(x.avg)}, ${x.wins} of ${x.rounds} sessions won, best ${x.best}</span>
    <svg viewBox="0 0 ${w} ${h}" aria-hidden="true"><path class="spot-line" d="${d}" fill="none" stroke="#fff" stroke-width="2.5"/>
    ${x.list.map(r => `<circle cx="${px(r.s)}" cy="${py(r.total)}" r="3" fill="#fff"/>`).join("")}</svg>`;
})();

// Story: every round as a dot, rearranged for each step
(function drawStory() {
  const W = 640, H = 420, m = { l: 96, r: 24, t: 34, b: 44 };
  const svg = el("storysvg");
  const lowest = [...rows].sort((a, b) => a.total - b.total);
  const latest = sessions[sessions.length - 1];
  // Current streak: sessions in a row won by the latest winner
  const champ = winners[latest][0];
  let streak = 0;
  for (let i = sessions.length - 1; i >= 0 && winners[sessions[i]].includes(champ); i--) streak++;
  const chase = regulars.slice(1, 4);
  const lead = regulars[0], gapToLead = chase[0].avg - lead.avg;
  const spread = chase[chase.length - 1].avg - chase[0].avg;

  const lin = (d0, d1, r0, r1) => v => r0 + (v - d0) * (r1 - r0) / (d1 - d0);
  const yMid = (m.t + H - m.b) / 2;
  // Stack equal values so dots never sit on top of each other
  const stack = (list, key) => {
    const seen = {};
    return list.map(r => { const k = key(r); const n = seen[k] = (seen[k] || 0) + 1; return (n % 2 ? 1 : -1) * Math.floor(n / 2); });
  };
  const xT = lin(26, 52, m.l, W - m.r);
  const rowY = p => m.t + 20 + players.findIndex(x => x.p === p) * ((H - m.t - m.b - 20) / (players.length - 1 || 1));
  const sorted = [...rows].sort((a, b) => a.total - b.total || playerOrder.indexOf(a.p) - playerOrder.indexOf(b.p));
  const stripOff = stack(sorted, r => r.total);
  const rowOff = stack(sorted, r => r.p + "|" + r.total);
  const xS = lin(0.5, sessions.length + 0.5, m.l, W - m.r), yS = lin(26, 52, m.t, H - m.b);
  const sessOff = stack(sorted, r => r.s + "|" + r.total);
  const zoom = lin(Math.floor(chase[0].avg - 6), Math.ceil(chase[chase.length - 1].avg + 6), m.l, W - m.r);

  const states = [
    { ax: "strip", pos: (r, i) => [xT(r.total), yMid + stripOff[i] * 17], op: () => 1 },
    { ax: "rows", pos: (r, i) => [xT(r.total), rowY(r.p) + rowOff[i] * 7], op: r => r.p === lead.p ? 1 : 0.55 },
    { ax: "sess", pos: (r, i) => [xS(r.s) + sessOff[i] * 15, yS(r.total)], op: r => winners[r.s].includes(r.p) ? 1 : 0.3, ring: r => winners[r.s].includes(r.p) && r.p === champ && r.s > latest - streak },
    { ax: "zoom", pos: (r, i) => [zoom(r.total), rowY(r.p) + rowOff[i] * 7], op: r => chase.some(c => c.p === r.p) ? 1 : 0.12 },
    { ax: "strip", pos: (r, i) => [xT(r.total), yMid + stripOff[i] * 17], op: r => r === lowest[0] || r === lowest[1] ? 1 : 0.2, ring: r => r === lowest[0] || r === lowest[1] },
  ];
  const steps = [
    ["25 rounds", `Every round of the season is a dot, placed by its total. The best is ${lowest[0].total}, the worst ${lowest[lowest.length - 1].total}, and the field averages ${fmt(fieldAvg)}.`],
    ["One player stands apart", `Sort the dots by player and ${lead.p} sits on their own, averaging ${fmt(lead.avg)}: ${fmt(gapToLead)} strokes better than anyone else who has played more than once.`],
    [`${streak > 1 ? `${streak} wins in a row` : "Session winners"}`, `By session, with the winners at full color. ${streak > 1 ? `${champ} has won the last ${streak} sessions, ringed here.` : `${champ} won the latest session.`}`],
    ["The race for second", `Zoom in on the chasers: ${chase.map(c => `${c.p} ${fmt(c.avg)}`).join(", ")}. Only ${fmt(spread)} strokes separate them, so one good round changes the order.`],
    ["The two lowest rounds", `${lowest[0].p} shot ${lowest[0].total} in session ${lowest[0].s}${players.find(x => x.p === lowest[0].p).rounds === 1 ? ", their only round" : ""}, and ${lowest[1].p} shot ${lowest[1].total} in session ${lowest[1].s}. The next best round is ${lowest[2].total}.`],
  ];
  el("steps").innerHTML = steps.map(([h, p], i) => `<div class="step" data-step="${i}"><div><span class="n">${i + 1} of ${steps.length}</span><h3>${h}</h3><p>${p}</p></div></div>`).join("");

  // Axes for each arrangement, faded in and out
  let ax = `<g class="ax" data-ax="strip">${[30, 35, 40, 45, 50].map(v => `<line x1="${xT(v)}" x2="${xT(v)}" y1="${m.t}" y2="${H - m.b}" stroke="var(--rule)"/><text x="${xT(v)}" y="${H - m.b + 18}" text-anchor="middle">${v}</text>`).join("")}<text x="${W - m.r}" y="${H - 8}" text-anchor="end">strokes per round, lower is better</text>
    <line x1="${xT(fieldAvg)}" x2="${xT(fieldAvg)}" y1="${m.t - 10}" y2="${H - m.b}" stroke="var(--ink)" stroke-dasharray="4 4"/><text x="${xT(fieldAvg) + 6}" y="${m.t - 2}" style="fill:var(--ink)">average ${fmt(fieldAvg)}</text></g>`;
  const rowLabels = (scale, ticks) => `${ticks.map(v => `<line x1="${scale(v)}" x2="${scale(v)}" y1="${m.t}" y2="${H - m.b}" stroke="var(--rule)"/><text x="${scale(v)}" y="${H - m.b + 18}" text-anchor="middle">${v}</text>`).join("")}
    ${players.map(x => `<g><clipPath id="sc-${x.p}"><circle cx="${m.l - 76}" cy="${rowY(x.p)}" r="12"/></clipPath>
      <image href="${AVATARS[x.p]}" x="${m.l - 76 - 21.6}" y="${rowY(x.p) - 12 - 7.7}" width="43.2" height="43.2" preserveAspectRatio="xMidYMin slice" clip-path="url(#sc-${x.p})"/>
      <text x="${m.l - 58}" y="${rowY(x.p) + 4}" class="sname">${x.p}</text>
      ${scale(x.avg) >= m.l && scale(x.avg) <= W - m.r ? `<line x1="${scale(x.avg)}" x2="${scale(x.avg)}" y1="${rowY(x.p) - 13}" y2="${rowY(x.p) + 13}" stroke="var(--ink)" stroke-width="2"/>` : ""}</g>`).join("")}
    <text x="${W - m.r}" y="${H - 8}" text-anchor="end">strokes per round · black tick is the player's average</text>`;
  ax += `<g class="ax" data-ax="rows">${rowLabels(xT, [30, 35, 40, 45, 50])}</g>`;
  ax += `<g class="ax" data-ax="zoom">${rowLabels(zoom, [...Array(20)].map((_, i) => Math.floor(chase[0].avg - 6) + i).filter(v => v % 2 === 0 && zoom(v) <= W - m.r))}</g>`;
  ax += `<g class="ax" data-ax="sess">${[30, 35, 40, 45, 50].map(v => `<line x1="${m.l}" x2="${W - m.r}" y1="${yS(v)}" y2="${yS(v)}" stroke="var(--rule)"/><text x="${m.l - 10}" y="${yS(v) + 4}" text-anchor="end">${v}</text>`).join("")}
    ${sessions.map(s => `<text x="${xS(s)}" y="${H - m.b + 18}" text-anchor="middle">S${s}</text>`).join("")}<text x="${m.l - 10}" y="${m.t - 12}" text-anchor="end">strokes</text></g>`;
  const dots = sorted.map((r, i) => `<g class="sdot" data-player="${r.p}" data-i="${i}" style="transition-delay:${(i * 18)}ms"><circle r="7.5" fill="${colorOf(r.p)}" stroke="var(--paper)" stroke-width="2"><title>${r.p}, session ${r.s}: ${r.total}</title></circle></g>`).join("");
  svg.innerHTML = ax + dots;

  function show(k) {
    const st = states[k];
    svg.querySelectorAll(".ax").forEach(a => a.classList.toggle("on", a.dataset.ax === st.ax));
    svg.querySelectorAll(".sdot").forEach(g => {
      const r = sorted[+g.dataset.i];
      const [x, y] = st.pos(r, +g.dataset.i);
      g.style.transform = `translate(${x}px, ${y}px)`;
      const c = g.firstElementChild;
      c.style.opacity = st.op(r);
      c.setAttribute("stroke", st.ring && st.ring(r) ? "var(--ink)" : "var(--paper)");
      c.setAttribute("stroke-width", st.ring && st.ring(r) ? 3 : 2);
    });
    el("steps").querySelectorAll(".step").forEach(s => s.classList.toggle("on", +s.dataset.step === k));
  }
  show(0);
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) show(+e.target.dataset.step); }), { rootMargin: "-45% 0px -45% 0px" });
    el("steps").querySelectorAll(".step").forEach(s => io.observe(s));
  }
})();

// Every hole ever played: a unit chart, one dot per hole score
(function drawDots() {
  const W = 960, H = 480, m = { l: 70, r: 12, t: 44, b: 38 };
  const colW = (W - m.l - m.r) / HOLES, values = [3, 4, 5, 6, 7, 8, 9];
  const rowH = (H - m.t - m.b) / values.length, step = 12.5, perLine = Math.floor((colW - 18) / step);
  const yOf = v => m.t + (v - 3) * rowH;
  let g = "";
  values.forEach(v => {
    g += `<line x1="${m.l}" x2="${W - m.r}" y1="${yOf(v)}" y2="${yOf(v)}" stroke="var(--rule)"/>`;
    g += `<text x="${m.l - 10}" y="${yOf(v) + rowH / 2 + 4}" text-anchor="end"${v === PAR || v === MAX_SCORE ? ' style="fill:var(--ink)"' : ""}>${v === PAR ? "3 par" : v === MAX_SCORE ? "9 max" : v}</text>`;
  });
  for (let i = 0; i < HOLES; i++) {
    const x0 = m.l + i * colW;
    if (i) g += `<line x1="${x0}" x2="${x0}" y1="${m.t}" y2="${H - m.b}" stroke="var(--rule)"/>`;
    g += `<text x="${x0 + colW / 2}" y="${m.t - 18}" text-anchor="middle" style="fill:var(--ink);font-size:14px">Hole ${i + 1}</text><text x="${x0 + colW / 2}" y="${m.t - 4}" text-anchor="middle">avg ${fmt(holeAvg[i])}</text>`;
    values.forEach(v => {
      const cell = rows.filter(r => r.h[i] === v).sort((a, b) => playerOrder.indexOf(a.p) - playerOrder.indexOf(b.p) || a.s - b.s);
      cell.forEach((r, j) => {
        const cx = x0 + 12 + (j % perLine) * step, cy = yOf(v) + rowH / 2 + (Math.floor(j / perLine) - (cell.length > perLine ? 0.5 : 0)) * step;
        const capped = r.raw[i] > v ? `, scored ${r.raw[i]} and capped` : "";
        g += `<g class="hdot" data-player="${r.p}" data-tip="${r.p} · session ${r.s} · hole ${i + 1}: <b>${v}</b> (${toPar(v - PAR)})${capped}"><circle class="hit" cx="${cx}" cy="${cy}" r="7.5"/><circle class="mark" cx="${cx}" cy="${cy}" r="5" fill="${colorOf(r.p)}"/></g>`;
      });
    });
  }
  el("dotchart").innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Every hole score as a dot, by hole and number of strokes">${g}</svg>`;
  el("dotlegend").innerHTML = playerOrder.map(p => `<span data-player="${p}"><span class="swatch" style="background:${colorOf(p)}"></span>${p}</span>`).join("");
  const svg = el("dotchart").firstElementChild;
  svg.addEventListener("pointermove", e => { const d = e.target.closest(".hdot"); d ? showTip(d.dataset.tip, e) : hideTip(); });
  svg.addEventListener("pointerleave", hideTip);
})();
