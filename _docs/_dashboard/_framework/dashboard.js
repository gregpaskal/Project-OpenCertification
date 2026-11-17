// ===============================================================
// @file: dashboard.js
// @filepath: dashboard_engine/_framework/dashboard.js
// @version: 2.10.0
// @updated: 2026-11-17 04:41:38 PM CST
// @author: Greg Paskal & Claude
// @company: MissionWares®
// @description: Shared site behavior for the living dashboard —
//   the ONE owner of the VIEW zoom component (Core_05 Shared
//   Rendering Rule) AND the live board subsystem (Step B AJAX,
//   2026-07-29). Owns the component's CSS (injected), its chips
//   (rendered into any #view-mount), its persistence (localStorage
//   vp-dash-zoom), the NOW strip, and now the wire-driven boards.
//
//   THE BOARD SUBSYSTEM (Greg's full-dynamic ruling): a page opts
//   in with <div id="wire-boards"></div>. Boards render there from
//   data and stay live with NO PAGE RELOAD — the dashboard-app feel
//   is the goal, reload is a last resort we design away from.
//
//   State model (Greg's caveat — reopen shows current state with no
//   catch-up needed):
//   - TRUTH is _data/boards-data.js on disk, kept current by the
//     courier. It declares window.DASH_BOARDS and loads via a
//     <script src> include BEFORE the engine — the mAi-correct
//     channel, because <script> loading works under file:// where
//     fetch() is CORS-blocked (confirmed 2026-07-29). DASH_BOARDS
//     ALWAYS WINS on load.
//   - localStorage 'mai-dash-boards--[project]' is a fast-paint CACHE so the
//     page shows something instantly before the durable read —
//     never the authority.
//   - Live wire board updates redraw in place AND rewrite the cache,
//     so an already-open page and a freshly-opened one converge on
//     the same content.
//   - A page with no boards yet has no DASH_BOARDS and simply keeps
//     its (empty) cache — no error, no fetch, no server.
//
//   Large boards arrive CHUNKED (same transferId/index/total/sha256
//   contract the courier's WireChunkAssembler certified) — the
//   engine reassembles page-side, verifies the whole-board checksum,
//   and only then redraws. One board replaces one board (whole-board
//   rule — a fragment can't be verified).
//
//   Pages opt in with: <div id="view-mount"></div> +
//   <div id="wire-boards"></div> +
//   <script src="_data/boards-data.js"></script> (optional; absent
//   until the first board lands) + <script src="dashboard.js"></script>
//   before </body>.
// @changeLog:
// Date        Author         Version        Description
// ----------  -------------  -------------  --------------------------
// 2026-09-05  Greg & Claude  1.0.0–2.3.0    [pruned 2026-11-12 and 2026-11-14; spans 2026-07-27→] THE WIRE STRIP, a 24-hour sparkline of this project's wire traffic on Home (2.3.0); Born, live boards, the page learns to reconnect, the warning, the key, the reload, memory and the page that names itself; THE ONE LEDGER and its acknowledgment by watching; the routing key declared, never guessed; one mai-* key namespace; ACKNOWLEDGE ALL and the 6 s dwell that clears a page's pills
// 2026-09-05  Greg & Claude  2.4.0          THE DECK (Greg: bump it up, ticks, rollover, scrolling; the LIVE heading is pointless) — Home opens with an instrument deck: THE WIRE strip taller with 3-hour ticks and local-hour labels, per-bar rollover metrics, re-drawn every minute so time scrolls; beside it THE PULSE tile (last heard, last verdict, busiest hour, since midnight) from the same log. The LIVE heading becomes THE EDGE (law 12's own word) with an honest empty state
// 2026-09-12  Greg & Claude  2.5.0          WORK FIRST (Greg, Road Warrior Chat 05: four titles that mean nothing; what would I do next with an hour?) — Home is built authored content first, live boards directly beneath with no heading, and the deck collapsed to one quiet wire line at the bottom (click to open the chart); THE EDGE heading, its nav link and the 'nothing in flight' strip are gone (the strip never saw a .wb-card anyway); every board card counts itself per Core_03 2.14.0 — done/total, a bar, +growth against stepsAtStart, orange GROWING past +50%
// 2026-09-12  Greg & Claude  2.5.1          The wire line opens with a chevron (Greg): ▸ closed, ▾ open, turning on click, state kept across loads and reloads; the show/hide words go
// 2026-10-03  Greg & Claude  2.5.2          Secondary pages (Backlog, Completed) put their content into main, so their nav shows as Home's does (Greg: no navigation there)
// 2026-10-13  Greg & Claude  2.5.3          Refusal notices tell the truth (Greg, the project file lane's first test run): deleted and renamed count as success, not refusals; the notice names its verdict and gives that verdict's own advice (Launch only for dropped-auth; rule, path, conflict, transfer and project each get theirs); the heal line no longer claims "back in sync"
// 2026-10-14  Greg & Claude  2.6.0          AUDIT J ITEMS (AiAssist Session 32 code audit): payload anchors accepted only as in-page #ids, so a javascript: link can no longer be stored or run (J-01); a refused board repaints from disk (J-03); renamed counts as success on the wire strip (J-08); a path-form file delivery reloads its page (J-09); probe scripts removed once loaded (J-10); the 24 h seed is one batch, not quadratic (J-11); board ids escaped in selectors (J-12); the ACKNOWLEDGE ALL visibility listener removed with the control (J-13); a liveness watchdog reconnects a connection silent for 150 s (J-14); one nudge at a time and chunk transfers expire after 2 min (J-15); runtime ENGINE_VERSION synced
// 2026-10-26  Greg & Claude  2.7.0          The Lanes page from _data/lanes-data.js (Core_03); runtime ENGINE_VERSION synced
// 2026-10-26  Greg & Claude  2.7.1          A run lane receipt no longer shows DELIVERY REFUSED (Greg saw a run's "started" called refused); one success list for the notice and the wire strip adds started, finished, killed and timed-out; runtime ENGINE_VERSION synced
// 2026-11-12  Greg & Claude  2.8.0          PAGE ORDER (Greg: sortable pages, spacing and dividers the user sets, remembered): ARRANGE on the PAGES heading opens the arranger (drag or up/down, + SPACE, + LINE, + HEADING, DONE/CANCEL/RESET); the layout is kept per project in browser storage and laid over the manifest at every render (new pages join at the end, removed ones drop); Lanes takes part; runtime ENGINE_VERSION synced
// 2026-11-14  Greg & Claude  2.9.0          THE TOOLS PHRASE ON THE STRIP (Greg, AiAssist chat 36): a tools cell beside methodology and dashboard, from stamp-data.js toolsPhrase (written by AiAssist at Launch), repainted with the stamp; runtime ENGINE_VERSION synced
// 2026-11-17  Greg & Claude  2.10.0         LINKS IN THE PAGES MENU (Greg, chat 15: shortcuts like the mAi Lab, each dashboard its own): + LINK in ARRANGE, between + LINE and + HEADING; a link has a title, an address (http or https only) and a tab (new or this); it moves like any item, and renaming it or changing its address or tab never moves it (each link keeps a fixed id); kept with the layout in this browser; RESET asks a second click when links would be lost; runtime ENGINE_VERSION synced
// ===============================================================

(function () {
  // The engine announces itself — type DASH_ENGINE_VERSION in the
  // browser console to verify which engine a page is running.
  var ENGINE_VERSION = '2.10.0';
  // 1.28.1: this page's birth moment — the line between replayed
  // history (older, never reloads) and live news (may reload).
  var PAGE_BOOT_MS = Date.now();
  window.DASH_ENGINE_VERSION = ENGINE_VERSION;
  try { console.info('mAi dashboard engine ' + ENGINE_VERSION); } catch (e) {}

  // 2.0.0: THE ROUTING KEY IS DECLARED, NEVER GUESSED. Every page
  // sets window.DASH_PROJECT before loading the engine. The old
  // 'vectorpal' fallback (1.3.0) let an undeclared page route another
  // project's boards, storage lanes and wire traffic onto itself
  // with no error — the 1.16.1 cache-bleed class, by design. A page
  // that cannot say whose instrument it is does not boot: a visible
  // banner names the fault, and the thrown error stops every lane.
  const PROJECT = (typeof window.DASH_PROJECT === 'string' && window.DASH_PROJECT.trim()) || null;
  if (!PROJECT) {
    var fault = 'mAi dashboard engine ' + ENGINE_VERSION + ': window.DASH_PROJECT is not declared — this page cannot route. Add <script>window.DASH_PROJECT = \'<routing key>\';</script> before the engine include.';
    try { console.error(fault); } catch (e) {}
    var banner = document.createElement('div');
    banner.setAttribute('style', 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#2a1313;color:#ff7b7b;border-bottom:1px solid #ff7b7b;padding:12px 18px;font:12px/1.5 monospace;');
    banner.textContent = fault;
    (document.body || document.documentElement).appendChild(banner);
    throw new Error(fault);
  }

  // 2.1.0: ONE KEY NAMESPACE — migrate VectorPal-era vp-* keys to mai-*
  // once, then never look for vp-* again. Copy-then-remove per key, so a
  // storage failure mid-way loses nothing (the old key still exists).
  (function migrateKeyNamespace() {
    var suffixed = ['dash-boards--', 'wire-fp--', 'wire-last--', 'wire-since--', 'wire-sound--'];
    var olds = suffixed.map(function (k) { return 'vp-' + k + PROJECT; }).concat(['vp-dash-zoom']);
    olds.forEach(function (oldKey) {
      try {
        var v = localStorage.getItem(oldKey);
        if (v === null) return;
        var newKey = 'mai-' + oldKey.slice(3);
        if (localStorage.getItem(newKey) === null) localStorage.setItem(newKey, v);
        localStorage.removeItem(oldKey);
      } catch (e) {}
    });
  })();

  const KEY = 'mai-dash-zoom';
  const LEVELS = ['100', '125', '150', '175'];
  const DEFAULT = '150';

  // --- Persistence -------------------------------------------------
  function readSaved() {
    try { return localStorage.getItem(KEY) || DEFAULT; } catch (e) { return DEFAULT; }
  }
  function writeSaved(z) {
    try { localStorage.setItem(KEY, z); } catch (e) {}
  }

  // --- Apply -------------------------------------------------------
  function applyZoom(z) {
    document.body.style.zoom = z + '%';
    // Chrome scales vh units by zoom: 100vh at zoom 1.5 renders 150%
    // of the viewport and the shell would clip. The zoom owner
    // compensates: height = 10000/z vh (z=150 → 66.67vh → 100% real).
    document.body.style.height = (10000 / parseFloat(z)) + 'vh';
    var sel = document.querySelector('.zoomsel');
    if (sel) { sel.value = String(z); }
    writeSaved(z);
  }

  // --- Component CSS lives in styles.css (2.0.0, one style owner) --
  // The rules the engine used to inject as a string now sit at the
  // END of _framework/styles.css under ENGINE COMPONENTS, so Gate 1's
  // duplicate-class audit can see them and the stamped framework has
  // exactly one style owner.
  // --- THE THIN SHELL (structure-from-engine) ----------------------
  // Greg's law: observe state, don't hope for it. A founded page used
  // to carry a frozen copy of template STRUCTURE — the copy went
  // stale when the template evolved. The thin shell removes the copy:
  // a shell page holds ONLY identity (window.DASH_* + meta tags) and
  // its #authored content; the engine builds ALL structure fresh at
  // every load. Structure therefore lives in ONE place — this file —
  // and synchronizes through the existing stamp + framework-
  // fingerprint system. Staleness cannot exist: there is nothing
  // left in the page to go stale.
  //
  // Detection is OBSERVED, not declared: a page with a <header> is a
  // structured legacy page and is left exactly as before (VectorPal,
  // the methodology page, older foundings all keep working). A page
  // without one is a shell and gets built.

  function isThinShell() {
    return !document.querySelector('header');
  }

  function pageMeta(name) {
    var m = document.querySelector('meta[name="' + name + '"]');
    return m ? (m.getAttribute('content') || '') : '';
  }

  function navCap(text) {
    var d = document.createElement('div'); d.className = 'cap'; d.textContent = text; return d;
  }

  // --- PAGES nav group (site manifest) -----------------------------
  // The courier maintains _data/site-data.js (window.DASH_SITE) on
  // every page delivery/delete — machine-maintained truth derived
  // from actual writes, never a hand-edited list. Loaded by dynamic
  // script injection (the file://-safe channel); rebuilt live when a
  // wire delivery lands, no refresh. Until the manifest exists, a
  // fallback list is built from the page's identity declarations.
  var shellNavEl = null;   // the built nav (thin-shell pages only)

  // --- 1.30.0: THE ONE LEDGER --------------------------------------
  // (Greg's rulings R4 + his observed flicker: UPDATED consumed by a
  // visit, gone from one page's nav, back on another's.) Three
  // overlapping mechanisms — cross-page pending, the runtime
  // here-badge, row pills — collapse into ONE persisted map of pages
  // holding unacknowledged change. The nav badge everywhere is a
  // view of this map and nothing else. Set by deliveries; cleared
  // ONLY by acknowledgment: clicking away a static page's last pill,
  // or witnessing Home's boards paint while actually looking at
  // them. Visiting, reloading, closing, reopening — none of those
  // clear anything.
  var DIRTY_KEY = 'mai-dirty--' + PROJECT;
  function readDirty() {
    try { return JSON.parse(localStorage.getItem(DIRTY_KEY)) || {}; } catch (e) { return {}; }
  }
  function markDirty(href) {
    try {
      var d = readDirty();
      d[String(href).toLowerCase()] = Math.floor(Date.now() / 1000);
      localStorage.setItem(DIRTY_KEY, JSON.stringify(d));
    } catch (e) {}
    if (shellNavEl) renderPagesGroup(shellNavEl);
  }
  function clearDirty(href) {
    try {
      var d = readDirty();
      delete d[String(href).toLowerCase()];
      localStorage.setItem(DIRTY_KEY, JSON.stringify(d));
    } catch (e) {}
    if (shellNavEl) renderPagesGroup(shellNavEl);
  }
  // Boards acknowledgment: a paint you actually watched is a change
  // you have seen; a paint behind your back keeps the badge.
  function witnessBoards() {
    if (currentPageFile() !== 'index.html') { return; }
    if (document.hidden) { markDirty('index.html'); return; }
    clearDirty('index.html');
  }

  // Marks a page as having unseen wire activity. 1.30.0: writes the
  // ONE LEDGER (name kept so every historical call site converges).
  function markPagePending(href) {
    markDirty(href);
  }

  // THE HERE-BADGE (1.25.0, Greg's ask): when a change paints ON the
  // page being viewed, the nav says so too — one more explicit sign
  // of WHERE the change landed, in the glow's own rhythm. Runtime
  // only (never persisted): it clears on refresh exactly as the glow
  // does, so a stale badge can never outlive its change. ONE marker,
  // called from every path that lights a glow (Core_05).
  // THE HERE-BADGE (1.25.0 → 1.30.0): now a pure view of the ONE
  // LEDGER. Static pages mark/clear through the pills; boards pages
  // route through witnessBoards (watched paint = acknowledged).
  function markHereUpdated() {
    if (currentPageFile() === 'index.html') { witnessBoards(); return; }
    markDirty(currentPageFile());
  }
  function clearHereUpdated() {
    clearDirty(currentPageFile());
  }

  function currentPageFile() {
    var f = (location.pathname.split('/').pop() || '').toLowerCase();
    return f || 'index.html';
  }

  function sitePages() {
    var site = window.DASH_SITE;
    if (site && site.pages && site.pages.length) { return site.pages; }
    // Fallback — identity declarations until the manifest is born.
    var pages = [{ href: 'index.html', label: 'Home' }];
    if (window.DASH_LEDGER) { pages.push({ href: window.DASH_LEDGER, label: 'Backlog' }); }
    return pages;
  }

  // --- 2.8.0: PAGE ORDER (Greg, 2026-11-12) ------------------------
  // The PAGES menu is the user's to arrange: the order of the pages, and spaces, lines and headings between them that
  // group the menu into a structure the user sets. The ARRANGE button on the PAGES heading opens the arranger; DONE
  // saves, CANCEL leaves the menu as it was, RESET goes back to the manifest order (saved only by DONE).
  //
  // What is saved is the user's layout, never the page list: the courier's manifest (site-data.js) stays the truth of
  // which pages exist. At every render the layout is laid over the manifest (arrangeEntries): a page the layout names
  // and the manifest holds takes its saved place; a page the manifest holds and the layout does not name (one founded
  // since) joins at the end; a page the manifest no longer holds is not drawn. So a new page is never hidden by an old
  // layout, and a removed page leaves no dead link.
  //
  // Where it is kept: this browser's storage, one key per project (mai-nav-layout--<project>), like the zoom and the
  // UPDATED ledger. The page cannot write a file (file:// and the wire's rules both forbid it), so a second browser or
  // a second Mac starts from the manifest order until it is arranged there too.
  //
  // 2.10.0, LINKS (Greg, 2026-11-17): a link is a fourth kind of item beside space, line and heading: a shortcut out of
  // the dashboard (the mAi Lab first), added with + LINK. It has a title, an address and a tab (new, the default, or
  // this one). It carries a fixed id from birth, so renaming it, readdressing it or switching its tab changes only that
  // link and never its place. Only http and https addresses are accepted (no javascript:, no file:); a new-tab link
  // opens with rel="noopener noreferrer". A saved link that cannot be read is skipped and named in the console.
  var LAYOUT_KEY = 'mai-nav-layout--' + PROJECT;
  var LAYOUT_HEAD_MAX = 40;
  var navEdit = null;      // the arranger's draft while it is open; null when the menu is shown
  var navEditSeq = 0;      // gives each draft row a key, so focus can follow a row after it moves

  // An address a link may carry: http or https, and nothing else.
  function linkUrlOk(u) {
    if (typeof u !== 'string' || !/^https?:\/\//i.test(u.trim())) { return false; }
    try { var x = new URL(u.trim()); return (x.protocol === 'http:' || x.protocol === 'https:') && !!x.host; } catch (e) { return false; }
  }
  function newLinkId() {
    return 'L' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }
  function cleanLayoutItem(it) {
    if (!it || typeof it !== 'object') { return null; }
    if (it.t === 'link') {
      var label = (typeof it.label === 'string') ? it.label.trim().slice(0, LAYOUT_HEAD_MAX) : '';
      if (typeof it.id !== 'string' || !/^L[0-9a-z]{4,24}$/.test(it.id) || !label || !linkUrlOk(it.url)) {
        try { console.warn('[dashboard] a saved menu link was skipped: it has no id, no title, or an address that is not http or https', it); } catch (e) {}
        return null;
      }
      return { t: 'link', id: it.id, label: label, url: it.url.trim(), tab: it.tab === 'same' ? 'same' : 'new' };
    }
    if (it.t === 'page' && typeof it.href === 'string' && it.href) { return { t: 'page', href: it.href }; }
    if (it.t === 'space' || it.t === 'line') { return { t: it.t }; }
    if (it.t === 'head' && typeof it.label === 'string') { return { t: 'head', label: it.label.trim().slice(0, LAYOUT_HEAD_MAX) }; }
    return null;
  }
  function readLayout() {
    var o = null;
    try { o = JSON.parse(localStorage.getItem(LAYOUT_KEY)); } catch (e) { o = null; }
    if (!o || !Array.isArray(o.items)) { return null; }
    return o.items.map(cleanLayoutItem).filter(function (it) { return it; });
  }
  // Saves the layout, or clears it when it is exactly the manifest order with no separators (nothing left to remember).
  function writeLayout(items) {
    var out = items.map(cleanLayoutItem).filter(function (it) { return it && !(it.t === 'head' && !it.label); });
    var plain = arrangeEntries(null).map(function (e) { return e.href; }).join('\n');
    var mine = out.map(function (it) { return it.t === 'page' ? it.href : '\u0000' + it.t; }).join('\n');
    try {
      if (mine === plain) { localStorage.removeItem(LAYOUT_KEY); }
      else { localStorage.setItem(LAYOUT_KEY, JSON.stringify({ v: 1, at: new Date().toISOString(), items: out })); }
    } catch (e) {}
  }

  // Every page the menu can show right now, in the manifest's order: the manifest's pages, then Lanes while its data
  // exists (2.7.0: engine-built, never in the manifest, always on Home at index.html#lanes).
  function availablePages() {
    var out = [];
    sitePages().forEach(function (p) {
      if (p && p.href) { out.push({ href: p.href, label: p.label }); }
    });
    if (lanesPresent) { out.push({ href: 'index.html' + LANES_HASH, label: 'Lanes', lanes: true }); }
    return out;
  }
  function availableSignature() {
    return availablePages().map(function (p) { return p.href.toLowerCase(); }).join('\n');
  }

  // THE ONE ORDERING (Core_05): the menu and the arranger both draw from this. Lays a layout over the pages that
  // exist, as described above. Returns entries: { t: 'page', href, page } or a separator { t, label }; an arranger
  // row's key (k) rides through, so a row keeps its identity when the arranger redraws.
  function arrangeEntries(items) {
    var avail = availablePages();
    var byHref = {};
    avail.forEach(function (p) { byHref[p.href.toLowerCase()] = p; });
    var used = {};
    var out = [];
    (items || []).forEach(function (it) {
      if (it.t === 'page') {
        var k = it.href.toLowerCase();
        if (byHref[k] && !used[k]) { used[k] = true; out.push({ t: 'page', href: byHref[k].href, page: byHref[k], k: it.k }); }
        return;
      }
      var s = (it.t === 'head') ? { t: 'head', label: it.label } : { t: it.t };
      if (it.t === 'link') { s = { t: 'link', id: it.id, label: it.label, url: it.url, tab: it.tab }; }
      s.k = it.k;
      out.push(s);
    });
    avail.forEach(function (p) {
      var k = p.href.toLowerCase();
      if (!used[k]) { used[k] = true; out.push({ t: 'page', href: p.href, page: p }); }
    });
    return out;
  }

  // The name a page goes by in the menu. Nav convention (Greg, 2026-07-30): the home page is called "Home"; the
  // manifest keeps the page's true observed title, presentation names the start point by its role.
  function pageMenuLabel(p) {
    return (p.href === 'index.html') ? 'Home' : (p.label || p.href);
  }

  // One page's link in the menu.
  function pageLink(p, dirty) {
    var a = document.createElement('a');
    a.className = 'pages-item pages-g';
    a.href = p.href;
    a.textContent = pageMenuLabel(p);
    if (p.lanes) {
      if (lanesActive()) { a.classList.add('here'); }
      return a;
    }
    var isHere = p.href.toLowerCase() === currentPageFile() && !lanesActive();
    if (isHere) { a.classList.add('here'); }
    // 1.30.0 (Greg's R4): ONE rule for every page including the
    // one being viewed — UPDATED while the ledger says so, from
    // anywhere, across visits/reloads/close-and-reopen. Cleared
    // only by acknowledgment (pills / witnessed boards), never by
    // mere navigation.
    if (dirty[p.href.toLowerCase()]) {
      var b = document.createElement('span');
      b.className = 'nbadge';
      b.textContent = 'UPDATED';
      a.appendChild(b);
    }
    return a;
  }

  // One link in the menu: a shortcut out of the dashboard, marked so it reads as leaving.
  function menuLinkEl(e) {
    var a = document.createElement('a');
    a.className = 'pages-item pages-g pages-link';
    a.href = e.url;
    a.textContent = e.label;
    a.title = e.url + (e.tab === 'same' ? '' : ' (opens in a new tab)');
    if (e.tab !== 'same') { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    var m = document.createElement('span');
    m.className = 'pages-out';
    m.setAttribute('aria-hidden', 'true');
    m.textContent = e.tab === 'same' ? '→' : '↗';
    a.appendChild(m);
    return a;
  }

  // One separator in the menu: a space, a line, or a heading over the pages below it.
  function separatorEl(e) {
    var d = document.createElement('div');
    d.className = 'pages-g pages-sep pages-' + e.t;
    if (e.t === 'head') { d.textContent = e.label; }
    else { d.setAttribute('aria-hidden', 'true'); }
    return d;
  }

  // The PAGES heading, with the ARRANGE button at its right.
  function pagesCapEl() {
    var cap = navCap('');
    cap.classList.add('pages-cap', 'pages-g');
    var t = document.createElement('span');
    t.textContent = 'PAGES';
    cap.appendChild(t);
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pages-arrange' + (navEdit ? ' on' : '');
    btn.title = navEdit ? 'Done arranging: save this order' : 'Arrange the pages: change their order, add spaces, lines, links and headings';
    btn.setAttribute('aria-label', btn.title);
    btn.setAttribute('aria-pressed', navEdit ? 'true' : 'false');
    var icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 16 16');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '1.6');
    icon.setAttribute('stroke-linecap', 'round');
    icon.setAttribute('stroke-linejoin', 'round');
    icon.innerHTML = '<path d="M5 2.5v11M2.5 5 5 2.5 7.5 5M11 13.5v-11M8.5 11 11 13.5 13.5 11"/>';
    btn.appendChild(icon);
    var w = document.createElement('span');
    w.textContent = navEdit ? 'DONE' : 'ARRANGE';
    btn.appendChild(w);
    btn.addEventListener('click', function () {
      if (navEdit) { arrangerDone(); } else { arrangerOpen(); }
    });
    cap.appendChild(btn);
    return cap;
  }

  function renderPagesGroup(nav) {
    // The arranger redraws itself on its own edits. Anything else (the disk watch, the UPDATED ledger, a hash change)
    // redraws it only when the set of pages changed, so a heading being typed or a row being dragged is never torn down.
    if (navEdit && navEdit.drawn && (navEdit.dragging || navEdit.availSig === availableSignature())) { return; }

    // Remove a previous render (live rebuild replaces in place).
    nav.querySelectorAll('.pages-g').forEach(function (el) { el.remove(); });
    // The menu widens while the arranger is open, so each row has room for its name and its buttons.
    nav.classList.toggle('pages-arranging', !!navEdit);

    var anchor = nav.firstChild;
    nav.insertBefore(pagesCapEl(), anchor);

    if (navEdit) {
      nav.insertBefore(arrangerEl(), anchor);
      return;
    }

    var dirty = readDirty();
    arrangeEntries(readLayout()).forEach(function (e) {
      nav.insertBefore(e.t === 'page' ? pageLink(e.page, dirty) : (e.t === 'link' ? menuLinkEl(e) : separatorEl(e)), anchor);
    });
  }

  // --- The arranger ------------------------------------------------
  function arrangerRedraw() {
    if (!navEdit) { return; }
    navEdit.drawn = false;
    if (shellNavEl) { renderPagesGroup(shellNavEl); }
  }
  function draftEntry(e) {
    if (!e.k) { navEditSeq += 1; }
    var d = { k: e.k || ('r' + navEditSeq), t: e.t };
    if (e.t === 'page') { d.href = e.href; d.page = e.page; }
    if (e.t === 'head') { d.label = e.label; }
    if (e.t === 'link') { d.id = e.id; d.label = e.label; d.url = e.url; d.tab = e.tab; }
    return d;
  }
  function arrangerOpen() {
    navEdit = { items: arrangeEntries(readLayout()).map(draftEntry), drawn: false, dragging: null, availSig: '' };
    arrangerRedraw();
  }
  function arrangerDone() {
    if (!navEdit) { return; }
    // A link with no title or a bad address is not saved: DONE stays put and points at it.
    var bad = navEdit.items.filter(function (it) { return it.t === 'link' && (!String(it.label || '').trim() || !linkUrlOk(it.url)); })[0];
    if (bad) {
      navEdit.msg = 'Link "' + (String(bad.label || '').trim() || 'untitled') + '": give it a title and an address starting http:// or https://';
      arrangerRedraw();
      arrangerFocus(bad.k, String(bad.label || '').trim() ? 'input.pages-eurl' : 'input.pages-elabel');
      return;
    }
    var items = navEdit.items;
    navEdit = null;
    writeLayout(items);
    if (shellNavEl) { renderPagesGroup(shellNavEl); }
  }
  function arrangerCancel() {
    if (!navEdit) { return; }
    navEdit = null;
    if (shellNavEl) { renderPagesGroup(shellNavEl); }
  }
  function arrangerReset() {
    if (!navEdit) { return; }
    // RESET drops the links with the rest: when there are any, the first click asks, the second resets.
    var links = navEdit.items.filter(function (it) { return it.t === 'link'; }).length;
    if (links && !navEdit.resetArmed) {
      navEdit.resetArmed = true;
      navEdit.msg = 'RESET removes ' + links + ' link' + (links === 1 ? '' : 's') + ' too. Press RESET again to go ahead.';
      arrangerRedraw();
      return;
    }
    navEdit.resetArmed = false;
    navEdit.msg = '';
    navEdit.items = arrangeEntries(null).map(draftEntry);
    arrangerRedraw();
  }
  function arrangerAdd(t) {
    if (!navEdit) { return; }
    var e = draftEntry(t === 'head' ? { t: 'head', label: 'Group' } : (t === 'link' ? { t: 'link', id: newLinkId(), label: 'Link', url: 'https://', tab: 'new' } : { t: t }));
    navEdit.items.push(e);
    arrangerRedraw();
    arrangerFocus(e.k, (t === 'head' || t === 'link') ? 'input' : '.pages-ebtn-remove');
  }
  function arrangerRemove(k) {
    if (!navEdit) { return; }
    navEdit.items = navEdit.items.filter(function (it) { return it.k !== k; });
    arrangerRedraw();
  }
  function arrangerMove(k, by) {
    if (!navEdit) { return; }
    var i = navEdit.items.findIndex(function (it) { return it.k === k; });
    var j = i + by;
    if (i < 0 || j < 0 || j >= navEdit.items.length) { return; }
    var it = navEdit.items.splice(i, 1)[0];
    navEdit.items.splice(j, 0, it);
    arrangerRedraw();
    arrangerFocus(k, by < 0 ? '.pages-ebtn-up' : '.pages-ebtn-down');
  }
  // Puts the keyboard focus back on a row's control after a redraw, so up and down can be pressed again and again.
  function arrangerFocus(k, selector) {
    var row = shellNavEl && shellNavEl.querySelector('.pages-erow[data-k="' + k + '"]');
    var el = row && row.querySelector(selector);
    if (!el || el.disabled) { el = row && row.querySelector('.pages-ebtn:not([disabled]), input'); }
    if (el) {
      el.focus();
      if (el.select) { el.select(); }
    }
  }

  function arrangerButton(text, cls, title, onClick) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.textContent = text;
    b.title = title;
    b.setAttribute('aria-label', title);
    b.addEventListener('click', onClick);
    return b;
  }

  // One row of the arranger: the grip to drag it by, what it is, and its buttons.
  function arrangerRow(it, i, n) {
    var row = document.createElement('div');
    row.className = 'pages-erow pages-erow-' + it.t;
    row.setAttribute('data-k', it.k);

    var grip = document.createElement('span');
    grip.className = 'pages-grip';
    grip.title = 'Drag to move';
    grip.innerHTML = '<svg viewBox="0 0 8 12" aria-hidden="true"><circle cx="2" cy="2" r="1"/><circle cx="6" cy="2" r="1"/><circle cx="2" cy="6" r="1"/><circle cx="6" cy="6" r="1"/><circle cx="2" cy="10" r="1"/><circle cx="6" cy="10" r="1"/></svg>';
    arrangerDragWire(grip, row);
    row.appendChild(grip);

    var what;
    if (it.t === 'head') {
      what = document.createElement('input');
      what.type = 'text';
      what.className = 'pages-elabel';
      what.value = it.label;
      what.maxLength = LAYOUT_HEAD_MAX;
      what.placeholder = 'Heading';
      what.setAttribute('aria-label', 'Heading text');
      what.addEventListener('input', function () { it.label = what.value; });
      what.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') { ev.preventDefault(); what.blur(); }
      });
    } else if (it.t === 'link') {
      // A link's three settings, each changed in place: changing them never moves the row.
      what = document.createElement('div');
      what.className = 'pages-elink';
      var title = document.createElement('input');
      title.type = 'text';
      title.className = 'pages-elabel';
      title.value = it.label;
      title.maxLength = LAYOUT_HEAD_MAX;
      title.placeholder = 'Title';
      title.setAttribute('aria-label', 'Link title');
      title.addEventListener('input', function () { it.label = title.value; });
      var url = document.createElement('input');
      url.type = 'url';
      url.className = 'pages-eurl' + (linkUrlOk(it.url) ? '' : ' pages-ebad');
      url.value = it.url;
      url.placeholder = 'https://';
      url.setAttribute('aria-label', 'Link address');
      url.addEventListener('input', function () { it.url = url.value; url.classList.toggle('pages-ebad', !linkUrlOk(url.value)); });
      var tab = document.createElement('select');
      tab.className = 'pages-etab';
      tab.setAttribute('aria-label', 'Where the link opens');
      [['new', 'New tab'], ['same', 'This tab']].forEach(function (o) {
        var op = document.createElement('option');
        op.value = o[0];
        op.textContent = o[1];
        if (it.tab === o[0]) { op.selected = true; }
        tab.appendChild(op);
      });
      tab.addEventListener('change', function () { it.tab = tab.value; });
      [title, url].forEach(function (inp) {
        inp.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); inp.blur(); } });
      });
      what.appendChild(title);
      what.appendChild(url);
      what.appendChild(tab);
    } else {
      what = document.createElement('span');
      what.className = 'pages-elabel';
      what.textContent = it.t === 'page' ? pageMenuLabel(it.page) : (it.t === 'space' ? 'space' : 'line');
    }
    row.appendChild(what);

    var name = it.t === 'page' ? pageMenuLabel(it.page) : (it.t === 'link' ? 'link ' + (it.label || '') : it.t);
    var up = arrangerButton('▲', 'pages-ebtn pages-ebtn-up', 'Move ' + name + ' up', function () { arrangerMove(it.k, -1); });
    var down = arrangerButton('▼', 'pages-ebtn pages-ebtn-down', 'Move ' + name + ' down', function () { arrangerMove(it.k, 1); });
    up.disabled = (i === 0);
    down.disabled = (i === n - 1);
    row.appendChild(up);
    row.appendChild(down);
    // Pages are never removed here: the menu lists what exists. Spaces, lines and headings are the user's to remove.
    if (it.t !== 'page') {
      row.appendChild(arrangerButton('×', 'pages-ebtn pages-ebtn-remove', 'Remove this ' + (it.t === 'head' ? 'heading' : it.t), function () { arrangerRemove(it.k); }));
    }
    return row;
  }

  function arrangerEl() {
    // Pages may have come or gone since the draft was made: lay the draft over what exists now, keeping its keys.
    navEdit.items = arrangeEntries(navEdit.items).map(draftEntry);
    navEdit.availSig = availableSignature();
    navEdit.drawn = true;

    var box = document.createElement('div');
    box.className = 'pages-g pages-arranger';
    var list = document.createElement('div');
    list.className = 'pages-elist';
    var n = navEdit.items.length;
    navEdit.items.forEach(function (it, i) { list.appendChild(arrangerRow(it, i, n)); });
    box.appendChild(list);

    var add = document.createElement('div');
    add.className = 'pages-etools';
    add.appendChild(arrangerButton('+ SPACE', 'pages-btn', 'Add a space at the end of the menu', function () { arrangerAdd('space'); }));
    add.appendChild(arrangerButton('+ LINE', 'pages-btn', 'Add a line at the end of the menu', function () { arrangerAdd('line'); }));
    add.appendChild(arrangerButton('+ LINK', 'pages-btn', 'Add a link at the end of the menu: a title, an address and the tab it opens in', function () { arrangerAdd('link'); }));
    add.appendChild(arrangerButton('+ HEADING', 'pages-btn', 'Add a heading at the end of the menu', function () { arrangerAdd('head'); }));
    box.appendChild(add);

    var act = document.createElement('div');
    act.className = 'pages-etools';
    act.appendChild(arrangerButton('DONE', 'pages-btn pages-btn-done', 'Save this order', arrangerDone));
    act.appendChild(arrangerButton('CANCEL', 'pages-btn', 'Leave the menu as it was', arrangerCancel));
    act.appendChild(arrangerButton('RESET', 'pages-btn', 'Back to the order the pages were added in, with no spaces, lines, links or headings (saved by DONE)', arrangerReset));
    box.appendChild(act);
    if (navEdit.msg) {
      var msg = document.createElement('p');
      msg.className = 'pages-emsg';
      msg.setAttribute('role', 'status');
      msg.textContent = navEdit.msg;
      box.appendChild(msg);
    }

    box.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { ev.preventDefault(); arrangerCancel(); }
    });
    return box;
  }

  // Dragging a row by its grip. Pointer events serve the mouse, a trackpad and a finger alike. The row moves past a
  // neighbour as soon as the pointer, travelling toward it, is over it; the direction check keeps a short row and a
  // tall row from trading places back and forth. Rows are found by hit-testing, not by measuring, so the page zoom
  // (body zoom, 100 to 175%) never skews the arithmetic. The move and release are heard on the document, not the grip:
  // moving the row in the page releases any pointer capture the grip held.
  function arrangerDragWire(grip, row) {
    grip.addEventListener('pointerdown', function (ev) {
      if (!navEdit || navEdit.dragging || (ev.pointerType === 'mouse' && ev.button !== 0)) { return; }
      ev.preventDefault();
      var drag = { row: row, id: ev.pointerId, lastY: ev.clientY };
      navEdit.dragging = drag;
      row.classList.add('pages-dragging');
      function move(e) {
        if (e.pointerId !== drag.id) { return; }
        var dy = e.clientY - drag.lastY;
        if (!dy) { return; }
        drag.lastY = e.clientY;
        var hit = document.elementFromPoint(e.clientX, e.clientY);
        var target = (hit && hit.closest) ? hit.closest('.pages-erow') : null;
        if (!target || target === row || target.parentNode !== row.parentNode) { return; }
        var after = !!(row.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING);
        if (dy > 0 && after) { row.parentNode.insertBefore(row, target.nextSibling); }
        if (dy < 0 && !after) { row.parentNode.insertBefore(row, target); }
      }
      function end(e) {
        if (e.pointerId !== drag.id) { return; }
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', end);
        document.removeEventListener('pointercancel', end);
        row.classList.remove('pages-dragging');
        if (!navEdit || navEdit.dragging !== drag) { return; }
        navEdit.dragging = null;
        var order = Array.prototype.map.call(row.parentNode.querySelectorAll('.pages-erow'), function (r) { return r.getAttribute('data-k'); });
        var byK = {};
        navEdit.items.forEach(function (it) { byK[it.k] = it; });
        navEdit.items = order.map(function (k) { return byK[k]; }).filter(function (it) { return it; });
        arrangerRedraw();
      }
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', end);
      document.addEventListener('pointercancel', end);
    });
  }

  // Another tab of this project saved a layout: show it here too (the storage event fires only in the other tabs).
  window.addEventListener('storage', function (ev) {
    if (ev.key === LAYOUT_KEY && shellNavEl && !navEdit) { renderPagesGroup(shellNavEl); }
  });

  // Loads (or reloads) the site manifest, then (re)renders the PAGES
  // group. Reload uses a cache-busting query so a live delivery is
  // picked up without a page refresh.
  // ── THE DISK WATCH ────────────────────────────────────────────
  // Restores what 1.4.0 had and 1.5.0 lost. That version read board
  // data with fetch() on a live path; the CORS fix correctly moved
  // to <script src> because file:// pages are unique security
  // origins — but in swapping the transport it dropped the LOOP.
  // From 1.5.0 to 1.17.0 the page learned about disk only by being
  // told over the wire, then guessing a delay: 800ms for the nav,
  // 1200ms for boards. If the courier had not finished writing by
  // then, the page read the OLD file, rendered it faithfully, and
  // never looked again — so every surface sat exactly one delivery
  // behind, curable only by navigating.
  //
  // A <script> tag polls perfectly well; nothing about the CORS wall
  // forbade it. So DISK IS THE TRUTH AND THE LOOP WATCHES IT. The
  // wire drops from sole trigger to an optimisation that nudges the
  // watch to look sooner. Even with the wire completely dead the
  // page now converges within one interval.
  //
  // Core_13 §2.2: a changed state requires a known BEFORE. We hold
  // the last-rendered signature and redraw only on real difference,
  // so a quiet minute costs one script load and nothing else.

  var POLL_MS = 4000;
  var lastSiteSig = null;
  var lastBoardsSig = null;
  var pollTimer = null;

  // The ONE file reader. Every disk re-read in this engine goes
  // through here — a second path would drift (Core_05).
  function reinjectData(src, done) {
    var s = document.createElement('script');
    s.src = src + '?b=' + Date.now();
    s.onload = function () {
      if (s.parentNode) { s.parentNode.removeChild(s); }
      done(true);
    };
    s.onerror = function () {
      if (s.parentNode) { s.parentNode.removeChild(s); }
      done(false);
    };
    document.head.appendChild(s);
  }

  // ── THE LANES PAGE (2.7.0, Core_03) ── no file, no page.
  var LANES_SRC = '_data/lanes-data.js';
  var LANES_HASH = '#lanes';
  var LANES_STALE_MS = 24 * 60 * 60 * 1000;
  var LANES_ABSENT_PROBE_MS = 60000;
  var lanesPresent = false;
  var lastLanesSig = null;
  var lastLanesProbe = 0;
  var lastLanesStale = null;
  var lanesTitleSaved = null;

  function lanesData() {
    var d = window.DASH_LANES;
    return (d && typeof d === 'object') ? d : null;
  }
  function lanesSignature() {
    try { return JSON.stringify(lanesData()); } catch (e) { return ''; }
  }
  function lanesActive() {
    return lanesPresent && currentPageFile() === 'index.html' && location.hash === LANES_HASH;
  }
  function lanesEl(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) { e.className = cls; }
    if (text !== undefined && text !== null) { e.textContent = String(text); }
    return e;
  }
  // The seven Wire Access levels, one colour each (styles.css 1.6.0).
  function lanesLevelClass(level) {
    var k = String(level || '').toLowerCase().replace(/[^a-z]/g, '');
    var map = { full: 'full', update: 'update', read: 'read', custom: 'custom', mixed: 'mixed', noaccess: 'none', none: 'none', never: 'never' };
    return 'lv lv-' + (map[k] || 'none');
  }
  function lanesVerdictClass(r) {
    var v = String((r && r.verdict) || '');
    if (v === 'started') { return 'vd-live'; }
    if (v === 'finished') { return (r.exit === 0) ? 'vd-ok' : 'vd-bad'; }
    if (v === 'killed' || v === 'timed-out') { return 'vd-warn'; }
    if (v.indexOf('dropped') === 0) { return 'vd-bad'; }
    return '';
  }
  function lanesWhen(iso) {
    var t = Date.parse(iso);
    if (!isFinite(t)) { return '?'; }
    try { return new Date(t).toLocaleString(); } catch (e) { return String(iso); }
  }
  function lanesDuration(secs) {
    var n = Number(secs);
    if (!isFinite(n) || n < 0) { return ''; }
    if (n < 60) { return Math.round(n) + ' s'; }
    if (n < 3600) { return Math.floor(n / 60) + ' m ' + Math.round(n % 60) + ' s'; }
    return Math.floor(n / 3600) + ' h ' + Math.floor((n % 3600) / 60) + ' m';
  }
  function lanesIsStale(d) {
    var t = Date.parse(d && d.at);
    return !isFinite(t) || (Date.now() - t) > LANES_STALE_MS;
  }
  function lanesTable(heads) {
    var t = lanesEl('table', 'lanes-table');
    var tr = lanesEl('tr');
    heads.forEach(function (h) { tr.appendChild(lanesEl('th', null, h)); });
    var thead = lanesEl('thead'); thead.appendChild(tr); t.appendChild(thead);
    var tb = lanesEl('tbody'); t.appendChild(tb);
    return { table: t, body: tb };
  }
  function lanesRow(body, cells) {
    var tr = lanesEl('tr');
    cells.forEach(function (c) {
      var td = lanesEl('td', c.cls || null);
      if (c.node) { td.appendChild(c.node); } else { td.textContent = (c.text === undefined || c.text === null) ? '' : String(c.text); }
      if (c.pad) { td.style.paddingLeft = c.pad; }
      tr.appendChild(td);
    });
    body.appendChild(tr);
  }

  function renderLanes(mount) {
    var d = lanesData();
    mount.textContent = '';
    if (!d) { return; }
    var stale = lanesIsStale(d);
    lastLanesStale = stale;

    if (stale) {
      var age = Date.parse(d.at);
      var msg = isFinite(age)
        ? 'STALE: this snapshot is ' + Math.floor((Date.now() - age) / 3600000) + ' hours old. The courier rewrites it at every Launch and on every rule change; what the wire may do now could differ.'
        : 'STALE: this snapshot carries no time, so it cannot be trusted as current. The courier rewrites it at every Launch and on every rule change.';
      mount.appendChild(lanesEl('div', 'lanes-stale', msg));
    }

    // FILES — the effective level per folder and file.
    var files = Array.isArray(d.files) ? d.files : [];
    mount.appendChild(lanesEl('h2', null, 'FILES'));
    mount.appendChild(lanesEl('div', 'lanes-sub', 'Snapshot ' + lanesWhen(d.at) + (d.courier ? ' · courier ' + d.courier : '') + ' · ' + files.length + ' paths · what the file lane may do, as Wire Access shows it'));
    var key = lanesEl('div', 'lanes-key');
    ['Full', 'Update', 'Read', 'Custom', 'Mixed', 'No access', 'Never'].forEach(function (lv) {
      key.appendChild(lanesEl('span', lanesLevelClass(lv), lv.toUpperCase()));
    });
    mount.appendChild(key);
    var ft = lanesTable(['LEVEL', 'PATH', 'MAY', 'TYPES']);
    files.forEach(function (f) {
      if (!f) { return; }
      var p = String(f.path || '');
      var depth = (p === '' || p === '.') ? 0 : p.split('/').length - 1;
      var name = (p === '' || p === '.') ? '(project root)' : p.split('/').pop() + (f.dir === false ? '' : '/');
      lanesRow(ft.body, [
        { node: lanesEl('span', lanesLevelClass(f.level), String(f.level || 'No access').toUpperCase()) },
        { text: name, cls: 'lanes-path', pad: (8 + depth * 16) + 'px' },
        { text: Array.isArray(f.allow) ? f.allow.join(', ') : '', cls: 'lanes-dim' },
        { text: Array.isArray(f.types) ? f.types.join(', ') : '', cls: 'lanes-dim' }
      ]);
    });
    if (!files.length) { lanesRow(ft.body, [{ text: '' }, { text: 'No paths in the snapshot.', cls: 'lanes-dim' }, { text: '' }, { text: '' }]); }
    mount.appendChild(ft.table);

    // CAN RUN — the run lane in plain words.
    var run = (d.run && typeof d.run === 'object') ? d.run : {};
    mount.appendChild(lanesEl('h2', null, 'CAN RUN'));
    if (run.open === false) {
      mount.appendChild(lanesEl('div', 'lanes-closed', 'THE RUN LANE IS CLOSED' + (run.reason ? ': ' + run.reason : '') + '. Nothing runs until the rules are fixed; every other wire kind keeps working.'));
    }
    var rt = lanesTable(['APPROVAL', 'RULE']);
    (Array.isArray(run.rules) ? run.rules : []).forEach(function (r) {
      if (!r) { return; }
      var each = String(r.approve || '') === 'each';
      lanesRow(rt.body, [
        { node: lanesEl('span', 'lv ' + (each ? 'lv-custom' : 'lv-full'), each ? 'EACH' : 'NONE') },
        { text: r.text || '' }
      ]);
    });
    (Array.isArray(run.deny) ? run.deny : []).forEach(function (t) {
      lanesRow(rt.body, [{ node: lanesEl('span', 'lv lv-never', 'DENY') }, { text: t }]);
    });
    (Array.isArray(run.refusals) ? run.refusals : []).forEach(function (t) {
      lanesRow(rt.body, [{ node: lanesEl('span', 'lv lv-never', 'NEVER') }, { text: t, cls: 'lanes-dim' }]);
    });
    if (!rt.body.childNodes.length) { lanesRow(rt.body, [{ text: '' }, { text: 'No run rules. Nothing may run.', cls: 'lanes-dim' }]); }
    mount.appendChild(rt.table);

    // RECENT RUNS — the run ledger's last 20, newest first.
    var runs = (Array.isArray(d.runs) ? d.runs.slice() : []).filter(Boolean);
    runs.sort(function (a, b) { return (Date.parse(b.at) || 0) - (Date.parse(a.at) || 0); });
    mount.appendChild(lanesEl('h2', null, 'RECENT RUNS'));
    var xt = lanesTable(['WHEN', 'WHAT', 'VERDICT', 'EXIT', 'TOOK']);
    runs.slice(0, 20).forEach(function (r) {
      lanesRow(xt.body, [
        { text: lanesWhen(r.at), cls: 'lanes-dim' },
        { text: r.what || '' },
        { text: r.verdict || '', cls: lanesVerdictClass(r) },
        { text: (r.exit === undefined || r.exit === null) ? '' : r.exit },
        { text: lanesDuration(r.secs), cls: 'lanes-dim' }
      ]);
    });
    if (!runs.length) { lanesRow(xt.body, [{ text: '' }, { text: 'No runs yet.', cls: 'lanes-dim' }, { text: '' }, { text: '' }, { text: '' }]); }
    mount.appendChild(xt.table);
  }

  // Shows or hides the Lanes view on Home. The page's own content is
  // hidden, never removed, so leaving #lanes restores it untouched.
  function applyLanesView() {
    var main = document.querySelector('.frame > main');
    if (!main) { return; }
    var mount = document.getElementById('mai-lanes');
    var pSpan = document.querySelector('header h1 .p');
    if (!lanesActive()) {
      if (mount) { mount.parentNode.removeChild(mount); }
      Array.prototype.forEach.call(main.children, function (c) {
        if (c.hasAttribute('data-lanes-hid')) { c.style.display = c.getAttribute('data-lanes-hid'); c.removeAttribute('data-lanes-hid'); }
      });
      if (pSpan && lanesTitleSaved !== null) { pSpan.textContent = lanesTitleSaved; lanesTitleSaved = null; }
      return;
    }
    Array.prototype.forEach.call(main.children, function (c) {
      if (c.id === 'mai-lanes' || c.hasAttribute('data-lanes-hid')) { return; }
      c.setAttribute('data-lanes-hid', c.style.display || '');
      c.style.display = 'none';
    });
    if (!mount) { mount = lanesEl('section'); mount.id = 'mai-lanes'; main.insertBefore(mount, main.firstChild); }
    if (pSpan) { if (lanesTitleSaved === null) { lanesTitleSaved = pSpan.textContent; } pSpan.textContent = 'LANES'; }
    renderLanes(mount);
  }

  // Takes the result of one read of the lanes file. Returns true when
  // what is on disk differs from what was last drawn.
  function adoptLanes(ok) {
    var was = lanesPresent;
    if (!ok) { window.DASH_LANES = undefined; }
    lanesPresent = !!(ok && lanesData());
    var sig = lanesPresent ? lanesSignature() : null;
    var changed = (sig !== lastLanesSig) || (was !== lanesPresent);
    lastLanesSig = sig;
    if (changed) {
      if (shellNavEl) { renderPagesGroup(shellNavEl); }
      applyLanesView();
    } else if (lanesActive() && lanesIsStale(lanesData()) !== lastLanesStale) {
      applyLanesView();   // the 24-hour line crossed while the page sat open
    }
    return changed;
  }
  function loadLanes() {
    if (!shellNavEl) { return; }        // structured legacy page — untouched
    lastLanesProbe = Date.now();
    reinjectData(LANES_SRC, function (ok) { adoptLanes(ok); });
  }

  function siteSignature() {
    var site = window.DASH_SITE;
    return JSON.stringify((site && site.pages) || []);
  }

  function boardsSignature() {
    var d = window.DASH_BOARDS;
    return JSON.stringify((d && d.boards) || []);
  }

  // One sweep: read what is on disk, compare, redraw only on change.
  //
  // THE CADENCE LIVES HERE (1.21.0). It used to sound when a PAYLOAD
  // arrived, which is the wrong moment twice over. It collided with
  // AiAssist's beam_down — both announcing the same instant from two
  // processes — and it was not even true: a payload can arrive for a
  // file that changes nothing on the page you are reading.
  //
  // Sounded from the change branch instead, it means what Greg
  // wanted it to mean: THIS DOCUMENT NOW HAS DIFFERENT CONTENT. The
  // overlap resolves itself with no timing hack, because the watch
  // can only notice a change AFTER the courier finished writing —
  // beam_down, then a beat, then the cadence. Sequence rather than
  // collision, and nothing waits on a guessed duration.
  function pollDisk() {
    var pending = 0;
    var changed = false;

    // One cadence per sweep even if both files moved — two sounds
    // for one redraw would be the collision we just removed.
    function finish() {
      pending -= 1;
      if (pending === 0 && changed) { chime('arrival'); }
    }

    if (shellNavEl) {
      pending += 1;
      reinjectData('_data/site-data.js', function (ok) {
        if (ok) {
          var sig = siteSignature();
          if (sig !== lastSiteSig) {
            lastSiteSig = sig;
            renderPagesGroup(shellNavEl);
            changed = true;
          }
        }
        finish();
      });
    }

    // 2.7.0: the lanes file. Every sweep while it exists; once a
    // minute while it does not, so an absent file costs little.
    if (shellNavEl && (lanesPresent || Date.now() - lastLanesProbe >= LANES_ABSENT_PROBE_MS)) {
      pending += 1;
      lastLanesProbe = Date.now();
      reinjectData(LANES_SRC, function (ok) {
        var hadLanes = lanesPresent;
        if (adoptLanes(ok) && hadLanes) { changed = true; }
        finish();
      });
    }

    if (boardsMount()) {
      pending += 1;
      reinjectData('_data/boards-data.js', function (ok) {
        if (ok) {
          var sig = boardsSignature();
          if (sig !== lastBoardsSig) {
            lastBoardsSig = sig;
            adoptDurableBoards();
            changed = true;
          }
        }
        finish();
      });
    }
  }

  // A wire payload means "look sooner," never "it has landed." The
  // burst covers a fast courier; the steady loop covers a slow one.
  // 2.6.0 (audit J-15): one look now and one 1.5 s later, and a nudge while those are pending adds nothing. Every
  // file payload used to fire three sweeps of its own, so a burst of chunks multiplied into dozens of reads.
  var nudgeTimer = null;
  function nudgeDisk() {
    if (nudgeTimer) return;
    pollDisk();
    nudgeTimer = setTimeout(function () { nudgeTimer = null; pollDisk(); }, 1500);
  }

  // ── STAMP STRIP HELPERS ───────────────────────────────────────
  // The fingerprint is the auth phrase every wire payload carries —
  // the one the courier recomputes from the routed project's own
  // methodology bytes at verification time. Capturing it from live
  // traffic means the strip shows what is ACTUALLY in force; a
  // configured value could only ever be a claim.

  function fingerprintKey() { return 'mai-wire-fp--' + PROJECT; }

  // The ENGINE fingerprint, supplied by LivingDashboardScaffolder in
  // _data/stamp-data.js at snapshot time. Read through the same
  // reinjectData channel as every other data file — a page cannot
  // hash its own framework under file://.
  function enginePhrase() {
    var s = window.DASH_STAMP;
    return (s && s.enginePhrase) || null;
  }

  // THE METHODOLOGY SEED (1.23.0). AiAssist writes the methodology
  // phrase into stamp-data.js at Launch — same trust model as the
  // engine phrase: recorded by the component that actually hashed
  // the bytes, because this page cannot (file:// CORS).
  function methodologySeed() {
    var s = window.DASH_STAMP;
    return (s && s.methodologyPhrase) || null;
  }

  // THE TOOLS PHRASE (2.9.0). AiAssist writes it beside the
  // methodology phrase at Launch; same trust model, same channel.
  function toolsSeed() {
    var s = window.DASH_STAMP;
    return (s && s.toolsPhrase) || null;
  }

  function loadStamp() {
    reinjectData('_data/stamp-data.js', function (ok) {
      if (!ok) { return; }                 // not stamped yet — cells stand
      var cell = document.querySelector('.stampstrip .stampval-dashboard');
      if (cell) { cell.textContent = enginePhrase() || 'not stamped'; }
      // A fresh stamp may carry a rotated methodology phrase (a
      // Launch happened) — repaint it too, so the strip catches a
      // rotation within one disk-watch sweep, no wire traffic needed.
      var seed = methodologySeed();
      var mCell = document.querySelector('.stampstrip .stampval-methodology');
      if (mCell && seed) { mCell.textContent = seed; }
      var tools = toolsSeed();
      var tCell = document.querySelector('.stampstrip .stampval-tools');
      if (tCell && tools) { tCell.textContent = tools; }
    });
  }

  function readFingerprint() {
    try { return localStorage.getItem(fingerprintKey()); } catch (e) { return null; }
  }

  function noteFingerprint(phrase) {
    if (!phrase) { return; }
    try {
      if (localStorage.getItem(fingerprintKey()) === phrase) { return; }
      localStorage.setItem(fingerprintKey(), phrase);
    } catch (e) {}
    var cell = document.querySelector('.stampstrip .stampval-methodology');
    if (cell) { cell.textContent = phrase; }
  }

  function stampCell(label, value, hint, keyIcon) {
    var wrap = document.createElement('span');
    wrap.className = 'stampcell';
    if (hint) { wrap.title = hint; }
    var k = document.createElement('span');
    k.className = 'stampkey';
    k.textContent = label;
    // The fingerprint cells carry a small fingerprint glyph (Greg's
    // call, 1.22.1 — the value IS a fingerprint, not a key). Inline
    // SVG in currentColor, not an emoji: an emoji renders full-color
    // and would clash with the muted strip, while the SVG inherits
    // the label's exact color.
    if (keyIcon) {
      var icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      icon.setAttribute('class', 'stampkeyicon');
      icon.setAttribute('viewBox', '0 0 24 24');
      icon.setAttribute('fill', 'none');
      icon.setAttribute('stroke', 'currentColor');
      icon.setAttribute('stroke-width', '2.2');
      icon.setAttribute('stroke-linecap', 'round');
      icon.innerHTML = '<path d="M5 13a7 7 0 0 1 14 0c0 3-.8 6-2.2 8"/>' +
        '<path d="M8.5 13a3.5 3.5 0 0 1 7 0c0 3.4-.7 6.4-1.8 8.6"/>' +
        '<path d="M12 13c0 3.2-.5 6.4-1.6 9"/>';
      k.appendChild(icon);
    }
    var v = document.createElement('span');
    // Slug, not the raw label: a multi-word label like "engine ver"
    // would otherwise produce "stampval-engine ver" — two classes,
    // and every lookup by the full name silently missing.
    v.className = 'stampval stampval-' + label.replace(/\s+/g, '-');
    v.textContent = value;
    wrap.appendChild(k); wrap.appendChild(v);
    return wrap;
  }

  function startDiskWatch() {
    if (pollTimer) { clearInterval(pollTimer); }
    lastSiteSig = siteSignature();
    lastBoardsSig = boardsSignature();
    pollTimer = setInterval(pollDisk, POLL_MS);
  }

  // When the wire delivers the page being viewed, reloading on a
  // fixed beat has the same flaw as everything above. Watch this
  // page's own manifest stamp instead and reload once it actually
  // advances — bounded, then reload anyway rather than stall.
  function reloadWhenSelfLands() {
    var here = currentPageFile();
    var before = 0;
    (window.DASH_SITE && window.DASH_SITE.pages || []).forEach(function (p) {
      if (p && String(p.href).toLowerCase() === here) { before = p.ts || 0; }
    });

    var tries = 0;
    (function attempt() {
      tries++;
      reinjectData('_data/site-data.js', function () {
        var now = 0;
        (window.DASH_SITE && window.DASH_SITE.pages || []).forEach(function (p) {
          if (p && String(p.href).toLowerCase() === here) { now = p.ts || 0; }
        });
        if (now > before || tries >= 12) { clearSelfReloadPending(); location.reload(); return; }
        setTimeout(attempt, 500);
      });
    })();
  }

  // --- 1.28.0: the reload that survives a throttled tab -----------
  // Browsers throttle background tabs: timers stretch, and a stalled
  // reloadWhenSelfLands can leave an updated file under a stale view
  // with no second chance. The pending flag is that second chance —
  // persisted per page, checked the instant the tab is seen again
  // (visibilitychange/focus) and once at boot in case the tab was
  // killed mid-stall. The flag clears ON reload, so it fires once.
  function selfReloadKey() {
    return 'mai-self-reload-' + PROJECT + '-' + currentPageFile();
  }
  // 1.28.2: the envelope time of the last self-delivery this page
  // ACTED on. Replays of that delivery (or anything older) can
  // never reload again — persisted, so it survives the reload it
  // protects against.
  function consumedStampKey() {
    return 'mai-self-consumed-' + PROJECT + '-' + currentPageFile();
  }
  function readConsumedStamp() {
    try { return Number(localStorage.getItem(consumedStampKey())) || 0; } catch (e) { return 0; }
  }
  function markConsumedStamp(t) {
    try {
      var prev = readConsumedStamp();
      if (t > prev) { localStorage.setItem(consumedStampKey(), String(t)); }
    } catch (e) {}
  }
  function markSelfReloadPending() {
    try { localStorage.setItem(selfReloadKey(), String(Date.now())); } catch (e) {}
  }
  function clearSelfReloadPending() {
    try { localStorage.removeItem(selfReloadKey()); } catch (e) {}
  }
  function fireIfSelfReloadPending(origin) {
    var stamp = null;
    try { stamp = localStorage.getItem(selfReloadKey()); } catch (e) {}
    if (!stamp) { return; }
    try { console.log('[wire] pending self-reload found (' + origin + ') — reloading'); } catch (e) {}
    clearSelfReloadPending();
    location.reload();
  }
  function selfToast(msg) {
    try {
      var el = document.createElement('div');
      el.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:99999;' +
        'background:#15161a;border:1px solid rgba(255,180,60,.4);color:#ffd498;' +
        'font:11px monospace;padding:8px 12px;border-radius:6px;';
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 3000);
    } catch (e) {}
  }

  // Initial manifest read at page load. Now cache-busted like every
  // other read — the no-query version could be served from cache,
  // which is how a page could open already showing a stale nav.
  function loadSite(rebuild) {
    if (!shellNavEl) { return; }        // structured legacy page — untouched
    var s = document.createElement('script');
    s.src = '_data/site-data.js?b=' + Date.now();
    s.onload = function () {
      lastSiteSig = siteSignature();
      renderPagesGroup(shellNavEl);
    };
    s.onerror = function () {};          // no manifest yet — fallback stands
    document.head.appendChild(s);
  }

  function buildShell() {
    if (!isThinShell()) return;

    var name = window.DASH_NAME ||
      (typeof window.DASH_PROJECT === 'string' ? window.DASH_PROJECT.toUpperCase() : 'PROJECT');
    var founded = window.DASH_FOUNDED || pageMeta('mai-founded');
    // Banner names WHERE YOU ARE (Greg's ruling, 2026-07-30):
    // secondary pages declare their name via DASH_PAGE; the home
    // page is HOME. (The project name beside it says whose
    // instrument this is.)
    var pageTitle = window.DASH_PAGE || 'HOME';

    // Header — built, never copied.
    var header = document.createElement('header');
    // Header stacks two rows (1.27.1, Greg's placement): the title,
    // then a flex row holding the stamp strip with the STATUS KEY
    // floating balanced between the strip's end and the zoom
    // control — same row, every page.
    var h1 = document.createElement('h1');
    var vSpan = document.createElement('span'); vSpan.className = 'v'; vSpan.textContent = name;
    var pSpan = document.createElement('span'); pSpan.className = 'p'; pSpan.textContent = pageTitle;
    h1.appendChild(vSpan); h1.appendChild(document.createTextNode(' — ')); h1.appendChild(pSpan);
    header.appendChild(h1);

    // THE STAMP STRIP (Greg's ask, 1.18.0) — instrumentation, not
    // decoration. Three things you otherwise have to go digging for:
    // which engine is actually running, which template founded this
    // page, and which methodology fingerprint the wire is currently
    // authenticating against. "Never guess" applies to the page's
    // own provenance too, and DASH_ENGINE_VERSION in a console you
    // have to remember to open is not the same as it being visible.
    //
    // The fingerprint is OBSERVED, never configured: every payload
    // carries the auth phrase the courier verified against, so the
    // page captures it from the wire and persists it. It shows the
    // phrase actually in force, not one somebody typed in.
    // THE STAMP STRIP (Greg's ask, 1.18.0; labels corrected 1.18.2).
    // Instrumentation, not decoration. There are TWO fingerprints in
    // this system and they answer different questions:
    //
    //   METHODOLOGY — SHA-256 of AI_Directive_Methodology.md. Which
    //     directive build the wire authenticates against. Observed
    //     from payload auth, so it shows what is actually in force.
    //   DASHBOARD — MaiFingerprint.frameworkFingerprint() over
    //     dashboard.js + styles.css. Whether this project's snapshot
    //     matches the engine source. Supplied by the scaffolder in
    //     _data/stamp-data.js, because the page cannot hash its own
    //     framework (fetch is CORS-blocked under file://).
    //
    // Both were once labelled just "fingerprint", which invited the
    // obvious question of why the two never agreed. They are not
    // meant to. The label IS the disambiguation.
    var stamp = document.createElement('div');
    stamp.className = 'stampstrip';

    // Every cell carries a tooltip saying what it IS and what to
    // compare it against (Greg: "I'm not sure I'd know what this
    // means in a week"). A four-character label cannot carry
    // meaning; instrumentation nobody can interpret is noise. The
    // template version was dropped here for exactly that reason —
    // founding provenance that never changes and prompts no action,
    // already recorded in the page's meta tags and footer.
    stamp.appendChild(stampCell('engine ver', ENGINE_VERSION,
      'Which dashboard engine is actually running on this page. ' +
      'A <script src> carries no version stamp, so this is the only ' +
      'way to know a re-snapshot landed — never guess it.'));

    // Display precedence (1.23.0): seed → observed → awaiting.
    // The seed is disk truth at the most recent Launch; the cached
    // observation may PREDATE the rotation. Live payload auth still
    // updates the cell in-session (noteFingerprint), and a payload
    // phrase differing from the seed is visible evidence of a stale
    // sender. The localStorage cache keeps its honest meaning — the
    // last phrase WITNESSED on the wire; only display order changed.
    stamp.appendChild(stampCell('methodology',
      methodologySeed() || readFingerprint() || 'awaiting wire',
      'The directive build the wire authenticates against — seeded ' +
      'by AiAssist at Launch, confirmed live from payload auth. ' +
      'Compare with mAi™ METHODOLOGY FINGERPRINT in AiAssist ' +
      'Mission Control — they must match. "awaiting wire" means ' +
      'neither a Launch stamp nor a payload has reached this page yet.', true));

    stamp.appendChild(stampCell('tools', toolsSeed() || 'not stamped',
      'Fingerprint of AI_Directive_Tools.md, seeded by AiAssist at ' +
      'Launch. Compare with the TOOLS card in AiAssist and the Tools ' +
      'fingerprint in the code zip’s _manifest.md; they must match.', true));

    stamp.appendChild(stampCell('dashboard', enginePhrase() || 'not stamped',
      'Fingerprint of THIS dashboard\u2019s framework snapshot ' +
      '(dashboard.js + styles.css). Compare with mAi™ DASHBOARD ' +
      'FINGERPRINT on the Living Dashboard card — a mismatch means ' +
      'the snapshot has drifted from the engine source.', true));

    // Sound toggle — clickable, persisted per project. Chunk ticks
    // and the completion chime both honour it.
    var soundCell = stampCell('sound', soundLabel(),
      'Wire sounds: AiAssist ticks once per chunk it holds, then ' +
      'this page rings G\u2013E\u2013C when the file lands. Click to ' +
      'toggle \u2014 and to hear it.');
    soundCell.style.cursor = 'pointer';
    soundCell.addEventListener('click', toggleSound);
    stamp.appendChild(soundCell);

    // Row 2 — the stamp strip and the STATUS KEY share one line
    // (Greg's placement, 1.27.1): strip left, key floating balanced
    // in the space between the strip's end and the zoom control.
    // The key is on EVERY page: status dots speak on secondary
    // pages too, and the vocabulary legend belongs wherever the
    // vocabulary is spoken (identical glyphs + colors to the dots).
    var hrow2 = document.createElement('div');
    hrow2.className = 'hrow2';
    hrow2.appendChild(stamp);
    var key = document.createElement('div');
    key.className = 'statuskey';
    [['done','Done'],['live','Live now'],['part','In progress'],['plan','Planned']]
      .forEach(function (pair) {
        var item = document.createElement('span');
        var dot = document.createElement('span');
        dot.className = 'wb-s s-' + pair[0];
        dot.textContent = { done:'\u25CF', live:'\u25CF', part:'\u25D0', plan:'\u25CB' }[pair[0]];
        item.appendChild(dot);
        item.appendChild(document.createTextNode(' ' + pair[1]));
        key.appendChild(item);
      });
    hrow2.appendChild(key);
    header.appendChild(hrow2);
    // No sub-line (Greg's tuning, 2026-07-30): the banner is title
    // only — founding provenance lives in the meta tags + footer.

    // App shell — frame holding nav + main.
    var frame = document.createElement('div'); frame.className = 'frame';
    var nav = document.createElement('nav');
    var main = document.createElement('main');

    // Live boards region — MAIN INSTRUMENT ONLY (a page declaring
    // DASH_PAGE is a secondary page; boards live on the dashboard).
    // Then the project's authored content moved INTO main (it stays
    // the project's — the engine only relocates it).
    if (!window.DASH_PAGE) {
      // The boards region's section heading — COMPACT (Greg,
      // 2026-07-30): title + one-line descriptor inline, no
      // stretched spacing, no top gap (it opens the page).
      // (The STATUS KEY lived here 1.10.0→1.26.2; it moved to the
      // header at 1.27.0 so every page carries the vocabulary.)
      // 2.5.0 WORK FIRST (Greg): the authored board is the first thing
      // on the page, the live boards sit directly under it with no
      // heading, and the wire deck is a single quiet line at the
      // bottom that opens the chart on click. Telemetry never sits
      // above the work again.
      var authoredFirst = document.getElementById('authored');
      if (authoredFirst) { main.appendChild(authoredFirst); }
      var boards = document.createElement('div'); boards.id = 'wire-boards';
      main.appendChild(boards);
      var deck = document.createElement('section'); deck.id = 'mai-deck';
      deck.setAttribute('style', 'display:none;grid-template-columns:minmax(0,2fr) minmax(220px,1fr);gap:18px;align-items:start;margin:14px 0 0;');
      main.appendChild(deck);
    }
    var authored = document.getElementById('authored');
    if (authored && authored.parentNode !== main) { main.appendChild(authored); }   // 2.5.2 (Greg: Backlog and Completed have no navigation): a secondary page's authored content goes into main too; it sat in the body under the frame, the nav squeezed above it

    // Nav — OBSERVED from what actually exists, never a stale list:
    // Live anchor, then one link per authored section[id].
    // Nav caps come from the module-scope navCap helper.
    // --- NAV: two honestly-named groups (Greg's design, 2026-07-30).
    // PAGES — consistent site navigation on every page, driven by the
    //   courier-maintained manifest (_data/site-data.js). Current page
    //   highlighted; (New)/(Updated) badges from manifest timestamps
    //   vs when YOU last visited (localStorage). Falls back to the
    //   identity declarations (DASH_HOME/DASH_LEDGER) until the
    //   manifest exists.
    // ON THIS PAGE — the old "MAP": this page's own sections,
    //   observed from #authored, plus the Live anchor on the main
    //   instrument.
    shellNavEl = nav;
    renderPagesGroup(nav);

    nav.appendChild(navCap('ON THIS PAGE'));
    if (authored) {
      authored.querySelectorAll('section[id]').forEach(function (sec) {
        var a = document.createElement('a');
        a.href = '#' + sec.id;
        var label = sec.id;
        var h2 = sec.querySelector('h2');
        if (h2 && h2.childNodes.length) {
          var t = (h2.childNodes[0].textContent || '').trim();
          if (t) { label = t.charAt(0) + t.slice(1).toLowerCase(); }
        }
        a.textContent = label;
        nav.appendChild(a);
      });
    }
    // Zoom lives in the header corner on shell pages (Greg's
    // placement, 2026-07-30) — no ZOOM group in the nav.

    frame.appendChild(nav);
    frame.appendChild(main);

    // Footer — provenance OBSERVED from the page's own meta tags.
    var footer = document.createElement('footer');
    var tv = pageMeta('mai-template-version');
    footer.textContent = name + ' · thin shell' +
      (tv ? ' · founded from template v' + tv : '') +
      ' · engine: _framework/ (stamped) · MissionWares® — Pioneering AI-Assisted Development Excellence';

    header.style.position = 'relative';   // hosts the corner zoom control

    // Assemble in document order.
    document.body.insertBefore(frame, document.body.firstChild);
    document.body.insertBefore(header, frame);
    document.body.appendChild(footer);
  }

  // --- Zoom control (a quiet dropdown — Greg's tuning, 2026-07-30:
  // this setting rarely changes, so it stays small and out of the
  // way; the choice persists across pages and reopens as before) ---
  function renderChips() {
    // Shell pages: the control sits small in the header's corner,
    // just above the NOW strip's timestamp (Greg's placement).
    // Legacy structured pages keep their own #view-mount in the nav.
    const mount = shellNavEl ? document.querySelector('header')
                             : document.getElementById('view-mount');
    if (!mount) return;
    const sel = document.createElement('select');
    sel.className = 'zoomsel';
    LEVELS.forEach(function (z) {
      const o = document.createElement('option');
      o.value = z; o.textContent = z + '%';
      sel.appendChild(o);
    });
    sel.value = String(readSaved());
    sel.addEventListener('change', function () { applyZoom(parseInt(sel.value, 10)); });
    mount.appendChild(sel);
  }

  // --- THE WIRE — Phase 1, page side --------------------------------
  // Fleet topic: one wire serves every mAi project; this page keeps
  // only payloads whose project key matches. The page renders DATA
  // and never executes pushed content; disk writes are the AiAssist
  // courier's job (Phase 2), behind fingerprint verification.
  const WIRE_TOPIC = 'greg-mai-wire-k4m9';
  // Routing key: PROJECT, resolved once at the top of the engine
  // (2.0.0) from the page's own window.DASH_PROJECT declaration.
  let audioCtx = null;
  let pendingVoice = null;   // a cadence attempted while unarmed — replayed on arming

  // ANY TOUCH ARMS (1.22.0). Chrome's autoplay policy blocks web
  // audio until a user gesture on the page, and for file:// pages
  // that wall NEVER relaxes — the engagement score that earns real
  // sites auto-play rights does not accrue for local files, so every
  // load starts muted by design. There is no pure-JS bypass. What
  // there IS: Chrome accepts ANY genuine gesture, not just a click
  // on the SOUND cell — so the page listens for the first
  // pointerup/click/keydown anywhere and arms on it. The gesture the
  // user was going to make anyway does the job; the "bump" vanishes
  // into normal use.
  //
  // Armed is VERIFIED, never assumed (Core_13: observe, don't hope):
  // only a context actually reporting 'running' counts. A gesture
  // Chrome rejected leaves the listeners in place for the next one.
  function armed() {
    return !!(audioCtx && audioCtx.state === 'running');
  }

  function tryArm() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    }
    if (audioCtx.state === 'running') { onArmed(); return; }
    audioCtx.resume().then(function () {
      if (armed()) { onArmed(); }
    }).catch(function () {});
  }

  function onArmed() {
    ['pointerdown', 'pointerup', 'click', 'keydown'].forEach(function (ev) {
      window.removeEventListener(ev, tryArm, true);
    });
    refreshSoundCell();
    // A change that landed during the silent window is announced
    // late rather than lost.
    if (pendingVoice && soundOn()) {
      var v = pendingVoice;
      setTimeout(function () { chime(v); }, 120);
    }
    pendingVoice = null;
  }

  function installArmListeners() {
    ['pointerdown', 'pointerup', 'click', 'keydown'].forEach(function (ev) {
      window.addEventListener(ev, tryArm, true);
    });
    // The strip exists by now (buildShell runs earlier in init) —
    // paint the initial dim state before the first arm attempt.
    refreshSoundCell();
    // Some configurations (Firefox defaults, Chrome launched with
    // --autoplay-policy=no-user-gesture-required) allow audio with
    // no gesture at all — try immediately and take the free win.
    tryArm();
  }

  // SOUND has THREE states, not two (1.19.1) — but the third no
  // longer needs WORDS (1.22.0). "on" with unarmed audio was the
  // invisible-state bug; the fix was the "click to arm" text, which
  // was honest but unpolished. Now the label reads on/off only and
  // the CELL ITSELF dims until the context reports running — the
  // state stays visible, the clutter goes, and with any-touch
  // arming the dim lasts only until the first natural interaction.
  function soundLabel() {
    return soundOn() ? 'on' : 'off';
  }

  function refreshSoundCell() {
    var cell = document.querySelector('.stampstrip .stampval-sound');
    if (!cell) { return; }
    cell.textContent = soundLabel();
    cell.classList.toggle('unarmed', soundOn() && !armed());
  }

  // NOTE (1.19.0): the page has no tick. Chunk-progress sound is
  // AiAssist's, emitted by WireCourier where the assembler actually
  // holds pieces. The page's voice is the arrival cadence below —
  // one sound, at the one moment this page can honestly speak to.

  function soundKey() { return 'mai-wire-sound--' + PROJECT; }

  function soundOn() {
    try { return localStorage.getItem(soundKey()) !== 'off'; } catch (e) { return true; }
  }

  function toggleSound() {
    var next = soundOn() ? 'off' : 'on';
    try { localStorage.setItem(soundKey(), next); } catch (e) {}

    // Turning sound ON plays the arrival cadence immediately
    // (Greg's ask). Two jobs in one gesture: it confirms the toggle
    // took, and the click itself is the user gesture that ARMS
    // WebAudio. Playing the full G–E–C rather than a single note
    // also lets you hear exactly what you just enabled.
    if (next === 'on') {
      tryArm();
      setTimeout(chime, 60);
    }
    refreshSoundCell();
  }

  // ARRIVAL — the NBC chimes, G–E–C (Greg's ask, 1.19.0).
  //
  // The ticks are AiAssist's: percussive, identical, neutral, one
  // per chunk held. They are rhythm — the sound of transit. This is
  // the page's own voice and it should be a CADENCE, not another
  // beep: a descending resolve from the dominant (G) through the
  // mediant (E) to the tonic (C). The ear does not merely register
  // it, it hears ARRIVAL — tension released and landed home.
  //
  // NBC adopted these three notes as a station identification: the
  // sound of a transmission completing and naming itself. For a
  // wire that assembles pieces and delivers a file, the borrowing
  // is apt rather than clever.
  //
  // Each note rings as a fundamental plus a soft octave partial
  // with exponential decay — tubular-bell character rather than a
  // bare oscillator. The final C rings nearly twice as long, so the
  // phrase settles instead of stopping.
  function ring(freq, at, dur) {
    [[freq, 0.16], [freq * 2, 0.045]].forEach(function (p) {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.value = p[0];
      o.connect(g); g.connect(audioCtx.destination);
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(p[1], at + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      o.start(at); o.stop(at + dur + 0.05);
    });
  }

  // THE VOICES (1.20.0). Four, fixed, the same way the board
  // statuses are four and fixed — a small legible vocabulary beats
  // an open field nobody can remember.
  //
  // The MEANING is carried by whether the phrase RESOLVES. arrival
  // settles onto the tonic because the work is finished; attention
  // and question deliberately do not, so the ear stays unsettled
  // until you look. That is the difference between a notification
  // and a nag, and it is why the NBC chimes work as an arrival.
  var VOICES = {
    // G–E–C descending to the tonic — something landed.
    arrival:   [[392.00, 0, 0.85], [329.63, 0.20, 0.85], [261.63, 0.40, 1.70]],
    // C–E–G ascending, left on the dominant — I need you.
    attention: [[261.63, 0, 0.55], [329.63, 0.16, 0.55], [392.00, 0.32, 1.10]],
    // E–G, a rising pair that hangs — awaiting your call.
    question:  [[329.63, 0, 0.50], [392.00, 0.18, 1.20]],
    // Minor second, held together — deliberately unpleasant.
    alert:     [[440.00, 0, 0.70], [466.16, 0.02, 0.70], [440.00, 0.34, 0.90]]
  };

  function chime(voice) {
    // Silent whenever the strip's SOUND cell is off.
    if (!soundOn()) return;

    // Unarmed (Chrome autoplay policy) — the cadence is REMEMBERED,
    // not discarded (1.22.0): the first gesture that arms audio
    // replays it, so an update that landed during the silent window
    // is announced late rather than lost.
    if (!audioCtx) { pendingVoice = voice || 'arrival'; return; }

    var notes = VOICES[voice] || VOICES.arrival;

    // A created context is not necessarily a RUNNING one — Chrome
    // suspends it when a tab is backgrounded, and playing into a
    // suspended context is silent with no error. Resume first, then
    // play on the promise; do not assume. A resume Chrome refuses
    // (still no gesture) records the voice for replay instead.
    if (audioCtx.state !== 'running') {
      pendingVoice = voice || 'arrival';
      audioCtx.resume().then(function () {
        if (armed()) { pendingVoice = null; playVoice(notes); }
      }).catch(function () {});
      return;
    }
    playVoice(notes);
  }

  function playVoice(notes) {
    const t = audioCtx.currentTime;
    notes.forEach(function (n) { ring(n[0], t + n[1], n[2]); });
  }

  function buildStrip() {
    const h = document.querySelector('header');
    if (!h) return;
    const s = document.createElement('div');
    s.id = 'wire-now';
    s.innerHTML = '<span class="wn-tag">⌁ NOW</span>' +
      '<span class="wn-note"></span>' +
      '<a class="wn-anchor" href="#"></a>' +
      '<span class="wn-at"></span>';
    h.insertAdjacentElement('afterend', s);
    try {
      const last = localStorage.getItem('mai-wire-last--' + PROJECT);
      if (last) renderNow(JSON.parse(last));
    } catch (e) {}
  }

  // 2.6.0 (audit J-01): a payload's anchor is used only as an in-page anchor (#id). It became an href unchecked,
  // so a "javascript:" value ran on click and persisted in localStorage to run again on the next visit.
  function safeAnchor(v) {
    return (typeof v === 'string' && /^#[A-Za-z][\w\-:.]*$/.test(v)) ? v : '';
  }

  function renderNow(p) {
    const strip = document.getElementById('wire-now');
    if (!strip) return;
    strip.querySelector('.wn-note').textContent = p.note || '';
    const a = strip.querySelector('.wn-anchor');
    const anchor = safeAnchor(p.anchor);
    if (anchor) { a.textContent = anchor; a.href = anchor; a.style.display = ''; }
    else { a.style.display = 'none'; }
    strip.querySelector('.wn-at').textContent = p.at || '';
    strip.classList.add('live');
  }

  // --- LIVE BOARDS (Step B AJAX) -----------------------------------
  // State model: boards.json on disk is TRUTH; localStorage is a
  // fast-paint cache; wire updates redraw in place. One board id →
  // one card; a board update replaces that whole card.
  var BOARDS_CACHE_KEY = 'mai-dash-boards--' + PROJECT;
  // Durable set arrives via window.DASH_BOARDS (a <script src> include,
  // not a fetch — file:// safe). The courier keeps _data/boards-data.js
  // current on every board write.
  var boardState = {};          // id → board object {id,title,rows}
  var chunkTransfers = {};      // transferId → {total,sha,pieces{}}

  // SHA-256 via SubtleCrypto — the same whole-board gate the courier
  // runs, page-side. Async; resolves to lowercase hex.
  function sha256Hex(str) {
    try {
      var bytes = new TextEncoder().encode(str);
      return crypto.subtle.digest('SHA-256', bytes).then(function (buf) {
        var arr = Array.prototype.slice.call(new Uint8Array(buf));
        return arr.map(function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  function boardsMount() { return document.getElementById('wire-boards'); }

  // Render one board object into a card. Replaces an existing card of
  // the same id in place; appends a new one otherwise. flash=true adds
  // the brief highlight so the eye catches a live change.
  // CHANGE VISIBILITY (Greg's ask, 2026-07-30): mark WHAT updated.
  // The freshest change wears a pulsing glow — released by the next
  // update (the glow moves) or a page refresh (runtime-only, never
  // persisted). Rows are diffed so the specific changed lines tint.
  function changedRowKeys(oldBoard, newBoard) {
    var changed = {};
    if (!oldBoard || !oldBoard.rows) return changed; // brand-new board: card glow carries it
    var oldRows = {};
    (oldBoard.rows || []).forEach(function (r) { if (r && r.k) oldRows[r.k] = r; });
    (newBoard.rows || []).forEach(function (r) {
      if (!r || !r.k) return;
      var o = oldRows[r.k];
      if (!o || o.s !== r.s || o.n !== r.n) changed[r.k] = true;
    });
    return changed;
  }

  function clearLiveGlow() {
    document.querySelectorAll('.wb-live-glow').forEach(function (el) {
      el.classList.remove('wb-live-glow');
    });
    document.querySelectorAll('.wb-row-changed').forEach(function (el) {
      el.classList.remove('wb-row-changed');
    });
  }

  // 2.6.0 (audit J-12): a board id is escaped before it goes into a selector. A quote in an id made the selector
  // throw, and the throw emptied the whole board area.
  function boardSelector(id) {
    var s = String(id);
    var esc = (window.CSS && typeof CSS.escape === 'function') ? CSS.escape(s) : s.replace(/["\\]/g, '\\$&');
    return '[data-board-id="' + esc + '"]';
  }

  function renderBoard(board, flash, changedKeys) {
    var mount = boardsMount();
    if (!mount || !board || !board.id) return;

    if (flash) clearLiveGlow(); // the glow moves to the freshest change
    if (flash) markHereUpdated(); // the nav names this page too (1.25.0)
    var card = document.createElement('div');
    card.className = 'wb-card' + (flash ? ' wb-updated wb-live-glow' : '');
    card.setAttribute('data-board-id', board.id);

    var h = document.createElement('h3');
    h.textContent = board.title || board.id;
    // 2.5.0: THE COUNT (Core_03 law 19) — done over total, growth
    // against stepsAtStart, painted orange GROWING past +50%. Rows
    // are not progress; the fraction is.
    var rowsAll = board.rows || [];
    var total = rowsAll.length;
    var doneN = rowsAll.filter(function (r) { return r && String(r.s || '').toLowerCase() === 'done'; }).length;
    var atStart = Number(board.stepsAtStart) || 0;
    var growth = atStart ? total - atStart : 0;
    var growing = atStart && growth >= Math.ceil(atStart * 0.5);
    if (total) {
      var meta = document.createElement('span');
      meta.className = 'wb-meta' + (growing ? ' wb-growing' : '');
      meta.textContent = doneN + ' / ' + total + (atStart ? ' · ' + (growth >= 0 ? '+' : '') + growth + (growing ? ' GROWING' : '') : '') + (board.session ? ' · session ' + board.session : '');
      h.appendChild(meta);
    }
    card.appendChild(h);
    if (total) {
      var bar = document.createElement('div'); bar.className = 'wb-bar';
      var fill = document.createElement('div'); fill.className = 'wb-bar-fill' + (growing ? ' wb-growing' : '');
      fill.style.width = Math.round((doneN / total) * 100) + '%';
      bar.appendChild(fill); card.appendChild(bar);
    }

    (board.rows || []).forEach(function (row) {
      var r = document.createElement('div');
      r.className = 'wb-row' + (changedKeys && row.k && changedKeys[row.k] ? ' wb-row-changed' : '');
      var status = (row.s || 'plan').toLowerCase();
      var dot = { done: '\u25CF', live: '\u25CF', part: '\u25D0', plan: '\u25CB' }[status] || '\u25CB';
      var k = document.createElement('span'); k.className = 'wb-k'; k.textContent = row.k || '';
      var s = document.createElement('span'); s.className = 'wb-s s-' + status; s.textContent = dot;
      var n = document.createElement('span'); n.className = 'wb-n'; n.textContent = row.n || '';
      r.appendChild(k); r.appendChild(s); r.appendChild(n);
      card.appendChild(r);
    });

    var existing = mount.querySelector(boardSelector(board.id));
    if (existing) { mount.replaceChild(card, existing); }
    else { mount.appendChild(card); }
  }

  // Draw the full board set from a state map, in insertion order.
  function renderAllBoards(state) {
    var mount = boardsMount();
    if (!mount) return;
    mount.innerHTML = '';
    Object.keys(state).forEach(function (id) {
      if (state[id] && state[id].retired) return; // completed — lives in the Backlog now
      renderBoard(state[id], false);
    });
  }

  // Persist the fast-paint cache. Never the authority — just so a
  // reopened page shows something before boards.json resolves.
  function saveBoardsCache() {
    try { localStorage.setItem(BOARDS_CACHE_KEY, JSON.stringify(boardState)); } catch (e) {}
  }

  // Accept one verified board into state + DOM + cache (live redraw).
  function acceptBoard(board) {
    if (!board || !board.id) return;
    // A page that doesn't SHOW boards must not consume them (the
    // cache means "what this browser last showed" — Greg's away-glow
    // depends on it). Hearing off-page marks Home pending instead,
    // which lights the nav badge in the glow's own color.
    if (!boardsMount()) { markPagePending('index.html'); return; }
    var wasVisible = !!boardState[board.id] && !boardState[board.id].retired;
    var oldBoard = boardState[board.id];
    boardState[board.id] = board;
    saveBoardsCache();
    if (board.retired) {
      // COMPLETION (Greg's lifecycle, 2026-07-30): declared done —
      // celebrate on the open page, then the card poofs to live on
      // in the Backlog's completed record. A load-time retired
      // board simply never renders (renderAllBoards skips it).
      if (wasVisible) { celebrateAndRetire(board.id); }
      else { renderAllBoards(boardState); }
      return;
    }
    renderBoard(board, true, changedRowKeys(oldBoard, board));
  }

  // The ceremony: confetti + drifting balloons over the finished
  // card (~3s), then a poof — scale/fade — and the board is gone
  // from the LIVE map. Deliberate declaration in, automated
  // celebration out.
  function celebrateAndRetire(id) {
    var mount = boardsMount();
    var card = mount ? mount.querySelector(boardSelector(id)) : null;
    if (!card) { renderAllBoards(boardState); return; }
    card.style.position = 'relative';
    card.style.overflow = 'hidden';
    var colors = ['#39d98a', '#39c6d9', '#e8c34a', '#e85a8a', '#8a7ae8'];
    for (var i = 0; i < 36; i++) {
      var c = document.createElement('span');
      c.className = 'confetti';
      c.style.left = (Math.random() * 100) + '%';
      c.style.background = colors[i % colors.length];
      c.style.animationDelay = (Math.random() * 0.8) + 's';
      c.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
      card.appendChild(c);
    }
    // Balloons fly OVER THE PAGE (Greg: 3× larger, strings
    // streaming) — a fixed full-viewport overlay anchored above the
    // card, so nothing clips them; removed when the flight ends.
    var rect = card.getBoundingClientRect();
    var sky = document.createElement('div');
    sky.className = 'balloon-sky';
    document.body.appendChild(sky);
    var balloonColors = ['#e85a8a', '#39c6d9', '#e8c34a', '#39d98a', '#8a7ae8'];
    for (var b = 0; b < 5; b++) {
      var bal = document.createElement('span');
      bal.className = 'balloon';
      var hue = balloonColors[b % balloonColors.length];
      // A real balloon at real size: shaded body, knot, and a long
      // ribbon string streaming beneath in lazy S-curves.
      bal.innerHTML = '<svg width="138" height="330" viewBox="0 0 138 330">' +
        '<defs><radialGradient id="bg' + b + '" cx="35%" cy="30%" r="75%">' +
        '<stop offset="0%" stop-color="#ffffff" stop-opacity="0.9"/>' +
        '<stop offset="18%" stop-color="' + hue + '"/>' +
        '<stop offset="100%" stop-color="' + hue + '" stop-opacity="0.72"/>' +
        '</radialGradient></defs>' +
        '<ellipse cx="69" cy="78" rx="58" ry="72" fill="url(#bg' + b + ')"/>' +
        '<ellipse cx="48" cy="46" rx="14" ry="20" fill="#ffffff" opacity="0.35"/>' +
        '<path d="M60 147 L78 147 L69 162 Z" fill="' + hue + '"/>' +
        '<path d="M69 162 Q 92 196 62 226 Q 34 254 76 282 Q 104 302 66 328"' +
        ' stroke="rgba(255,255,255,0.55)" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
        '</svg>';
      bal.style.left = (rect.left + rect.width * (0.02 + b * 0.2) + Math.random() * 20) + 'px';
      bal.style.top = (rect.bottom - 40) + 'px';
      bal.style.animationDelay = (b * 0.3 + Math.random() * 0.25) + 's';
      bal.style.animationDuration = (3.6 + Math.random() * 1.0) + 's';
      sky.appendChild(bal);
    }
    setTimeout(function () { if (sky.parentNode) sky.parentNode.removeChild(sky); }, 6500);
    setTimeout(function () {
      card.classList.add('wb-poof');
      setTimeout(function () { renderAllBoards(boardState); }, 500);
    }, 4200);
  }

  // A board payload may be whole or a chunk (transferId). The board
  // object rides in p.data (the wire contract — same field the
  // courier writes from); p.board is tolerated as an alias so the
  // key name can't drift the two sides apart again.
  function handleBoardPayload(p) {
    if (p.transferId) { handleBoardChunk(p); return; }
    var board = p.data || p.board;
    if (board) { acceptBoard(board); }
  }

  // Page-side chunk reassembly — mirrors WireChunkAssembler: identity
  // fixed by first chunk, whole-board checksum gate, in-order join.
  function handleBoardChunk(p) {
    var id = p.transferId;
    if (!id || !p.total || !p.index || !p.sha256 || typeof p.content !== 'string') return;

    // 2.6.0 (audit J-15): a transfer that has not completed within two minutes is dropped, so lost chunks do not
    // hold their pieces for the life of the page
    var nowMs = Date.now();
    Object.keys(chunkTransfers).forEach(function (k) {
      if (nowMs - (chunkTransfers[k].started || nowMs) > 120000) { delete chunkTransfers[k]; }
    });

    var t = chunkTransfers[id];
    if (!t) {
      t = { total: p.total, sha: p.sha256, pieces: {}, started: nowMs };
      chunkTransfers[id] = t;
    } else if (t.total !== p.total || t.sha !== p.sha256) {
      // Disagreement — drop the whole transfer (tamper/corruption).
      delete chunkTransfers[id];
      return;
    }
    t.pieces[p.index] = p.content;

    // Whole yet?
    if (Object.keys(t.pieces).length !== t.total) return;
    for (var i = 1; i <= t.total; i++) { if (t.pieces[i] === undefined) return; }

    var assembled = '';
    for (var j = 1; j <= t.total; j++) { assembled += t.pieces[j]; }
    delete chunkTransfers[id];

    // Whole-board checksum gate before we trust it.
    sha256Hex(assembled).then(function (hex) {
      if (hex !== t.sha.toLowerCase()) return; // refuse silently — no half-board
      try { acceptBoard(JSON.parse(assembled)); } catch (e) {}
    }).catch(function () {});
  }

  // Re-reads the durable board file (cache-busted) and adopts it —
  // used when the boards FILE arrives over the wire, so a wholesale
  // set replacement paints live just like a single board message.
  // COURIER SILENCE DETECTOR (Greg's ask, 2026-07-30): this page and
  // the courier both hear the wire — but only the courier writes
  // disk. When a board arrives live, wait a grace period, then
  // OBSERVE the durable file: if disk doesn't hold what the wire
  // said, the courier must be off or disarmed — say so, loudly.
  // (Computer fully off is the other gap: nothing can warn, and
  // nothing needs to — the courier's catch-up heals it on launch.)
  // Canonical JSON — recursive key-sort so the comparison sees
  // CONTENT, not encoder key order (Swift's encoder and the wire
  // payload order fields differently; 1.12.0 compared raw strings
  // and false-alarmed on an honest courier — Greg caught it live).
  function canonicalJSON(v) {
    if (Array.isArray(v)) return '[' + v.map(canonicalJSON).join(',') + ']';
    if (v && typeof v === 'object') {
      return '{' + Object.keys(v).sort().map(function (k) {
        return JSON.stringify(k) + ':' + canonicalJSON(v[k]);
      }).join(',') + '}';
    }
    return JSON.stringify(v);
  }

  var courierCheckTimer = null;
  var courierWarnWatch = null;   // {boardId, expected} while a warning shows
  function scheduleCourierCheck(payload) {
    var board = payload && payload.data;
    if (!board || !board.id || payload.transferId) return; // chunked boards: courier-assembled only
    if (courierCheckTimer) clearTimeout(courierCheckTimer);
    var expected = canonicalJSON(board);
    courierCheckTimer = setTimeout(function () {
      try {
        var probe = document.createElement('script');
        probe.src = '_data/boards-data.js?cc=' + Date.now();
        probe.onload = function () {
          try {
            var durable = (window.DASH_BOARDS && window.DASH_BOARDS.boards) || [];
            var landed = durable.some(function (b) {
              return b && b.id === board.id && canonicalJSON(b) === expected;
            });
            if (!landed) {
              courierWarnWatch = { boardId: board.id, expected: expected };
              showCourierWarning();
            }
          } catch (e) {}
          dropProbe(probe);
        };
        probe.onerror = function () { dropProbe(probe); showCourierWarning(); }; // no durable file at all
        document.head.appendChild(probe);
      } catch (e) {}
    }, 8000);
  }

  function showCourierWarning() {
    if (document.querySelector('.courier-warn')) return;
    var warn = document.createElement('div');
    warn.className = 'courier-warn';
    var msg = document.createElement('div');
    msg.textContent = '\u26A0 COURIER SILENT — this page heard a delivery, but it never landed on disk. AiAssist is likely off or disarmed. Launch AiAssist: catch-up will land the missed work.';
    var x = document.createElement('button');
    x.textContent = 'DISMISS';
    x.addEventListener('click', function () { dismissCourierWarning(warn); });
    warn.appendChild(msg); warn.appendChild(x);
    document.body.appendChild(warn);

    // SELF-HEALING (Greg's ask): the warning keeps observing disk.
    // The moment the missed delivery lands (catch-up did its job),
    // the toast flips green — COURIER BACK — and dismisses itself.
    var watcher = setInterval(function () {
      if (!warn.parentNode) { clearInterval(watcher); return; }
      var watch = courierWarnWatch;
      if (!watch) { clearInterval(watcher); dismissCourierWarning(warn); return; }
      try {
        var probe = document.createElement('script');
        probe.src = '_data/boards-data.js?cw=' + Date.now();
        probe.onload = function () {
          try {
            var durable = (window.DASH_BOARDS && window.DASH_BOARDS.boards) || [];
            var landed = durable.some(function (b) {
              return b && b.id === watch.boardId && canonicalJSON(b) === watch.expected;
            });
            if (landed && warn.parentNode) {
              clearInterval(watcher);
              courierWarnWatch = null;
              warn.classList.add('healed');
              msg.textContent = '\u2713 COURIER BACK — the missed delivery landed on disk. All caught up.';
              x.parentNode.removeChild(x);
              setTimeout(function () { dismissCourierWarning(warn); }, 4000);
            }
          } catch (e) {}
          dropProbe(probe);
        };
        probe.onerror = function () { dropProbe(probe); };
        document.head.appendChild(probe);
      } catch (e) {}
    }, 6000);
  }

  // 2.6.0 (audit J-10): a probe script leaves the page once it has loaded or failed. While COURIER SILENT showed,
  // one new <script> stayed in <head> every 6 seconds, for as long as the warning stood.
  function dropProbe(s) {
    if (s && s.parentNode) s.parentNode.removeChild(s);
  }

  function dismissCourierWarning(warn) {
    if (warn && warn.parentNode) warn.parentNode.removeChild(warn);
  }

  // ── DELIVERY REFUSED (1.26.0) ────────────────────────────────
  // Born from a live misdiagnosis: the methodology was edited, the
  // fingerprint superseded, and the courier — RUNNING the whole
  // time — refused deliveries with dropped-auth and the detail
  // "has this project been Launched?". The only toast this engine
  // had said "off or disarmed": the wrong story with the wrong
  // remedy. The wire already carried the truth in the receipt; the
  // page now reads it instead of guessing. Two stories, both
  // observed: REFUSED = a dropped-* receipt was heard (courier
  // alive, delivery rejected, quote its own words); SILENT = no
  // receipt at all (genuinely off or disarmed — unchanged, and now
  // honest by elimination).
  var refusalToast = null;   // {el, msg, btn} while showing

  function noteReceiptVerdict(p) {
    var verdict = String(p.verdict || '').toLowerCase();
    if (!verdict) return;
    // THE RULE (1.26.1, inverted after the live proof surfaced
    // `malformed`): success is the NAMED list; every other verdict
    // is the courier running and refusing — the REFUSED story.
    // A refusal word the courier grows tomorrow is covered today.
    // 2.5.3: deleted and renamed are the courier SUCCEEDING (a delete
    // since courier 2.2.0, a rename since 2.17.0). Left off this list
    // they toasted as refusals, which is the false alarm the list exists
    // to prevent.
    // 2.7.1 (Greg, the run lane's acceptance): a run lane receipt is not a delivery. Its sender reads every verdict
    // in its own reply, so the DELIVERY REFUSED notice never speaks for one; it showed a run's "started" as refused.
    if (isRunLaneReceipt(p)) return;
    var success = receiptSucceeded(verdict);
    if (!success) {
      // The courier ANSWERED. A pending silence check would layer
      // the off/disarmed story on top of a courier that is running
      // and refusing — cancel it, and clear any SILENT toast
      // already showing: the refusal is the truer, actionable one.
      if (courierCheckTimer) { clearTimeout(courierCheckTimer); courierCheckTimer = null; }
      courierWarnWatch = null;
      var toasts = document.querySelectorAll('.courier-warn');
      for (var i = 0; i < toasts.length; i++) {
        if (!refusalToast || toasts[i] !== refusalToast.el) {
          toasts[i].parentNode.removeChild(toasts[i]);
        }
      }
      showCourierRefusal(String(p.detail || verdict), verdict);
      // 2.6.0 (audit J-03): a board is painted and cached the moment the page hears it, before the courier rules.
      // When the courier refuses a board, repaint from disk, so the refused board does not stay on screen (and in
      // the cache) until disk next changes.
      if (String(p.ofKind || '').toLowerCase() === 'board') { reloadDurableBoards(); }
      return;
    }
    // A success while the refusal shows means auth is whole again —
    // heal in the wire's own currency, not disk's.
    if (refusalToast && refusalToast.el.parentNode) {
      var t = refusalToast; refusalToast = null;
      t.el.classList.add('healed');
      t.msg.textContent = '\u2713 COURIER VERIFIED: a later delivery landed.';
      if (t.btn.parentNode) t.btn.parentNode.removeChild(t.btn);
      setTimeout(function () { dismissCourierWarning(t.el); }, 4000);
    }
  }

  // 2.7.1: the ONE success list, read by the refusal notice and the wire strip alike, so the two cannot disagree.
  // started, finished, killed and timed-out are the courier doing what a run asked (courier 2.25.0); a run that
  // ends non-zero, is stopped, or runs out of time still went where it was sent.
  function receiptSucceeded(verdict) {
    var v = String(verdict || '').toLowerCase();
    if (v.indexOf('verified') === 0) return true;
    return ['executed', 'deleted', 'renamed', 'started', 'finished', 'killed', 'timed-out'].indexOf(v) !== -1;
  }

  // 2.7.1: receipts of the run lane (run, kill, runs, lanes), told apart by the kind they answer.
  function isRunLaneReceipt(p) {
    return ['run', 'kill', 'runs', 'lanes'].indexOf(String(p.ofKind || '').toLowerCase()) !== -1;
  }

  // 2.5.3 (Greg, the file lane's first test run): the advice follows
  // the verdict. "Run Launch" only fixes dropped-auth; under a rule,
  // conflict or fixed refusal it sent the reader to fix the wrong thing.
  function refusalAdvice(verdict) {
    switch (verdict) {
      case 'dropped-auth': return 'If the methodology was edited, run Launch in AiAssist to re-stamp, then resend.';
      case 'dropped-rule': return 'This project\u2019s file lane does not allow it. Copy the file by hand, or add a rule in AiAssist.';
      case 'dropped-path': return 'That location is never reachable over the wire. Copy the file by hand.';
      case 'dropped-conflict': return 'The file on disk is not the one the sender read. The sender re-reads it and resends.';
      case 'dropped-transfer': return 'The file did not arrive whole. The sender resends it.';
      case 'dropped-project': return 'This project is not registered in the Navigation Bay.';
      default: return 'The message itself was refused. The sender corrects it and resends.';
    }
  }

  function showCourierRefusal(detail, verdict) {
    if (refusalToast && refusalToast.el.parentNode) return;
    var warn = document.createElement('div');
    warn.className = 'courier-warn';
    var msg = document.createElement('div');
    msg.textContent = '\u26A0 DELIVERY REFUSED (' + (verdict || 'refused') + '): \u201C' + detail + '\u201D ' + refusalAdvice(verdict);
    var x = document.createElement('button');
    x.textContent = 'DISMISS';
    x.addEventListener('click', function () { refusalToast = null; dismissCourierWarning(warn); });
    warn.appendChild(msg); warn.appendChild(x);
    document.body.appendChild(warn);
    refusalToast = { el: warn, msg: msg, btn: x };
  }

  function reloadDurableBoards() {
    if (!boardsMount()) return;
    try {
      var s = document.createElement('script');
      s.src = '_data/boards-data.js?b=' + Date.now();
      s.onload = function () { dropProbe(s); adoptDurableBoards(); };
      s.onerror = function () { dropProbe(s); };
      document.head.appendChild(s);
    } catch (e) {}
  }

  // Adopts the durable set from window.DASH_BOARDS — the disk truth
  // ALWAYS WINS over the cache. Idempotent; safe to call again.
  function adoptDurableBoards() {
    try {
      var durable = window.DASH_BOARDS;
      if (durable && durable.boards) {
        var incoming = {};
        durable.boards.forEach(function (b) { if (b && b.id) incoming[b.id] = b; });

        // WHILE-YOU-WERE-AWAY (Greg's catch, 2026-07-30): the cache
        // is what this browser last saw; disk is what's true now.
        // Their diff IS the recency the fresh page lacks — glow it.
        // Saving the cache below consumes the highlight: the next
        // visit loads clean. First-ever visits (no cache) stay quiet.
        var hadCache = Object.keys(boardState).length > 0;
        var glowIds = {};
        var rowKeys = {};
        if (hadCache) {
          Object.keys(incoming).forEach(function (id) {
            var oldB = boardState[id], newB = incoming[id];
            if (newB.retired) return;
            if (!oldB) { glowIds[id] = true; return; }
            if (canonicalJSON(oldB) !== canonicalJSON(newB)) {
              glowIds[id] = true;
              rowKeys[id] = changedRowKeys(oldB, newB);
            }
          });
        }

        // LIVE GLOW PRESERVED (1.24.0, Greg's catch): after a live
        // paint, the courier's write lands and the next sweep adopts
        // a durable set that merely CONFIRMS what this page already
        // shows — the diff above is empty, and the full repaint below
        // would wipe the recency glow the live lane just applied,
        // seconds after it appeared. Identical content = leave the
        // DOM alone; the glow survives until the next change or a
        // refresh, exactly as the recency language promises. State
        // and cache still adopt silently. The DOM-populated guard
        // keeps a first paint from ever being skipped.
        var newIds = Object.keys(incoming);
        var mountEl = boardsMount();
        var identical = hadCache &&
          mountEl && mountEl.childElementCount > 0 &&
          newIds.length === Object.keys(boardState).length &&
          newIds.every(function (id) {
            return boardState[id] &&
              canonicalJSON(boardState[id]) === canonicalJSON(incoming[id]);
          });
        if (identical) {
          boardState = incoming;         // disk still wins the record
          saveBoardsCache();
          // 1.30.1 (Greg: "I can't find any way to tell it whatever
          // it was marking as updated was never set") — a viewer
          // looking at boards that MATCH disk has, by definition,
          // seen everything the ledger was holding the badge for.
          // The old clear path only fired when a NEW glow painted,
          // so a visit that found boards already current could never
          // witness, and Home's badge stuck forever. Watched and
          // current = acknowledged, glow or no glow.
          witnessBoards();
          return;                        // …but the pixels stand
        }

        boardState = incoming;         // disk wins
        renderAllBoards(boardState);
        if (Object.keys(glowIds).length) { markHereUpdated(); } // nav names this page (1.25.0)
        else { witnessBoards(); }        // 1.30.1: adopted with no news while watching = seen
        Object.keys(glowIds).forEach(function (id) {
          var card = document.querySelector(boardSelector(id));
          if (!card) return;
          card.classList.add('wb-live-glow');
          var keys = rowKeys[id] || {};
          card.querySelectorAll('.wb-row').forEach(function (r) {
            var kEl = r.querySelector('.wb-k');
            if (kEl && keys[kEl.textContent]) r.classList.add('wb-row-changed');
          });
        });
        saveBoardsCache();
      }
    } catch (e) {}                      // malformed durable → keep cache
  }

  // Load-time reconcile (Greg's caveat): paint the cache instantly,
  // then adopt the durable set. The durable file loads by DYNAMIC
  // <script> injection — the engine fetches its own data channel, so
  // no page needs a static include (older pages that still have one
  // simply arrive with DASH_BOARDS already set and adopt at once).
  // <script src> is the mAi-correct file://-safe channel; fetch() is
  // CORS-blocked (confirmed 2026-07-29). A project with no board
  // file yet errors the script load silently — the cache stands.
  function loadBoards() {
    if (!boardsMount()) return; // page didn't opt in / no region built

    try {
      var cached = localStorage.getItem(BOARDS_CACHE_KEY);
      if (cached) { boardState = JSON.parse(cached) || {}; renderAllBoards(boardState); }
    } catch (e) { boardState = {}; }

    if (window.DASH_BOARDS) {
      adoptDurableBoards();             // legacy static include already loaded
      return;
    }
    try {
      var s = document.createElement('script');
      s.src = '_data/boards-data.js';
      // BASELINE SEED (1.23.1) — mirror loadSite: startDiskWatch runs
      // synchronously at init, BEFORE this async script lands, so it
      // seeds lastBoardsSig from an undefined DASH_BOARDS ("[]"). The
      // first 4s sweep then read the real file, saw a "change", and
      // played the arrival cadence for content that changed nothing
      // (Core_13 §2.4: first observation is a baseline, not an event).
      // Latent since 1.6.0's async load; audible since 1.21.0 moved
      // the cadence into the change branch. Home-only because only
      // boards pages run this lane.
      s.onload = function () {
        adoptDurableBoards();
        lastBoardsSig = boardsSignature();
      };
      s.onerror = function () {};        // no durable file yet — cache stands
      document.head.appendChild(s);
    } catch (e) {}
  }

  // --- 2.3.0: THE WIRE STRIP (Home only) ------------------------------
  // What the wire did in the last 24 hours, one bar per hour. Fed by
  // every payload this page hears; seeded on open from the relay's own
  // 24h cache so a fresh browser still sees the day. Persisted 48h,
  // keyed by message id so replay and live never double-count.
  var WIRE_LOG_MAX_AGE = 48 * 3600;
  function wireLogKey() { return 'mai-wire-log--' + PROJECT; }
  function wireLogRead() {
    try { return JSON.parse(localStorage.getItem(wireLogKey())) || []; } catch (e) { return []; }
  }
  function wireLogClass(p) {
    var k = String(p.kind || '');
    if (k === 'receipt') {
      var v = String(p.verdict || '').toLowerCase();
      // 2.6.0 (audit J-08): renamed is a success too; it drew as a refusal on the strip
      // 2.7.1: the strip reads the same success list as the refusal notice
      return receiptSucceeded(v) ? 'ok' : 'refused';
    }
    if (k === 'board' || k === 'file' || k === 'command') return 'delivery';
    return 'other';
  }
  function wireLogNote(p) {
    var id = p.__envId; if (!id) return;
    var t = Number(p.__envTime) || Math.floor(Date.now() / 1000);
    var log = wireLogRead();
    for (var i = 0; i < log.length; i++) { if (log[i].id === id) return; }
    var floor = Math.floor(Date.now() / 1000) - WIRE_LOG_MAX_AGE;
    log = log.filter(function (e) { return e.t >= floor; });
    log.push({ id: id, t: t, c: wireLogClass(p) });
    try { localStorage.setItem(wireLogKey(), JSON.stringify(log)); } catch (e) {}
    renderWireStrip();
  }
  function seedWireLog() {
    // One poll of the relay's cache, parsed as JSON, never pattern-matched.
    // 2.6.0 (audit J-11): the seed is one batch: the log is read once, every new message is added with a set
    // lookup, and the log is written and drawn once. It went through wireLogNote per message, re-reading,
    // rewriting and redrawing the whole log each time, which made the seed quadratic.
    fetch('https://ntfy.sh/' + WIRE_TOPIC + '/json?poll=1&since=24h').then(function (r) { return r.text(); }).then(function (txt) {
      var floor = Math.floor(Date.now() / 1000) - WIRE_LOG_MAX_AGE;
      var log = wireLogRead().filter(function (e) { return e.t >= floor; });
      var seen = {};
      log.forEach(function (e) { seen[e.id] = true; });
      txt.split('\n').forEach(function (line) {
        if (!line.trim()) return;
        var d, p;
        try { d = JSON.parse(line); p = JSON.parse(d.message); } catch (e) { return; }
        if (!d || d.event !== 'message' || !p || !p.project) return;
        if (String(p.project).toLowerCase() !== String(PROJECT).toLowerCase()) return;
        if (!d.id || seen[d.id]) return;
        seen[d.id] = true;
        log.push({ id: d.id, t: Number(d.time) || Math.floor(Date.now() / 1000), c: wireLogClass(p) });
      });
      try { localStorage.setItem(wireLogKey(), JSON.stringify(log)); } catch (e) {}
      renderWireStrip();
    }).catch(function () {});
  }
  function fmtHour(sec) {
    var d = new Date(sec * 1000); var h = d.getHours();
    return (h % 12 || 12) + (h < 12 ? 'a' : 'p');
  }
  function fmtAgo(sec) {
    var d = Math.max(0, Math.floor(Date.now() / 1000) - sec);
    if (d < 60) return d + 's ago'; if (d < 3600) return Math.floor(d / 60) + 'm ago';
    if (d < 86400) return Math.floor(d / 3600) + 'h ' + Math.floor((d % 3600) / 60) + 'm ago';
    return Math.floor(d / 86400) + 'd ago';
  }
  var wireStripTimer = null;
  function renderWireStrip() {
    if (currentPageFile() !== 'index.html') return;
    var deck = document.getElementById('mai-deck'); if (!deck) return;
    var host = document.getElementById('mai-wire-strip');
    if (!host) {
      host = document.createElement('div'); host.id = 'mai-wire-strip'; deck.appendChild(host);
      var pulse = document.createElement('div'); pulse.id = 'mai-pulse'; deck.appendChild(pulse);
      wireStripTimer = setInterval(renderWireStrip, 60000);   // time scrolls
      // 2.5.0: the quiet line — one sentence of wire state, at the
      // bottom of the work, opening the deck on click.
      var line = document.createElement('div'); line.id = 'mai-wire-line'; line.className = 'wire-line';
      line.title = 'Click to show or hide the wire chart';
      line.addEventListener('click', function () {
        var open = deck.style.display === 'none';
        deck.style.display = open ? 'grid' : 'none';
        try { localStorage.setItem('mai-wire-deck--' + PROJECT, open ? 'open' : 'closed'); } catch (e) {}
        renderWireStrip();   // 2.5.1: the chevron turns the moment you click
      });
      try { if (localStorage.getItem('mai-wire-deck--' + PROJECT) === 'open') { deck.style.display = 'grid'; } } catch (e) {}
      deck.parentNode.insertBefore(line, deck);
    }
    var nowS = Math.floor(Date.now() / 1000);
    var start = nowS - 24 * 3600;
    var buckets = [];
    for (var h = 0; h < 24; h++) buckets.push({ delivery: 0, ok: 0, refused: 0, other: 0, from: start + h * 3600 });
    var log = wireLogRead(), total = 0, last = null, lastReceipt = null, midnight = new Date(); midnight.setHours(0, 0, 0, 0);
    var sinceMidnight = 0;
    log.forEach(function (e) {
      if (!last || e.t > last.t) last = e;
      if (e.c !== 'delivery' && e.c !== 'other' && (!lastReceipt || e.t > lastReceipt.t)) lastReceipt = e;
      if (e.t >= midnight.getTime() / 1000 && e.c === 'delivery') sinceMidnight++;
      if (e.t < start) return;
      var i = Math.min(23, Math.floor((e.t - start) / 3600));
      buckets[i][e.c] = (buckets[i][e.c] || 0) + 1; total++;
    });
    var max = 1, busiest = null;
    buckets.forEach(function (bk) { var n = bk.delivery + bk.ok + bk.refused; max = Math.max(max, n); if (!busiest || n > busiest.n) busiest = { n: n, from: bk.from }; });
    var W = 720, H = 120, top = 8, base = H - 22, pad = 3, bw = W / 24;
    var bars = buckets.map(function (bk, i) {
      var x = i * bw + pad, w = bw - pad * 2, y = base, out = '';
      var tip = fmtHour(bk.from) + ' – ' + fmtHour(bk.from + 3600) + ' · ' + bk.delivery + ' deliveries · ' + bk.ok + ' verified · ' + bk.refused + ' refused';
      out += '<rect x="' + x.toFixed(1) + '" y="' + top + '" width="' + w.toFixed(1) + '" height="' + (base - top) + '" fill="transparent"><title>' + tip + '</title></rect>';
      [['refused', '#ffb43c'], ['ok', '#3fb950'], ['delivery', '#39c5cf']].forEach(function (pair) {
        var n = bk[pair[0]]; if (!n) return;
        var hgt = Math.max(2, (n / max) * (base - top)); y -= hgt;
        out += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + hgt.toFixed(1) + '" fill="' + pair[1] + '" rx="1" style="pointer-events:none"/>';
      });
      return out;
    }).join('');
    var ticks = '';
    for (var t = 0; t <= 24; t += 3) {
      var tx = (t * bw).toFixed(1);
      ticks += '<line x1="' + tx + '" y1="' + base + '" x2="' + tx + '" y2="' + (base + 5) + '" stroke="rgba(255,255,255,.28)"/>';
      if (t < 24) ticks += '<text x="' + (Number(tx) + 3) + '" y="' + (base + 15) + '" font-family="monospace" font-size="9" fill="#8b949e">' + fmtHour(start + t * 3600) + '</text>';
    }
    var gridY = [0.5, 1].map(function (f) { var gy = base - f * (base - top); return '<line x1="0" y1="' + gy.toFixed(1) + '" x2="' + W + '" y2="' + gy.toFixed(1) + '" stroke="rgba(255,255,255,.06)"/><text x="' + (W - 3) + '" y="' + (gy + 9).toFixed(1) + '" text-anchor="end" font-family="monospace" font-size="8" fill="#8b949e">' + Math.round(max * f) + '</text>'; }).join('');
    var sums = { delivery: 0, ok: 0, refused: 0 };
    buckets.forEach(function (bk) { sums.delivery += bk.delivery; sums.ok += bk.ok; sums.refused += bk.refused; });
    host.innerHTML =
      '<h2 style="margin-top:0">THE WIRE <span class="tag">last 24 hours — ' + sums.delivery + ' deliveries · ' + sums.ok + ' verified · ' + sums.refused + ' refused' + (total ? '' : ' · quiet') + '</span></h2>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="display:block;background:rgba(255,255,255,.02);border-radius:6px;">' + gridY + bars + ticks +
      '<line x1="0" y1="' + (base + .5) + '" x2="' + W + '" y2="' + (base + .5) + '" stroke="rgba(255,255,255,.18)"/>' +
      '<text x="' + (W - 3) + '" y="' + (base + 15) + '" text-anchor="end" font-family="monospace" font-size="9" fill="#8b949e">now</text></svg>' +
      '<div style="font:9px monospace;color:var(--dim,#8b949e);margin-top:4px;"><span style="color:#39c5cf">■</span> delivery &nbsp;<span style="color:#3fb950">■</span> verified &nbsp;<span style="color:#ffb43c">■</span> refused &nbsp;· hover a bar for its hour</div>';
    var lineEl = document.getElementById('mai-wire-line');
    if (lineEl) {
      // 2.5.1 (Greg): a chevron carries the open/closed state, \u25b8 closed and \u25be open, remembered across loads.
      lineEl.textContent = (deck.style.display === 'none' ? '\u25b8 ' : '\u25be ') + 'wire · last heard ' + (last ? fmtAgo(last.t) : 'nothing yet') + ' · ' + (lastReceipt ? (lastReceipt.c === 'ok' ? 'verified' : 'REFUSED') + ' ' + fmtAgo(lastReceipt.t) : 'no verdict yet') + ' · ' + sinceMidnight + ' deliveries today';
      lineEl.classList.toggle('refused', !!(lastReceipt && lastReceipt.c === 'refused'));
    }
    var pulseEl = document.getElementById('mai-pulse');
    if (pulseEl) {
      var row = function (k, v, color) { return '<div class="row"><span class="k">' + k + '</span><span class="s" style="color:' + (color || '#39c5cf') + '">●</span><span class="n">' + v + '</span></div>'; };
      pulseEl.innerHTML =
        '<h2 style="margin-top:0">THE PULSE <span class="tag">as heard by this page</span></h2><div class="card">' +
        row('Last heard', last ? fmtAgo(last.t) : 'nothing yet', last && (nowS - last.t) < 900 ? '#39c5cf' : '#8b949e') +
        row('Last verdict', lastReceipt ? (lastReceipt.c === 'ok' ? 'verified · ' : 'REFUSED · ') + fmtAgo(lastReceipt.t) : '—', lastReceipt && lastReceipt.c === 'refused' ? '#ffb43c' : '#3fb950') +
        row('Busiest hour', busiest && busiest.n ? fmtHour(busiest.from) + ' — ' + busiest.n + ' messages' : '—') +
        row('Since midnight', sinceMidnight + ' deliveries') +
        '</div>';
    }
  }

  function handlePayload(p) {
    // PROJECT KEY — compared case-insensitively (1.18.1). The
    // courier's routing provider already normalises with
    // .lowercased() before matching the Navigation Bay, so it
    // happily accepts "AiAssist", "aiassist", or "AIASSIST" and
    // delivers correctly. This page did an EXACT comparison against
    // window.DASH_PROJECT ('aiassist'), so a payload the courier
    // wrote to disk without complaint was discarded here on the
    // first line — before the chime, before anything. The wire
    // looked dead for a full day while working perfectly.
    //
    // Two sides of one contract must not hold different assumptions
    // about it. The lenient side is correct; this one now matches.
    if (!p || !p.project) return;
    if (String(p.project).toLowerCase() !== String(PROJECT).toLowerCase()) return;

    // RECEIPTS ride the same topic (courier 2.4.0) so the sender can
    // observe its own verdicts. They are outbound telemetry, never
    // instructions — no chime, no delivery handling. Since 1.26.0
    // their VERDICT is observed on the way out: a dropped-* receipt
    // is the courier saying "running, but refusing" — the true
    // story the DELIVERY REFUSED toast tells; a later success heals
    // it. Without the return every landed delivery would still
    // chime twice: once for the payload, once for its own receipt.
    wireLogNote(p);
    if (p.kind === 'receipt') { noteReceiptVerdict(p); return; }

    // The strip's fingerprint is observed from traffic, not declared.
    noteFingerprint(p.auth);

    // Board traffic — live redraw, no reload (Step B).
    if (p.kind === 'board') {
      handleBoardPayload(p);
      scheduleCourierCheck(p);
      if (p.anchor) {
        var target = document.querySelector(p.anchor);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      }
      // NO CHIME (1.21.0). This branch redraws from the PAYLOAD;
      // the courier then writes boards-data.js and the watch adopts
      // it. Chiming here would sound once for the payload and again
      // when the watch confirmed the same change on disk — three
      // sounds for one event counting beam_down. The watch is the
      // sole voice: the visual says HEARD, the cadence says LANDED.
      return;
    }

    // File delivery landed for this project. NOTHING here guesses a
    // delay any more (1.18.0). A payload says the courier HEARD
    // something; only disk says it landed, and the disk watch is
    // what asks. Chunk pieces before the last describe a file that
    // does not exist yet, so they are ignored outright.
    if (p.kind === 'file') {
      // 2.6.0 (audit J-09): a delivery in the project-path form (path "_docs/_dashboard/x.html", the file lane
      // since courier 2.17.0) names its page by path, not filename; it is read in the dashboard form so the
      // page it delivers reloads like one sent by filename.
      var dashPrefix = '_docs/_dashboard/';
      var pathForm = String(p.path || '').replace(/^\.?\//, '');
      var fname = (p.filename || (pathForm.toLowerCase().indexOf(dashPrefix) === 0 ? pathForm.slice(dashPrefix.length) : '')).toLowerCase();
      var mine = fname === currentPageFile();
      var finalPiece = !p.transferId || (p.index === p.total);

      // 1.28.1/1.28.2: HISTORY IS NOT NEWS. The boot-window tag
      // (1.28.1) labels obvious replay for the log; the CONSUMED
      // STAMP (1.28.2) is the actual gate — a time window can never
      // cleanly separate "the delivery I just reloaded for" from "a
      // genuinely new one" (a chunked transfer spans longer than any
      // sane grace period, as the first live test proved when its
      // own tail chunks replayed as 'live' and re-fired one reload).
      // So the trigger's envelope time is persisted at the moment of
      // consumption, and only strictly NEWER self-payloads may
      // reload. Precision by memory, not by clock arithmetic.
      var isHistorical = !!(p.__envTime && (p.__envTime * 1000) < (PAGE_BOOT_MS - 10000));
      var consumed = readConsumedStamp();
      var alreadyConsumed = !!(p.__envTime && consumed && p.__envTime <= consumed);

      // 1.28.0 (Greg: "critical that I can see the progress") —
      // every file payload logs its gate decisions, so a delivery
      // that fails to reload THIS page leaves evidence in the tab's
      // own console instead of vanishing silently.
      try {
        console.log('[wire] file payload: ' + fname +
          ' mine=' + mine + ' finalPiece=' + finalPiece +
          (isHistorical ? ' [replay]' : '') +
          (alreadyConsumed && !isHistorical ? ' [consumed]' : '') +
          (p.transferId ? (' chunk ' + p.index + '/' + p.total) : ''));
      } catch (e) {}

      // Chunk pieces before the last describe a file that does not
      // exist yet — nothing to read, nothing to render.
      //
      // No tick here (1.18.5, Greg's correction): AiAssist owns the
      // chunk-progress sound. Assembly happens in its
      // WireChunkAssembler; this page's knowledge of chunks is
      // incidental, since it merely subscribes to the same topic.
      // Ticking from both would double every sound and imply the
      // page knows something about assembly that it does not.
      if (!finalPiece) { return; }

      if (mine && p.op !== 'delete' && !isHistorical && !alreadyConsumed) {
        // 1.28.2: remember WHAT was consumed before acting on it —
        // this exact payload can replay after our reload, and the
        // stamp is what keeps it from firing twice.
        markConsumedStamp(p.__envTime || Math.floor(Date.now() / 1000));
        // 1.28.0: remember the intent OUTSIDE this page's lifetime.
        // A throttled background tab can stall timers until focus
        // returns; the flag makes the reload survive the stall —
        // visibility/focus handlers below fire it the moment the
        // page is looked at again.
        markSelfReloadPending();
        selfToast('PAGE UPDATE LANDING \u2014 reloading\u2026');
        // Reload only once this page's own manifest stamp advances.
        reloadWhenSelfLands();
      } else {
        // Nav growth, board files, any asset — the watch compares
        // before it redraws, so it cannot render a stale read.
        nudgeDisk();
      }

      // NO CHIME HERE (1.21.0). A payload means the courier heard
      // something, not that this page's content changed — and
      // AiAssist is already sounding beam_down at this instant. The
      // cadence belongs to the disk watch, which is the only place
      // that knows a redraw actually happened.
      return;
    }

    // NOTIFY — a deliberate interruption (1.20.0). The payload names
    // its audiences; this page answers only for "dashboard" and
    // ignores the rest, because AiAssist reaches the Mac and the
    // wrist and this page cannot. Nothing is written and nothing is
    // read — the sound and the strip line ARE the delivery.
    if (p.kind === 'notify') {
      var mine2 = p.destinations && p.destinations.dashboard;
      if (mine2) {
        if (mine2.message) { renderNow({ note: mine2.message }); }
        chime(mine2.sound);
      }
      return;
    }

    if (p.kind !== 'now' && p.kind !== 'message') return;
    renderNow(p);
    var strip = document.getElementById('wire-now');
    if (strip) { clearLiveGlow(); strip.classList.add('wb-live-glow'); }
    // 2.6.0 (audit J-01): only the checked anchor is kept and followed
    const anchorOk = safeAnchor(p.anchor);
    try { localStorage.setItem('mai-wire-last--' + PROJECT, JSON.stringify({ note: p.note, anchor: anchorOk, at: p.at })); } catch (e) {}
    if (anchorOk) {
      const el = document.querySelector(anchorOk);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    chime();
  }

  // ── THE WIRE CONNECTION ───────────────────────────────────────
  // Until 1.17.0 this was eleven lines: open an EventSource, attach
  // onmessage, swallow every error. No onerror, no onopen, no
  // reconnect, no catch-up, and no way to tell a healthy page from a
  // deaf one. When the stream died — relay idle timeout, sleep, a
  // background-tab throttle, any blip — the page went permanently
  // silent while the courier kept landing everything perfectly. The
  // only cure was a manual refresh, and the only symptom was
  // NOTHING HAPPENING, which looks exactly like a quiet afternoon.
  //
  // That is Core_13 §2 in miniature: the page waited and assumed.
  // The courier has had backoff, sleep/wake reconnect and a
  // persisted high-water mark since WireListener 1.1.0; the page
  // that shares its wire had none of it.
  //
  // Now: onopen confirms, onerror reconnects with backoff, the last
  // message id is persisted, and the relay's own ?since= replays
  // whatever was missed — over the SAME SSE transport already proven
  // to work here, so catch-up introduces no new mechanism whose
  // behavior we would be guessing at.
  //
  // And the page SAYS when it is deaf. Silence and health must never
  // look identical on screen; that ambiguity is what made this
  // failure survive two days.

  var wireES = null;          // the live EventSource, or null
  var wireRetry = 0;          // consecutive failures, drives backoff
  var wireTimer = null;       // pending reconnect
  var wireEverOpen = false;   // has this page EVER connected?

  var WIRE_BACKOFF = [1000, 2000, 4000, 8000, 15000, 30000];

  function wireSinceKey() { return 'mai-wire-since--' + PROJECT; }

  function wireSince() {
    try { return localStorage.getItem(wireSinceKey()); } catch (e) { return null; }
  }

  function setWireSince(id) {
    if (!id) return;
    try { localStorage.setItem(wireSinceKey(), String(id)); } catch (e) {}
  }

  // LIVENESS WATCHDOG (2.6.0, audit J-14): a half-open connection never fires onerror, so the page stayed deaf
  // with no WIRE OFFLINE. The relay sends a keepalive about every 45 s; when nothing at all has been heard for
  // 150 s, the connection is treated as dead and the normal reconnect takes over.
  var wireHeardMs = 0;
  var wireWatchdog = null;
  function startWireWatchdog() {
    if (wireWatchdog) return;
    wireWatchdog = setInterval(function () {
      if (!wireES || !wireHeardMs) return;
      if (Date.now() - wireHeardMs > 150000) {
        try { wireES.close(); } catch (e) {}
        wireES = null;
        wireHeardMs = 0;
        scheduleWireReconnect();
      }
    }, 30000);
  }

  function openWire() {
    if (wireTimer) { clearTimeout(wireTimer); wireTimer = null; }
    if (wireES) { try { wireES.close(); } catch (e) {} wireES = null; }

    // Resume from the last message this page actually saw. The relay
    // replays the gap, then continues streaming — catch-up and live
    // delivery on one connection.
    var since = wireSince();
    var url = 'https://ntfy.sh/' + WIRE_TOPIC + '/sse' +
              (since ? ('?since=' + encodeURIComponent(since)) : '');

    try {
      var es = new EventSource(url);
      wireES = es;
      wireHeardMs = Date.now();
      startWireWatchdog();

      es.onopen = function () {
        wireRetry = 0;
        wireEverOpen = true;
        wireHeardMs = Date.now();
        dismissWireOffline();
      };

      // The relay's keepalive and open events count as hearing it (2.6.0, audit J-14)
      es.addEventListener('keepalive', function () { wireHeardMs = Date.now(); });
      es.addEventListener('open', function () { wireHeardMs = Date.now(); });

      es.onmessage = function (ev) {
        wireHeardMs = Date.now();
        try {
          var d = JSON.parse(ev.data);
          if (d.event && d.event !== 'message') return;
          setWireSince(d.id);          // high-water mark BEFORE handling
          var payload = JSON.parse(d.message);
          // 1.28.1: the envelope's own timestamp rides along so the
          // file branch can tell replayed history from live news.
          payload.__envTime = d.time || 0;
          payload.__envId = d.id || '';
          handlePayload(payload);
        } catch (e) {}
      };

      es.onerror = function () {
        // EventSource retries on its own, but silently and forever
        // without telling anyone — which is the exact failure being
        // fixed. Take the connection over: close, show the state,
        // and reconnect on a bounded, visible schedule.
        try { es.close(); } catch (e2) {}
        if (wireES === es) { wireES = null; }
        scheduleWireReconnect();
      };
    } catch (e) {
      scheduleWireReconnect();
    }
  }

  function scheduleWireReconnect() {
    if (wireTimer) return;
    var wait = WIRE_BACKOFF[Math.min(wireRetry, WIRE_BACKOFF.length - 1)];
    wireRetry++;

    // Say it out loud once the page has actually lost something. A
    // first-connection failure is usually just being offline; a DROP
    // after a healthy connection is the case that used to go unseen.
    if (wireEverOpen) { showWireOffline(); }
    console.warn('[dash] wire disconnected — reconnecting in ' +
                 (wait / 1000) + 's (attempt ' + wireRetry + ')');

    wireTimer = setTimeout(function () { wireTimer = null; openWire(); }, wait);
  }

  function showWireOffline() {
    if (document.querySelector('.wire-offline')) return;
    var warn = document.createElement('div');
    warn.className = 'courier-warn wire-offline';
    var msg = document.createElement('div');
    msg.textContent = '\u26A0 WIRE OFFLINE — this page lost its connection and ' +
                      'is reconnecting. Deliveries are still landing on disk; ' +
                      'this page just cannot see them yet.';
    warn.appendChild(msg);
    document.body.appendChild(warn);
  }

  function dismissWireOffline() {
    var el = document.querySelector('.wire-offline');
    if (!el || !el.parentNode) return;
    // Flip green briefly so the recovery is witnessed, then go.
    el.className = 'courier-warn wire-offline healed';
    el.textContent = '\u2713 WIRE BACK — catching up on anything missed.';
    setTimeout(function () {
      if (el.parentNode) { el.parentNode.removeChild(el); }
    }, 3500);
  }

  // --- 1.29.0: THE PAGE REMEMBERS WHAT CHANGED ---------------------
  // (Greg, after watching the self-reload work: "there is no
  // persisting indicator of what was updated... I have no idea what
  // was updated.") The wire says THAT something landed; the reload
  // erases the WHAT. So the page fingerprints every .row per visit
  // and, after any reload, rows whose content differs from the last
  // ACKNOWLEDGED state carry an ember edge and an UPDATED pill —
  // persisting across further reloads until the row is clicked.
  // First-ever visit seeds silently: a baseline, not an event
  // (the 1.23.1 lesson, applied on purpose this time).
  function rowSigKey() {
    return 'mai-row-sigs-' + PROJECT + '-' + currentPageFile();
  }
  function hashStr(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) { h = ((h << 5) + h + s.charCodeAt(i)) | 0; }
    return String(h);
  }
  // 2.2.0: ACKNOWLEDGMENT BY PAGE. One control clears every pill;
  // and a page that is actually on screen for a while is, by law 13,
  // being watched — so its pills clear on their own. Hidden tabs never
  // count: the dwell timer only runs while the document is visible.
  var ACK_DWELL_MS = 6000;
  var ackDwellTimer = null;
  var ackVisibilityListener = null;   // 2.6.0 (audit J-13): kept so it can be removed
  function removeAckAll() {
    var el = document.querySelector('.mai-ack-all');
    if (el && el.parentNode) { el.parentNode.removeChild(el); }
    if (ackDwellTimer) { clearTimeout(ackDwellTimer); ackDwellTimer = null; }
    // 2.6.0 (audit J-13): the visibility listener leaves with the control; it stayed for the life of the page and
    // re-armed the dwell timer on every tab switch after everything was already acknowledged
    if (ackVisibilityListener) { document.removeEventListener('visibilitychange', ackVisibilityListener); ackVisibilityListener = null; }
  }
  function installAckAll(pendingAcks, count) {
    var host = document.getElementById('authored') || document.body;
    var bar = document.createElement('div');
    bar.className = 'mai-ack-all';
    bar.setAttribute('style', 'display:flex;align-items:center;gap:10px;margin:0 0 14px;font:11px monospace;color:var(--dim,#8b949e);');
    var btn = document.createElement('button');
    btn.textContent = 'ACKNOWLEDGE ALL (' + count + ')';
    btn.setAttribute('style', 'font:10px monospace;letter-spacing:.08em;color:#1a1208;background:linear-gradient(180deg,#ffb43c,#e69b1f);border:0;border-radius:999px;padding:3px 10px;cursor:pointer;');
    var note = document.createElement('span');
    note.textContent = 'or keep this page on screen and it clears itself';
    bar.appendChild(btn); bar.appendChild(note);
    host.insertBefore(bar, host.firstChild);
    function ackAll() { pendingAcks.slice().forEach(function (f) { f(); }); removeAckAll(); }
    btn.addEventListener('click', ackAll);
    function armDwell() {
      if (ackDwellTimer) { clearTimeout(ackDwellTimer); ackDwellTimer = null; }
      if (document.hidden) { return; }
      ackDwellTimer = setTimeout(function () { ackDwellTimer = null; ackAll(); }, ACK_DWELL_MS);
    }
    if (ackVisibilityListener) { document.removeEventListener('visibilitychange', ackVisibilityListener); }
    ackVisibilityListener = armDwell;
    document.addEventListener('visibilitychange', armDwell);
    armDwell();
  }

  function initRowChangeTracking() {
    var rows = document.querySelectorAll('.row');
    if (!rows.length) {
      // 1.30.1: a page with nothing trackable cannot hold an
      // unacknowledged change — being viewed IS being seen. (Boards
      // pages witness through their own adoption path instead.)
      if (currentPageFile() !== 'index.html') { clearDirty(currentPageFile()); }
      return;
    }

    var st = document.createElement('style');
    st.textContent =
      '.mai-row-updated{border-left:3px solid #ffb43c;background:rgba(255,180,60,.05);}' +
      '.mai-updated-pill{margin-left:8px;font:9px monospace;letter-spacing:.08em;' +
      'color:#1a1208;background:linear-gradient(180deg,#ffb43c,#e69b1f);' +
      'border-radius:999px;padding:1px 7px;vertical-align:middle;}';
    document.head.appendChild(st);

    var raw = null;
    try { raw = localStorage.getItem(rowSigKey()); } catch (e) {}
    var stored = {};
    try { stored = raw ? JSON.parse(raw) : {}; } catch (e) { stored = {}; }
    var firstVisit = (raw === null);

    var current = {};
    var flagged = 0;
    var pendingAcks = [];
    rows.forEach(function (row) {
      var kEl = row.querySelector('.k');
      if (!kEl) { return; }
      var key = kEl.textContent.trim();
      var sig = hashStr(row.textContent);
      current[key] = sig;
      if (firstVisit) { return; }
      if (stored[key] === sig) { return; }

      // Changed since last acknowledged (or brand new): flag it and
      // keep flagging it on every reload until the row is clicked.
      row.classList.add('mai-row-updated');
      var pill = document.createElement('span');
      pill.className = 'mai-updated-pill';
      pill.textContent = 'UPDATED';
      kEl.appendChild(pill);
      flagged++;

      function ack() {
        row.classList.remove('mai-row-updated');
        if (pill.parentNode) { pill.parentNode.removeChild(pill); }
        stored[key] = sig;
        try { localStorage.setItem(rowSigKey(), JSON.stringify(stored)); } catch (e) {}
        row.removeEventListener('click', ack);
        pendingAcks = pendingAcks.filter(function (f) { return f !== ack; });
        // 1.29.1: the last acknowledged pill puts the nav badge out —
        // badge and pills agree, always.
        if (!document.querySelector('.mai-row-updated')) { clearHereUpdated(); removeAckAll(); }
      }
      row.addEventListener('click', ack);
      pendingAcks.push(ack);
    });

    if (firstVisit) {
      try { localStorage.setItem(rowSigKey(), JSON.stringify(current)); } catch (e) {}
      clearDirty(currentPageFile());
      return;
    }
    if (flagged) {
      // 1.29.1 (Greg's catch: "Development should say updated next to
      // it but it does not") — a page holding unacknowledged pills
      // names ITSELF in the nav too. The 1.25.0 here-badge cleared on
      // refresh, which is exactly wrong for a self-reloading page:
      // the refresh IS the delivery. Ridden on the pills instead, it
      // stays lit across reloads until the last pill is clicked.
      markHereUpdated();
      installAckAll(pendingAcks, flagged);
      try { console.log('[rows] ' + flagged + ' row(s) updated since last acknowledged — click a row, ACKNOWLEDGE ALL, or keep the page on screen'); } catch (e) {}
    } else {
      // Content matches the acknowledged state — this page holds no
      // unacknowledged change, whatever the ledger thought before.
      clearDirty(currentPageFile());
    }
  }

  // --- Init --------------------------------------------------------
  buildShell();
  loadSite(false);
  loadLanes();
  // 2.7.0: #lanes opens and closes the Lanes view without a reload.
  window.addEventListener('hashchange', function () { if (shellNavEl) { renderPagesGroup(shellNavEl); } applyLanesView(); });
  renderChips();
  applyZoom(readSaved());
  buildStrip();
  loadBoards();
  renderWireStrip();
  seedWireLog();
  openWire();
  startDiskWatch();
  loadStamp();
  installArmListeners();
  initRowChangeTracking();
  // 1.28.0: a reload promised while this tab was throttled or gone
  // fires the moment the page is booted or looked at again.
  fireIfSelfReloadPending('boot');
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) { fireIfSelfReloadPending('visibility'); }
  });
  window.addEventListener('focus', function () {
    fireIfSelfReloadPending('focus');
  });
})();