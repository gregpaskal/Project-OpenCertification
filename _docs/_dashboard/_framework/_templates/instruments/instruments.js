// ===============================================================
// @file: instruments.js
// @filepath: dashboard_engine/_framework/_templates/instruments/instruments.js
// @version: 1.0.0
// @updated: 2026-11-13 05:16:26 PM CST
// @author: Greg Paskal & Claude
// @company: MissionWares®
// @description: The Instruments page type's behavior: it draws a run being measured, live, from an instrument lane (an
//   ntfy topic). On opening it reads what the relay keeps (12 hours by default), then follows the wire live
//   (EventSource). Every message is JSON-parsed, never pattern-matched; only the configured kind from this project is
//   kept. Readings group by runId; older readings without one group by host and model, a new run starting at seq 1. The
//   Gauge Row shows the newest run: its latest sample while it runs, its result once done. The Runs Table lists every
//   finished run, newest first. What is measured lives in the page's own instruments/instruments-config.js
//   (window.DASH_INSTRUMENTS): the lane, the gauges (METERS), the table's columns, the column cards and the legend, so
//   no project's instruments are baked in here. A value not read is shown as a dash, never 0. Read-only: it sends
//   nothing.
//   THE LEARNING CARDS: every gauge and every column title with a key carries a card (what it measures, an analogy, what
//   has been measured, what to watch for, glossary links when the project has a Glossary). It opens beside the gauge on
//   hover or focus; a click pins it, and pinned cards drag anywhere on the page and resize from their corner, several
//   open at once. Open cards and their places are remembered under the project's own key.
//   A STAMPED file: changed only at the engine home.
// @tags: living-dashboard, instruments, instrument-lane, perf, gauges, page-type
// @changeLog:
// Date        Author         Version        Description
// ----------  -------------  -------------  --------------------------
// 2026-11-13  Greg & Claude  1.0.0          The Instruments page type, harvested from Project-AI-Local instruments.js 1.4.1 (Greg: add the Instruments to our templates): ingest, gauges, sparklines and the learning cards unchanged; the lane topic, relay, project, kind, catch-up window, time zone, gauges, Runs Table columns, column cards, glossary labels and legend from instruments/instruments-config.js; a card's measured paragraph titled from the config and left out when empty; glossary links only when the project has a Glossary; storage key from DASH_PROJECT; IN_TEMPLATE_VERSION announced
// ===============================================================
(function () {
  'use strict';

  var VERSION = '1.0.0';
  // The page type announces itself, like the engine does: type IN_TEMPLATE_VERSION in the console. Must equal @version above.
  window.IN_TEMPLATE_VERSION = VERSION;
  var P = window.DASH_PROJECT || 'dashboard';

  // ── SETTINGS: all from the page's own instruments/instruments-config.js (window.DASH_INSTRUMENTS) ──────────
  var CFG = window.DASH_INSTRUMENTS || null;
  var C = CFG || {};
  var TOPIC = C.topic || '';
  var RELAY = (C.relay || 'https://ntfy.sh').replace(/\/+$/, '');
  var PROJECT = C.project || P;
  var KIND = C.kind || 'perf';
  var LIVE_SECONDS = C.liveSeconds || 30;
  var SINCE = C.since || '12h';
  var TZ = C.timeZone || 'America/Chicago';

  // ── METERS: one row per gauge; level() reads warnBelow and badBelow; the learning card reads what, like, measured, watch and terms ──
  var METERS = Array.isArray(C.meters) ? C.meters : [];

  // ── COLUMN CARDS: Runs Table columns with no gauge of their own; a column that shows a gauge's value opens that gauge's card ──
  var COLUMN_CARDS = Array.isArray(C.cards) ? C.cards : [];

  // ── COLUMNS: the Runs Table, left to right. path names where a cell's value lives in a run (result.x, run.x.y, last.x,
  // model, tag, host, or when); a list of paths takes the first that has a value; level names the gauge whose warn and bad
  // color the cell; key gives the title a card ──
  var COLUMNS = Array.isArray(C.columns) ? C.columns : [];
  var STRIP = Array.isArray(C.strip) ? C.strip : [];

  // ── STATE ─────────────────────────────────────────────────────
  var seen = {};
  var runs = {};
  var legacyKeys = {};
  var wireState = 'connecting';

  // ── SMALL HELPERS ─────────────────────────────────────────────
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(v, d) { return v == null || !isFinite(v) ? '-' : Number(v).toFixed(d); }
  function cdtTime(unix) { return new Date(unix * 1000).toLocaleTimeString('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit', second: '2-digit' }); }
  function cdtDay(unix) { return new Date(unix * 1000).toLocaleDateString('en-US', { timeZone: TZ, month: 'short', day: 'numeric' }); }
  // A value in a run by path: result.x, run.x.y (the result message's run block), last.x (the newest sample), or a run's own field
  function at(r, path) {
    var paths = Array.isArray(path) ? path : [path];
    for (var i = 0; i < paths.length; i++) {
      var parts = String(paths[i]).split('.');
      var head = parts.shift();
      var v = head === 'result' ? r.result : head === 'run' ? r.extra : head === 'last' ? (r.samples.length ? r.samples[r.samples.length - 1].m : null) : r[head];
      while (v != null && parts.length) { v = v[parts.shift()]; }
      if (v != null && v !== '') { return v; }
    }
    return null;
  }
  function cell(r, col) {
    if (col.path === 'when') { return cdtDay(r.firstAt) + ' ' + cdtTime(r.firstAt); }
    var v = at(r, col.path);
    return col.digits != null && typeof v === 'number' ? fmt(v, col.digits) : (v == null ? '-' : String(v));
  }
  function level(m, v) {
    if (v == null) return '';
    if (m.badBelow != null && v < m.badBelow) return 'bad';
    if (m.warnBelow != null && v < m.warnBelow) return 'warn';
    return '';
  }
  function levelColor(lv) { return lv === 'bad' ? 'var(--bad)' : lv === 'warn' ? 'var(--warn)' : 'var(--cyan)'; }

  // ── INGEST: one relay envelope at a time ──────────────────────
  function ingest(e) {
    if (!e || e.event !== 'message' || seen[e.id] || typeof e.message !== 'string') return false;
    seen[e.id] = true;
    var p;
    try { p = JSON.parse(e.message); } catch (err) { return false; }
    if (!p || p.kind !== KIND || p.project !== PROJECT || !p.metrics) return false;
    var key = p.runId;
    if (!key) {
      var lk = (p.host || '?') + '|' + (p.model || '?');
      if (p.seq === 1 || !legacyKeys[lk]) legacyKeys[lk] = 'legacy-' + lk + '-' + e.time;
      key = legacyKeys[lk];
    }
    var r = runs[key];
    if (!r) { r = runs[key] = { id: key, host: p.host, model: p.model, tag: p.tag, samples: [], result: null, extra: null, firstAt: e.time, lastAt: e.time }; }
    if (e.time < r.firstAt) r.firstAt = e.time;
    if (e.time > r.lastAt) r.lastAt = e.time;
    if (p.phase === 'result') { r.result = p.metrics; r.extra = p.run || null; }
    else r.samples.push({ t: e.time, seq: p.seq, m: p.metrics });
    r.samples.sort(function (a, b) { return a.t - b.t || a.seq - b.seq; });
    return true;
  }

  // ── DRAWING: one function per region ──────────────────────────
  function newestRun() {
    var best = null;
    Object.keys(runs).forEach(function (k) { if (!best || runs[k].lastAt > best.lastAt) best = runs[k]; });
    return best;
  }

  function arcSvg(pct, color) {
    var p = Math.max(0, Math.min(100, pct || 0));
    return '<svg class="in-arc" viewBox="0 0 100 56" aria-hidden="true"><path d="M10 50 A40 40 0 0 1 90 50" pathLength="100" fill="none" stroke="var(--hair)" stroke-width="8" stroke-linecap="round"/><path d="M10 50 A40 40 0 0 1 90 50" pathLength="100" fill="none" stroke="' + color + '" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + p.toFixed(1) + ' 100"/></svg>';
  }

  // The vertical span is at least 10% of the gauge's range, so a wobble of 0.1 tok/s draws as the flat line it is
  function sparkSvg(values, color, max) {
    var pts = values.filter(function (v) { return v != null && isFinite(v); });
    if (pts.length < 2) return '<svg class="in-spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"></svg>';
    var hi = Math.max.apply(null, pts);
    var span = Math.max(hi - Math.min.apply(null, pts), max * 0.1);
    var lo = Math.max(0, (hi + Math.min.apply(null, pts)) / 2 - span / 2);
    var line = pts.map(function (v, i) { return (i / (pts.length - 1) * 100).toFixed(1) + ',' + (27 - (v - lo) / span * 24).toFixed(1); }).join(' ');
    return '<svg class="in-spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><polyline points="' + line + '" fill="none" stroke="' + color + '" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>';
  }

  function drawStrip(r) {
    var el = document.getElementById('in-strip');
    if (!CFG) { el.innerHTML = '<span class="in-pill stale">NO CONFIG</span> <span>instruments/instruments-config.js did not load: it names the lane, the gauges and the columns</span>'; return; }
    if (!TOPIC) { el.innerHTML = '<span class="in-pill stale">NO LANE</span> <span>instruments-config.js names no topic, so there is nothing to read</span>'; return; }
    if (!r) { el.innerHTML = '<span class="in-pill">WAITING</span> <span>no readings from ' + esc(PROJECT) + ' in the last ' + esc(SINCE) + ' · wire ' + esc(wireState) + '</span>'; return; }
    var age = Date.now() / 1000 - r.lastAt;
    var pill = r.result ? '<span class="in-pill done">DONE</span>' : age <= LIVE_SECONDS ? '<span class="in-pill live">LIVE</span>' : '<span class="in-pill stale">NO RESULT</span>';
    var extra = STRIP.map(function (s) { var v = at(r, s.path); return '<span>' + esc(s.label) + ' <b>' + esc(s.digits != null && typeof v === 'number' ? fmt(v, s.digits) : (v == null ? '-' : v)) + '</b></span>'; });
    var parts = [pill, '<span><b>' + esc(r.model) + '</b></span>'].concat(extra).concat(['<span>' + esc(r.host) + '</span>', '<span>last reading <b>' + cdtTime(r.lastAt) + '</b></span>', '<span>wire ' + esc(wireState) + '</span>']);
    if (r.tag) parts.splice(2, 0, '<span>tag <b>' + esc(r.tag) + '</b></span>');
    el.innerHTML = parts.join(' ');
  }

  function drawRow(r) {
    var el = document.getElementById('in-row');
    var shown = r ? (r.result || (r.samples.length ? r.samples[r.samples.length - 1].m : {})) : {};
    el.innerHTML = METERS.map(function (m) {
      var v = shown[m.key];
      var open = '<div class="in-gauge" data-key="' + m.key + '" tabindex="0" role="button" aria-label="' + esc(m.title) + ': about this gauge"><h4>' + esc(m.title) + '<span class="in-i" aria-hidden="true">i</span></h4>';
      if (m.word) return open + '<div class="in-word">' + esc(v == null ? '-' : v) + '</div><div class="in-note">' + esc(m.note) + '</div></div>';
      var lv = level(m, v);
      var color = levelColor(lv);
      var series = r ? r.samples.map(function (s) { return s.m[m.key]; }) : [];
      if (r && r.result) series.push(r.result[m.key]);
      return open + arcSvg(v == null ? 0 : v / m.max * 100, color) + '<div class="in-val">' + fmt(v, m.digits) + '<small>' + esc(m.unit) + '</small></div><div class="in-note">' + esc(m.note) + '</div>' + sparkSvg(series, color, m.max) + '</div>';
    }).join('');
  }

  function drawRuns() {
    var el = document.getElementById('in-runs');
    var done = Object.keys(runs).map(function (k) { return runs[k]; }).filter(function (r) { return r.result; });
    done.sort(function (a, b) { return b.lastAt - a.lastAt; });
    if (!COLUMNS.length) { el.innerHTML = ''; return; }
    if (!done.length) { el.innerHTML = '<h4 class="in-note in-runs-h">RUNS</h4><div class="in-empty">No finished run in the last ' + esc(SINCE) + '.</div>'; return; }
    // A column title with a card (1.2.0) carries its key and opens that card on hover, focus or click
    var th = function (key, label, left) { return '<th' + (left ? ' class="l"' : '') + (key ? ' data-key="' + key + '" tabindex="0" role="button" aria-label="' + esc(label) + ': about this column"' : '') + '>' + esc(label) + '</th>'; };
    var head = '<tr>' + COLUMNS.map(function (col) { return th(col.key && learnFor(col.key) ? col.key : null, col.label, col.left); }).join('') + '</tr>';
    var body = done.map(function (r) {
      return '<tr>' + COLUMNS.map(function (col) {
        var m = col.level ? meterFor(col.level) : null;
        var lv = m ? level(m, at(r, col.path)) : '';
        var cls = [col.left ? 'l' : '', lv].filter(Boolean).join(' ');
        return '<td' + (cls ? ' class="' + cls + '"' : '') + '>' + esc(cell(r, col)) + '</td>';
      }).join('') + '</tr>';
    }).join('');
    el.innerHTML = '<h4 class="in-note in-runs-h">RUNS · newest first · ' + done.length + '</h4><table>' + head + body + '</table>';
  }

  function drawLegend() {
    // The legend: each item a bold name and its plain sentence, from the config; the dash rule is always said
    var items = Array.isArray(C.legend) ? C.legend : [];
    document.getElementById('in-legend').innerHTML = items.map(function (x) { return (x.name ? '<b>' + esc(x.name) + '</b> ' : '') + esc(x.text || ''); }).join(' ') + (items.length ? ' ' : '') + 'A dash is a value not read, never a zero.' + (C.source ? ' Readings come from ' + esc(C.source) + '.' : '');
  }

  // ── THE LEARNING CARDS (1.1.0) ──────────────────────────────
  // Hovering (or focusing) a gauge opens its card beside it, never over it, so the gauge stays live while it is read. A click (or
  // Enter) pins the card: a pinned card stays open, drags by its title bar to wherever it helps, and any number may be open at once,
  // one per gauge; its close mark or a second click on its gauge closes it. Where each card sits, and which are open, is remembered in
  // this browser (localStorage, wrapped: it may be empty or refused). Cards live in the section, outside the Gauge Row, so the
  // five-second redraw of the gauges never removes them.
  var TERM_LABELS = C.terms || {};
  var MEASURED = C.measuredLabel || 'Measured';
  var STORE = P + '.instruments.cards.v1';
  // Glossary links are drawn only when the project has a Glossary page (the courier's page list)
  function hasGlossary() { var s = window.DASH_SITE; return !!(s && s.pages && s.pages.some(function (p) { return p.href === 'glossary.html'; })); }
  var hoverKey = null;
  var hideTimer = null;
  var hoverCard = null;
  var pinned = {};
  var places = { open: [], at: {} };
  var topZ = 30;
  function meterFor(key) { return METERS.filter(function (m) { return m.key === key; })[0]; }
  // A card's words (1.2.0): a gauge's row in METERS, or a column-only card in COLUMN_CARDS; each idea is written once
  function learnFor(key) { return meterFor(key) || COLUMN_CARDS.filter(function (m) { return m.key === key; })[0]; }
  // What a card sits beside (1.2.0): the gauge or column title it was last opened from, else whichever of the two exists
  var lastSrc = '#in-row .in-gauge';
  function gaugeFor(key) { return document.querySelector(lastSrc + '[data-key="' + key + '"]') || document.querySelector('#in-row .in-gauge[data-key="' + key + '"]') || document.querySelector('#in-runs th[data-key="' + key + '"]'); }
  function section() { return document.getElementById('instruments'); }

  function loadPlaces() {
    try { var p = JSON.parse(localStorage.getItem(STORE) || 'null'); if (p && Array.isArray(p.open) && p.at) places = p; } catch (e) { }
  }
  function savePlaces() {
    places.open = Object.keys(pinned);
    places.open.forEach(function (k) { var c = pinned[k]; places.at[k] = { left: c.offsetLeft, top: c.offsetTop, w: c.style.height ? c.offsetWidth : null, h: c.style.height ? c.offsetHeight : null }; });
    try { localStorage.setItem(STORE, JSON.stringify(places)); } catch (e) { }
  }

  function cardHtml(m, isPinned) {
    var list = Array.isArray(m.terms) ? m.terms : [];
    var terms = list.length && hasGlossary() ? '<div class="in-card-terms">Glossary: ' + list.map(function (t) { return '<a href="glossary.html#' + encodeURIComponent(t) + '">' + esc(TERM_LABELS[t] || t) + '</a>'; }).join(' · ') + '</div>' : '';
    var para = function (k, text) { return text ? '<p>' + (k ? '<span class="in-card-k">' + esc(k) + '</span>' : '') + esc(text) + '</p>' : ''; };
    var right = isPinned ? '<button class="in-card-x" type="button" aria-label="Close the ' + esc(m.title) + ' card">×</button>' : '<span class="in-card-hint">click the gauge to pin</span>';
    return '<div class="in-card-head"><b>' + esc(m.title) + '</b>' + right + '</div>' + para('', m.what) + para('Like', m.like) + para(MEASURED, m.measured) + para('Watch for', m.watch) + terms;
  }

  // Beside the gauge: to its right when there is room, else to its left, else below it
  // Any element's box in the section's own coordinates (1.3.0): measured on screen and divided by the page zoom, so a column title
  // inside the table (whose offsets count from the table) lands where it really is
  function posOf(el) {
    var z = pageZoom();
    var b = section().getBoundingClientRect();
    var r = el.getBoundingClientRect();
    return { l: (r.left - b.left) / z, t: (r.top - b.top) / z, w: r.width / z, h: r.height / z };
  }

  // The part of the section the reader can see right now (1.3.0): the nearest scrolling frame, else the window, in section coordinates
  function visibleBand() {
    var z = pageZoom();
    var b = section().getBoundingClientRect();
    var top = 0;
    var bottom = window.innerHeight;
    for (var p = section().parentElement; p && p !== document.documentElement; p = p.parentElement) {
      var oy = getComputedStyle(p).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && p.scrollHeight > p.clientHeight) { var r = p.getBoundingClientRect(); top = Math.max(top, r.top); bottom = Math.min(bottom, r.bottom); break; }
    }
    return { t: (top - b.top) / z, b: (bottom - b.top) / z };
  }

  // Beside its gauge or title: to the right when there is room, else to the left, else below. FIT TO VIEW (1.3.0): when the card is
  // taller than the visible band it widens (320, 420, 520 px) until it fits, then slides up or down to sit wholly in view.
  function placeBeside(el, key) {
    var g = gaugeFor(key);
    if (!g) return;
    var box = section();
    var a = posOf(g);
    var band = visibleBand();
    var room = band.b - band.t - 16;
    var widths = [320, 420, 520];
    for (var i = 0; i < widths.length; i++) { el.style.width = widths[i] + 'px'; if (el.offsetHeight <= room) break; }
    var w = el.offsetWidth;
    var h = el.offsetHeight;
    var gap = 12;
    var left = a.l + a.w + gap;
    var top = a.t;
    if (left + w > box.clientWidth) left = a.l - gap - w;
    if (left < 0) { left = Math.max(0, Math.min(a.l, box.clientWidth - w)); top = a.t + a.h + gap; }
    top = Math.max(band.t + 8, Math.min(top, band.b - h - 8));
    el.style.left = left + 'px';
    el.style.top = Math.max(0, top) + 'px';
  }

  // A card stays inside the section across, and below its top; it may sit as far down as it is dragged
  function clampInto(el, left, top) {
    var box = section();
    el.style.left = Math.max(0, Math.min(left, box.clientWidth - el.offsetWidth)) + 'px';
    el.style.top = Math.max(0, top) + 'px';
  }

  function markGauges() {
    document.querySelectorAll('#in-row .in-gauge, #in-runs th[data-key]').forEach(function (el) {
      var k = el.getAttribute('data-key');
      el.classList.toggle('in-active', k === hoverKey || !!pinned[k]);
      el.classList.toggle('in-pinned', !!pinned[k]);
    });
  }

  function showHover() {
    clearTimeout(hideTimer);
    markGauges();
    if (!hoverKey || pinned[hoverKey]) { hoverCard.hidden = true; return; }
    hoverCard.innerHTML = cardHtml(learnFor(hoverKey), false);
    hoverCard.hidden = false;
    placeBeside(hoverCard, hoverKey);
  }

  function hideSoon() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () { hoverKey = null; showHover(); }, 200);
  }

  function pin(key) {
    if (pinned[key] || !learnFor(key)) return;
    var el = document.createElement('div');
    el.className = 'in-card in-card-pinned';
    el.setAttribute('role', 'note');
    el.setAttribute('data-key', key);
    el.innerHTML = cardHtml(learnFor(key), true);
    el.style.zIndex = ++topZ;
    section().appendChild(el);
    // A pinned card opens exactly where its hover card fits (1.3.1); a remembered place is used only when it is wholly in view now
    var at = places.at[key];
    var band = visibleBand();
    if (at && at.w && at.h) { el.style.width = at.w + 'px'; el.style.height = at.h + 'px'; }
    if (at && at.top >= band.t && at.top + el.offsetHeight <= band.b) clampInto(el, at.left, at.top);
    else placeBeside(el, key);
    // SIZE TO FIT (1.4.0): a pinned card resizes from its corner; once given a height, its text steps down from 12 px (to 7 px at
    // the least) until the content fits, and steps back up when there is room again. The size is remembered with the place.
    var fit = function () {
      if (!el.style.height) return;
      var s = 12;
      el.style.fontSize = s + 'px';
      while (el.scrollHeight > el.clientHeight + 1 && s > 7) { s -= 0.5; el.style.fontSize = s + 'px'; }
    };
    var saveLater = null;
    new ResizeObserver(function () { fit(); clearTimeout(saveLater); saveLater = setTimeout(savePlaces, 400); }).observe(el);
    pinned[key] = el;
    if (hoverKey === key) hoverKey = null;
    showHover();
    savePlaces();
  }

  function unpin(key) {
    if (!pinned[key]) return;
    pinned[key].remove();
    delete pinned[key];
    // Closing forgets (1.4.1): a card pinned again starts fresh beside its gauge at the default size; open cards keep theirs
    delete places.at[key];
    markGauges();
    savePlaces();
  }

  // The engine zooms the page; a drag in screen pixels moves a card by screen pixels divided by that zoom
  function pageZoom() {
    var z = parseFloat(getComputedStyle(document.body).zoom) || 1;
    var zh = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
    return z * zh;
  }

  function startDrag(ev, el) {
    if (ev.button !== 0 || ev.target.closest('.in-card-x')) return;
    ev.preventDefault();
    var zoom = pageZoom();
    var x0 = ev.clientX;
    var y0 = ev.clientY;
    var left0 = el.offsetLeft;
    var top0 = el.offsetTop;
    el.classList.add('in-dragging');
    var move = function (e) { clampInto(el, left0 + (e.clientX - x0) / zoom, top0 + (e.clientY - y0) / zoom); };
    var end = function () { el.classList.remove('in-dragging'); document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', end); savePlaces(); };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', end);
  }

  function setupCards() {
    var row = document.getElementById('in-row');
    var box = section();
    hoverCard = document.createElement('div');
    hoverCard.className = 'in-card';
    hoverCard.hidden = true;
    hoverCard.setAttribute('role', 'note');
    box.appendChild(hoverCard);
    // One set of handlers serves both places a card opens from (1.2.0): a gauge in the Gauge Row, a column title in the Runs Table
    [[row, '#in-row .in-gauge', '.in-gauge'], [document.getElementById('in-runs'), '#in-runs th', 'th[data-key]']].forEach(function (src) {
      var area = src[0];
      var where = src[1];
      var sel = src[2];
      var take = function (ev) { var g = ev.target.closest(sel); if (!g) return null; lastSrc = where; return g; };
      area.addEventListener('mouseover', function (ev) { var g = take(ev); if (!g) return; hoverKey = g.getAttribute('data-key'); showHover(); });
      area.addEventListener('mouseout', function (ev) { var to = ev.relatedTarget; if (to && (to.closest(sel) || hoverCard.contains(to))) return; hideSoon(); });
      area.addEventListener('focusin', function (ev) { var g = take(ev); if (!g) return; hoverKey = g.getAttribute('data-key'); showHover(); });
      area.addEventListener('focusout', function () { hideSoon(); });
      area.addEventListener('click', function (ev) { var g = take(ev); if (!g) return; var k = g.getAttribute('data-key'); if (pinned[k]) unpin(k); else pin(k); });
      area.addEventListener('keydown', function (ev) { if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.closest(sel)) { ev.preventDefault(); ev.target.closest(sel).click(); } });
    });
    hoverCard.addEventListener('mouseenter', function () { clearTimeout(hideTimer); });
    hoverCard.addEventListener('mouseleave', hideSoon);
    box.addEventListener('click', function (ev) { var x = ev.target.closest('.in-card-x'); if (x) unpin(x.closest('.in-card-pinned').getAttribute('data-key')); });
    box.addEventListener('pointerdown', function (ev) { var c = ev.target.closest('.in-card-pinned'); if (!c) return; c.style.zIndex = ++topZ; if (ev.target.closest('.in-card-head')) startDrag(ev, c); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && hoverKey) { hoverKey = null; showHover(); } });
    window.addEventListener('resize', function () { if (!hoverCard.hidden) placeBeside(hoverCard, hoverKey); Object.keys(pinned).forEach(function (k) { clampInto(pinned[k], pinned[k].offsetLeft, pinned[k].offsetTop); }); });
  }

  // Cards that were open last time come back where they were left, once the gauges exist
  // The page list (_data/site-data.js) arrives after this script, so cards wait for it to know whether to link the Glossary
  function restoreCards() {
    var go = function () { loadPlaces(); places.open.slice().forEach(pin); };
    if (window.DASH_SITE) { go(); } else { window.addEventListener('load', go); }
  }

  function render() {
    var r = newestRun();
    drawStrip(r);
    drawRow(r);
    drawRuns();
    markGauges();
    if (hoverCard && !hoverCard.hidden) placeBeside(hoverCard, hoverKey);
  }

  // ── THE WIRE: 12 hours of catch-up, then live ─────────────────
  function catchUp() {
    return fetch(RELAY + '/' + encodeURIComponent(TOPIC) + '/json?poll=1&since=' + encodeURIComponent(SINCE)).then(function (resp) { return resp.text(); }).then(function (txt) {
      txt.split('\n').forEach(function (line) {
        if (!line.trim()) return;
        try { ingest(JSON.parse(line)); } catch (err) { }
      });
    }).catch(function () { wireState = 'catch-up failed'; });
  }

  function follow() {
    var es = new EventSource(RELAY + '/' + encodeURIComponent(TOPIC) + '/sse');
    es.onopen = function () { wireState = 'live'; render(); };
    es.onerror = function () { wireState = 'reconnecting'; render(); };
    es.onmessage = function (ev) {
      var e;
      try { e = JSON.parse(ev.data); } catch (err) { return; }
      if (ingest(e)) render();
    };
  }

  var sub = document.getElementById('in-sub');
  if (sub) { sub.textContent = C.subtitle || 'live from the instrument lane'; }
  drawLegend();
  setupCards();
  render();
  if (!CFG || !TOPIC) { return; }
  restoreCards();
  catchUp().then(function () { render(); follow(); });
  setInterval(render, 5000);
})();