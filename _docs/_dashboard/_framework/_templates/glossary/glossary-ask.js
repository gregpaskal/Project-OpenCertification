// ===============================================================
// @file: glossary-ask.js
// @filepath: dashboard_engine/_framework/_templates/glossary/glossary-ask.js
// @version: 1.0.0
// @updated: 2026-11-13 05:16:26 PM CST
// @author: Greg Paskal & Claude
// @company: MissionWares®
// @description: Glossary Ask: an Ask button on every glossary card opens a drawer where you talk with a model on this
//   Mac about that one term. Each answer starts from the card's vetted data (the Ask part's ask-prompt.js, grounded with
//   the glossary's own name and reader line), streams in as it is written, marks what goes BEYOND THE CARD, names the
//   card parts it used as chips you can follow, and offers three follow-up questions. A takeaway turns the conversation
//   into three lessons you edit and save to the card's My notes. Conversations and notes are remembered in this browser
//   under the project's own keys (every dashboard served by AiAssist shares the localhost:8765 origin). The model is
//   reached only through the Ask part's ask-link.js. Opened from disk, the drawer explains how to open the served page.
//   A STAMPED file: changed only at the engine home.
// @tags: dashboard, glossary, ask, ollama, learning, takeaway, notes, page-type
// @changeLog:
// Date        Author         Version        Description
// ----------  -------------  -------------  --------------------------
// 2026-11-13  Greg & Claude  1.0.0          Harvested into the Glossary page type from Project-AI-Local glossary-ask.js 1.0.2: drawer, chips, follow-ups, takeaway and My notes unchanged; storage keys and the served address from DASH_PROJECT; preferred models from the data (curriculum.ask.models); starter questions name no project or catalog
// ===============================================================
(function () {
  'use strict';
  var P = window.DASH_PROJECT || 'dashboard';
  var KEYS = { model: P + '.glossary.ask.model.v1', talks: P + '.glossary.ask.talks.v1', notes: P + '.glossary.notes.v1' };
  var PREFERRED = ['gemma3:27b', 'llama3.1:8b'];
  var OPTIONS = { temperature: 0.3, num_ctx: 16384 };
  var TAKE_OPTIONS = { temperature: 0.2, num_ctx: 16384 };
  var MAX_TALKS = 40;
  var MAX_TURNS_SENT = 6;
  var SERVED_URL = 'http://localhost:8765/' + P + '/glossary.html';

  var ctx = null;
  var drawer = null;
  var D = {};
  var NOTES = {};
  // S.run is the request in flight: { stop }. A run belongs to the term it was asked on; switching terms detaches it.
  var S = { term: null, turns: [], run: null, link: null, models: null, model: null, warm: {}, cleared: null };

  // ── STORAGE: guarded, because storage can be empty or refuse; save() says whether it worked ──
  function load(k) { try { return JSON.parse(window.localStorage.getItem(k)) || null; } catch (e) { return null; } }
  function save(k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }

  // ── SMALL DOM HELPERS ──
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) { e.className = cls; } if (text !== undefined && text !== null) { e.textContent = text; } return e; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function button(cls, label, onClick, title) { var b = el('button', cls, label); b.type = 'button'; if (title) { b.title = title; } if (onClick) { b.addEventListener('click', onClick); } return b; }
  var ICON = {};
  ICON.ask = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M5.5 7h5M5.5 5.2h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';
  ICON.close = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
  ICON.fresh = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8a5 5 0 1 0 1.5-3.6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M3 2.5v2.5h2.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  ICON.send = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4.5L12 8l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  ICON.stop = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="4.5" width="7" height="7" rx="1.2" fill="currentColor"/></svg>';
  ICON.spark = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.8l1.5 4.7 4.7 1.5-4.7 1.5L8 14.2 6.5 9.5 1.8 8l4.7-1.5z" fill="currentColor"/></svg>';
  ICON.chev = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function motionOn() { return ctx && ctx.motionOn ? ctx.motionOn() : true; }
  function term() { return ctx.byId[S.term]; }
  function busy() { return !!S.run; }
  function zoom() { var z = document.body.style.zoom || window.getComputedStyle(document.body).zoom || '1'; var n = parseFloat(z); if (/%$/.test(String(z))) { n = n / 100; } return n > 0 ? n : 1; }
  function secs(ms) { return ms == null ? '' : (ms < 10000 ? (ms / 1000).toFixed(1) : Math.round(ms / 1000)) + ' s'; }
  function when(at) {
    var d = new Date(at);
    if (isNaN(d)) { return ''; }
    var mins = Math.round((Date.now() - d.getTime()) / 60000);
    if (mins < 1) { return 'just now'; }
    if (mins < 60) { return mins + ' min ago'; }
    if (mins < 60 * 20) { return Math.round(mins / 60) + ' h ago'; }
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  function stamp(at) { var d = new Date(at); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + ' ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); }

  // ── CARD SIDE: the Ask button and My notes on every card ──
  function decorate(card, t) {
    var head = card.querySelector('.gl-head');
    var b = button('gl-askbtn', '', function (e) { e.stopPropagation(); open(t.term_id); }, 'Ask a model on this Mac about ' + t.term);
    b.innerHTML = ICON.ask + '<span>Ask</span>';
    b.setAttribute('aria-haspopup', 'dialog');
    head.insertBefore(b, head.querySelector('.gl-anchor'));
    renderNotes(card, t);
  }

  function notesFor(id) { return (NOTES[id] || []).slice(); }
  function setNotes(id, list) { var next = Object.assign({}, NOTES); if (list.length) { next[id] = list; } else { delete next[id]; } if (!save(KEYS.notes, next)) { return false; } NOTES = next; return true; }

  function renderNotes(card, t) {
    var old = card.querySelector('.gl-notes-wrap');
    if (old) { old.parentNode.removeChild(old); }
    var list = notesFor(t.term_id);
    if (!list.length) { return null; }
    var wrap = el('div', 'gl-notes-wrap');
    wrap.appendChild(el('div', 'gl-lbl', 'My notes'));
    var box = el('div', 'gl-notes');
    list.forEach(function (n, i) {
      var one = el('div', 'gl-note');
      var ul = el('ul', '');
      n.items.forEach(function (it) { ul.appendChild(el('li', '', it)); });
      one.appendChild(ul);
      var meta = el('div', 'gl-note-meta');
      meta.appendChild(document.createTextNode('Saved ' + stamp(n.at) + ' · from ' + n.questions + (n.questions === 1 ? ' question' : ' questions') + ' with ' + n.model + ' · '));
      meta.appendChild(button('gl-note-act', 'Copy for Journal', function (e) { copy(journalText(t, n), e.target, 'Copied'); }));
      meta.appendChild(document.createTextNode(' · '));
      var rm = button('gl-note-act', 'Remove', function () {
        if (rm.getAttribute('data-sure')) { var l = notesFor(t.term_id); l.splice(i, 1); if (setNotes(t.term_id, l)) { renderNotes(card, t); } else { rm.textContent = 'Could not remove: storage refused'; } return; }
        rm.setAttribute('data-sure', '1'); rm.textContent = 'Remove? Click again'; rm.classList.add('warn');
        setTimeout(function () { rm.removeAttribute('data-sure'); rm.textContent = 'Remove'; rm.classList.remove('warn'); }, 3500);
      });
      meta.appendChild(rm);
      one.appendChild(meta);
      box.appendChild(one);
    });
    wrap.appendChild(box);
    var ana = card.querySelector('.gl-analogy');
    if (ana && ana.nextSibling) { card.insertBefore(wrap, ana.nextSibling); } else { card.appendChild(wrap); }
    return wrap;
  }

  function journalText(t, n) { return '### ' + t.term + ': takeaway, ' + stamp(n.at) + '\n\n' + n.items.map(function (x) { return '- ' + x; }).join('\n') + '\n\n*From a ' + n.questions + '-question conversation with ' + n.model + ' in Glossary Ask, grounded on glossary v' + n.card + '.*\n'; }

  function copy(text, btn, done) {
    var label = btn ? btn.textContent : '';
    function ok() { if (btn) { btn.textContent = done || 'Copied'; setTimeout(function () { btn.textContent = label; }, 1600); } }
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(ok, function () { fallbackCopy(text); ok(); }); } else { fallbackCopy(text); ok(); }
  }
  function fallbackCopy(text) { var ta = el('textarea', ''); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) { /* nothing more to try */ } document.body.removeChild(ta); }

  // ── THE DRAWER ──
  function build() {
    drawer = el('aside', 'ask');
    drawer.id = 'ask';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-label', 'Ask about a glossary term');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.innerHTML = '<div class="ask-head"><div class="ask-row"><div class="ask-title"><span class="ask-kick">' + ICON.spark + 'ASK</span></div><button type="button" class="ask-model" aria-expanded="false" title="Choose the model"><span class="ask-dot"></span><span class="ask-mname">checking</span><span class="ask-chev">' + ICON.chev + '</span></button><div class="ask-menu" hidden></div><button type="button" class="ask-icon ask-new" title="New conversation">' + ICON.fresh + '</button><button type="button" class="ask-icon ask-x" title="Close (Esc)">' + ICON.close + '</button></div><div class="ask-term"></div><div class="ask-ground">Answers start from this card\'s <b>vetted data</b>. Anything a model adds is marked <span class="ask-bm">BEYOND THE CARD</span>.</div></div><div class="ask-conv" aria-live="polite"></div><div class="ask-undo" hidden><span>Conversation cleared.</span><button type="button" class="ask-link-btn">Undo</button></div><div class="ask-foot"><div class="ask-inp"><textarea rows="1" spellcheck="true" aria-label="Your question"></textarea><button type="button" class="ask-send" title="Ask (Enter)">' + ICON.send + '</button></div><div class="ask-fa"><span class="ask-honest">Runs on this Mac · nothing leaves it · answers are not vetted</span><button type="button" class="ask-take" disabled title="Turn this conversation into three notes for the card">' + ICON.spark + 'Takeaway</button></div></div>';
    // On a narrow window the drawer sits over the cards; a dim scrim behind it closes it on click
    var scrim = el('div', 'ask-scrim');
    scrim.addEventListener('click', close);
    document.body.appendChild(scrim);
    document.body.appendChild(drawer);
    D = { term: q('.ask-term'), model: q('.ask-model'), mname: q('.ask-mname'), dot: q('.ask-dot'), menu: q('.ask-menu'), conv: q('.ask-conv'), input: q('textarea'), send: q('.ask-send'), take: q('.ask-take'), undo: q('.ask-undo'), fresh: q('.ask-new'), foot: q('.ask-foot') };
    q('.ask-x').addEventListener('click', close);
    D.fresh.addEventListener('click', clearTalk);
    D.undo.querySelector('button').addEventListener('click', undoClear);
    D.model.addEventListener('click', function (e) { e.stopPropagation(); toggleMenu(); });
    D.menu.addEventListener('keydown', menuKeys);
    document.addEventListener('click', function (e) { if (!D.menu.hidden && !D.menu.contains(e.target)) { hideMenu(); } });
    D.send.addEventListener('click', function () { if (busy()) { S.run.stop(); return; } submit(); });
    D.take.addEventListener('click', takeaway);
    D.input.addEventListener('input', grow);
    D.input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); if (!busy()) { submit(); } } });
    // Chips act on press, not on click: a streaming answer is redrawn many times a second, which would lose a click
    D.conv.addEventListener('pointerdown', function (e) { if (e.button !== 0) { return; } var c = e.target.closest('[data-act]'); if (!c) { return; } e.preventDefault(); act(c); c.setAttribute('data-done', String(Date.now())); });
    D.conv.addEventListener('click', function (e) { var c = e.target.closest('[data-act]'); if (!c) { return; } var t = Number(c.getAttribute('data-done') || 0); if (Date.now() - t < 800) { return; } act(c); });
    window.addEventListener('resize', function () { if (isOpen()) { layout(); } });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !isOpen()) { return; }
      if (!D.menu.hidden) { hideMenu(); D.model.focus(); return; }
      if (busy()) { S.run.stop(); return; }
      close();
    });
    function q(s) { return drawer.querySelector(s); }
  }
  function grow() { D.input.style.height = 'auto'; D.input.style.height = Math.min(D.input.scrollHeight, 140) + 'px'; }
  function isOpen() { return drawer && drawer.classList.contains('open'); }

  function open(id) {
    if (!drawer) { build(); }
    var was = S.term;
    if (busy() && was !== id) { detach(); }
    S.term = id;
    var t = term();
    D.term.textContent = t.term;
    D.input.placeholder = 'Ask about ' + t.term + '...';
    Array.prototype.forEach.call(document.querySelectorAll('.gl-asking'), function (c) { c.classList.remove('gl-asking'); });
    var card = document.getElementById(id);
    layout();
    drawer.classList.toggle('still', !motionOn());
    var arriving = !isOpen();
    document.body.classList.add('gl-ask-open');
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    // The page narrows while the drawer slides in, so the card is brought into view once the layout has settled
    if (card) { card.hidden = false; card.classList.add('gl-asking'); setTimeout(function () { bring(card, 'start', true); }, motionOn() && arriving ? 740 : 30); }
    if (was !== id || !D.conv.childNodes.length) { S.turns = restore(id); S.cleared = null; D.undo.hidden = true; drawConv(); }
    connect().then(function () { if (isOpen()) { setTimeout(function () { D.input.focus({ preventScroll: true }); }, motionOn() && arriving ? 320 : 0); } });
  }

  // A run asked on another term is stopped and let go: its own handler saves what arrived under its own term
  function detach() { var r = S.run; S.run = null; r.stop(); setModelChip(); syncControls(); }

  // The drawer's width follows the room the page really has (the engine zooms the whole page, 150% by default); the page
  // makes room for it whenever the cards keep a readable width (so a chip's glow on the card stays in sight); on a
  // narrow window the drawer sits over the cards
  function layout() {
    var w = window.innerWidth / zoom();
    var push = w >= 940;
    var dw = Math.round(push ? Math.min(460, w - 600) : Math.min(460, w));
    document.body.style.setProperty('--ask-w', dw + 'px');
    document.body.classList.toggle('gl-ask-push', push);
  }

  function close() {
    if (!drawer) { return; }
    drawer.classList.toggle('still', !motionOn());
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('gl-ask-open');
    document.body.classList.remove('gl-ask-push');
    Array.prototype.forEach.call(document.querySelectorAll('.gl-asking'), function (c) { c.classList.remove('gl-asking'); });
    hideMenu();
    var card = S.term && document.getElementById(S.term);
    var btn = card && card.querySelector('.gl-askbtn');
    if (btn) { btn.focus({ preventScroll: true }); }
  }

  // ── CONNECTION: where the page runs, whether Ollama answers, which model ──
  function connect(force) {
    if (S.link && S.link.ok && S.models && !force) { setModelChip(); syncControls(); return Promise.resolve(); }
    setStatus('checking', 'checking');
    return window.AskLink.reach().then(function (r) {
      S.link = r;
      if (!r.ok) { S.models = null; setStatus('down', r.why === 'file' ? 'not served' : 'Ollama offline'); drawConv(); return; }
      return window.AskLink.models().then(function (list) {
        S.models = list;
        if (!list.length) { S.link = { ok: false, why: 'empty' }; setStatus('down', 'no models'); drawConv(); return; }
        var saved = load(KEYS.model);
        var pick = list.filter(function (m) { return m.name === saved; })[0] || ((ctx.models && ctx.models.length) ? ctx.models : PREFERRED).map(function (p) { return list.filter(function (m) { return m.name === p; })[0]; }).filter(Boolean)[0] || list[list.length - 1];
        var first = !S.model;
        S.model = pick.name;
        setModelChip();
        if (first || force) { drawConv(); }
      });
    }).catch(function () { S.link = { ok: false, why: 'down' }; setStatus('down', 'Ollama offline'); drawConv(); }).then(syncControls);
  }
  function setStatus(kind, label) { D.dot.className = 'ask-dot ' + kind; D.mname.textContent = label; }
  function setModelChip() { if (S.model && S.link && S.link.ok) { setStatus(busy() ? 'busy' : 'ready', S.model); } }

  // The model menu: plain buttons, the current one pressed; arrows move between them
  function hideMenu() { if (D.menu) { D.menu.hidden = true; D.model.setAttribute('aria-expanded', 'false'); } }
  function toggleMenu() {
    if (!S.models || !S.models.length) { connect(true); return; }
    if (!D.menu.hidden) { hideMenu(); return; }
    D.menu.innerHTML = '';
    D.menu.appendChild(el('div', 'ask-menu-h', 'Models on this Mac'));
    var on = null;
    S.models.forEach(function (m) {
      var b = button('ask-mi' + (m.name === S.model ? ' on' : ''), '', function () { S.model = m.name; save(KEYS.model, m.name); hideMenu(); setModelChip(); D.model.focus(); });
      b.setAttribute('aria-pressed', String(m.name === S.model));
      var hint = m.gb < 8 ? 'quick' : (m.gb < 30 ? 'thorough' : 'slow, very large');
      b.innerHTML = '<span class="ask-mi-n">' + esc(m.name) + '</span><span class="ask-mi-d">' + esc([m.params, m.gb.toFixed(1) + ' GB', hint].filter(Boolean).join(' · ')) + '</span>';
      D.menu.appendChild(b);
      if (m.name === S.model) { on = b; }
    });
    D.menu.appendChild(el('div', 'ask-menu-f', 'Larger models answer more carefully and mark what goes beyond the card more reliably; smaller ones answer faster.'));
    D.menu.hidden = false;
    D.model.setAttribute('aria-expanded', 'true');
    (on || D.menu.querySelector('.ask-mi')).focus();
  }
  function menuKeys(e) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') { return; }
    e.preventDefault();
    var items = Array.prototype.slice.call(D.menu.querySelectorAll('.ask-mi'));
    var i = items.indexOf(document.activeElement);
    var next = items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length];
    if (next) { next.focus(); }
  }

  function ready() { return S.link && S.link.ok && S.model; }
  function syncControls() {
    var can = !!ready();
    D.input.disabled = !can;
    D.send.disabled = !can && !busy();
    D.send.innerHTML = busy() ? ICON.stop : ICON.send;
    D.send.classList.toggle('stop', busy());
    D.send.title = busy() ? 'Stop (Esc)' : 'Ask (Enter)';
    D.take.disabled = !can || busy() || !S.turns.some(done);
    D.fresh.disabled = busy() || !S.turns.length;
    D.foot.classList.toggle('off', !can);
  }
  function done(x) { return x.a && !x.error; }

  // ── CONVERSATION STORAGE: the last conversation per term ──
  function restore(id) { var all = load(KEYS.talks) || {}; var t = all[id]; return t && Array.isArray(t.turns) ? t.turns.filter(done).map(function (x) { x.restored = true; return x; }) : []; }
  function persist(id, turns) {
    var all = load(KEYS.talks) || {};
    var keep = turns.filter(done).map(function (x) { return { q: x.q, a: x.a, model: x.model, meta: x.meta ? { totalMs: x.meta.totalMs, tps: x.meta.tps, tokens: x.meta.tokens } : null, at: x.at, stopped: !!x.stopped, card: x.card }; });
    if (keep.length) { all[id] = { at: new Date().toISOString(), turns: keep }; } else { delete all[id]; }
    var ids = Object.keys(all).sort(function (a, b) { return String(all[b].at).localeCompare(String(all[a].at)); });
    ids.slice(MAX_TALKS).forEach(function (k) { delete all[k]; });
    save(KEYS.talks, all);
  }
  function clearTalk() {
    if (busy() || !S.turns.length) { return; }
    S.cleared = S.turns;
    S.turns = [];
    persist(S.term, S.turns);
    drawConv();
    D.undo.hidden = false;
    clearTimeout(clearTalk.timer);
    clearTalk.timer = setTimeout(function () { D.undo.hidden = true; S.cleared = null; }, 6000);
    D.input.focus();
  }
  function undoClear() { if (!S.cleared) { return; } S.turns = S.cleared; S.cleared = null; D.undo.hidden = true; persist(S.term, S.turns); drawConv(); }

  // ── DRAWING THE CONVERSATION ──
  function drawConv() {
    D.conv.innerHTML = '';
    var r = S.link;
    if (r && !r.ok) { D.conv.appendChild(unavailable(r.why)); syncControls(); return; }
    if (!S.turns.length) { D.conv.appendChild(welcome()); syncControls(); return; }
    S.turns.forEach(function (x, i) {
      if (x.restored && i === 0) { D.conv.appendChild(el('div', 'ask-div', 'Earlier conversation · ' + when(x.at))); }
      if (!x.restored && i > 0 && S.turns[i - 1].restored) { D.conv.appendChild(el('div', 'ask-div', 'Now')); }
      x.qnode = el('div', 'ask-q', x.q);
      D.conv.appendChild(x.qnode);
      x.node = el('div', 'ask-a');
      drawAnswer(x, i === S.turns.length - 1);
      D.conv.appendChild(x.node);
    });
    syncControls();
    D.conv.scrollTop = D.conv.scrollHeight;
  }

  function welcome() {
    var t = term();
    var w = el('div', 'ask-welcome');
    w.appendChild(el('div', 'ask-w-h', 'The card says'));
    w.appendChild(button('ask-w-m', t.definitions.layman.universal[0], function () { glow('Meaning'); }, 'Show it on the card'));
    w.appendChild(el('div', 'ask-w-h', 'Try asking'));
    var box = el('div', 'ask-follow');
    starters(t).forEach(function (s, i) { var b = button('ask-fu', s, function () { ask(s); }); b.style.setProperty('--i', i); box.appendChild(b); });
    w.appendChild(box);
    return w;
  }

  // Starter questions come from the card itself, so they are instant and always fit the term
  function starters(t) {
    var out = ['Explain ' + t.term + ' to me as if I am new to it.'];
    var std = (t.catalog_refs || [])[0];
    if (std) { out.push('How does ' + t.term + ' relate to ' + std.id + '?'); } else { out.push('Where would I run into ' + t.term + ' in practice?'); }
    if (t.polysemy) {
      var names = {};
      (ctx.domains || []).forEach(function (d) { names[d.id] = d.name; });
      var top = function (m) { return Math.max.apply(null, Object.keys(m.weights || {}).map(function (k) { return m.weights[k]; }).concat([0])); };
      var other = t.polysemy.meanings.filter(function (m) { return !m.official; }).sort(function (a, b) { return top(b) - top(a); })[0];
      if (other && names[other.domain]) { out.push('What would a ' + names[other.domain] + ' hear when I say "' + t.term + '"?'); }
    }
    var rel = (t.relationships || []).filter(function (r) { return ctx.byId[r.term_id]; })[0];
    if (rel) { out.push('How does ' + t.term + ' connect to ' + ctx.byId[rel.term_id].term + '?'); }
    return out.slice(0, 4);
  }

  function unavailable(why) {
    var u = el('div', 'ask-un');
    if (why === 'file') {
      u.appendChild(el('div', 'ask-un-t', 'Ask works on the served dashboard'));
      u.appendChild(el('div', 'ask-un-p', 'This page was opened from disk. Ollama only answers pages served by AiAssist, so open the glossary from AiAssist\'s menu (Open a Dashboard), or paste this address into your browser:'));
      var row = el('div', 'ask-un-url');
      var code = el('code', '', SERVED_URL + (S.term ? '#' + S.term : ''));
      row.appendChild(code);
      row.appendChild(button('ask-btn', 'Copy', function (e) { copy(code.textContent, e.target, 'Copied'); }));
      u.appendChild(row);
      u.appendChild(el('div', 'ask-un-n', 'Settings and notes saved on the disk page stay with it; the served page keeps its own.'));
      return u;
    }
    var text = { down: ['Ollama is not answering', 'Open the Ollama app on this Mac (it lives in the menu bar), then try again.'], refused: ['Ollama refused this page', 'Ollama answered 403 to this page\'s origin. The served page at localhost:8765 is allowed by default, so check whether OLLAMA_ORIGINS was changed.'], empty: ['No models on this Mac yet', 'Pull one in Terminal, for example: ollama pull gemma3:27b, then try again.'] }[why] || ['Ask is not available', 'Try again in a moment.'];
    u.appendChild(el('div', 'ask-un-t', text[0]));
    u.appendChild(el('div', 'ask-un-p', text[1]));
    u.appendChild(button('ask-btn pri', 'Try again', function (e) { e.target.textContent = 'Checking...'; connect(true); }));
    return u;
  }

  // One answer: parsed from its raw text, drawn as paragraphs, BEYOND THE CARD blocks and chips
  function drawAnswer(x, last) {
    var a = x.node;
    var live = !!(x.live && S.run && x.run === S.run);
    a.innerHTML = '';
    a.setAttribute('aria-busy', String(live));
    if (live && !x.a) { a.appendChild(thinking(x)); return; }
    var p = window.AskPrompt.parse(x.a || '', !live);
    p.paras.forEach(function (para) {
      var box = para.beyond ? el('div', 'ask-beyond') : el('p', 'ask-p');
      if (para.beyond) { box.appendChild(el('span', 'ask-bl', 'BEYOND THE CARD')); }
      var body = para.beyond ? el('span', 'ask-bt') : box;
      var lastCite = null;
      para.parts.forEach(function (part) {
        if (part.cite) { var key = part.cite + '|' + (part.detail || ''); if (key === lastCite) { return; } lastCite = key; body.appendChild(chip(part)); return; }
        lastCite = null;
        inline(body, part.text);
      });
      keepPunctuation(body);
      if (para.beyond) { box.appendChild(body); }
      a.appendChild(box);
    });
    if (live) { var paras = a.querySelectorAll('.ask-p, .ask-bt'); var tail = paras[paras.length - 1] || a; tail.appendChild(el('span', 'ask-caret')); return; }
    if (x.error) { a.appendChild(errorBox(x)); return; }
    a.appendChild(metaLine(x, last));
    if (last) {
      var fu = p.followups.length ? p.followups : starters(term()).filter(function (s) { return !S.turns.some(function (y) { return y.q === s; }); }).slice(0, 3);
      if (fu.length) { var box2 = el('div', 'ask-follow'); fu.forEach(function (s, i) { var b = button('ask-fu', s, function () { ask(s); }); b.style.setProperty('--i', i); box2.appendChild(b); }); a.appendChild(box2); }
    }
  }

  // A period or comma right after a chip stays on the chip's line instead of wrapping alone
  function keepPunctuation(body) {
    Array.prototype.forEach.call(body.querySelectorAll('.ask-chip'), function (c) {
      var n = c.nextSibling;
      if (!n || n.nodeType !== 3) { return; }
      var m = n.nodeValue.match(/^[.,;:!?)]+/);
      if (!m) { return; }
      var w = el('span', 'ask-nw');
      c.parentNode.insertBefore(w, c);
      w.appendChild(c);
      w.appendChild(document.createTextNode(m[0]));
      n.nodeValue = n.nodeValue.slice(m[0].length);
    });
  }

  // Scroll the glossary column so a card part sits below the sticky search bar, not under it
  function bring(target, where, instant) {
    var main = target.closest('main') || document.scrollingElement;
    var bar = document.querySelector('.gl-top');
    var zf = zoom();
    var top = (bar ? bar.getBoundingClientRect().bottom : main.getBoundingClientRect().top) / zf;
    var box = target.getBoundingClientRect();
    var view = main.getBoundingClientRect();
    var goal = where === 'center' ? (box.top / zf) - (top + (view.bottom / zf - top) / 2) + (box.height / zf) / 2 : (box.top / zf) - top - 12;
    main.scrollBy({ top: goal, behavior: motionOn() && !instant ? 'smooth' : 'auto' });
  }

  function thinking(x) {
    var w = el('div', 'ask-think');
    w.innerHTML = '<span class="ask-dots"><i></i><i></i><i></i></span><span class="ask-tt">Reading the card</span>';
    var tt = w.querySelector('.ask-tt');
    clearInterval(thinking.timer);
    thinking.timer = setInterval(function () {
      if (!w.isConnected || x.a) { clearInterval(thinking.timer); return; }
      var ms = performance.now() - x.t0;
      if (ms < 1800) { return; }
      tt.textContent = (!S.warm[x.model] && ms > 6000) ? 'Loading ' + x.model + ' into memory · ' + secs(ms) + ' · the first answer takes longest' : x.model + ' is thinking · ' + secs(ms);
    }, 250);
    return w;
  }

  // Text with light inline marks: *emphasis*, `code`, and [term names] the glossary knows become links
  function inline(parent, text) {
    var s = String(text).replace(/\bthe CARD\b/g, 'the card').replace(/\bThe CARD\b/g, 'The card').replace(/\bCARD\b/g, 'card');
    var re = /(\*[^*\n]{1,80}\*|`[^`\n]{1,60}`|\[[^\]\n]{2,48}\])/g;
    var last = 0;
    var m;
    while ((m = re.exec(s)) !== null) {
      if (m.index > last) { parent.appendChild(document.createTextNode(s.slice(last, m.index))); }
      var tok = m[0];
      if (tok[0] === '*') { parent.appendChild(el('em', '', tok.slice(1, -1))); } else if (tok[0] === '`') { parent.appendChild(el('code', '', tok.slice(1, -1))); } else {
        var id = termIdFor(tok.slice(1, -1));
        if (id) { parent.appendChild(chip({ cite: 'Term', detail: ctx.byId[id].term, id: id })); } else { parent.appendChild(document.createTextNode(tok)); }
      }
      last = re.lastIndex;
    }
    if (last < s.length) { parent.appendChild(document.createTextNode(s.slice(last))); }
  }
  function termIdFor(name) {
    var n = String(name).toLowerCase().trim();
    var hit = null;
    Object.keys(ctx.byId).some(function (id) { var t = ctx.byId[id]; if (t.term.toLowerCase() === n || id === n.replace(/\s+/g, '-') || (t.synonyms || []).some(function (s) { return s.toLowerCase() === n; })) { hit = id; return true; } return false; });
    return hit;
  }

  // A chip names what the answer used: a card part (glows on the card), a source (opens it), a related term (shows it)
  function chip(part) {
    var t = term();
    if (/^S\d+$/.test(part.cite)) {
      var src = window.AskPrompt.sourceList(t, ctx)[Number(part.cite.slice(1)) - 1];
      if (!src) { return el('span', 'ask-chip', part.cite); }
      var a = el('a', 'ask-chip src', part.cite);
      a.href = src.url; a.target = '_blank'; a.rel = 'noopener';
      a.title = src.title + (src.publisher ? ' · ' + src.publisher : '');
      return a;
    }
    if ((part.cite === 'Related' || part.cite === 'Term') && part.detail) {
      var id = part.id || termIdFor(part.detail);
      if (id && id !== t.term_id) { return actChip('ask-chip rel', ctx.byId[id].term, 'show', id, 'Show ' + ctx.byId[id].term + ' in the glossary'); }
      if (id === t.term_id) { return actChip('ask-chip card', 'Card', 'glow', 'Meaning', 'Show the card\'s Meaning'); }
    }
    var label = part.cite === 'Card' ? 'Card' : part.cite;
    return actChip('ask-chip card', label, 'glow', part.cite, 'Show the card\'s ' + label);
  }
  function actChip(cls, label, kind, arg, title) { var b = button(cls, label, null, title); b.setAttribute('data-act', kind); b.setAttribute('data-arg', arg); return b; }
  function act(c) { var arg = c.getAttribute('data-arg'); if (c.getAttribute('data-act') === 'show') { showCard(arg); } else { glow(arg); } }

  // Glow the part of the card the answer used, so you can check it against the vetted text
  function glow(section) {
    var card = document.getElementById(S.term);
    if (!card) { return; }
    var target = null;
    if (section === 'Domains') { target = card.querySelector('.gl-polysemy'); } else if (section === 'Also known as') { target = card.querySelector('.gl-aka'); } else if (section === 'Meaning' || section === 'Card') { target = card.querySelector('.gl-plain'); } else {
      Array.prototype.some.call(card.querySelectorAll('.gl-lbl'), function (l) { if (l.textContent.trim().toLowerCase().indexOf(section.toLowerCase()) === 0) { target = l.nextElementSibling; return true; } return false; });
    }
    target = target || card;
    bring(target, 'center');
    target.classList.remove('ask-glow');
    void target.offsetWidth;
    target.classList.add('ask-glow');
  }
  function showCard(id) {
    var c = document.getElementById(id);
    if (!c) { return; }
    c.hidden = false;
    bring(c, 'start');
    c.classList.remove('gl-flash');
    void c.offsetWidth;
    c.classList.add('gl-flash');
  }

  function metaLine(x, last) {
    var m = el('div', 'ask-meta');
    var bits = [x.model];
    if (x.meta) { bits.push(secs(x.meta.totalMs)); if (x.meta.tps) { bits.push(Math.round(x.meta.tps) + ' tokens/s'); } }
    bits.push('card v' + (x.card || ctx.version));
    if (x.stopped) { bits.push('stopped'); }
    m.appendChild(el('span', '', bits.join(' · ')));
    var acts = el('span', 'ask-acts');
    acts.appendChild(button('ask-link-btn', 'Copy', function (e) { copy(window.AskPrompt.strip(x.a), e.target, 'Copied'); }));
    if (last && !busy()) { acts.appendChild(button('ask-link-btn ask-again', 'Ask again', function () { retry(x); })); }
    m.appendChild(acts);
    return m;
  }
  function errorBox(x) {
    var e = el('div', 'ask-err');
    e.appendChild(el('div', 'ask-err-t', 'That answer did not arrive'));
    e.appendChild(el('div', 'ask-err-p', x.error));
    e.appendChild(button('ask-btn pri', 'Try again', function () { connect(true).then(function () { if (ready()) { retry(x); } }); }));
    return e;
  }
  // Ask the same question again: that turn and its question leave the conversation first, wherever they are
  function retry(x) {
    if (busy()) { return; }
    var i = S.turns.indexOf(x);
    if (i !== -1) { S.turns.splice(i, 1); }
    [x.qnode, x.node].forEach(function (n) { if (n && n.parentNode) { n.parentNode.removeChild(n); } });
    persist(S.term, S.turns);
    ask(x.q);
  }

  // ── ASKING ──
  function submit() { var q = D.input.value.trim(); if (!q) { D.input.focus(); return; } D.input.value = ''; grow(); ask(q); }

  function ask(question) {
    if (busy() || !ready()) { return; }
    var t = term();
    var termId = S.term;
    var turns = S.turns;
    var history = turns.filter(done).slice(-MAX_TURNS_SENT).map(function (x) { return { q: x.q, a: x.a }; });
    var x = { q: question, a: '', model: S.model, at: new Date().toISOString(), card: ctx.version, t0: performance.now(), live: true };
    if (!turns.length) { D.conv.innerHTML = ''; }
    if (turns.length && turns[turns.length - 1].restored) { D.conv.appendChild(el('div', 'ask-div', 'Now')); }
    Array.prototype.forEach.call(D.conv.querySelectorAll('.ask-follow, .ask-again'), function (f) { f.parentNode.removeChild(f); });
    turns.push(x);
    x.qnode = el('div', 'ask-q', question);
    x.node = el('div', 'ask-a');
    D.conv.appendChild(x.qnode);
    D.conv.appendChild(x.node);
    var run = window.AskLink.chat({ model: S.model, messages: window.AskPrompt.messages(t, ctx, history, question), options: OPTIONS }, function (piece) {
      var first = !x.a;
      x.a += piece;
      if (x.run !== S.run) { return; }
      if (first) { S.warm[x.model] = true; }
      redraw(x);
    });
    x.run = { stop: run.stop };
    S.run = x.run;
    setModelChip();
    syncControls();
    drawAnswer(x, true);
    D.conv.scrollTop = D.conv.scrollHeight;
    run.promise.then(function (r) { x.meta = r; x.stopped = r.stopped; if (!x.a) { x.error = r.stopped ? 'Stopped before the first word.' : 'The model returned no text.'; } }, function (e) { x.error = e && e.message ? e.message : String(e); }).then(function () {
      x.live = false;
      persist(termId, turns);
      if (x.run !== S.run) { return; }
      S.run = null;
      var stick = nearBottom();
      drawAnswer(x, true);
      setModelChip();
      syncControls();
      if (stick) { D.conv.scrollTop = D.conv.scrollHeight; }
      if (isOpen() && !x.error) { D.input.focus({ preventScroll: true }); }
    });
  }

  // Redraws are batched to one per frame, so a fast model does not flood the page; the view follows the newest words
  // only when the reader was already at the bottom (measured before the answer grows)
  function redraw(x) {
    if (redraw.pending) { return; }
    redraw.pending = true;
    requestAnimationFrame(function () { redraw.pending = false; if (x.run !== S.run) { return; } var stick = nearBottom(); drawAnswer(x, true); if (stick) { D.conv.scrollTop = D.conv.scrollHeight; } });
  }
  function nearBottom() { var c = D.conv; return c.scrollHeight - c.scrollTop - c.clientHeight < 140; }

  // ── TAKEAWAY (S4): three lessons, edited by you, saved to the card's My notes ──
  function takeaway() {
    if (busy() || !ready()) { return; }
    var t = term();
    var termId = S.term;
    var model = S.model;
    var turns = S.turns.filter(done);
    if (!turns.length) { return; }
    var box = el('div', 'ask-take-box');
    box.appendChild(el('div', 'ask-take-h', 'Takeaway · draft'));
    var body = el('div', 'ask-take-b');
    body.innerHTML = '<div class="ask-think"><span class="ask-dots"><i></i><i></i><i></i></span><span class="ask-tt">Distilling ' + turns.length + (turns.length === 1 ? ' answer' : ' answers') + ' into three notes</span></div>';
    box.appendChild(body);
    D.conv.appendChild(box);
    D.conv.scrollTop = D.conv.scrollHeight;
    var text = '';
    var run = window.AskLink.chat({ model: model, messages: window.AskPrompt.takeaway(t, ctx, turns), options: TAKE_OPTIONS }, function (piece) { text += piece; });
    var mine = { stop: run.stop };
    S.run = mine;
    setModelChip();
    syncControls();
    run.promise.then(function (r) { return { r: r }; }, function (e) { return { e: e }; }).then(function (o) {
      if (mine !== S.run) { return; }
      S.run = null;
      var stick = nearBottom();
      body.innerHTML = '';
      var items = text.split('\n').map(function (l) { var m = l.match(/^\s*(?:[-*•]|\d+[.)])\s*(.+?)\s*$/); return m ? m[1].replace(/\*\*/g, '').replace(/\*([^*]+)\*/g, '$1').trim() : null; }).filter(Boolean).slice(0, 3);
      if (o.e || (o.r && o.r.stopped) || !items.length) {
        var why = o.e ? 'The takeaway did not arrive: ' + (o.e.message || o.e) : (o.r.stopped ? 'Stopped. No draft was kept, since the last line was cut off.' : 'The model did not return any notes.');
        body.appendChild(el('div', 'ask-err-p', why));
        var row = el('div', 'ask-take-a');
        row.appendChild(button('ask-btn pri', 'Try again', function () { box.parentNode.removeChild(box); takeaway(); }));
        row.appendChild(button('ask-btn', 'Dismiss', function () { box.parentNode.removeChild(box); }));
        body.appendChild(row);
      } else {
        drawTakeaway(box, body, items, turns.length, termId, model);
      }
      setModelChip();
      syncControls();
      if (stick) { D.conv.scrollTop = D.conv.scrollHeight; }
    });
  }

  function drawTakeaway(box, body, items, n, termId, model) {
    var ul = el('ul', 'ask-take-l');
    items.forEach(function (it) { var li = el('li', '', it); li.contentEditable = 'true'; li.spellcheck = true; ul.appendChild(li); });
    body.appendChild(ul);
    var hint = el('div', 'ask-take-n', 'Edit any line before saving: these become your notes on the card.');
    body.appendChild(hint);
    var acts = el('div', 'ask-take-a');
    acts.appendChild(button('ask-btn gold', 'Save to My notes', function () {
      var final = Array.prototype.map.call(ul.querySelectorAll('li'), function (li) { return li.textContent.trim(); }).filter(Boolean);
      if (!final.length) { return; }
      var note = { items: final, at: new Date().toISOString(), model: model, questions: n, card: ctx.version };
      var list = notesFor(termId);
      list.push(note);
      if (!setNotes(termId, list)) { hint.textContent = 'Could not save: this browser\'s storage is full or blocked. Your draft is still here; Copy keeps it safe.'; hint.classList.add('bad'); return; }
      var card = document.getElementById(termId);
      var wrap = card ? renderNotes(card, ctx.byId[termId]) : null;
      box.classList.add('saved');
      box.querySelector('.ask-take-h').textContent = 'Takeaway · saved to My notes';
      body.innerHTML = '';
      var ul2 = el('ul', 'ask-take-l');
      final.forEach(function (it) { ul2.appendChild(el('li', '', it)); });
      body.appendChild(ul2);
      var row = el('div', 'ask-take-a');
      row.appendChild(button('ask-link-btn', 'See it on the card', function () { if (wrap && wrap.isConnected) { bring(wrap, 'center'); wrap.classList.remove('ask-glow'); void wrap.offsetWidth; wrap.classList.add('ask-glow'); } }));
      row.appendChild(button('ask-link-btn', 'Copy for Journal', function (e) { copy(journalText(ctx.byId[termId], note), e.target, 'Copied'); }));
      body.appendChild(row);
      if (wrap) { wrap.classList.add('ask-glow'); }
    }));
    acts.appendChild(button('ask-btn', 'Copy', function (e) { copy(Array.prototype.map.call(ul.querySelectorAll('li'), function (li) { return '- ' + li.textContent.trim(); }).join('\n'), e.target, 'Copied'); }));
    acts.appendChild(button('ask-btn', 'Discard', function () { box.parentNode.removeChild(box); }));
    body.appendChild(acts);
  }

  // ── WIRING: glossary.js hands over its data, then calls decorate() for each card ──
  function init(c) { ctx = c; NOTES = load(KEYS.notes) || {}; }

  function hasNotes(id) { return !!(NOTES[id] && NOTES[id].length); }

  window.GlossaryAsk = { version: '1.0.0', init: init, decorate: decorate, open: open, close: close, hasNotes: hasNotes };
})();