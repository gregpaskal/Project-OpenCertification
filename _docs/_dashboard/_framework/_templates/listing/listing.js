// ===============================================================
// @file: listing.js
// @filepath: dashboard_engine/_framework/_templates/listing/listing.js
// @version: 1.0.0
// @updated: 2026-11-13 09:07:14 AM CST
// @author: Greg Paskal & Claude
// @company: MissionWares®
// @description: The Listing page type's behavior, the master AiAssist copies into a project's
//   _docs/_dashboard/_framework/_templates/listing/listing.js (a STAMPED file: never edited in a project, replaced when
//   this master changes). Draws a listing: one table from a data object that names its own columns and rows. Each
//   <div class="lst-table-mount" data-source="NAME"> on the page is filled from window[NAME] (DASH_LISTING on a founded
//   page, loaded from <slug>/<slug>-data.js). Columns come from the data, so a new column is a data change, not a code
//   change; a cell whose field is missing is blank (the additive data law). Optional attributes on the mount:
//   data-count names an element that shows "N entries", data-missing is the sentence shown when the data is absent.
//
//   CELL VALUES. A cell is one of:
//     'text'                                      plain text
//     { text: 'Diagrams', href: 'diagrams.html' }  a link; open is 'same' or 'new'
//     [ 'text', { text, href, open }, ... ]       several items in one cell, separated by a comma
//   open defaults to 'new' for an http(s) address and 'same' for a path in the project. A new window always carries
//   rel="noopener noreferrer" and a small arrow after the text, outside its underline. Only http(s) addresses and
//   relative paths become links; any other address (javascript:, data:, file:, a protocol-relative //host) is drawn as
//   plain text, marked refused, and named once in the console. Every value is text (textContent, never markup), so
//   nothing in the data runs. A column of kind 'code' draws its text in <code>.
// @dependencies: _framework/dashboard.js loads first (it builds the page shell); the page's data file loads before this
//   file; listing.css beside it supplies the styles.
// @tags: dashboard, page-type, listing, table, links, template
// @changeLog:
// Date        Author         Version        Description
// ----------  -------------  -------------  --------------------------
// 2026-11-13  Greg & Claude  1.0.0          The Listing page type, harvested from Project-mAi-Methodology dashboard-templates.js 1.1.0 (the Dashboard Templates page, proven 2026-11-13 with links confirmed on Greg's Mac): renderer unchanged; LST_TEMPLATE_VERSION announced in place of DASH_LISTING_VERSION
// ===============================================================

(function () {
  'use strict';

  // The page type announces itself, like the engine does: type LST_TEMPLATE_VERSION in the console to see which
  // Listing template a page is running. Must equal @version above.
  var VERSION = '1.0.0';
  window.LST_TEMPLATE_VERSION = VERSION;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) { e.className = cls; }
    if (text !== undefined && text !== null) { e.textContent = String(text); }
    return e;
  }

  // Judges one address. Returns 'http' (an outside site), 'local' (a path in the project or an anchor) or null (refused).
  // Browsers ignore tabs, newlines and leading spaces inside a scheme, so they are removed before the scheme is read.
  function addressKind(href) {
    if (typeof href !== 'string') { return null; }
    var h = href.replace(/[\u0000- \u007f]/g, '');
    if (h === '') { return null; }
    if (/^https?:\/\//i.test(h)) { return 'http'; }
    if (/^[a-z][a-z0-9+.\-]*:/i.test(h)) { return null; }
    if (/^[\/\\]{2}/.test(h)) { return null; }
    if (h.indexOf('\\') !== -1) { return null; }
    return 'local';
  }

  var warned = {};
  function refuse(href) {
    var key = String(href);
    if (warned[key]) { return; }
    warned[key] = true;
    console.warn('[listing ' + VERSION + '] link refused, drawn as text: ' + key + ' (only http(s) addresses and relative paths are links)');
  }

  // One item: text, or a link built from { text, href, open }. code wraps the text in <code> for code columns.
  function item(v, code) {
    var isObj = v !== null && typeof v === 'object';
    var text = isObj ? (v.text !== undefined && v.text !== null ? v.text : (v.href || '')) : v;
    var inner = code ? el('code', null, text) : document.createTextNode(String(text));
    if (!isObj || v.href === undefined || v.href === null || v.href === '') { return inner; }
    var kind = addressKind(v.href);
    if (!kind) {
      refuse(v.href);
      var s = el('span', 'lst-refused');
      s.title = 'Link refused: only http(s) addresses and relative paths are allowed';
      s.appendChild(inner);
      return s;
    }
    var open = v.open === 'new' || v.open === 'same' ? v.open : (kind === 'http' ? 'new' : 'same');
    var a = el('a', 'lst-link');
    a.setAttribute('href', v.href);
    var label = el('span', 'lst-text');
    label.appendChild(inner);
    a.appendChild(label);
    if (open === 'new') {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
      a.classList.add('lst-new');
      a.title = 'Opens in a new window';
      var mark = el('span', 'lst-mark', '↗');
      mark.setAttribute('aria-hidden', 'true');
      a.appendChild(mark);
    }
    return a;
  }

  // One cell. A list draws each item, separated by a comma.
  function cell(col, row) {
    var td = el('td', 'lst-' + (col.kind || 'text'));
    var v = row[col.key];
    if (v === undefined || v === null || v === '') { return td; }
    var code = col.kind === 'code';
    var items = Array.isArray(v) ? v : [v];
    items.forEach(function (x, i) {
      if (x === undefined || x === null || x === '') { return; }
      if (i > 0 && td.childNodes.length) { td.appendChild(document.createTextNode(', ')); }
      td.appendChild(item(x, code));
    });
    return td;
  }

  // The message shown in place of a table when its data is not on the page.
  function missing(mount, name) {
    var d = el('div', 'lst-missing');
    d.appendChild(el('b', null, 'The list is not here yet. '));
    d.appendChild(document.createTextNode(mount.getAttribute('data-missing') || ('window.' + name + ' was not loaded.')));
    mount.appendChild(d);
  }

  function draw(mount) {
    var name = mount.getAttribute('data-source');
    var data = name ? window[name] : null;
    mount.textContent = '';
    var countEl = document.getElementById(mount.getAttribute('data-count') || '');
    if (!data || !Array.isArray(data.columns) || !Array.isArray(data.rows)) {
      missing(mount, name);
      if (countEl) { countEl.textContent = 'not loaded'; }
      return;
    }
    var t = el('table', 'lst-table');
    var hr = el('tr');
    data.columns.forEach(function (c) { hr.appendChild(el('th', null, c.label || c.key)); });
    var thead = el('thead');
    thead.appendChild(hr);
    t.appendChild(thead);
    var tb = el('tbody');
    data.rows.forEach(function (r) {
      var tr = el('tr');
      data.columns.forEach(function (c) { tr.appendChild(cell(c, r)); });
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    mount.appendChild(t);
    if (countEl) { countEl.textContent = data.rows.length + (data.rows.length === 1 ? ' entry' : ' entries'); }
  }

  function init() {
    document.querySelectorAll('.lst-table-mount').forEach(draw);
    console.log('[listing ' + VERSION + '] drew ' + document.querySelectorAll('.lst-table-mount').length + ' list(s)');
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();