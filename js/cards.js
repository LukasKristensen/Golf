// Player cards: ratings, the flip and tilt, and saving a card as a PNG.

// Player cards: a trading card on the front, the stat sheet on the back
// Card colors are fixed (the light-mode player hues) so the cards and the saved PNGs look the same in either theme
const CARD_HEX = { Lukas: "#1d7a48", Laurits: "#3b6fb6", Mikkel: "#c27a12", Daniel: "#9b4aa8", Oskar: "#b8432f", Tobias: "#00899f" };
// Each rating maps a real stat onto 40-99, linearly between a "great" and a "poor" value for this group
const MIN_ROUNDS = 3;
const rate = (v, great, poor) => Math.round(Math.max(40, Math.min(99, 99 - (v - great) / (poor - great) * 59)));
const ATTRS = [
  { k: "SCO", name: "Scoring", arch: "Shot-maker", how: "average total (30 rates 99, 52 rates 40)" },
  { k: "CON", name: "Consistency", arch: "Steady hand", how: "spread of round totals (needs three rounds)" },
  { k: "PUT", name: "Putting", arch: "Putter", how: "putts per hole in counted rounds (1.8 to 2.8)" },
  { k: "FIN", name: "Finishing", arch: "Closer", how: "strokes on holes 4 to 6 per round (12 to 27)" },
  { k: "SAF", name: "Safety", arch: "Damage control", how: "share of holes that end on the maximum 9 (0% to 60%)" },
  { k: "H2H", name: "Head to head", arch: "The one to beat", how: "share of opponents beaten in the same session (100% to 0%)" },
];
const cardData = players.map(x => {
  const totals = x.list.map(r => r.total);
  const sd = Math.sqrt(totals.reduce((a, t) => a + (t - x.avg) ** 2, 0) / totals.length);
  const putts = puttRows.filter(r => r.p === x.p);
  const holes = x.list.flatMap(r => r.h);
  let w = 0, l = 0, t = 0;
  x.list.forEach(r => rows.filter(o => o.s === r.s && o.p !== x.p).forEach(o => (r.total < o.total ? w++ : r.total > o.total ? l++ : t++)));
  const v = {
    SCO: rate(x.avg, 30, 52),
    CON: x.rounds >= MIN_ROUNDS ? rate(sd, 0, 7) : null,
    PUT: putts.length ? rate(putts.reduce((a, r) => a + r.total, 0) / (putts.length * HOLES), 1.8, 2.8) : null,
    FIN: rate(x.list.reduce((a, r) => a + r.h[3] + r.h[4] + r.h[5], 0) / x.rounds, 12, 27),
    SAF: rate(holes.filter(h => h === MAX_SCORE).length / holes.length, 0, 0.6),
    H2H: rate((w + t / 2) / (w + l + t), 1, 0),
  };
  // Overall weights scoring double, then averages whatever could be rated
  const have = ATTRS.filter(a => v[a.k] !== null);
  // Fewer than three rounds is too little to rank, so those cards are marked provisional with no overall
  const ovr = x.rounds >= MIN_ROUNDS ? Math.round((v.SCO * 2 + have.reduce((a, b) => a + v[b.k], 0)) / (have.length + 2)) : null;
  const best = have.filter(a => a.k !== "SCO").sort((a, b) => v[b.k] - v[a.k])[0];
  return { x, v, ovr, arch: best && v[best.k] > v.SCO ? best.arch : "Shot-maker", rec: `${w}-${l}${t ? "-" + t : ""}` };
});
el("ratingnote").textContent = `Ratings run from 40 to 99 and come straight from the scores: ${ATTRS.map(a => `${a.k} is ${a.how}`).join("; ")}. Overall counts scoring twice and needs at least ${MIN_ROUNDS} rounds; with fewer the card is provisional. A dash means there is not enough data yet. Hover to tilt, flip for the full stat sheet, or save a card as an image.`;

el("profilecards").innerHTML = cardData.map(({ x, v, ovr, arch, rec }) => {
  const ha = playerHoleAvg(x.p);
  const bestH = ha.indexOf(Math.min(...ha)), worstH = ha.indexOf(Math.max(...ha));
  const bestRound = x.list.reduce((a, r) => (r.total < a.total ? r : a));
  const putts = puttRows.filter(r => r.p === x.p);
  const holes = x.list.flatMap(r => r.h);
  const gained = x.list.reduce((a, r) => a + sessionAvg[r.s] - r.total, 0) / x.rounds;
  const items = [
    ["Rounds", `${x.rounds}${x.wins ? `, ${x.wins} won` : ""}`],
    ["Best round", `${bestRound.total} (session ${bestRound.s})`],
    ["Vs the field", `${signed(gained)} per round`],
    ["Record vs others", rec],
    ["Best hole", `Hole ${bestH + 1} (${fmt(ha[bestH])})`],
    ["Worst hole", `Hole ${worstH + 1} (${fmt(ha[worstH])})`],
    ["Holes at 9", `${holes.filter(h => h === MAX_SCORE).length} of ${holes.length}`],
    ["Avg putts", putts.length ? `${fmt(putts.reduce((a, r) => a + r.total, 0) / putts.length)} over ${putts.length}` : "not counted"],
  ];
  return `<div class="twrap" data-player="${x.p}">
    <div class="tcard" style="--c:${CARD_HEX[x.p]};--ring:${colorOf(x.p)}">
      <div class="tface tfront" role="img" aria-label="${x.p}: overall ${ovr ?? "provisional"}, ${ATTRS.map(a => `${a.name} ${v[a.k] ?? "not rated"}`).join(", ")}">
        <div class="ttop"><div class="tovr">${ovr === null ? `<b style="font-size:1.6rem;padding-top:8px">NEW</b><span>${x.rounds} round${x.rounds === 1 ? "" : "s"}</span>` : `<b>${ovr}</b><span>OVR</span>`}</div><div class="tarch">${arch}</div></div>
        ${avatarHTML(x.p)}
        <div class="tname">${x.p}</div>
        <div class="tattrs">${ATTRS.map(a => `<div title="${a.name}: ${a.how}"><b>${v[a.k] ?? "-"}</b><span>${a.k}</span></div>`).join("")}</div>
        <div class="tfoot">Golfparken Aalborg · ${x.rounds} round${x.rounds === 1 ? "" : "s"} · avg ${fmt(x.avg)}</div>
      </div>
      <div class="tface tback">
        <h3>${x.p} <span class="num muted">${fmt(x.avg)}</span></h3>
        ${spark(x.list)}
        <dl>${items.map(([k, val]) => `<dt>${k}</dt><dd>${val}</dd>`).join("")}</dl>
      </div>
    </div>
    <div class="tactions">
      <button type="button" data-act="flip" aria-pressed="false">Flip</button>
      <button type="button" data-act="save">Save card</button>
      <button type="button" data-act="follow" aria-pressed="false">Follow</button>
    </div>
  </div>`;
}).join("");

el("profilecards").addEventListener("click", e => {
  const b = e.target.closest("button[data-act]"); if (!b) return;
  const wrap = b.closest(".twrap"), p = wrap.dataset.player;
  if (b.dataset.act === "flip") { wrap.classList.toggle("flipped"); b.setAttribute("aria-pressed", String(wrap.classList.contains("flipped"))); }
  if (b.dataset.act === "follow") toggleFocus(p);
  if (b.dataset.act === "save") saveCard(cardData.find(c => c.x.p === p), b);
});
// Tilt toward the pointer, with a moving glare; skipped for touch and reduced motion
if (!reduceMotion) {
  el("profilecards").addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse") return;
    const wrap = e.target.closest(".twrap"); if (!wrap || !e.target.closest(".tcard")) return;
    const r = wrap.querySelector(".tcard").getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    const card = wrap.querySelector(".tcard");
    wrap.classList.add("tilting");
    card.style.setProperty("--rx", `${(0.5 - py) * 14}deg`);
    card.style.setProperty("--ry", `${(px - 0.5) * 18}deg`);
    card.style.setProperty("--gx", `${px * 100}%`);
    card.style.setProperty("--gy", `${py * 100}%`);
  });
  el("profilecards").addEventListener("pointerout", e => {
    const wrap = e.target.closest(".twrap");
    if (!wrap || wrap.contains(e.relatedTarget)) return;
    wrap.classList.remove("tilting");
    const card = wrap.querySelector(".tcard");
    ["--rx", "--ry"].forEach(k => card.style.setProperty(k, "0deg"));
  });
}

// Draw a card onto a canvas and download it as a PNG
async function saveCard(cd, btn) {
  const { x, v, ovr, arch } = cd;
  const S = 2, W = 300 * S, H = 420 * S, c = CARD_HEX[x.p];
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const g = cv.getContext("2d");
  const label = btn.textContent; btn.textContent = "Saving…";
  try {
    await Promise.all(["800 48px Archivo", "500 12px 'IBM Plex Mono'"].map(f => document.fonts ? document.fonts.load(f) : null));
    const mix = (hex, to, t) => { const n = parseInt(hex.slice(1), 16), m = to === "#fff" ? 255 : 0; return `rgb(${[16, 8, 0].map(sh => Math.round(((n >> sh) & 255) * (1 - t) + m * t)).join(",")})`; };
    const round = (x0, y0, w, h, r) => { g.beginPath(); g.moveTo(x0 + r, y0); g.arcTo(x0 + w, y0, x0 + w, y0 + h, r); g.arcTo(x0 + w, y0 + h, x0, y0 + h, r); g.arcTo(x0, y0 + h, x0, y0, r); g.arcTo(x0, y0, x0 + w, y0, r); g.closePath(); };
    round(0, 0, W, H, 14 * S); g.save(); g.clip();
    const grad = g.createLinearGradient(0, 0, W * 0.6, H);
    grad.addColorStop(0, mix(c, "#fff", 0.55)); grad.addColorStop(0.38, c); grad.addColorStop(1, mix(c, "#000", 0.5));
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    g.strokeStyle = "rgba(255,255,255,0.07)"; g.lineWidth = 2 * S;
    for (let i = -H; i < W; i += 12 * S) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + H, H); g.stroke(); }
    g.restore();
    round(7 * S, 7 * S, W - 14 * S, H - 14 * S, 10 * S); g.strokeStyle = "rgba(255,255,255,0.55)"; g.lineWidth = 1.5 * S; g.stroke();
    g.fillStyle = "#fff"; g.textBaseline = "alphabetic";
    g.textAlign = "center"; g.font = `800 ${(ovr === null ? 28 : 48) * S}px Archivo`; g.fillText(ovr === null ? "NEW" : String(ovr), 52 * S, 62 * S);
    g.font = `500 ${10 * S}px 'IBM Plex Mono'`; g.fillText(ovr === null ? `${x.rounds} ROUND${x.rounds === 1 ? "" : "S"}` : "OVR", 52 * S, 78 * S);
    g.textAlign = "right"; g.fillText(arch.toUpperCase(), W - 22 * S, 36 * S);
    // Avatar, cropped the same way the page crops it (zoomed 180%, centred at 50% 42%)
    const img = new Image(); img.src = AVATARS[x.p];
    await img.decode();
    const d = 120 * S, cx = W / 2, cy = 140 * S;
    g.save(); g.beginPath(); g.arc(cx, cy, d / 2, 0, Math.PI * 2); g.clip();
    const iw = d * 1.8, ih = iw * img.naturalHeight / img.naturalWidth;
    g.drawImage(img, cx - d / 2 + (d - iw) * 0.5, cy - d / 2 + (d - ih) * 0.42, iw, ih);
    g.restore();
    g.beginPath(); g.arc(cx, cy, d / 2 + 1.5 * S, 0, Math.PI * 2); g.strokeStyle = "rgba(255,255,255,0.85)"; g.lineWidth = 3 * S; g.stroke();
    g.textAlign = "center"; g.font = `800 ${30 * S}px Archivo`; g.fillText(x.p.toUpperCase(), cx, 238 * S);
    g.fillStyle = "rgba(255,255,255,0.55)"; g.fillRect(cx - 70 * S, 248 * S, 140 * S, 1.5 * S);
    g.fillStyle = "#fff";
    ATTRS.forEach((a, i) => {
      const colX = i % 2 ? W / 2 + 22 * S : W / 2 - 78 * S, rowY = 292 * S + Math.floor(i / 2) * 30 * S;
      g.textAlign = "right"; g.font = `800 ${21 * S}px Archivo`; g.fillText(String(v[a.k] ?? "-"), colX + 30 * S, rowY);
      g.textAlign = "left"; g.font = `500 ${13 * S}px 'IBM Plex Mono'`; g.fillText(a.k, colX + 38 * S, rowY);
    });
    g.textAlign = "center"; g.font = `500 ${9 * S}px 'IBM Plex Mono'`; g.fillStyle = "rgba(255,255,255,0.85)";
    g.fillText(`GOLFPARKEN AALBORG · ${x.rounds} ROUND${x.rounds === 1 ? "" : "S"} · AVG ${fmt(x.avg)}`, cx, H - 22 * S);
    const blob = await new Promise(res => cv.toBlob(res, "image/png"));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `${x.p.toLowerCase()}-golf-card.png`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    btn.textContent = "Saved";
  } catch (err) {
    btn.textContent = "Could not save";
  }
  setTimeout(() => (btn.textContent = label), 1800);
}
