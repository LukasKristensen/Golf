// Scores, constants, shared helpers and the player focus state. Everything else builds on these globals.

// Scores come from data/sessions.csv, fetched by boot.js before this file runs
const CSV = window.SESSIONS_CSV;

const PAR = 3, HOLES = 6, COURSE_PAR = PAR * HOLES;
// Stroke index (hardest = 1) from the club's scorecard
const STROKE_INDEX = [13, 1, 9, 17, 11, 5];
// Putts were counted in sessions 2, 3 and 6; the session 1 putt rows in the file are not real counts.
const PUTT_SESSIONS = [2, 3, 6];
const parsed = CSV.trim().split(/\r?\n/).slice(1).map(l => {
  const c = l.split(",");
  return { s: +c[0], course: c[1], p: c[2], metric: c[3], h: c.slice(4, 10).map(Number), total: +c[10] };
});
// The group plays to a maximum of 9 per hole (triple par); session 1 predates that rule, so it is capped here.
const MAX_SCORE = 9;
const rows = parsed.filter(r => r.metric === "Strokes").map(r => {
  const h = r.h.map(v => Math.min(v, MAX_SCORE));
  return { ...r, raw: r.h, rawTotal: r.total, h, total: h.reduce((a, b) => a + b, 0) };
});
const puttRows = parsed.filter(r => r.metric === "Putts" && PUTT_SESSIONS.includes(r.s));
const puttsOf = (s, p) => puttRows.find(r => r.s === s && r.p === p);
const sessions = [...new Set(rows.map(r => r.s))].sort((a, b) => a - b);
const playerOrder = ["Lukas", "Laurits", "Mikkel", "Daniel", "Oskar", "Tobias"];
const colorOf = p => `var(--p${playerOrder.indexOf(p) + 1})`;
const fmt = n => (Math.round(n * 10) / 10).toFixed(1);
const toPar = n => (n > 0 ? "+" : "") + n;
const el = id => document.getElementById(id);

// Player avatars, served next to the page
const AVATARS = Object.fromEntries(playerOrder.map(p => [p, `avatars/${p.toLowerCase()}.png`]));
const avatarHTML = p => AVATARS[p] ? `<span class="avatar" role="img" aria-label="${p}" style="background-image:url(${AVATARS[p]})"></span>` : `<span class="initial">${p[0]}</span>`;

// Player focus: elements tagged data-player fade unless they belong to the followed player;
// data-hl elements (head-to-head cells) only get highlighted. Charts call applyFocus after each redraw.
let focus = null;
function applyFocus() {
  document.querySelectorAll("[data-player]").forEach(n => {
    const on = n.dataset.player === focus;
    n.classList.toggle("dim", !!focus && !on);
    n.classList.toggle("hl", !!focus && on);
    // Raise the followed player's lines above the others
    if (on && n.tagName === "g") n.parentNode.appendChild(n);
  });
  document.querySelectorAll("[data-hl]").forEach(n => n.classList.toggle("hl", !!focus && n.dataset.hl === focus));
}

// Winners per session
const winners = {};
sessions.forEach(s => {
  const sr = rows.filter(r => r.s === s);
  const min = Math.min(...sr.map(r => r.total));
  winners[s] = sr.filter(r => r.total === min).map(r => r.p);
});

// Player summaries
const players = playerOrder.map(p => {
  const pr = rows.filter(r => r.p === p).sort((a, b) => a.s - b.s);
  const totals = pr.map(r => r.total);
  return {
    p, rounds: pr.length, list: pr,
    avg: totals.reduce((a, b) => a + b, 0) / pr.length,
    best: Math.min(...totals), worst: Math.max(...totals),
    wins: sessions.filter(s => winners[s].includes(p)).length,
  };
}).sort((a, b) => (a.rounds > 1) === (b.rounds > 1) ? a.avg - b.avg : (a.rounds > 1 ? -1 : 1));
