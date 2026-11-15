// ===============================================================
// @file: diagrams.js
// @filepath: dashboard_engine/_framework/_templates/diagrams/diagrams.js
// @version: 1.0.1
// @updated: 2026-11-12 08:09:17 PM CST
// @author: Greg Paskal & Claude
// @company: MissionWares®
// @description: The Diagrams page type's behavior, the master AiAssist publishes into a project's
//   _docs/_dashboard/_framework/_templates/diagrams/diagrams.js (a STAMPED file: never edited in a project, replaced when this master
//   changes). ONE function renders every catalog card (Core_05 Shared Rendering Rule) and ONE viewer opens any diagram
//   full window on an infinite canvas: drag or two-finger scroll to pan, pinch or Cmd/Ctrl + wheel to zoom about the
//   pointer, double-click to zoom in, keys for everything. Cards come from data, window.DASH_DIAGRAMS in
//   diagrams/diagrams-data.js (the project's own file, founded from example/), read by the additive data law: known fields are used, unknown
//   fields ignored, a missing field shows blank. A card written by hand as <article class="dg-card"> in the page still
//   renders, so a page founded before this template keeps working. Harvested from Project-AI-Local diagrams.js 1.0.0
//   (2026-10-31); the viewer is unchanged.
// @dependencies: _framework/dashboard.js loads first (it builds the page shell); diagrams/diagrams-data.js loads before
//   this file; diagrams.css beside it supplies the styles. The SVG is sized as real pixels at every zoom (never
//   CSS-scaled), so text stays crisp at any magnification.
// @tags: dashboard, page-type, diagram, catalog, viewer, infinite-canvas, pan, zoom, template
// @changeLog:
// Date        Author         Version        Description
// ----------  -------------  -------------  --------------------------
// 2026-11-12  Greg & Claude  1.0.0          The Diagrams page type, harvested from Project-AI-Local diagrams.js 1.0.0: cards drawn from DASH_DIAGRAMS (schema 1.0.0, additive) as well as hand-written articles; viewer unchanged; DG_TEMPLATE_VERSION announced
// 2026-11-12  Greg & Claude  1.0.1          Moved with the engine: the page types now live in dashboard_engine/_framework/_templates/, so AiAssist copies them with the engine (framework entry "- _framework/"); @filepath follows, template 1.0.1; TEMPLATE_VERSION follows @version
// ===============================================================
(function () {
  'use strict';

  // The page type announces itself, like the engine does: type DG_TEMPLATE_VERSION in the console to see which
  // Diagram template a page is running. Must equal @version above.
  var TEMPLATE_VERSION = '1.0.1';
  window.DG_TEMPLATE_VERSION = TEMPLATE_VERSION;

  var SVG_DIR = 'diagrams/svg/';
  var ZOOM_MIN = 0.05;
  var ZOOM_MAX = 24;
  var GRID = 40;
  var FIT_PAD = 40;
  var viewer = null;

  // ── DATA: the additive data law ───────────────────────────────
  // A field is read only if this version knows it; any other field is ignored; a missing or non-string field is
  // blank, never an error and never an invented default.
  function field(entry, name) {
    var v = entry ? entry[name] : undefined;
    return (typeof v === 'string') ? v : '';
  }

  // One entry becomes one <article class="dg-card"> in the grid, the same shape a hand-written card has, so one
  // renderer serves both.
  function articleFromEntry(entry) {
    var id = field(entry, 'id');
    var file = field(entry, 'file');
    if (!id || !file || document.getElementById(id)) { return null; }
    var a = document.createElement('article');
    a.className = 'dg-card';
    a.id = id;
    a.setAttribute('data-src', SVG_DIR + file);
    a.setAttribute('data-title', field(entry, 'title') || id);
    a.setAttribute('data-added', field(entry, 'added'));
    a.textContent = field(entry, 'summary');
    return a;
  }

  function addCardsFromData() {
    var grid = document.getElementById('dg-grid');
    var data = window.DASH_DIAGRAMS;
    if (!grid || !data || !Array.isArray(data.diagrams)) { return; }
    data.diagrams.forEach(function (entry) {
      var a = articleFromEntry(entry);
      if (a) { grid.appendChild(a); }
    });
  }

  // ── CATALOG: one renderer for every card ──────────────────────
  function renderCard(card) {
    var src = card.getAttribute('data-src');
    var title = card.getAttribute('data-title') || card.id;
    var added = card.getAttribute('data-added') || '';
    var summary = document.createElement('div');
    summary.className = 'dg-summary';
    while (card.firstChild) { summary.appendChild(card.firstChild); }
    var thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = 'dg-thumb';
    thumb.setAttribute('aria-label', 'Open ' + title + ' full size');
    var img = document.createElement('img');
    img.src = src;
    img.alt = title;
    thumb.appendChild(img);
    var body = document.createElement('div');
    body.className = 'dg-body';
    var heading = document.createElement('h3');
    heading.textContent = title;
    var meta = document.createElement('div');
    meta.className = 'dg-meta';
    meta.textContent = (added ? 'ADDED ' + added + ' · ' : '') + '#' + card.id;
    var actions = document.createElement('div');
    actions.className = 'dg-actions';
    var openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.className = 'dg-btn';
    openBtn.textContent = 'OPEN FULL SIZE';
    var rawLink = document.createElement('a');
    rawLink.className = 'dg-btn';
    rawLink.href = src;
    rawLink.target = '_blank';
    rawLink.rel = 'noopener';
    rawLink.textContent = 'RAW SVG';
    var anchorLink = document.createElement('a');
    anchorLink.className = 'dg-btn';
    anchorLink.href = '#' + card.id;
    anchorLink.textContent = 'LINK';
    actions.appendChild(openBtn);
    actions.appendChild(rawLink);
    actions.appendChild(anchorLink);
    body.appendChild(heading);
    body.appendChild(summary);
    body.appendChild(meta);
    body.appendChild(actions);
    card.appendChild(thumb);
    card.appendChild(body);
    var open = function () { openViewer(src, title, thumb); };
    thumb.addEventListener('click', open);
    openBtn.addEventListener('click', open);
  }

  function renderCatalog() {
    addCardsFromData();
    var cards = document.querySelectorAll('article.dg-card');
    for (var i = 0; i < cards.length; i++) { renderCard(cards[i]); }
    var count = document.getElementById('dg-count');
    if (count) { count.textContent = cards.length + (cards.length === 1 ? ' DIAGRAM' : ' DIAGRAMS'); }
    // A card reached by its anchor (Core_16 law 3) scrolls into view once it exists
    if (location.hash) {
      var target = document.getElementById(location.hash.slice(1));
      if (target) { target.scrollIntoView(); }
    }
  }

  // ── VIEWER: the infinite canvas ───────────────────────────────
  function makeButton(label, title, onClick) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'dg-btn';
    b.textContent = label;
    b.title = title;
    b.addEventListener('click', onClick);
    return b;
  }

  function apply() {
    var v = viewer;
    var x = Math.round(v.x);
    var y = Math.round(v.y);
    v.img.style.width = Math.round(v.w * v.s) + 'px';
    v.img.style.height = Math.round(v.h * v.s) + 'px';
    v.img.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    var g = GRID * v.s;
    while (g < 16) { g = g * 4; }
    while (g > 160) { g = g / 4; }
    v.stage.style.backgroundSize = g + 'px ' + g + 'px';
    v.stage.style.backgroundPosition = x + 'px ' + y + 'px';
    v.readout.textContent = Math.round(v.s * 100) + '%';
  }

  function zoomAt(factor, cx, cy) {
    var v = viewer;
    var next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v.s * factor));
    var k = next / v.s;
    v.x = cx - (cx - v.x) * k;
    v.y = cy - (cy - v.y) * k;
    v.s = next;
    apply();
  }

  function stageCenter() {
    var r = viewer.stage.getBoundingClientRect();
    return { x: r.width / 2, y: r.height / 2 };
  }

  function fit() {
    var v = viewer;
    var r = v.stage.getBoundingClientRect();
    v.s = Math.min((r.width - FIT_PAD * 2) / v.w, (r.height - FIT_PAD * 2) / v.h);
    v.s = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v.s));
    v.x = (r.width - v.w * v.s) / 2;
    v.y = (r.height - v.h * v.s) / 2;
    apply();
  }

  function actualSize() {
    var c = stageCenter();
    zoomAt(1 / viewer.s, c.x, c.y);
  }

  function closeViewer() {
    if (!viewer) { return; }
    var v = viewer;
    viewer = null;
    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('resize', onResize);
    v.root.parentNode.removeChild(v.root);
    if (v.returnFocus) { v.returnFocus.focus(); }
  }

  function onResize() {
    if (viewer && !viewer.touched) { fit(); }
  }

  function onKey(e) {
    if (!viewer) { return; }
    var c = stageCenter();
    var step = 60;
    var handled = true;
    if (e.key === 'Escape') { closeViewer(); }
    else if (e.key === '+' || e.key === '=') { zoomAt(1.25, c.x, c.y); }
    else if (e.key === '-' || e.key === '_') { zoomAt(0.8, c.x, c.y); }
    else if (e.key === '0') { fit(); }
    else if (e.key === '1') { actualSize(); }
    else if (e.key === 'ArrowLeft') { viewer.x += step; apply(); }
    else if (e.key === 'ArrowRight') { viewer.x -= step; apply(); }
    else if (e.key === 'ArrowUp') { viewer.y += step; apply(); }
    else if (e.key === 'ArrowDown') { viewer.y -= step; apply(); }
    else { handled = false; }
    if (handled) { if (viewer) { viewer.touched = true; } e.preventDefault(); e.stopPropagation(); }
  }

  function openViewer(src, title, returnFocus) {
    closeViewer();
    var root = document.createElement('div');
    root.className = 'dg-viewer';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', title + ', full size');
    var bar = document.createElement('div');
    bar.className = 'dg-bar';
    var heading = document.createElement('div');
    heading.className = 'dg-title';
    heading.textContent = title;
    var readout = document.createElement('div');
    readout.className = 'dg-zoom';
    var hint = document.createElement('div');
    hint.className = 'dg-hint';
    hint.textContent = 'drag or scroll to pan · pinch or ⌘ + scroll to zoom · double-click zooms in · Esc closes';
    var stage = document.createElement('div');
    stage.className = 'dg-stage';
    var img = document.createElement('img');
    img.alt = title;
    img.draggable = false;
    stage.appendChild(img);
    viewer = { root: root, stage: stage, img: img, readout: readout, s: 1, x: 0, y: 0, w: 1600, h: 1000, touched: false, returnFocus: returnFocus, pointers: {}, pinch: null };
    bar.appendChild(heading);
    bar.appendChild(makeButton('−', 'Zoom out (-)', function () { var c = stageCenter(); viewer.touched = true; zoomAt(0.8, c.x, c.y); }));
    bar.appendChild(readout);
    bar.appendChild(makeButton('+', 'Zoom in (+)', function () { var c = stageCenter(); viewer.touched = true; zoomAt(1.25, c.x, c.y); }));
    bar.appendChild(makeButton('FIT', 'Fit to window (0)', function () { viewer.touched = false; fit(); }));
    bar.appendChild(makeButton('1:1', 'Actual size (1)', function () { viewer.touched = true; actualSize(); }));
    bar.appendChild(hint);
    bar.appendChild(makeButton('CLOSE', 'Close (Esc)', closeViewer));
    root.appendChild(bar);
    root.appendChild(stage);
    // The engine zooms <body> (the 150% control). The canvas must live outside that zoom so pointer, wheel and fit
    // math stay in true pixels; the toolbar alone follows the page zoom so its text matches the rest of the page.
    bar.style.zoom = document.body.style.zoom || '';
    document.documentElement.appendChild(root);
    wireStage(stage);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', onResize);
    img.addEventListener('load', function () {
      if (!viewer || viewer.img !== img) { return; }
      viewer.w = img.naturalWidth || 1600;
      viewer.h = img.naturalHeight || 1000;
      fit();
    });
    img.src = src;
    root.tabIndex = -1;
    root.focus();
  }

  function wireStage(stage) {
    stage.addEventListener('wheel', function (e) {
      if (!viewer) { return; }
      e.preventDefault();
      viewer.touched = true;
      var r = stage.getBoundingClientRect();
      var lines = e.deltaMode === 1 ? 16 : 1;
      if (e.ctrlKey || e.metaKey) {
        var sensitivity = e.ctrlKey && !e.metaKey ? 0.01 : 0.002;
        zoomAt(Math.exp(-e.deltaY * lines * sensitivity), e.clientX - r.left, e.clientY - r.top);
      } else {
        viewer.x -= e.deltaX * lines;
        viewer.y -= e.deltaY * lines;
        apply();
      }
    }, { passive: false });

    stage.addEventListener('pointerdown', function (e) {
      if (!viewer || (e.pointerType === 'mouse' && e.button !== 0)) { return; }
      stage.setPointerCapture(e.pointerId);
      viewer.pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      viewer.touched = true;
      stage.classList.add('dg-dragging');
      var ids = Object.keys(viewer.pointers);
      if (ids.length === 2) {
        var a = viewer.pointers[ids[0]];
        var b = viewer.pointers[ids[1]];
        viewer.pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y) };
      }
    });

    stage.addEventListener('pointermove', function (e) {
      if (!viewer || !viewer.pointers[e.pointerId]) { return; }
      var prev = viewer.pointers[e.pointerId];
      var ids = Object.keys(viewer.pointers);
      if (ids.length === 1) {
        viewer.x += e.clientX - prev.x;
        viewer.y += e.clientY - prev.y;
        viewer.pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
        apply();
        return;
      }
      viewer.pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      var a = viewer.pointers[ids[0]];
      var b = viewer.pointers[ids[1]];
      var dist = Math.hypot(a.x - b.x, a.y - b.y);
      var r = stage.getBoundingClientRect();
      if (viewer.pinch && viewer.pinch.dist > 0) { zoomAt(dist / viewer.pinch.dist, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top); }
      viewer.pinch = { dist: dist };
    });

    var release = function (e) {
      if (!viewer) { return; }
      delete viewer.pointers[e.pointerId];
      if (Object.keys(viewer.pointers).length < 2) { viewer.pinch = null; }
      if (Object.keys(viewer.pointers).length === 0) { stage.classList.remove('dg-dragging'); }
    };
    stage.addEventListener('pointerup', release);
    stage.addEventListener('pointercancel', release);

    stage.addEventListener('dblclick', function (e) {
      if (!viewer) { return; }
      var r = stage.getBoundingClientRect();
      viewer.touched = true;
      zoomAt(e.shiftKey ? 0.5 : 2, e.clientX - r.left, e.clientY - r.top);
    });
  }

  // Exposed for verification and for other pages that want the same viewer (one viewer, never a second copy).
  window.DG_VIEWER = { open: openViewer, close: closeViewer, state: function () { return viewer ? { s: viewer.s, x: viewer.x, y: viewer.y, w: viewer.w, h: viewer.h } : null; } };

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', renderCatalog); } else { renderCatalog(); }
})();