// ===============================================================
// @file: backlog.js
// @filepath: dashboard_engine/_framework/_templates/backlog/backlog.js
// @version: 1.0.0
// @updated: 2026-11-17 08:13:40 AM CST
// @author: Greg Paskal & Claude
// @company: MissionWares®
// @description: The Backlog page type's renderer. Reads window.DASH_BACKLOG (backlog/backlog-data.js, schema 1.0.0)
//   and draws one card per group, in the data's order, with the items that name it, highest value first; items that
//   name no group, or a group that does not exist, are drawn in a last card, UNGROUPED (IDEAS & DREAMS when the
//   backlog has no groups at all). Each row shows the item's BL- number, its status mark, its title, its note and the
//   day it was added. Checks the numbers as it draws and names any fault above the cards: a number not in BL-001 form,
//   a number used twice, or next not above every number. A STAMPED file: changed only at the engine home.
// @dependencies: backlog/backlog-data.js (the project's own, founded from example/backlog-data.js)
// @tags: dashboard, backlog, page-type
// @changeLog:
// Date        Author         Version        Description
// ----------  -------------  -------------  --------------------------
// 2026-11-17  Greg & Claude  1.0.0          The Backlog page type (Greg: every item gets a reference number, groups optional and changeable later): grouped cards, BL- numbers, number checks, BL_TEMPLATE_VERSION announced
// ===============================================================
(function () {
  'use strict';
  var VERSION = '1.0.0';
  // The page type announces itself, like the engine does: type BL_TEMPLATE_VERSION in the console. Must equal @version above.
  window.BL_TEMPLATE_VERSION = VERSION;

  var MARKS = { idea: ['○', 'g-plan'], next: ['◐', 'g-part'], blocked: ['■', 'bl-blocked'] };
  var NUMBER = /^BL-(\d{3,})$/;

  // Text made safe for the page
  function esc(value) {
    return String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, function (c) {
      return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c];
    });
  }

  function row(item) {
    var mark = MARKS[item.status] || MARKS.idea;
    var meta = item.added ? 'added ' + esc(item.added) : '';
    if (item.status === 'blocked') { meta = 'blocked' + (meta ? ' · ' + meta : ''); }
    return '<div class="row" id="' + esc(item.id) + '"><span class="k bl-num">' + esc(item.id) + '</span><span class="s ' + mark[1] + '" title="' + esc(item.status || 'idea') + '">' + mark[0] + '</span><span class="n"><span class="bl-title">' + esc(item.title) + '</span>' + (item.note ? ' ' + esc(item.note) : '') + (meta ? '<span class="bl-meta">' + meta + '</span>' : '') + '</span></div>';
  }

  function card(title, note, items, id) {
    var html = '<div class="card"' + (id ? ' id="bl-group-' + esc(id) + '"' : '') + '><h3>' + esc(title).toUpperCase() + ' <span class="tag">' + items.length + '</span></h3>';
    if (note) { html += '<p class="bl-gnote">' + esc(note) + '</p>'; }
    html += items.length ? items.map(row).join('') : '<span class="bl-empty">Nothing in this group yet.</span>';
    return html + '</div>';
  }

  // The faults a reader must see: numbers that break the rule
  function faults(data, items) {
    var out = [];
    var seen = {};
    var top = 0;
    items.forEach(function (item) {
      var m = NUMBER.exec(item.id || '');
      if (!m) { out.push('"' + (item.id || '(no number)') + '" is not a BL- number'); return; }
      if (seen[item.id]) { out.push(item.id + ' is used twice'); }
      seen[item.id] = true;
      top = Math.max(top, parseInt(m[1], 10));
    });
    if (typeof data.next !== 'number' || data.next <= top) { out.push('next (' + data.next + ') must be above BL-' + String(top).padStart(3, '0')); }
    return out;
  }

  function render() {
    var mount = document.getElementById('bl-groups');
    var count = document.getElementById('bl-count');
    var data = window.DASH_BACKLOG;
    if (!data) {
      count.textContent = 'no data';
      mount.innerHTML = '<span class="bl-empty">Its data file, backlog/backlog-data.js, was not found beside this page.</span>';
      return;
    }
    var groups = data.groups || [];
    var items = data.items || [];
    var known = {};
    groups.forEach(function (g) { known[g.id] = true; });
    var html = groups.map(function (g) {
      return card(g.title || g.id, g.note, items.filter(function (item) { return item.group === g.id; }), g.id);
    }).join('');
    var loose = items.filter(function (item) { return !item.group || !known[item.group]; });
    if (loose.length || !groups.length) { html += card(groups.length ? 'Ungrouped' : 'Ideas & dreams', null, loose, 'none'); }
    mount.innerHTML = html;
    var bad = faults(data, items);
    if (bad.length) { mount.insertAdjacentHTML('beforebegin', '<p class="bl-warn" id="bl-warn">Number check: ' + esc(bad.join('; ')) + '</p>'); }
    count.textContent = items.length + ' item' + (items.length === 1 ? '' : 's') + (groups.length ? ' in ' + groups.length + ' group' + (groups.length === 1 ? '' : 's') : '') + ' · next BL-' + String(data.next).padStart(3, '0');
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', render); } else { render(); }
})();