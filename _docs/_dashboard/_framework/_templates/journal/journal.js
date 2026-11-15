// ===============================================================
// @file: journal.js
// @filepath: dashboard_engine/_framework/_templates/journal/journal.js
// @version: 1.0.0
// @updated: 2026-11-13 05:16:26 PM CST
// @author: Greg Paskal & Claude
// @company: MissionWares®
// @description: The Journal page type's renderer. Reads window.DASH_JOURNAL and window.DASH_DOCS (built by the type's
//   journal-export.js) and draws three views of the same entries, because the order is not known yet: By date, By tag,
//   By term (each linked glossary term, offered only when the project has a Glossary). Opening an entry or a doc
//   section shows it in the Reader. Every entry is anchored by its id (journal.html#2026-10-31-validating-ai-accuracy),
//   every heading inside it too, and every doc section by its doc- id. Search (journal-search.js) is mounted at the top
//   of the page. A STAMPED file: changed only at the engine home.
// @dependencies: journal-search.js (window.JournalSearch), journal/journal-data.js, journal/docs-data.js
// @tags: dashboard, journal, reader, anchors, search, page-type
// @changeLog:
// Date        Author         Version        Description
// ----------  -------------  -------------  --------------------------
// 2026-11-13  Greg & Claude  1.0.0          The Journal page type, harvested from Project-AI-Local journal.js 1.0.0 (Greg: add the Journal to our templates): views, reader and anchors unchanged; globals DASH_JOURNAL and DASH_DOCS; term names from DASH_DOCS.terms, so the page loads no glossary file; By term and the term links only when the project has a Glossary; the view remembered under the project's own key; the jn-q- prefix for Search; JN_TEMPLATE_VERSION announced
// ===============================================================
(function () {
  'use strict';
  var VERSION = '1.0.0';
  // The page type announces itself, like the engine does: type JN_TEMPLATE_VERSION in the console. Must equal @version above.
  window.JN_TEMPLATE_VERSION = VERSION;
  var P = window.DASH_PROJECT || 'dashboard';

  var J = (window.DASH_JOURNAL && window.DASH_JOURNAL.entries) || [];
  var DOCS = window.DASH_DOCS || {};
  var D = DOCS.sections || [];
  var G = DOCS.terms || [];
  var HAS_GLOSSARY = !!DOCS.glossary;
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var termName = function (id) { var t = G.filter(function (x) { return x.id === id; })[0]; return t ? t.term : id; };
  var VIEW_KEY = P + '.journal.view.v1';

  // ── ONE ENTRY ROW: the same row in every view (Shared Rendering Rule) ──
  function row(e) {
    var a = document.createElement('a');
    a.className = 'jn-row';
    a.href = '#' + e.id;
    a.innerHTML = '<span class="jn-date">' + e.date + '</span><span class="jn-title">' + esc(e.title) + '</span><span class="jn-status jn-' + e.status + '">' + e.status + '</span><span class="jn-desc">' + esc(e.description) + '</span>';
    return a;
  }

  function group(name, entries, href) {
    var g = document.createElement('div');
    g.className = 'jn-group';
    g.innerHTML = '<div class="jn-group-head">' + (href ? '<a href="' + href + '">' + esc(name) + '</a>' : esc(name)) + ' <span class="jn-n">' + entries.length + '</span></div>';
    entries.forEach(function (e) { g.appendChild(row(e)); });
    return g;
  }

  // ── THE THREE VIEWS ──
  function draw(view) {
    var list = document.getElementById('jn-list');
    if (view === 'term' && !HAS_GLOSSARY) { view = 'date'; }
    list.innerHTML = '';
    Array.prototype.forEach.call(document.querySelectorAll('.jn-tab'), function (b) { b.classList.toggle('on', b.getAttribute('data-view') === view); });
    if (!J.length) { list.innerHTML = '<div class="jn-none">No entries yet.</div>'; return; }
    var byNewest = J.slice().sort(function (a, b) { return b.date.localeCompare(a.date) || a.title.localeCompare(b.title); });
    if (view === 'date') { byNewest.forEach(function (e) { list.appendChild(row(e)); }); return; }
    var buckets = {};
    byNewest.forEach(function (e) { (view === 'tag' ? e.tags : e.terms).forEach(function (k) { (buckets[k] = buckets[k] || []).push(e); }); });
    if (!Object.keys(buckets).length) { list.innerHTML = '<div class="jn-none">No entry carries ' + (view === 'tag' ? 'a tag' : 'a glossary term') + ' yet.</div>'; return; }
    Object.keys(buckets).sort().forEach(function (k) { list.appendChild(view === 'tag' ? group('#' + k, buckets[k]) : group(termName(k), buckets[k], 'glossary.html#' + k)); });
  }

  // ── THE READER: an entry, or a doc section ──
  function openEntry(e, sectionId) {
    var r = document.getElementById('jn-reader');
    var terms = HAS_GLOSSARY ? e.terms.map(function (t) { return '<a class="jn-chip" href="glossary.html#' + esc(t) + '">' + esc(termName(t)) + '</a>'; }).join('') : '';
    var tags = e.tags.map(function (t) { return '<span class="jn-chip jn-tag">#' + esc(t) + '</span>'; }).join('');
    var related = e.related.map(function (id) { var o = J.filter(function (x) { return x.id === id; })[0]; return o ? '<a class="jn-chip" href="#' + id + '">' + esc(o.title) + '</a>' : ''; }).join('');
    r.innerHTML = '<article class="jn-entry" id="' + e.id + '"><div class="jn-entry-head"><h3>' + esc(e.title) + '</h3><span class="jn-status jn-' + e.status + '">' + e.status + '</span></div><div class="jn-meta">' + e.date + ' · v' + e.version + ' · updated ' + esc(e.updated) + ' · <span class="jn-file">' + esc(e.file) + '</span></div><div class="jn-chips">' + terms + tags + '</div><div class="jn-body">' + e.html + '</div>' + (related ? '<div class="jn-chips"><span class="jn-label">Related</span>' + related + '</div>' : '') + '</article>';
    r.hidden = false;
    var target = (sectionId && document.getElementById(sectionId)) || r;
    target.scrollIntoView({ block: 'start' });
    flash(target);
  }

  function openDoc(s) {
    var r = document.getElementById('jn-reader');
    r.innerHTML = '<article class="jn-entry" id="' + s.id + '"><div class="jn-entry-head"><h3>' + esc(s.title) + '</h3><span class="jn-status jn-doc">doc</span></div><div class="jn-meta"><span class="jn-file">' + esc(s.path) + '</span></div><div class="jn-body">' + s.html + '</div></article>';
    r.hidden = false;
    r.scrollIntoView({ block: 'start' });
    flash(r);
  }

  function flash(el) { el.classList.add('jn-flash'); setTimeout(function () { el.classList.remove('jn-flash'); }, 1600); }

  // ── ANCHORS: an entry id, a heading inside an entry, or a doc section ──
  function route() {
    var id = decodeURIComponent((location.hash || '').slice(1));
    if (!id) { return; }
    var doc = D.filter(function (s) { return s.id === id; })[0];
    if (doc) { openDoc(doc); return; }
    var e = J.filter(function (x) { return x.id === id || id.indexOf(x.id + '-') === 0; })[0];
    if (e) { openEntry(e, id === e.id ? null : id); }
  }

  function boot() {
    var count = document.getElementById('jn-count');
    if (!window.DASH_JOURNAL) {
      count.textContent = 'no data';
      document.getElementById('jn-list').innerHTML = '<div class="jn-none">journal/journal-data.js did not load. Build it from journal/*.md: node _docs/_dashboard/_framework/_templates/journal/journal-export.js from the repo root.</div>';
      return;
    }
    count.textContent = J.length + (J.length === 1 ? ' entry' : ' entries');
    var termTab = document.querySelector('.jn-tab[data-view="term"]');
    if (termTab && !HAS_GLOSSARY) { termTab.hidden = true; }
    var view = 'date';
    try { view = localStorage.getItem(VIEW_KEY) || 'date'; } catch (err) { view = 'date'; }
    Array.prototype.forEach.call(document.querySelectorAll('.jn-tab'), function (b) {
      b.addEventListener('click', function () { var v = b.getAttribute('data-view'); try { localStorage.setItem(VIEW_KEY, v); } catch (err) { /* not remembered; the view still changes */ } draw(v); });
    });
    draw(view);
    if (window.JournalSearch) { window.JournalSearch.mount(document.getElementById('jn-q-input'), document.getElementById('jn-q-results'), document.getElementById('jn-q-count'), null); }
    window.addEventListener('hashchange', route);
    route();
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', boot); } else { boot(); }
})();