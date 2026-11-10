// Fetches the scores, then runs the page scripts in order. They share globals, so the order matters.
(async function boot() {
  const scripts = ["core","charts","race","cards","story","course","away","app"];
  // Away rounds are optional: if the file fails to load, their section is hidden and the rest still runs
  const away = fetch("data/oland.csv", { cache: "no-cache" }).then(r => r.ok ? r.text() : null).catch(() => null);
  try {
    const res = await fetch("data/sessions.csv", { cache: "no-cache" });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    window.SESSIONS_CSV = await res.text();
    window.OLAND_CSV = await away;
  } catch (err) {
    document.querySelector(".wrap").insertAdjacentHTML("afterbegin",
      `<p class="load-error">Could not load the scores from data/sessions.csv (${err.message}). If you opened the file straight from disk, serve the folder instead, for example with: npx http-server</p>`);
    return;
  }
  // Appended scripts with async off still download in parallel but run in the order they were added
  scripts.forEach(name => {
    const s = document.createElement("script");
    s.src = `js/${name}.js`;
    s.async = false;
    document.body.appendChild(s);
  });
})();
