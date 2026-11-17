// ===============================================================
// @file: completed.js
// @filepath: dashboard_engine/_framework/_templates/completed/completed.js
// @version: 1.0.0
// @updated: 2026-11-17 01:27:17 PM CST
// @author: Greg Paskal & Claude
// @company: MissionWares®
// @description: The Completed page type's renderer. Reads window.DASH_COMPLETED (completed/completed-data.js, schema
//   1.0.0) and draws one card per entry, newest completion first, its id as the anchor: the title (a BL- number shown
//   before it), one dated line per completion (a reopened entry shows each, the latest first, the earlier marked
//   "earlier"), the entry's note, then a board's final rows. A withdrawn entry says so. Names an entry used twice, and
//   an entry with no completion, above the cards. A STAMPED file: changed only at the engine home.
// @dependencies: completed/completed-data.js (the project's own, founded from example/completed-data.js)
// @tags: dashboard, completed, trophy-room, page-type
// @changeLog:
// Date        Author         Version        Description
// ----------  -------------  -------------  --------------------------
// 2026-11-17  Greg & Claude  1.0.0          The Completed page type (Greg: its own data file; a reopened feature's second completion a second dated line on the same card; required): cards newest first, CP_TEMPLATE_VERSION announced
// ===============================================================
(function () {
  'use strict';
  var VERSION = '1.0.0';
  // The page type announces itself, like the engine does: type CP_TEMPLATE_VERSION in the console. Must equal @version above.
  window.CP_TEMPLATE_VERSION = VERSION;

  var MARKS = { done: ['●', 'g-done'], part: ['◐', 'g-part'], live: ['◉', 'g-live'], plan: ['○', 'g-plan'] };

  // Text made safe for the page
  function esc(value) {
    return String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, function (c) {
      return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c];
    });
  }

  // A completion's moment as a sortable number: Chicago time as written, "YYYY-MM-DD hh:mm[:ss] AM CST", or a bare date
  function when(text) {
    var m = /^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM))?/i.exec(String(text || ''));
    if (!m) { return 0; }
    var h = m[4] ? parseInt(m[4], 10) % 12 + (/pm/i.test(m[7]) ? 12 : 0) : 0;
    return Date.UTC(+m[1], +m[2] - 1, +m[3], h, m[5] ? +m[5] : 0, m[6] ? +m[6] : 0);
  }

  function latest(entry) {
    return (entry.completions || []).reduce(function (top, c) { return Math.max(top, when(c.at)); }, 0);
  }

  function card(entry) {
    var done = (entry.completions || []).slice().sort(function (a, b) { return when(b.at) - when(a.at); });
    var withdrawn = entry.outcome === 'withdrawn';
    var num = /^BL-\d{3,}$/.test(entry.id || '') ? '<span class="cp-num">' + esc(entry.id) + '</span>' : '';
    var html = '<div class="card' + (withdrawn ? ' cp-withdrawn' : '') + '" id="' + esc(entry.id) + '"><h3>' + num + esc(entry.title).toUpperCase() + (withdrawn ? ' <span class="tag">withdrawn</span>' : '') + '</h3>';
    done.forEach(function (c, i) {
      var line = (i === 0 ? '' : '<span class="cp-again">earlier: </span>') + (withdrawn ? 'withdrawn ' : 'finished ') + esc(c.at) + (i === done.length - 1 && entry.opened ? ', opened ' + esc(entry.opened) : '') + (c.steps ? ', ' + esc(c.steps) + ' steps' : '') + (c.note ? '. ' + esc(c.note) : '');
      html += '<p class="cp-when">' + line + '</p>';
    });
    if (entry.note) { html += '<p class="cp-note">' + esc(entry.note) + '</p>'; }
    (entry.rows || []).forEach(function (r) {
      var mark = MARKS[r.s] || MARKS.done;
      html += '<div class="row"><span class="k">' + esc(r.k) + '</span><span class="s ' + mark[1] + '">' + mark[0] + '</span><span class="n">' + esc(r.n) + '</span></div>';
    });
    return html + '</div>';
  }

  function render() {
    var mount = document.getElementById('cp-cards');
    var count = document.getElementById('cp-count');
    var data = window.DASH_COMPLETED;
    if (!data) {
      count.textContent = 'no data';
      mount.innerHTML = '<span class="cp-empty">Its data file, completed/completed-data.js, was not found beside this page.</span>';
      return;
    }
    var entries = (data.entries || []).slice().sort(function (a, b) { return latest(b) - latest(a); });
    var seen = {};
    var bad = [];
    entries.forEach(function (e) {
      if (seen[e.id]) { bad.push((e.id || '(no id)') + ' is used twice: a reopened entry gains a completion, never a second entry'); }
      seen[e.id] = true;
      if (!(e.completions || []).length) { bad.push((e.id || '(no id)') + ' has no completion'); }
    });
    mount.innerHTML = entries.length ? entries.map(card).join('') : '<span class="cp-empty">Nothing finished yet.</span>';
    if (bad.length) { mount.insertAdjacentHTML('beforebegin', '<p class="cp-warn" id="cp-warn">Record check: ' + esc(bad.join('; ')) + '</p>'); }
    var again = entries.filter(function (e) { return (e.completions || []).length > 1; }).length;
    count.textContent = entries.length + ' finished' + (again ? ', ' + again + ' reopened and finished again' : '') + ', newest first';
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', render); } else { render(); }
})();