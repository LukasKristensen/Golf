// Away rounds on other courses. They stay out of the Golfparken stats above (different holes, different
// length), so this file only draws their own scorecard. Every hole is played as a par 3.

(function away() {
  const csv = window.OLAND_CSV;
  if (!csv) { el("oland").hidden = true; document.querySelector('.toc a[href="#oland"]')?.remove(); return; }
  const AWAY_HOLES = 9, AWAY_PAR = PAR * AWAY_HOLES;
  const recs = csv.trim().split(/\r?\n/).slice(1).map(l => {
    const c = l.split(",");
    // A blank cell is a hole with no score on the card
    return { date: c[0], course: c[1], p: c[2], metric: c[3], h: c.slice(4, 4 + AWAY_HOLES).map(v => v === "" ? null : +v), total: +c[4 + AWAY_HOLES] };
  });
  const strokes = recs.filter(r => r.metric === "Strokes");
  const of = (metric, p) => recs.find(r => r.metric === metric && r.p === p);
  const complete = r => r.h.every(v => v !== null);
  const played = r => r.h.filter(v => v !== null).length;
  // Finished rounds first, lowest total first
  strokes.sort((a, b) => (complete(b) - complete(a)) || a.total - b.total);
  const best = Math.min(...strokes.filter(complete).map(r => r.total));
  const avg = Array.from({ length: AWAY_HOLES }, (_, i) => {
    const v = strokes.map(r => r.h[i]).filter(x => x !== null);
    return v.reduce((a, b) => a + b, 0) / v.length;
  });

  const head = `<thead><tr><th>Player</th>${avg.map((_, i) => `<th class="h">${i + 1}</th>`).join("")}<th>Total</th><th>To par</th><th>Putts</th><th>GIR</th></tr></thead>`;
  const parRow = `<tr class="par"><td>Par</td>${avg.map(() => `<td class="h">${PAR}</td>`).join("")}<td>${AWAY_PAR}</td><td></td><td></td><td></td></tr>`;
  const body = strokes.map(r => {
    const pt = of("Putts", r.p), gir = of("GIR", r.p), n = played(r);
    const cells = r.h.map((v, i) => v === null
      ? `<td class="h muted" title="No score on hole ${i + 1}">-</td>`
      : `<td class="h" style="background:${heat(v)}">${v}${pt && pt.h[i] !== null ? `<small>${pt.h[i]}</small>` : ""}${gir && gir.h[i] ? `<i class="gir-mark" title="Green in regulation"></i>` : ""}</td>`).join("");
    const par = toPar(r.total - PAR * n) + (n < AWAY_HOLES ? ` <small class="muted">thru ${n}</small>` : "");
    return `<tr data-player="${r.p}"><td><span class="swatch" style="background:${colorOf(r.p)}"></span>${r.p}</td>${cells}
      <td class="${complete(r) && r.total === best ? "win" : ""}"><strong>${r.total}</strong>${complete(r) ? "" : "*"}</td><td>${par}</td><td>${pt ? pt.total : "-"}</td><td>${gir ? gir.total : "-"}</td></tr>`;
  }).join("");
  const avgRow = `<tr><td class="muted">Hole avg</td>${avg.map(a => `<td class="h muted">${fmt(a)}</td>`).join("")}<td></td><td></td><td></td><td></td></tr>`;
  el("olandcard").innerHTML = head + `<tbody>${parRow}${body}${avgRow}</tbody>`;

  el("olandkey").innerHTML = [["par", 0], ["+1 to +2", 1], ["+3 to +4", 2], ["+5 to +6 (max)", 3]]
    .map(([t, i]) => `<span><i style="background:var(--heat-${i})"></i>${t}</span>`).join("")
    + `<span>Small figure under a score: putts on that hole</span><span><i class="gir-key"></i>Green in regulation</span>`
    + (strokes.some(r => !complete(r)) ? `<span>* No score on every hole, so not ranked</span>` : "");
  const d = new Date(strokes[0].date + "T12:00:00");
  el("olanddate").textContent = d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  applyFocus();
})();
