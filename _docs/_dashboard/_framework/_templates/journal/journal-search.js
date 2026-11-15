// ===============================================================
// @file: journal-search.js
// @filepath: dashboard_engine/_framework/_templates/journal/journal-search.js
// @version: 1.0.0
// @updated: 2026-11-13 05:16:26 PM CST
// @author: Greg Paskal & Claude
// @company: MissionWares®
// @description: SEARCH on the Journal page, one search for the project's written knowledge (Core_05 Shared Rendering
//   Rule: one function, used everywhere). Indexes what the Journal's data carries: glossary terms (window.DASH_DOCS.terms,
//   when the project has a Glossary), journal entries (window.DASH_JOURNAL) and technical doc sections
//   (window.DASH_DOCS.sections). Every word typed must appear (AND); a hit in a title outranks one in tags or linked
//   terms, which outranks one in the body. Results are labeled Term, Journal or Doc and link to their anchor.
//   A STAMPED file: changed only at the engine home.
// @tags: dashboard, search, journal, glossary, docs, page-type
// @changeLog:
// Date        Author         Version        Description
// ----------  -------------  -------------  --------------------------
// 2026-11-13  Greg & Claude  1.0.0          Harvested into the Journal page type from Project-AI-Local search.js 1.0.0 (Lab Search): index, ranking and snippets unchanged; reads DASH_JOURNAL and DASH_DOCS (glossary terms carried there by journal-export.js); window.JournalSearch; the jn-q- class prefix
// ===============================================================
(function () {
  'use strict';

  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };

  // ── THE INDEX: one record shape for every kind of knowledge ──
  function build() {
    var items = [];
    var d = window.DASH_DOCS || {};
    (d.terms || []).forEach(function (t) {
      items.push({ type: 'Term', id: t.id, title: t.term, href: 'glossary.html#' + t.id, keys: t.keys || '', text: t.text || '' });
    });
    var j = window.DASH_JOURNAL;
    if (j && j.entries) {
      j.entries.forEach(function (e) {
        items.push({ type: 'Journal', id: e.id, title: e.title, href: 'journal.html#' + e.id, keys: e.tags.concat(e.terms).join(' '), text: e.description + ' ' + e.text, meta: e.date + ' · ' + e.status });
      });
    }
    (d.sections || []).forEach(function (s) {
      items.push({ type: 'Doc', id: s.id, title: s.title, href: 'journal.html#' + s.id, keys: s.doc, text: s.text, meta: s.doc });
    });
    items.forEach(function (it) { it.lt = it.title.toLowerCase(); it.lk = it.keys.toLowerCase(); it.lx = it.text.toLowerCase(); });
    return items;
  }

  var INDEX = null;
  var ORDER = { Term: 0, Journal: 1, Doc: 2 };

  // ── THE QUERY: every word must be found somewhere; rank by where ──
  function query(q) {
    if (!INDEX) { INDEX = build(); }
    var words = String(q || '').toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) { return []; }
    var hits = [];
    INDEX.forEach(function (it) {
      var score = 0;
      for (var i = 0; i < words.length; i++) {
        var w = words[i];
        var s = (it.lt.indexOf(w) !== -1 ? 5 : 0) + (it.lk.indexOf(w) !== -1 ? 3 : 0) + (it.lx.indexOf(w) !== -1 ? 1 : 0);
        if (!s) { return; }
        score += s;
      }
      hits.push({ item: it, score: score, word: words[0] });
    });
    hits.sort(function (a, b) { return b.score - a.score || ORDER[a.item.type] - ORDER[b.item.type] || a.item.title.localeCompare(b.item.title); });
    return hits;
  }

  // ── THE SNIPPET: the text around the first word found, that word marked ──
  function snippet(it, word) {
    var at = it.lx.indexOf(word);
    if (at === -1) { return esc(it.text.slice(0, 160)) + (it.text.length > 160 ? '…' : ''); }
    var from = Math.max(0, at - 60);
    var to = Math.min(it.text.length, at + word.length + 100);
    var before = esc(it.text.slice(from, at));
    var found = esc(it.text.slice(at, at + word.length));
    var after = esc(it.text.slice(at + word.length, to));
    return (from > 0 ? '…' : '') + before + '<mark>' + found + '</mark>' + after + (to < it.text.length ? '…' : '');
  }

  // ── THE RENDER: wire an input to a results box; onPick lets a page open a result in place ──
  function mount(input, box, count, onPick) {
    var show = function () {
      var q = (input.value || '').trim();
      var hits = query(q);
      box.innerHTML = '';
      box.hidden = !q;
      if (count) { count.textContent = q ? hits.length + ' found' : (INDEX ? INDEX.length : build().length) + ' indexed'; }
      if (!q) { return; }
      if (!hits.length) { box.innerHTML = '<div class="jn-q-none">Nothing found for "' + esc(q) + '".</div>'; return; }
      hits.slice(0, 40).forEach(function (h) {
        var a = document.createElement('a');
        a.className = 'jn-q-hit jn-q-' + h.item.type.toLowerCase();
        a.href = h.item.href;
        a.innerHTML = '<span class="jn-q-type">' + h.item.type + '</span><span class="jn-q-title">' + esc(h.item.title) + '</span>' + (h.item.meta ? '<span class="jn-q-meta">' + esc(h.item.meta) + '</span>' : '') + '<span class="jn-q-snip">' + snippet(h.item, h.word) + '</span>';
        if (onPick) { a.addEventListener('click', function (ev) { if (onPick(h.item)) { ev.preventDefault(); } }); }
        box.appendChild(a);
      });
    };
    input.addEventListener('input', show);
    show();
  }

  window.JournalSearch = { version: '1.0.0', query: query, mount: mount, snippet: snippet };
})();