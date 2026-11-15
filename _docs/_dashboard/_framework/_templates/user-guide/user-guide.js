// ===============================================================
// @file: user-guide.js
// @filepath: dashboard_engine/_framework/_templates/user-guide/user-guide.js
// @version: 2.0.0
// @updated: 2026-11-13 04:51:30 PM CST
// @author: Greg Paskal & Claude
// @company: MissionWares®
// @description: The User Guide page type's behavior (Greg, 2026-11-04: "what if I am away from it for a while and forget I have
//   this capability"). Draws window.DASH_USER_GUIDE, which user-guide-export.js builds from the project's CAPABILITIES.md, the one
//   source: every capability in its group, each with one plain sentence, the words to say to Claude (click to copy), the
//   commands to run (click to copy), the pages to open and its details. Search filters as you type; the group pills narrow
//   it; What's new badges the changes made since this browser last opened the User Guide; #cap-7 opens straight to a
//   capability. Ask the User Guide answers how-to questions from the same data through the Ask part (AskLink, AskPrompt), on
//   the served page only. Storage keys carry the project's routing key. A STAMPED file: copied into every project with
//   the engine, changed only at the engine home.
// @dependencies: _framework/dashboard.js (the shell); user-guide/user-guide-data.js (the data, loaded first);
//   _framework/_parts/ask/ask-link.js and ask-prompt.js (Ask the User Guide; the page works without them); user-guide.css beside it
// @tags: dashboard, guide, capabilities, search, ask, help, page-type
// @changeLog:
// Date        Author         Version        Description
// ----------  -------------  -------------  --------------------------
// 2026-11-04  Greg & Claude  1.0.0          First (Project-AI-Local): groups and cards, say and run chips that copy, page links, details, search, What's new, Ask the Guide
// 2026-11-04  Greg & Claude  1.0.1          Independent review (15 findings) and the real-model probe: gemma3:27b answers by default (6 of 6 right on Greg's Mac, llama3.1:8b 4 of 6) and is warmed when the Ask box is first touched
// 2026-11-13  Greg & Claude  1.1.0          The Guide page type (Greg: Guide first): storage keys from DASH_PROJECT; starters, placeholder, preferred models and page names from the data; a card labels its sentence What it does when that stands in; the group pills hide when there is only one group; the served-page and missing-data messages name no project; GD_TEMPLATE_VERSION announced
// 2026-11-13  Greg & Claude  1.2.0          The User Guide (Greg: call it User Guide; a searchable, AI integrated guide to using the project's tools and processes, and to asking about the project): every word the reader sees says User Guide
// 2026-11-13  Greg & Claude  2.0.0          Renamed from the guide type to user-guide (Greg: get everything changed over to user guide): the type key, folder, file names, page file user-guide.html, data folder user-guide/, globals DASH_USER_GUIDE and UG_TEMPLATE_VERSION, the ug- class prefix, storage keys and the update the user guide trigger
// ===============================================================
(function () {
  'use strict';
  var G = window.DASH_USER_GUIDE;
  // The page type announces itself, like the engine does: type UG_TEMPLATE_VERSION in the console. Must equal @version above.
  var VERSION = '2.0.0';
  window.UG_TEMPLATE_VERSION = VERSION;
  // Storage keys carry the project's routing key: every dashboard served by AiAssist shares the localhost:8765 origin
  var P = window.DASH_PROJECT || 'dashboard';
  var KEYS = { seen: P + '.user-guide.seen.v1', model: P + '.user-guide.model.v1', glossaryModel: P + '.glossary.ask.model.v1' };
  // gemma3:27b answered all six probe questions right (_docs/_test_results/guide/2026-11-04/); it reads the User Guide once (about 32 s), then answers in seconds
  var PREFERRED = (G && G.models && G.models.length ? G.models : ['gemma3:27b', 'llama3.1:8b']);
  var OPTIONS = { temperature: 0.2, num_ctx: 16384 };
  // Starter questions and page names come from the User Guide data (user-guide-config.js and the courier's page manifest)
  var STARTERS = (G && G.starters && G.starters.length ? G.starters : ['What can I do here?', 'What changed lately?']);
  var PAGES = (G && G.pages) || {};
  var own = function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); };

  function get(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* not remembered; the page still works */ } }
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) { e.className = cls; } if (text !== undefined) { e.textContent = text; } return e; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function cmp(a, b) { var x = String(a).split('.').map(Number); var y = String(b).split('.').map(Number); for (var i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) { return (x[i] || 0) - (y[i] || 0); } } return 0; }
  var byN = {};

  // ── INLINE TEXT: `code`, **bold**, links, page names, and "(section N)" become live ──
  function xref(n) { return byN[n] ? '<a class="ug-xref" href="#cap-' + n + '" data-n="' + n + '">' + n + '</a>' : n; }
  function inline(text) {
    return String(text).split('`').map(function (seg, i) {
      if (i % 2 === 1) { return own(PAGES, seg) ? '<a class="ug-code" href="' + esc(seg) + '">' + esc(seg) + '</a>' : '<code>' + esc(seg) + '</code>'; }
      var h = esc(seg).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
      // Links stop before an escaped quote or bracket, so "http://x" never swallows its closing quote
      h = h.replace(/https?:\/\/(?:(?!&quot;|&gt;|&lt;)[^\s)<,])+/g, function (u) { var tail = /[.;:]$/.test(u) ? u.slice(-1) : ''; var url = tail ? u.slice(0, -1) : u; return '<a href="' + url + '" target="_blank" rel="noopener">' + url + '</a>' + tail; });
      // Only "(section 7)" or "(sections 7 and 10)" point at this page; "its section 10 rules" names another document
      h = h.replace(/\((sections? )([\d, and]+)\)/g, function (m, word, nums) { return '(' + word + nums.replace(/\d+/g, xref) + ')'; });
      return h;
    }).join('');
  }

  // ── COPY: the clipboard where allowed, then a hidden textarea, then the chip's own text selected for Cmd+C ──
  function copy(text, chip) {
    function done(ok) {
      chip.classList.remove('ug-copied', 'ug-nocopy');
      void chip.offsetWidth;
      chip.classList.add(ok ? 'ug-copied' : 'ug-nocopy');
      chip.setAttribute('data-tip', ok ? (/[<\[]/.test(text) ? 'Copied: fill in the <...> part' : 'Copied') : 'Selected: press Cmd+C');
      if (!ok) { var r = document.createRange(); r.selectNodeContents(chip); var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r); }
      chip.focus();
      setTimeout(function () { chip.classList.remove('ug-copied', 'ug-nocopy'); }, ok ? 1600 : 4000);
    }
    if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallback(text)); }); } else { done(fallback(text)); }
  }
  function fallback(text) { var t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; } t.remove(); return ok; }

  // ── ONE CAPABILITY CARD ──
  function card(c) {
    var a = el('article', 'ug-card');
    a.id = c.id;
    var head = el('div', 'ug-head');
    head.appendChild(el('span', 'ug-num', String(c.n)));
    head.appendChild(el('h3', '', c.title));
    var link = el('a', 'ug-anchor', '#' + c.id);
    link.href = '#' + c.id;
    link.title = 'Link to this capability';
    head.appendChild(link);
    a.appendChild(head);
    var use = el('p', 'ug-use');
    use.innerHTML = '<span class="ug-lbl">' + esc(c.useLabel || 'You use it to') + '</span> ' + inline(c.use);
    a.appendChild(use);
    var acts = el('div', 'ug-acts');
    if (c.say.length) {
      var row = el('div', 'ug-row');
      row.appendChild(el('span', 'ug-lbl', 'Say to Claude'));
      c.say.forEach(function (w) { var b = el('button', 'ug-say', w); b.type = 'button'; b.title = 'Copy, then paste it to Claude'; b.addEventListener('click', function () { copy(w, b); }); row.appendChild(b); });
      acts.appendChild(row);
    }
    if (c.run.length) {
      var row2 = el('div', 'ug-row');
      row2.appendChild(el('span', 'ug-lbl', 'Or run'));
      c.run.forEach(function (w) { var b = el('button', 'ug-run', w); b.type = 'button'; b.title = /^\//.test(w) ? 'Type it inside the program it belongs to; click to copy' : 'Copy for Terminal (from the repo root)' + (/[<\[]/.test(w) ? '; fill in the <...> part first' : ''); b.addEventListener('click', function () { copy(w, b); }); row2.appendChild(b); });
      acts.appendChild(row2);
    }
    if (c.pages.length) {
      var row3 = el('div', 'ug-row');
      row3.appendChild(el('span', 'ug-lbl', c.pages.length > 1 ? 'Pages' : 'Open'));
      c.pages.forEach(function (p) { if (p === 'user-guide.html' && c.pages.length === 1) { row3.appendChild(el('span', 'ug-here', 'You are here')); return; } var l = el('a', 'ug-page', PAGES[p] || p); l.href = p; row3.appendChild(l); });
      acts.appendChild(row3);
    }
    if (acts.childNodes.length) { a.appendChild(acts); }
    var more = el('button', 'ug-more', 'Details');
    more.type = 'button';
    more.setAttribute('aria-expanded', 'false');
    var box = el('dl', 'ug-details');
    box.id = c.id + '-details';
    more.setAttribute('aria-controls', box.id);
    box.hidden = true;
    c.fields.forEach(function (f) { if (f.label) { box.appendChild(el('dt', '', f.label)); } var dd = el('dd', ''); dd.innerHTML = inline(f.text); box.appendChild(dd); });
    more.addEventListener('click', function () { setOpen(a, box.hidden); });
    a.appendChild(more);
    a.appendChild(box);
    a.ugMore = more;
    a.ugBox = box;
    a.ugGroup = c.group;
    a.ugText = ['cap ' + c.n, c.title, c.use, c.say.join(' '), c.run.join(' ')].concat(c.fields.map(function (f) { return f.label + ' ' + f.text; })).join(' ').toLowerCase();
    a.ugHead = (c.title + ' ' + c.use + ' ' + c.say.join(' ')).toLowerCase();
    return a;
  }
  function setOpen(a, open) { a.ugBox.hidden = !open; a.ugMore.setAttribute('aria-expanded', open ? 'true' : 'false'); a.ugMore.textContent = open ? 'Less' : 'Details'; }

  // ── WHAT'S NEW: the changes since this browser last opened the User Guide; opening it marks them seen ──
  function drawNew() {
    var box = $('ug-new');
    var latest = G.changes.reduce(function (m, c) { return cmp(c.version, m) > 0 ? c.version : m; }, G.version);
    var seen = get(KEYS.seen);
    if (seen && cmp(seen, latest) > 0) { seen = latest; }
    var fresh = seen ? G.changes.filter(function (c) { return cmp(c.version, seen) > 0; }) : [];
    var list = fresh.length ? fresh : G.changes.slice(0, 3);
    box.innerHTML = '';
    var top = el('div', 'ug-newhead');
    top.appendChild(el('span', 'ug-lbl', fresh.length ? 'New since your last visit' : 'What\'s new'));
    if (fresh.length) { top.appendChild(el('span', 'ug-badge', String(fresh.length))); }
    var all = el('button', 'ug-link', 'All ' + G.changes.length + ' changes');
    all.type = 'button';
    top.appendChild(all);
    box.appendChild(top);
    var ul = el('ul', 'ug-changes');
    function fill(items) { ul.innerHTML = ''; items.forEach(function (c) { var li = el('li', fresh.indexOf(c) !== -1 ? 'ug-fresh' : ''); li.innerHTML = '<span class="ug-when">' + esc(c.date) + ' · ' + esc(c.version) + '</span> ' + inline(c.text); ul.appendChild(li); }); }
    fill(list);
    all.addEventListener('click', function () { var open = all.getAttribute('data-open') === '1'; fill(open ? list : G.changes); all.setAttribute('data-open', open ? '0' : '1'); all.textContent = open ? 'All ' + G.changes.length + ' changes' : 'Fewer'; });
    box.appendChild(ul);
    // Seen now: the badge shows on this visit, and the next visit compares with today's version
    put(KEYS.seen, latest);
  }

  // ── SEARCH AND GROUPS: one filter decides what shows, so the count, the message and Enter always agree ──
  var cards = [];
  var group = '';
  function filter() {
    var q = $('ug-search').value.trim().toLowerCase();
    var words = q.split(/\s+/).filter(Boolean);
    var shown = 0;
    cards.forEach(function (a) {
      var hit = words.every(function (w) { return a.ugText.indexOf(w) !== -1; }) && (!group || a.ugGroup === group);
      a.hidden = !hit;
      if (hit) { shown++; }
      a.classList.toggle('ug-best', !!q && hit && words.every(function (w) { return a.ugHead.indexOf(w) !== -1; }));
    });
    Array.prototype.forEach.call(document.querySelectorAll('.ug-group'), function (g) { g.hidden = !g.querySelector('.ug-card:not([hidden])'); });
    var none = $('ug-none');
    none.hidden = shown > 0;
    none.innerHTML = shown ? '' : 'Nothing here matches <b>' + esc(q || 'this group') + '</b>' + (group ? ' in this group. <button type="button" class="ug-link" id="ug-allgroups">Search all groups</button>' : '. Try fewer words, or ask the User Guide above.');
    if (!shown && group) { $('ug-allgroups').addEventListener('click', function () { setGroup(''); }); }
    $('ug-count').textContent = (q || group) ? shown + ' of ' + cards.length : cards.length + ' capabilities';
  }
  function setGroup(g) {
    group = g;
    Array.prototype.forEach.call($('ug-pills').children, function (x) { var on = x.getAttribute('data-g') === g; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    filter();
  }

  // ── GO TO A CAPABILITY: clear anything hiding it, open it, scroll under the pinned bar, glow ──
  function goTo(n, open) {
    var a = $('cap-' + n);
    if (!a) { return; }
    if (a.hidden) { $('ug-search').value = ''; setGroup(''); }
    if (open) { setOpen(a, true); }
    a.scrollIntoView({ behavior: 'smooth', block: 'start' });
    a.classList.remove('ug-flash');
    void a.offsetWidth;
    a.classList.add('ug-flash');
  }

  // ── ASK THE GUIDE ──
  var A = { model: null, run: null, turn: null, turns: [], warmed: {} };
  function status(html, kind) { var s = $('ug-ask-status'); s.innerHTML = html || ''; s.className = 'ug-ask-status' + (kind ? ' ' + kind : ''); s.hidden = !html; }
  function setBusy(on) { $('ug-ask-go').hidden = on; $('ug-ask-stop').hidden = !on; $('ug-answers').setAttribute('aria-busy', on ? 'true' : 'false'); }
  function canAsk(on) { $('ug-ask-q').disabled = !on; $('ug-ask-go').disabled = !on; Array.prototype.forEach.call(document.querySelectorAll('#ug-starters .ug-chip'), function (b) { b.disabled = !on; }); }
  // Stop the answer in flight and keep it out of the next question's history
  function halt() { if (A.turn) { A.turn.stopped = true; } if (A.run) { A.run.stop(); } }
  function connect() {
    if (!window.AskLink || !window.AskPrompt || !window.AskPrompt.userGuideMessages) { status('Ask the User Guide did not load. Everything else on this page works.', 'warn'); canAsk(false); return; }
    var w = window.AskLink.where();
    if (!w.served) { status('Ask the User Guide works on the served page: open this dashboard from AiAssist (<b>Open a Dashboard</b>) instead of from disk. Everything else here works from disk.', 'warn'); canAsk(false); return; }
    status('Looking for Ollama on this Mac...', '');
    canAsk(false);
    window.AskLink.reach().then(function (r) {
      if (!r.ok) { var why = r.why === 'refused' ? 'Ollama refused this page (403). The served page is allowed by default, so check whether OLLAMA_ORIGINS was changed.' : 'Ollama is not answering. Open the Ollama app on this Mac (it lives in the menu bar), then'; status(esc(why) + ' <button type="button" class="ug-link" id="ug-retry">Try again</button>', 'warn'); $('ug-retry').addEventListener('click', connect); return; }
      return window.AskLink.models().then(function (list) {
        if (!list.length) { status('No models on this Mac yet. In Terminal: <code>ollama pull gemma3:27b</code>, then reload.', 'warn'); return; }
        var names = list.map(function (m) { return m.name; });
        var want = [get(KEYS.model)].concat(PREFERRED).concat([get(KEYS.glossaryModel)]).filter(function (x) { return x && names.indexOf(x) !== -1; })[0] || names[names.length - 1];
        var sel = $('ug-ask-model');
        sel.innerHTML = list.map(function (m) { return '<option value="' + esc(m.name) + '"' + (m.name === want ? ' selected' : '') + '>' + esc(m.name) + ' · ' + m.gb.toFixed(1) + ' GB</option>'; }).join('');
        sel.hidden = false;
        A.model = want;
        status('', '');
        canAsk(true);
      });
    }).catch(function (e) { status('Ask the User Guide could not start: ' + esc(e.message || e), 'warn'); });
  }
  // WARM: the first question makes the model read the whole Guide (Project-AI-Local's, about 6,500 tokens, took gemma3:27b about
  // 32 s). Reading it once when the reader first touches the Ask box lets Ollama keep that reading, so his real question starts in under a second.
  function warm() {
    var m = A.model;
    if (!m || A.warmed[m] || A.run) { return; }
    A.warmed[m] = 'warming';
    status('Getting ' + esc(m) + ' ready: it reads the User Guide once, then answers quickly.', 'soft');
    var w = window.AskLink.chat({ model: m, messages: window.AskPrompt.userGuideMessages(G, [], 'Ready?'), options: { temperature: 0.2, num_ctx: OPTIONS.num_ctx, num_predict: 1 } }, function () {});
    w.promise.then(function () { A.warmed[m] = 'ready'; if (A.model === m && $('ug-ask-status').className.indexOf('soft') !== -1) { status('', ''); } }, function () { A.warmed[m] = false; status('', ''); });
  }
  function ask(question) {
    question = String(question || '').trim();
    if (!question || !A.model) { return; }
    halt();
    var model = A.model;
    if ($('ug-ask-status').className.indexOf('soft') !== -1) { status('', ''); }
    $('ug-ask-q').value = '';
    $('ug-starters').hidden = true;
    $('ug-ask-clear').hidden = false;
    var turn = { q: question, a: '', el: el('div', 'ug-turn') };
    turn.el.appendChild(el('div', 'ug-q', question));
    var body = el('div', 'ug-a');
    body.appendChild(el('div', 'ug-wait', 'Reading the User Guide...'));
    turn.el.appendChild(body);
    turn.meta = el('div', 'ug-meta');
    turn.el.appendChild(turn.meta);
    $('ug-answers').appendChild(turn.el);
    var history = A.turns.filter(function (t) { return t.a && !t.stopped; }).slice(-3).map(function (t) { return { q: t.q, a: t.a }; });
    A.turns.push(turn);
    var mine = { stop: null };
    A.run = mine;
    A.turn = turn;
    var slow = setTimeout(function () { if (!turn.a && A.run === mine) { var wt = body.querySelector('.ug-wait'); if (wt) { wt.textContent = 'Reading the User Guide. The first question takes longest; the next ones are quick.'; } } }, 5000);
    var run = window.AskLink.chat({ model: model, messages: window.AskPrompt.userGuideMessages(G, history, question), options: OPTIONS }, function (piece) { turn.a += piece; if (A.run === mine) { draw(turn, false); } });
    mine.stop = run.stop;
    setBusy(true);
    turn.el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    run.promise.then(function (r) {
      if (r.stopped) { turn.stopped = true; }
      draw(turn, true);
      A.warmed[model] = 'ready';
      turn.meta.textContent = model + (turn.stopped ? ' · stopped' : '') + (r.firstMs ? ' · first word ' + (r.firstMs / 1000).toFixed(1) + ' s' : '') + (r.tps ? ' · ' + Math.round(r.tps) + ' tok/s' : '') + ' · not vetted: open the capability it names';
    }, function (e) {
      turn.stopped = true;
      body.innerHTML = '';
      body.appendChild(el('p', 'ug-err', 'The answer did not arrive: ' + (e.message || e)));
    }).then(function () { clearTimeout(slow); if (A.run === mine) { A.run = null; A.turn = null; setBusy(false); } });
  }
  // Models sometimes write (Cap 7) or [Cap 7, Cap 8]; both become ordinary [Cap N] chips
  function tidy(text) { return text.replace(/\(Cap\s*(\d+)\)/g, '[Cap $1]').replace(/\[Cap\s*\d+(?:\s*,\s*Cap\s*\d+)+\]/g, function (m) { return m.match(/\d+/g).map(function (n) { return '[Cap ' + n + ']'; }).join(' '); }); }
  function draw(turn, final) {
    var p = window.AskPrompt.parse(tidy(turn.a), final);
    var body = turn.el.querySelector('.ug-a');
    body.innerHTML = '';
    if (!p.paras.length && !final) { body.appendChild(el('div', 'ug-wait', 'Reading the User Guide...')); return; }
    p.paras.forEach(function (para) {
      var d = el('div', para.beyond ? 'ug-beyond' : 'ug-para');
      if (para.beyond) { d.appendChild(el('span', 'ug-beyond-lbl', 'Beyond the User Guide')); }
      var txt = el('p', '');
      para.parts.forEach(function (x) {
        if (x.text) { txt.appendChild(document.createTextNode(x.text)); return; }
        var n = /^Cap (\d+)$/.exec(x.cite);
        if (n && byN[n[1]]) { var b = el('button', 'ug-cite', n[1] + ' · ' + byN[n[1]].title); b.type = 'button'; b.title = 'Open capability ' + n[1]; b.addEventListener('click', function () { goTo(n[1], true); }); txt.appendChild(b); }
      });
      d.appendChild(txt);
      body.appendChild(d);
    });
    if (final && p.followups.length) {
      var f = el('div', 'ug-follow');
      p.followups.forEach(function (q) { var b = el('button', 'ug-chip', q); b.type = 'button'; b.addEventListener('click', function () { ask(q); }); f.appendChild(b); });
      body.appendChild(f);
    }
  }

  // ── BUILD ──
  function build() {
    if (!G) { $('ug-groups').innerHTML = '<p class="ug-err">The User Guide data did not load (user-guide/user-guide-data.js). Ask Claude to <b>update the user guide</b>: it runs the export on CAPABILITIES.md and lands the data.</p>'; return; }
    G.sections.forEach(function (c) { byN[c.n] = c; });
    $('ug-asof').innerHTML = 'From <code>CAPABILITIES.md</code> ' + esc(G.version) + ' · sha256 ' + esc(G.sha256.slice(0, 12));
    var nav = $('ug-pills');
    var all = el('button', 'ug-pill on', 'All');
    all.type = 'button';
    all.setAttribute('data-g', '');
    all.setAttribute('aria-pressed', 'true');
    nav.appendChild(all);
    G.groups.forEach(function (g) {
      var n = G.sections.filter(function (c) { return c.group === g.id; });
      var p = el('button', 'ug-pill', g.name);
      p.type = 'button';
      p.setAttribute('data-g', g.id);
      p.setAttribute('aria-pressed', 'false');
      nav.appendChild(p);
      var sec = el('div', 'ug-group');
      sec.id = 'grp-' + g.id;
      var h = el('div', 'ug-ghead');
      h.appendChild(el('h3', '', g.name));
      h.appendChild(el('span', 'ug-gblurb', g.blurb));
      sec.appendChild(h);
      var grid = el('div', 'ug-grid');
      n.forEach(function (c) { var a = card(c); cards.push(a); grid.appendChild(a); });
      sec.appendChild(grid);
      $('ug-groups').appendChild(sec);
    });
    // One group needs no pills: the search alone narrows it
    nav.hidden = G.groups.length < 2;
    nav.addEventListener('click', function (e) {
      var b = e.target.closest('.ug-pill');
      if (!b) { return; }
      var g = b.getAttribute('data-g');
      setGroup(g);
      if (g) { $('grp-' + g).scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
    G.rules.forEach(function (r) { var li = el('li', ''); li.innerHTML = inline(r); $('ug-rules').appendChild(li); });
    G.threads.forEach(function (r) { var li = el('li', ''); li.innerHTML = inline(r); $('ug-threads').appendChild(li); });
    document.addEventListener('click', function (e) { var x = e.target.closest('.ug-xref'); if (x) { e.preventDefault(); goTo(x.getAttribute('data-n'), true); history.replaceState(null, '', '#cap-' + x.getAttribute('data-n')); } });
    $('ug-search').addEventListener('input', filter);
    $('ug-search').addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.stopPropagation(); $('ug-search').value = ''; filter(); }
      if (e.key === 'Enter') { var first = cards.filter(function (a) { return !a.hidden; })[0]; if (first) { goTo(first.id.slice(4), true); } }
    });
    drawNew();
    filter();
    // Ask the User Guide
    if (G.placeholder) { $('ug-ask-q').placeholder = G.placeholder; }
    var st = $('ug-starters');
    STARTERS.forEach(function (q) { var b = el('button', 'ug-chip', q); b.type = 'button'; b.disabled = true; b.addEventListener('click', function () { ask(q); }); st.appendChild(b); });
    $('ug-ask').addEventListener('submit', function (e) { e.preventDefault(); ask($('ug-ask-q').value); });
    $('ug-ask-stop').addEventListener('click', halt);
    $('ug-ask-clear').addEventListener('click', function () { halt(); A.turns = []; $('ug-answers').innerHTML = ''; $('ug-starters').hidden = false; $('ug-ask-clear').hidden = true; });
    $('ug-ask-model').addEventListener('change', function (e) { A.model = e.target.value; put(KEYS.model, A.model); warm(); });
    var box = document.querySelector('.ug-askbox');
    box.addEventListener('focusin', warm);
    box.addEventListener('pointerenter', warm);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && A.run) { halt(); }
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && document.activeElement && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) { e.preventDefault(); $('ug-search').focus(); }
    });
    connect();
    // #cap-7 opens straight to capability 7; the engine may still be laying out, so wait a moment
    function jump() { var m = /^#cap-(\d+)$/.exec(window.location.hash); if (m) { goTo(m[1], true); } }
    window.addEventListener('hashchange', jump);
    setTimeout(jump, 120);
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', build); } else { build(); }
  window.UserGuide = { version: VERSION, goTo: goTo, ask: ask };
})();