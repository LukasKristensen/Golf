// The static charts and tables: stats, leaderboard, head to head, trend, holes, putting, season race, heatmap, stroke index, score mix and scorecards.

// Meta + stats
const allTotals = rows.map(r => r.total);
const fieldAvg = allTotals.reduce((a, b) => a + b, 0) / rows.length;
const bestRow = rows.reduce((a, b) => (b.total < a.total ? b : a));
const holeAvg = Array.from({ length: HOLES }, (_, i) => rows.reduce((a, r) => a + r.h[i], 0) / rows.length);
const hardest = holeAvg.indexOf(Math.max(...holeAvg));
const bad = [...rows.map(r => ({ h: r.raw, total: r.rawTotal })), ...puttRows].filter(r => r.h.reduce((a, b) => a + b, 0) !== r.total);
el("check").textContent = bad.length ? `${bad.length} rows have hole scores that do not add up to their Total.` : "Hole scores add up to each row's Total in every round.";

el("meta").innerHTML = [
  `${rows[0].course}`, `${sessions.length} sessions`, `${rows.length} rounds`,
  `${playerOrder.length} players`, `${HOLES} holes, par ${COURSE_PAR}`,
].map(t => `<span>${t}</span>`).join("");

el("stats").innerHTML = [
  { v: fmt(fieldAvg), l: "Field average", s: `${toPar(+fmt(fieldAvg - COURSE_PAR))} to par` },
  { v: bestRow.total, l: "Best round", s: `${bestRow.p}, session ${bestRow.s}` },
  { v: `#${hardest + 1}`, l: "Hardest hole", s: `${fmt(holeAvg[hardest])} strokes on average` },
  { v: fmt(players[0].avg), l: "Season leader", s: `${players[0].p}, ${players[0].wins} of ${players[0].rounds} sessions won` },
].map(x => `<div class="stat"><span class="l">${x.l}</span><span class="v num">${x.v}</span><span class="s">${x.s}</span></div>`).join("");

// Sparkline
// Join a player's rounds: solid between back-to-back sessions, dashed across sessions they missed
function joinRounds(list, x, y) {
  let solid = "", dashed = "";
  for (let i = 1; i < list.length; i++) {
    const a = list[i - 1], b = list[i];
    const seg = `M${x(a.s).toFixed(1)} ${y(a.total).toFixed(1)} L${x(b.s).toFixed(1)} ${y(b.total).toFixed(1)} `;
    if (b.s === a.s + 1) solid += seg; else dashed += seg;
  }
  return { solid, dashed };
}

function spark(list) {
  const w = 120, h = 28, lo = 25, hi = 55;
  const x = s => 6 + (s - 1) * (w - 12) / (sessions.length - 1);
  const y = v => 4 + (v - lo) * (h - 8) / (hi - lo);
  const pts = list.map(r => [x(r.s), y(r.total)]);
  const { solid, dashed } = joinRounds(list, x, y);
  const last = pts[pts.length - 1];
  return `<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">
    <line x1="0" x2="${w}" y1="${y(fieldAvg)}" y2="${y(fieldAvg)}" stroke="var(--rule)" stroke-dasharray="2 3"/>
    ${solid ? `<path d="${solid}" fill="none" stroke="var(--muted)" stroke-width="1.5"/>` : ""}
    ${dashed ? `<path d="${dashed}" fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="3 3"/>` : ""}
    ${pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="2" fill="var(--muted)"/>`).join("")}
    <circle cx="${last[0]}" cy="${last[1]}" r="3.2" fill="var(--accent)"/></svg>`;
}

el("board").innerHTML = `<thead><tr><th>Player</th><th>Rounds</th><th>Average</th><th>To par</th><th>Best</th><th>Worst</th><th>Wins</th><th style="text-align:left">Trend</th></tr></thead>
<tbody>${players.map(x => `<tr data-player="${x.p}" data-toggle>
  <td><span class="swatch" style="background:${colorOf(x.p)}"></span>${x.p}${x.rounds === 1 ? ' <span class="pill">1 round</span>' : ""}</td>
  <td>${x.rounds}</td><td>${fmt(x.avg)}</td><td>${toPar(+fmt(x.avg - COURSE_PAR))}</td>
  <td>${x.best}</td><td>${x.worst}</td><td>${x.wins}</td><td style="text-align:left">${spark(x.list)}</td></tr>`).join("")}</tbody>`;

// Head to head
(function drawH2H() {
  const ps = players.filter(x => x.rounds > 1).map(x => x.p);
  const cell = (a, b) => {
    if (a === b) return `<td class="muted" data-hl="${b}">-</td>`;
    let w = 0, l = 0, t = 0;
    sessions.forEach(s => {
      const A = rows.find(r => r.s === s && r.p === a), B = rows.find(r => r.s === s && r.p === b);
      if (A && B) A.total < B.total ? w++ : A.total > B.total ? l++ : t++;
    });
    if (!w && !l && !t) return `<td class="muted" data-hl="${b}">no games</td>`;
    const cls = w > l ? "win" : w < l ? "loss" : "";
    return `<td class="${cls}" data-hl="${b}">${w}-${l}${t ? `-${t}` : ""}</td>`;
  };
  el("h2h").innerHTML = `<thead><tr><th></th>${ps.map(p => `<th data-hl="${p}">${p}</th>`).join("")}</tr></thead>
  <tbody>${ps.map(a => `<tr data-hl="${a}"><td><span class="swatch" style="background:${colorOf(a)}"></span>${a}</td>${ps.map(b => cell(a, b)).join("")}</tr>`).join("")}</tbody>`;
})();

// Trend chart
const hidden = new Set();
function drawTrend() {
  const W = 960, H = 340, m = { l: 48, r: 44, t: 16, b: 36 };
  const lo = 25, hi = 55;
  const x = s => m.l + (s - 1) * (W - m.l - m.r) / (sessions.length - 1);
  const y = v => m.t + (v - lo) * (H - m.t - m.b) / (hi - lo);
  let g = "";
  for (let v = lo; v <= hi; v += 5) {
    g += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--rule)"/>`;
    g += `<text x="${m.l - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
  }
  sessions.forEach(s => g += `<text x="${x(s)}" y="${H - 12}" text-anchor="middle">Session ${s}</text>`);
  g += `<text x="${m.l + 4}" y="${m.t - 4}" text-anchor="start">strokes, lower is better</text>`;
  playerOrder.filter(p => !hidden.has(p)).forEach(p => {
    const pr = rows.filter(r => r.p === p).sort((a, b) => a.s - b.s);
    const c = colorOf(p);
    const { solid, dashed } = joinRounds(pr, x, y);
    g += `<g data-player="${p}">`;
    if (solid) g += `<path d="${solid}" fill="none" stroke="${c}" stroke-width="2.25"/>`;
    if (dashed) g += `<path d="${dashed}" fill="none" stroke="${c}" stroke-width="2" stroke-dasharray="5 5" opacity="0.8"/>`;
    pr.forEach(r => g += `<circle cx="${x(r.s)}" cy="${y(r.total)}" r="4.5" fill="${c}" stroke="var(--paper)" stroke-width="1.5"><title>${p}, session ${r.s}: ${r.total}</title></circle>`);
    g += `</g>`;
  });
  el("trendchart").innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Total strokes per player by session">${g}</svg>`;
  applyFocus();
}
el("legend").innerHTML = playerOrder.map(p => `<button type="button" aria-pressed="true" data-p="${p}"><span class="swatch" style="background:${colorOf(p)}"></span>${p}</button>`).join("");
el("legend").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  const p = b.dataset.p;
  hidden.has(p) ? hidden.delete(p) : hidden.add(p);
  b.setAttribute("aria-pressed", String(!hidden.has(p)));
  drawTrend();
});
drawTrend();

// Hole chart
(function drawHoles() {
  const W = 960, H = 260, m = { l: 44, r: 20, t: 20, b: 34 };
  const max = 10;
  const bw = (W - m.l - m.r) / HOLES;
  const y = v => H - m.b - v * (H - m.t - m.b) / max;
  let g = "";
  for (let v = 0; v <= max; v += 2) {
    g += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--rule)"/>`;
    g += `<text x="${m.l - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
  }
  holeAvg.forEach((a, i) => {
    const x0 = m.l + i * bw + bw * 0.22, w = bw * 0.56;
    const fill = i === hardest ? "var(--flag)" : "var(--accent)";
    g += `<rect x="${x0}" y="${y(a)}" width="${w}" height="${y(0) - y(a)}" fill="${fill}" rx="2"/>`;
    g += `<text x="${x0 + w / 2}" y="${y(a) - 6}" text-anchor="middle" style="fill:var(--ink)">${fmt(a)}</text>`;
    g += `<text x="${x0 + w / 2}" y="${H - 12}" text-anchor="middle">Hole ${i + 1} · SI ${STROKE_INDEX[i]}</text>`;
  });
  g += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(PAR)}" y2="${y(PAR)}" stroke="var(--ink)" stroke-dasharray="5 4" stroke-width="1.5"/>`;
  g += `<text x="${W - m.r}" y="${y(PAR) - 6}" text-anchor="end" style="fill:var(--ink)">par 3</text>`;
  el("holechart").innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Average strokes per hole">${g}</svg>`;
})();

// Putting
(function drawPutting() {
  const withStrokes = puttRows.map(pr => ({ ...pr, strokes: rows.find(r => r.s === pr.s && r.p === pr.p) }));
  const stats = playerOrder.map(p => {
    const list = withStrokes.filter(r => r.p === p);
    if (!list.length) return null;
    const holes = list.flatMap(r => r.h);
    const putts = list.reduce((a, r) => a + r.total, 0);
    const strokes = list.reduce((a, r) => a + r.strokes.total, 0);
    return {
      p, rounds: list.length, avg: putts / list.length, best: Math.min(...list.map(r => r.total)),
      one: holes.filter(x => x <= 1).length, two: holes.filter(x => x === 2).length, three: holes.filter(x => x >= 3).length,
      share: putts / strokes, toGreen: (strokes - putts) / list.length,
    };
  }).filter(Boolean).sort((a, b) => a.avg - b.avg);
  el("putttable").innerHTML = `<thead><tr><th>Player</th><th>Rounds</th><th>Avg putts</th><th>Fewest</th><th>1-putts</th><th>2-putts</th><th>3+ putts</th><th>Share of strokes</th><th>Strokes to green</th></tr></thead>
  <tbody>${stats.map(x => `<tr data-player="${x.p}"><td><span class="swatch" style="background:${colorOf(x.p)}"></span>${x.p}</td>
    <td>${x.rounds}</td><td>${fmt(x.avg)}</td><td>${x.best}</td><td>${x.one}</td><td>${x.two}</td><td>${x.three}</td>
    <td>${Math.round(x.share * 100)}%</td><td>${fmt(x.toGreen)}</td></tr>`).join("")}</tbody>`;

  const max = Math.max(...withStrokes.map(r => r.strokes.total));
  let html = "";
  PUTT_SESSIONS.forEach((s, i) => {
    if (i) html += `<div class="bar-gap"></div>`;
    withStrokes.filter(r => r.s === s).sort((a, b) => a.strokes.total - b.strokes.total).forEach(r => {
      const g = r.strokes.total - r.total;
      html += `<div class="bar-row" data-player="${r.p}"><span class="who"><span class="swatch" style="background:${colorOf(r.p)}"></span>${r.p} <small>S${s}</small></span>
        <div class="bar" title="${r.p}, session ${s}: ${g} to green + ${r.total} putts = ${r.strokes.total}">
          <span class="g" style="width:${g / max * 100}%">${g}</span><span class="pt" style="width:${r.total / max * 100}%">${r.total}</span></div></div>`;
    });
  });
  el("puttbars").innerHTML = html;
})();

// Shared helpers for the extra displays
const regulars = players.filter(x => x.rounds > 1);
const sessionAvg = {};
sessions.forEach(s => { const sr = rows.filter(r => r.s === s); sessionAvg[s] = sr.reduce((a, r) => a + r.total, 0) / sr.length; });
const playerHoleAvg = p => {
  const pr = rows.filter(r => r.p === p);
  return Array.from({ length: HOLES }, (_, i) => pr.reduce((a, r) => a + r.h[i], 0) / pr.length);
};
const signed = n => (n > 0 ? "+" : n < 0 ? "−" : "") + fmt(Math.abs(n));

// Season race: cumulative strokes gained against each session's average
(function drawRace() {
  // From a player's first round on, a missed session adds nothing, so the line stays flat (dashed) until they play again
  const series = regulars.map(x => {
    let cum = 0;
    const pts = sessions.filter(s => s >= x.list[0].s).map(s => {
      const r = x.list.find(r => r.s === s);
      if (r) cum += sessionAvg[s] - r.total;
      return { s, total: cum, missed: !r };
    });
    return { p: x.p, pts };
  });
  const vals = series.flatMap(sr => sr.pts.map(p => p.total)).concat(0);
  const lo = Math.floor(Math.min(...vals) / 10) * 10, hi = Math.ceil(Math.max(...vals) / 10) * 10;
  const W = 960, H = 340, m = { l: 48, r: 44, t: 16, b: 36 };
  const x = s => m.l + (s - 1) * (W - m.l - m.r) / (sessions.length - 1);
  const y = v => m.t + (hi - v) * (H - m.t - m.b) / (hi - lo);
  let g = "";
  for (let v = lo; v <= hi; v += 10) {
    g += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="${v === 0 ? "var(--ink)" : "var(--rule)"}"${v === 0 ? ' stroke-dasharray="5 4"' : ""}/>`;
    g += `<text x="${m.l - 8}" y="${y(v) + 4}" text-anchor="end">${v > 0 ? "+" + v : v}</text>`;
  }
  sessions.forEach(s => g += `<text x="${x(s)}" y="${H - 12}" text-anchor="middle">Session ${s}</text>`);
  series.forEach(sr => {
    const c = colorOf(sr.p);
    let solid = "", dashed = "";
    for (let i = 1; i < sr.pts.length; i++) {
      const a = sr.pts[i - 1], b = sr.pts[i];
      const seg = `M${x(a.s)} ${y(a.total)} L${x(b.s)} ${y(b.total)} `;
      if (b.missed) dashed += seg; else solid += seg;
    }
    g += `<g data-player="${sr.p}">`;
    if (solid) g += `<path d="${solid}" fill="none" stroke="${c}" stroke-width="2.25"/>`;
    if (dashed) g += `<path d="${dashed}" fill="none" stroke="${c}" stroke-width="2" stroke-dasharray="5 5" opacity="0.8"/>`;
    sr.pts.filter(pt => !pt.missed).forEach(pt => g += `<circle cx="${x(pt.s)}" cy="${y(pt.total)}" r="4" fill="${c}" stroke="var(--paper)" stroke-width="1.5"><title>${sr.p} after session ${pt.s}: ${signed(pt.total)}</title></circle>`);
    g += `</g>`;
  });
  el("racechart").innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Cumulative strokes gained on the field by session">${g}</svg>`;
  el("racelegend").innerHTML = series.map(sr => {
    const last = sr.pts[sr.pts.length - 1].total;
    return `<span data-player="${sr.p}"><span class="swatch" style="background:${colorOf(sr.p)}"></span>${sr.p} <span class="num muted">${signed(last)}</span></span>`;
  }).join("");
})();

// Player-by-hole heatmap
(function drawHeatmap() {
  const shade = a => a <= 4.5 ? "var(--heat-0)" : a <= 6 ? "var(--heat-1)" : a <= 7.25 ? "var(--heat-2)" : a <= 8.25 ? "var(--heat-3)" : "var(--heat-4)";
  const row = (label, avgs, mark) => {
    const best = Math.min(...avgs), worst = Math.max(...avgs);
    return avgs.map(a => {
      const cls = mark ? (a === best ? " best" : a === worst ? " worst" : "") : "";
      return `<td class="hm${cls}" style="background:${shade(a)}">${fmt(a)}</td>`;
    }).join("");
  };
  el("heatmap").innerHTML = `<thead><tr><th>Player</th>${STROKE_INDEX.map((si, i) => `<th class="h">${i + 1}<br><span style="text-transform:none">SI ${si}</span></th>`).join("")}<th>Rounds</th></tr></thead>
  <tbody>${players.map(x => `<tr data-player="${x.p}"><td><span class="swatch" style="background:${colorOf(x.p)}"></span>${x.p}</td>${row(x.p, playerHoleAvg(x.p), x.rounds > 1)}<td>${x.rounds}</td></tr>`).join("")}
  <tr class="group"><td>Group</td>${row("Group", holeAvg, true)}<td>${rows.length}</td></tr></tbody>`;
})();

// Club stroke index against the group's own ranking
(function drawSlope() {
  const holes = Array.from({ length: HOLES }, (_, i) => i);
  const club = [...holes].sort((a, b) => STROKE_INDEX[a] - STROKE_INDEX[b]);
  const group = [...holes].sort((a, b) => holeAvg[b] - holeAvg[a]);
  const W = 720, H = 320, lx = 230, rx = 490, top = 56, step = 44;
  let g = `<text x="${lx}" y="24" text-anchor="middle" style="fill:var(--ink)">Club stroke index</text>
    <text x="${rx}" y="24" text-anchor="middle" style="fill:var(--ink)">Your group's average</text>`;
  holes.forEach(h => {
    const cr = club.indexOf(h), gr = group.indexOf(h);
    const col = gr < cr ? "var(--flag)" : gr > cr ? "var(--accent)" : "var(--muted)";
    const y1 = top + cr * step, y2 = top + gr * step;
    g += `<line x1="${lx}" y1="${y1}" x2="${rx}" y2="${y2}" stroke="${col}" stroke-width="${Math.abs(gr - cr) >= 2 ? 3 : 1.75}"/>`;
    g += `<circle cx="${lx}" cy="${y1}" r="5" fill="${col}"/><circle cx="${rx}" cy="${y2}" r="5" fill="${col}"/>`;
    g += `<text x="${lx - 14}" y="${y1 + 4}" text-anchor="end" style="fill:var(--ink)">Hole ${h + 1}  ·  SI ${STROKE_INDEX[h]}</text>`;
    g += `<text x="${rx + 14}" y="${y2 + 4}" text-anchor="start" style="fill:var(--ink)">Hole ${h + 1}  ·  ${fmt(holeAvg[h])}</text>`;
  });
  g += `<text x="${(lx + rx) / 2}" y="${top - 18}" text-anchor="middle">hardest ↑</text>`;
  g += `<text x="${(lx + rx) / 2}" y="${top + 5 * step + 30}" text-anchor="middle">easiest ↓</text>`;
  el("slope").innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;display:block;margin:0 auto" role="img" aria-label="Club stroke index ranking compared with the group's ranking">${g}</svg>`;
})();

// Score mix per player
(function drawDist() {
  const values = [3, 4, 5, 6, 7, 8, 9];
  const label = v => v === PAR ? "3 (par)" : v === MAX_SCORE ? "9 (max)" : String(v);
  el("distlegend").innerHTML = values.map(v => `<span><span class="swatch" style="background:var(--d${v});border-radius:2px"></span>${label(v)}</span>`).join("");
  el("dist").innerHTML = players.map(x => {
    const holes = rows.filter(r => r.p === x.p).flatMap(r => r.h);
    const n = holes.length;
    const segs = values.map(v => {
      const c = holes.filter(h => h === v).length;
      return c ? `<span style="width:${c / n * 100}%;background:var(--d${v})" title="${x.p}: ${c} of ${n} holes in ${v}"></span>` : "";
    }).join("");
    const nines = holes.filter(h => h === MAX_SCORE).length;
    return `<div class="dist-row" data-player="${x.p}"><span class="who"><span class="swatch" style="background:${colorOf(x.p)}"></span>${x.p} <small>${n} holes</small></span>
      <div class="bar">${segs}</div><span class="tail">${Math.round(nines / n * 100)}% at 9</span></div>`;
  }).join("");
})();

// Scorecards
const heat = v => {
  const over = v - PAR;
  return over <= 0 ? "var(--heat-0)" : over <= 2 ? "var(--heat-1)" : over <= 4 ? "var(--heat-2)" : over <= 6 ? "var(--heat-3)" : "var(--heat-4)";
};
el("key").innerHTML = [["par", 0], ["+1 to +2", 1], ["+3 to +4", 2], ["+5 to +6 (max)", 3]]
  .map(([t, i]) => `<span><i style="background:var(--heat-${i})"></i>${t}</span>`).join("")
  + `<span id="puttnote" hidden>Small figure under a score: putts on that hole</span>`
  + `<span id="capnote" hidden>* Scored higher, capped at ${MAX_SCORE}</span>`;

function showSession(s) {
  const sr = rows.filter(r => r.s === s).sort((a, b) => a.total - b.total);
  const avg = holeAvg.map((_, i) => sr.reduce((a, r) => a + r.h[i], 0) / sr.length);
  const hasPutts = PUTT_SESSIONS.includes(s);
  el("card").innerHTML = `<thead><tr><th>Player</th>${Array.from({ length: HOLES }, (_, i) => `<th class="h">${i + 1}</th>`).join("")}<th>Total</th><th>To par</th>${hasPutts ? "<th>Putts</th>" : ""}</tr></thead>
  <tbody><tr><td class="muted">Stroke index</td>${STROKE_INDEX.map(v => `<td class="h muted">${v}</td>`).join("")}<td></td><td></td>${hasPutts ? "<td></td>" : ""}</tr>
  <tr class="par"><td>Par</td>${Array(HOLES).fill(`<td class="h">${PAR}</td>`).join("")}<td>${COURSE_PAR}</td><td></td>${hasPutts ? "<td></td>" : ""}</tr>
  ${sr.map(r => { const pt = puttsOf(s, r.p); return `<tr data-player="${r.p}"><td><span class="swatch" style="background:${colorOf(r.p)}"></span>${r.p}</td>
    ${r.h.map((v, i) => `<td class="h" style="background:${heat(v)}"${r.raw[i] > v ? ` title="Scored ${r.raw[i]}, capped at ${MAX_SCORE}"` : ""}>${v}${r.raw[i] > v ? "*" : ""}${pt ? `<small>${pt.h[i]}</small>` : ""}</td>`).join("")}
    <td class="${winners[s].includes(r.p) ? "win" : ""}"><strong>${r.total}</strong></td><td>${toPar(r.total - COURSE_PAR)}</td>${hasPutts ? `<td>${pt ? pt.total : "-"}</td>` : ""}</tr>`; }).join("")}
  <tr><td class="muted">Session avg</td>${avg.map(a => `<td class="h muted">${fmt(a)}</td>`).join("")}<td class="muted">${fmt(sr.reduce((a, r) => a + r.total, 0) / sr.length)}</td><td></td>${hasPutts ? "<td></td>" : ""}</tr></tbody>`;
  el("puttnote").hidden = !hasPutts;
  el("capnote").hidden = !sr.some(r => r.raw.some((v, i) => v > r.h[i]));
  [...el("tabs").children].forEach(b => b.setAttribute("aria-selected", String(+b.dataset.s === s)));
  try { localStorage.setItem("golf-session", s); } catch (e) {}
  applyFocus();
}
el("tabs").innerHTML = sessions.map(s => `<button type="button" role="tab" id="tab-${s}" data-s="${s}">Session ${s}</button>`).join("");
el("tabs").addEventListener("click", e => { const b = e.target.closest("button"); if (b) showSession(+b.dataset.s); });
let start = sessions[sessions.length - 1];
try { const v = +localStorage.getItem("golf-session"); if (sessions.includes(v)) start = v; } catch (e) {}
showSession(start);
