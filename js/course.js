// The course: hole drawings, the hole detail view and the map of the loop.

// The course: hand-traced, simplified drawings of each hole from overhead screenshots.
// Coordinates are in the screenshots' pixel space (891 wide, map area from y 125 to 1785), tee at the bottom, pin near the top.
// Distances are tee to pin as shown in the group's golf app, in metres.
const COURSE = [
  { dist: 146, tee: [230, 1470], pin: [731, 432], green: [735, 425, 95, 70],
    fairway: "130,1500 300,1440 560,1230 760,1020 880,820 880,480 700,430 600,540 470,800 360,1080 220,1300",
    bunkers: [[742, 545, 34, 20], [148, 878, 22, 20]],
    trees: [[60, 200, 110], [180, 170, 90], [120, 380, 120], [60, 560, 100], [150, 650, 90], [90, 760, 70],
      [520, 330, 70], [480, 470, 90], [420, 600, 90], [380, 760, 100], [300, 870, 90], [250, 1000, 110], [200, 1150, 100], [150, 1300, 100], [90, 1430, 90],
      [690, 170, 90], [820, 170, 80], [870, 300, 60], [720, 1250, 100], [840, 1150, 80], [560, 1560, 110], [420, 1650, 100], [260, 1700, 90]],
    paths: ["M0,1620 Q400,1450 891,880", "M60,1700 Q450,1500 891,960"],
    buildings: ["650,1420 800,1370 891,1440 891,1600 760,1640 650,1560"] },
  { dist: 121, tee: [250, 1390], pin: [717, 447], green: [720, 440, 90, 70],
    fairway: "230,1420 360,1360 560,1170 880,900 880,560 760,520 520,560 420,640 330,900 250,1180",
    bunkers: [[705, 580, 30, 18]],
    trees: [[400, 280, 110], [520, 230, 110], [650, 250, 100], [720, 330, 70], [460, 420, 100], [560, 420, 90], [360, 400, 70],
      [90, 720, 110], [160, 800, 100], [80, 920, 120], [180, 960, 80], [60, 1080, 90],
      [600, 1450, 110], [760, 1350, 100], [860, 1250, 80], [450, 1600, 100], [300, 1700, 90], [860, 1100, 60]],
    paths: ["M0,1690 Q450,1350 891,960", "M0,1780 Q480,1430 891,1040"],
    buildings: ["540,1560 700,1530 760,1600 720,1785 480,1785 470,1680"] },
  { dist: 106, tee: [200, 1180], pin: [695, 460], green: [680, 450, 90, 70],
    fairway: "40,1300 120,1050 260,820 330,560 420,420 600,330 760,230 790,310 720,520 560,700 380,900 230,1150 120,1380",
    bunkers: [[38, 1068, 26, 16]],
    trees: [[75, 255, 25], [140, 330, 25], [150, 270, 22], [120, 350, 22], [230, 450, 22], [65, 500, 28], [165, 540, 22], [265, 670, 22], [470, 540, 28],
      [415, 880, 26], [220, 885, 26], [75, 620, 24], [560, 300, 15], [440, 340, 14], [20, 720, 60], [10, 820, 50],
      [760, 1000, 90], [860, 900, 80], [650, 1200, 100], [820, 1250, 90], [550, 1400, 90], [480, 1550, 90], [700, 1500, 80], [400, 1700, 90], [860, 700, 40]],
    paths: ["M60,1785 Q500,1150 891,640", "M150,1785 Q560,1220 891,760"],
    buildings: ["820,1080 891,1040 891,1250 840,1260", "820,1360 891,1330 891,1480"] },
  { dist: 166, tee: [125, 1500], pin: [731, 430], green: [725, 420, 90, 70],
    fairway: "90,1420 190,1180 360,900 420,740 470,580 620,520 800,440 820,700 760,960 600,1160 420,1310 250,1460",
    bunkers: [[745, 620, 30, 18], [245, 140, 26, 12]],
    trees: [[240, 560, 100], [300, 650, 110], [220, 720, 110], [330, 760, 90], [160, 620, 80], [250, 480, 70],
      [850, 650, 70], [870, 780, 60], [60, 200, 90], [150, 230, 70], [600, 200, 80], [720, 170, 90], [840, 220, 60],
      [205, 890, 20], [270, 935, 22], [210, 975, 20], [330, 1045, 25], [400, 1050, 20], [230, 1045, 18], [80, 1130, 22], [100, 965, 20], [845, 470, 22], [490, 595, 15], [530, 345, 15],
      [560, 1200, 80], [680, 1290, 100], [800, 1370, 100], [560, 1620, 80], [700, 1650, 90], [860, 1550, 80]],
    paths: ["M0,1680 Q450,1350 891,1015"],
    buildings: ["470,1380 540,1380 550,1460 480,1460"] },
  { dist: 106, tee: [300, 1220], pin: [718, 453], green: [705, 440, 95, 70],
    fairway: "160,1460 380,1280 560,1020 760,660 870,460 760,390 600,470 470,640 260,880 90,1120 110,1360",
    bunkers: [[502, 800, 30, 34], [345, 815, 12, 10]],
    trees: [[180, 520, 110], [300, 450, 120], [420, 380, 100], [260, 640, 110], [380, 600, 90], [170, 700, 80], [460, 280, 80], [560, 200, 70],
      [850, 760, 70], [860, 920, 80], [870, 1080, 60], [640, 1300, 90], [760, 1400, 110], [870, 1500, 90], [680, 1520, 70], [770, 1600, 60], [20, 1100, 70], [60, 1460, 30]],
    paths: [], buildings: [] },
  { dist: 150, tee: [180, 1590], pin: [730, 438], green: [725, 425, 90, 70],
    fairway: "70,1650 150,1250 260,1050 420,900 560,700 700,430 840,380 840,620 650,900 560,1000 520,1140 400,1200 340,1400 320,1650",
    bunkers: [[410, 845, 28, 22]],
    trees: [[540, 300, 70], [480, 420, 80], [400, 520, 90], [300, 620, 90], [200, 760, 100], [110, 880, 100], [30, 1000, 90], [560, 500, 50],
      [470, 1200, 70], [440, 1340, 80], [460, 1480, 75], [400, 1610, 80], [520, 1680, 60],
      [60, 250, 80], [200, 200, 70], [700, 190, 80], [800, 250, 70], [880, 500, 40]],
    paths: ["M500,1785 Q640,1100 880,300"], buildings: [] },
];

function holeSVG(i, big) {
  const h = COURSE[i];
  const id = `h${i}${big ? "b" : "s"}`;
  const [tx, ty] = h.tee, [px, py] = h.pin;
  let s = `<svg viewBox="0 125 891 1660" ${big ? 'class="hole-big"' : ""} role="img" aria-label="Illustrated layout of hole ${i + 1}">`;
  s += `<rect x="0" y="125" width="891" height="1660" fill="var(--c-rough)"/>`;
  h.paths.forEach(d => s += `<path d="${d}" fill="none" stroke="var(--c-path)" stroke-width="16" stroke-linecap="round"/>`);
  h.buildings.forEach(p => s += `<polygon points="${p}" fill="var(--c-building)"/>`);
  s += `<polygon points="${h.fairway}" fill="var(--c-fairway)" stroke="var(--c-fairway)" stroke-width="60" stroke-linejoin="round"/>`;
  s += `<ellipse cx="${h.green[0]}" cy="${h.green[1]}" rx="${h.green[2]}" ry="${h.green[3]}" fill="var(--c-green)" stroke="var(--c-fairway)" stroke-width="10"/>`;
  h.bunkers.forEach(([cx, cy, rx, ry]) => s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="var(--c-sand)"/>`);
  s += `<g fill="var(--c-shadow)">${h.trees.map(([cx, cy, r]) => `<circle cx="${cx + r * 0.18}" cy="${cy + r * 0.14}" r="${r}"/>`).join("")}</g>`;
  s += `<g fill="var(--c-tree)">${h.trees.map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`).join("")}</g>`;
  // Line of play, tee box and flag
  s += `<line class="lop" x1="${tx}" y1="${ty}" x2="${px}" y2="${py}" stroke="#fff" stroke-width="${big ? 5 : 8}" stroke-dasharray="${big ? "4 18" : "6 22"}" stroke-linecap="round" opacity="0.9"/>`;
  s += `<rect x="${tx - 34}" y="${ty - 14}" width="68" height="28" rx="6" fill="var(--c-tee)" stroke="#fff" stroke-width="4"/>`;
  s += `<line x1="${px}" y1="${py}" x2="${px}" y2="${py - 110}" stroke="#fff" stroke-width="7"/><path d="M${px} ${py - 110} l70 22 l-70 22z" fill="var(--flag)"/><circle cx="${px}" cy="${py}" r="9" fill="#fff"/>`;
  if (big) s += `<circle class="ball" id="${id}ball" cx="${tx}" cy="${ty}" r="15" fill="#fff" stroke="#222" stroke-width="3" opacity="0"/>`;
  return s + `</svg>`;
}

const HEAT_STEPS = a => a <= 4.5 ? 0 : a <= 6 ? 1 : a <= 7.25 ? 2 : a <= 8.25 ? 3 : 4;
let courseHole = 0;
const groupRank = [...holeAvg.keys()].sort((a, b) => holeAvg[b] - holeAvg[a]);

(function drawCourse() {
  el("holestrip").innerHTML = COURSE.map((h, i) => `<button type="button" class="hcard" data-hole="${i}" aria-pressed="false" aria-label="Hole ${i + 1}, ${h.dist} metres, averages ${fmt(holeAvg[i])}">
    <span class="hc-top" style="background:var(--heat-${HEAT_STEPS(holeAvg[i])})"><b>${i + 1}</b><span>${h.dist} m</span></span>
    ${holeSVG(i, false)}
    <span class="hc-foot"><span class="num">${fmt(holeAvg[i])}</span> avg</span>
  </button>`).join("");
  el("holestrip").addEventListener("click", e => { const b = e.target.closest(".hcard"); if (b) showHole(+b.dataset.hole); });
  el("holestrip").addEventListener("keydown", e => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    showHole((courseHole + (e.key === "ArrowRight" ? 1 : HOLES - 1)) % HOLES, true);
  });
})();

function holeStats(i, who) {
  const rs = rows.filter(r => !who || r.p === who);
  const sc = rs.map(r => ({ v: r.h[i], r }));
  if (!sc.length) return null;
  const avg = sc.reduce((a, x) => a + x.v, 0) / sc.length;
  const best = Math.min(...sc.map(x => x.v));
  const bestBy = [...new Set(sc.filter(x => x.v === best).map(x => x.r.p))];
  const counts = [3, 4, 5, 6, 7, 8, 9].map(v => sc.filter(x => x.v === v).length);
  return { n: sc.length, avg, best, bestBy, nines: counts[6], counts };
}

function showHole(i, focusCard) {
  courseHole = i;
  [...el("holestrip").children].forEach((b, j) => { b.setAttribute("aria-pressed", String(j === i)); b.tabIndex = j === i ? 0 : -1; });
  if (focusCard) el("holestrip").children[i].focus();
  const h = COURSE[i], g = holeStats(i), me = focus ? holeStats(i, focus) : null;
  const rank = groupRank.indexOf(i) + 1;
  const st = me || g;
  const maxC = Math.max(...st.counts, 1);
  el("holeart").innerHTML = holeSVG(i, true);
  el("holeinfo").innerHTML = `
    <span class="eyebrow">Hole ${i + 1} · par ${PAR} · ${h.dist} m</span>
    <h3 class="hole-title">${rank === 1 ? "The hardest hole" : rank === HOLES ? "The easiest hole" : `The ${ordinalWord(rank)} hardest hole`} for the group</h3>
    ${me ? `<p class="muted">Showing ${focus}'s ${me.n} round${me.n === 1 ? "" : "s"}; group figures in brackets.</p>` : focus ? `<p class="muted">${focus} has no rounds here.</p>` : ""}
    <dl class="hole-stats">
      <dt>Average</dt><dd>${fmt(st.avg)}${me ? ` <span class="muted">(${fmt(g.avg)})</span>` : ""}</dd>
      <dt>Best score</dt><dd>${st.best} <span class="muted">${me ? "" : st.bestBy.join(", ")}</span></dd>
      <dt>Ended on a 9</dt><dd>${Math.round(st.nines / st.n * 100)}%${me ? ` <span class="muted">(${Math.round(g.nines / g.n * 100)}%)</span>` : ""}</dd>
      <dt>Club stroke index</dt><dd>${STROKE_INDEX[i]} <span class="muted">(club rates it ${rankByClub(i)} of ${HOLES} for difficulty)</span></dd>
      <dt>Group difficulty</dt><dd>${rank} of ${HOLES}</dd>
    </dl>
    <div class="hole-dist" role="img" aria-label="How often each score happened on hole ${i + 1}">
      ${st.counts.map((c, k) => `<div><span class="hd-bar" style="height:${c / maxC * 100}%;background:var(--d${k + 3})" title="${c} × ${k + 3}"></span><span class="hd-n num">${c || ""}</span><span class="hd-v">${k + 3}</span></div>`).join("")}
    </div>`;
  playBall(i);
  paintMap();
}
const ordinalWord = n => ["", "", "second", "third", "fourth", "fifth"][n] || n + "th";
const rankByClub = i => [...STROKE_INDEX].sort((a, b) => a - b).indexOf(STROKE_INDEX[i]) + 1;

// Roll a ball along the line of play: a short hop for each stroke the group averages, finishing in the hole
function playBall(i) {
  const ball = el(`h${i}bball`); if (!ball) return;
  const [tx, ty] = COURSE[i].tee, [px, py] = COURSE[i].pin;
  if (reduceMotion) { ball.setAttribute("cx", px); ball.setAttribute("cy", py); ball.setAttribute("opacity", 1); return; }
  const strokes = Math.max(2, Math.round(holeAvg[i]));
  // The first shot covers most of the way, then shorter and shorter shots close in
  const marks = [0]; let left = 1;
  for (let k = 1; k < strokes; k++) { left *= k === 1 ? 0.25 : 0.45; marks.push(1 - left); }
  marks.push(1);
  ball.setAttribute("opacity", 1);
  let k = 0;
  const hop = () => {
    if (k >= marks.length - 1 || !ball.isConnected) return;
    const a = marks[k], b = marks[k + 1], t0 = performance.now(), dur = k === 0 ? 900 : 450;
    const step = t => {
      const u = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - u, 2), f = a + (b - a) * e;
      ball.setAttribute("cx", tx + (px - tx) * f);
      ball.setAttribute("cy", ty + (py - ty) * f - Math.sin(u * Math.PI) * (k === 0 ? 120 : 30));
      ball.setAttribute("r", 15 + Math.sin(u * Math.PI) * (k === 0 ? 8 : 3));
      if (u < 1) requestAnimationFrame(step); else { k++; setTimeout(hop, 160); }
    };
    requestAnimationFrame(step);
  };
  hop();
}
showHole(groupRank[0]);

// Course map: the whole loop, traced from a north-up satellite overview (pixel space of an 875 x 1003 image, about 2 px per metre)
const LOOP = [
  { tee: [315, 132], pin: [328, 452], w: 50, bunkers: [[343, 438, 9, 6]] },
  { tee: [292, 478], pin: [350, 700], w: 46, bunkers: [[340, 678, 8, 5]] },
  { tee: [292, 628], pin: [306, 872], w: 48, bunkers: [] },
  { tee: [340, 892], pin: [568, 652], w: 56, bunkers: [[566, 716, 8, 5]] },
  { tee: [462, 690], pin: [466, 458], w: 40, bunkers: [[455, 528, 8, 6]] },
  { tee: [480, 452], pin: [410, 138], w: 52, bunkers: [[418, 278, 9, 6]] },
];
const MAP_TREES = [
  // Central tree line between the west and middle fairways
  [355, 130, 16], [362, 175, 18], [366, 220, 18], [368, 265, 20], [372, 310, 20], [378, 355, 22], [385, 400, 22], [392, 445, 22], [398, 490, 24], [403, 535, 22], [400, 570, 16],
  // Woods between hole 6 / 5 and the road
  [515, 300, 14], [505, 350, 22], [522, 380, 30], [552, 420, 32], [580, 465, 32], [604, 510, 30], [630, 555, 26], [648, 595, 18], [505, 300, 14],
  // The round clump beside hole 4, and the clump east of its green
  [408, 670, 26], [420, 700, 30], [412, 735, 22], [610, 750, 26], [625, 785, 22],
  // West boundary hedge
  ...Array.from({ length: 19 }, (_, k) => [240, 100 + k * 46, 18]),
  // Woods south of the path and across the road
  [520, 890, 28], [580, 905, 30], [640, 870, 32], [690, 900, 30], [660, 960, 30], [560, 960, 26],
  [655, 205, 30], [690, 240, 22], [665, 290, 12], [705, 350, 12], [735, 720, 18], [800, 715, 22], [725, 590, 10],
  // Scattered single trees in the rough
  [300, 745, 6], [330, 770, 5], [385, 790, 6], [410, 820, 6], [440, 770, 5], [505, 655, 6], [595, 640, 6], [550, 690, 5], [355, 735, 5], [470, 845, 6],
];
const MAP_PATHS = [
  { d: "M372,0 Q395,55 440,95 L610,420 Q700,600 790,770 L875,960", w: 9 },
  { d: "M215,1003 Q330,930 430,905 Q600,850 875,725", w: 6 },
  { d: "M255,95 L258,950", w: 4 },
];
const MAP_BUILDINGS = [[95, 15, 70, 45, 0], [135, 105, 60, 45, 20], [30, 160, 55, 40, 0], [150, 220, 55, 45, 0], [55, 260, 55, 45, 0], [125, 340, 60, 50, 0], [10, 330, 80, 100, -30], [135, 480, 60, 45, 0], [10, 520, 70, 55, 0], [130, 600, 60, 45, 0], [80, 710, 55, 40, 0], [135, 760, 60, 45, 0], [10, 830, 50, 80, 0], [120, 890, 70, 35, 10], [430, 920, 26, 20, 0]];

function holeShape(i) {
  const { tee: [tx, ty], pin: [px, py], w } = LOOP[i];
  const cx = (tx + px) / 2, cy = (ty + py) / 2, len = Math.hypot(px - tx, py - ty);
  const ang = Math.atan2(py - ty, px - tx) * 180 / Math.PI;
  return { cx, cy, len, ang, w };
}

(function drawMap() {
  const sel = () => courseHole;
  let s = `<svg viewBox="196 60 500 900" id="mapsvg" role="img" aria-label="Map of the six holes at Golfparken, played as a loop">`;
  s += `<defs><pattern id="mowstripes" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><rect width="9" height="18" fill="rgba(255,255,255,0.06)"/></pattern></defs>`;
  s += `<rect x="0" y="0" width="875" height="1003" fill="var(--c-rough)"/>`;
  s += `<rect x="0" y="0" width="236" height="1003" fill="var(--c-town)"/>`;
  MAP_BUILDINGS.forEach(([x, y, w, h, r]) => s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="var(--c-building)" transform="rotate(${r} ${x + w / 2} ${y + h / 2})"/>`);
  MAP_PATHS.forEach(p => s += `<path d="${p.d}" fill="none" stroke="var(--c-path)" stroke-width="${p.w}" stroke-linecap="round"/>`);
  // Fairways first, so trees sit over their edges
  LOOP.forEach((h, i) => {
    const f = holeShape(i);
    s += `<ellipse cx="${f.cx}" cy="${f.cy}" rx="${f.len / 2 + 22}" ry="${f.w / 2}" transform="rotate(${f.ang} ${f.cx} ${f.cy})" fill="var(--c-fairway)"/>`;
    s += `<ellipse cx="${f.cx}" cy="${f.cy}" rx="${f.len / 2 + 22}" ry="${f.w / 2}" transform="rotate(${f.ang} ${f.cx} ${f.cy})" fill="url(#mowstripes)"/>`;
  });
  s += `<g fill="var(--c-shadow)">${MAP_TREES.map(([x, y, r]) => `<circle cx="${x + r * 0.2}" cy="${y + r * 0.15}" r="${r}"/>`).join("")}</g>`;
  s += `<g fill="var(--c-tree)">${MAP_TREES.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g>`;
  // Walking route between holes
  LOOP.forEach((h, i) => {
    const n = LOOP[(i + 1) % LOOP.length];
    s += `<line x1="${h.pin[0]}" y1="${h.pin[1]}" x2="${n.tee[0]}" y2="${n.tee[1]}" stroke="var(--ink)" stroke-width="2" stroke-dasharray="2 6" stroke-linecap="round" opacity="0.5"/>`;
  });
  // Each hole: a clickable group with greens, bunkers, line of play, tee badge and flag
  LOOP.forEach((h, i) => {
    const [tx, ty] = h.tee, [px, py] = h.pin;
    s += `<g class="maphole" data-hole="${i}" tabindex="-1">`;
    const f = holeShape(i);
    s += `<ellipse class="mh-hit" cx="${f.cx}" cy="${f.cy}" rx="${f.len / 2 + 26}" ry="${f.w / 2 + 6}" transform="rotate(${f.ang} ${f.cx} ${f.cy})"/>`;
    h.bunkers.forEach(([cx, cy, rx, ry]) => s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="var(--c-sand)"/>`);
    s += `<circle cx="${px}" cy="${py}" r="15" fill="var(--c-green)" stroke="var(--c-fairway)" stroke-width="3"/>`;
    s += `<line class="mh-lop" x1="${tx}" y1="${ty}" x2="${px}" y2="${py}" stroke="#fff" stroke-width="2.5" stroke-dasharray="2 7" stroke-linecap="round"/>`;
    s += `<line x1="${px}" y1="${py}" x2="${px}" y2="${py - 26}" stroke="#fff" stroke-width="2.5"/><path d="M${px} ${py - 26} l16 5 l-16 5z" fill="var(--flag)"/>`;
    s += `<circle class="mh-badge" cx="${tx}" cy="${ty}" r="15" stroke="var(--ink)" stroke-width="2"/><text x="${tx}" y="${ty + 5.5}" text-anchor="middle" class="mh-num">${i + 1}</text>`;
    s += `</g>`;
  });
  // North arrow and a 50 m scale bar (about 2 px per metre)
  s += `<g transform="translate(660 100)"><path d="M0 -22 L9 8 L0 2 L-9 8 Z" fill="var(--ink)"/><text y="26" text-anchor="middle" class="mh-small">N</text></g>`;
  s += `<g transform="translate(560 940)"><rect width="100" height="6" fill="var(--ink)"/><rect width="50" height="6" fill="var(--paper)" stroke="var(--ink)" stroke-width="1"/><text x="50" y="-6" text-anchor="middle" class="mh-small">50 m</text></g>`;
  s += `</svg>`;
  el("coursemap").innerHTML = s;

  const svg = el("mapsvg");
  svg.addEventListener("click", e => { const g = e.target.closest(".maphole"); if (g) showHole(+g.dataset.hole); });
  svg.addEventListener("pointermove", e => {
    const g = e.target.closest(".maphole"); if (!g) return hideTip();
    const i = +g.dataset.hole, st = focus ? holeStats(i, focus) : null;
    showTip(`Hole ${i + 1} · ${COURSE[i].dist} m<br>Group avg <b>${fmt(holeAvg[i])}</b>${st ? `<br>${focus} avg <b>${fmt(st.avg)}</b>` : ""}`, e);
  });
  svg.addEventListener("pointerleave", hideTip);
})();

// Badges are tinted by difficulty: the group's average, or the followed player's when one is picked
function paintMap() {
  const svg = el("mapsvg"); if (!svg) return;
  svg.querySelectorAll(".maphole").forEach(g => {
    const i = +g.dataset.hole, st = focus ? holeStats(i, focus) : null;
    const a = st ? st.avg : holeAvg[i];
    g.querySelector(".mh-badge").setAttribute("fill", `var(--heat-${HEAT_STEPS(a)})`);
    g.classList.toggle("on", i === courseHole);
  });
}
paintMap();
