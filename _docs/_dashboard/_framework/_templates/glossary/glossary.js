// ===============================================================
// @file: glossary.js
// @filepath: dashboard_engine/_framework/_templates/glossary/glossary.js
// @version: 1.0.0
// @updated: 2026-11-13 05:16:26 PM CST
// @author: Greg Paskal & Claude
// @company: MissionWares®
// @description: The Glossary page type's behavior: ONE renderer draws every term from window.DASH_GLOSSARY (the
//   project's glossary/glossary.json in the Lexicon Codex curriculum shape, wrapped by the type's glossary-export.js),
//   search filters as you type, the topic filter narrows the terms to one or more areas of knowledge, and every term
//   carries its term_id as an anchor so glossary.html#kv-cache opens straight to it. Schema 1.3 to 1.6 terms (this
//   folder's GLOSSARY-SCHEMA.md) also show their etymology, a Risk at a glance gradient and their meanings by domain,
//   redrawn when the speaking domain changes. Data never carries presentation: domain colors, band widths and motion
//   live in THEME below and in the viewer's Glossary settings, remembered per browser under the project's own key.
//   A STAMPED file: changed only at the engine home.
// @tags: dashboard, glossary, lexicon, search, topics, polysemy, risk-at-a-glance, page-type
// @changeLog:
// Date        Author         Version        Description
// ----------  -------------  -------------  --------------------------
// 2026-11-13  Greg & Claude  1.0.0          The Glossary page type, harvested from Project-AI-Local glossary.js 2.4.1 (Greg: add the Glossary to our templates; one per project, filters across areas of knowledge): renderer unchanged; NEW the topic filter, pills that pick one or more topics, remembered; window.DASH_GLOSSARY in place of AI_GLOSSARY; domain colors from a palette in domain order, so no project's domains are baked in; storage keys from DASH_PROJECT; the lab note titled In practice; the ? link and the tips name the User Guide only when the project has one; risk classes carry the gl- prefix; GL_TEMPLATE_VERSION announced
// ===============================================================
(function () {
  'use strict';
  var VERSION = '1.0.0';
  // The page type announces itself, like the engine does: type GL_TEMPLATE_VERSION in the console. Must equal @version above.
  window.GL_TEMPLATE_VERSION = VERSION;
  var P = window.DASH_PROJECT || 'dashboard';

  // ── THEME: presentation only (GLOSSARY-SCHEMA.md section 9). Cyan is reserved for "ours". ──
  var THEME = {
    // Domain colors in the order the data lists its domains (GLOSSARY-SCHEMA.md section 9); a viewer can change any in Glossary settings
    palette: ['#ffffff', '#d2a8ff', '#58a6ff', '#f778ba', '#9aa5b5', '#ffa657', '#7ee787'],
    fallbackColor: '#D7DEEA',
    fill: 0.22, fillActive: 0.40,
    driftWidth: [1.4, 4, 8, 13],
    motion: { duration: 700, stagger: 35, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
  };
  var LEVEL = ['ours', 'unlikely', 'possible', 'likely', 'very likely'];
  // Every dashboard served by AiAssist shares one origin (localhost:8765), so the key names the project
  var STORE = P + '.glossary.settings.v1';

  // ── SETTINGS: per viewer, per browser; storage can be missing or refuse, so every touch is guarded ──
  function loadSettings() { try { return JSON.parse(window.localStorage.getItem(STORE)) || {}; } catch (e) { return {}; } }
  function saveSettings(s) { try { window.localStorage.setItem(STORE, JSON.stringify(s)); } catch (e) { /* not remembered; the page still works */ } }
  var settings = loadSettings();
  function colorOf(id) { return (settings.colors && settings.colors[id]) || paletteColor(id) || THEME.fallbackColor; }
  function paletteColor(id) { var i = LD ? LD.domains.map(function (d) { return d.id; }).indexOf(id) : -1; return i === -1 ? null : THEME.palette[i % THEME.palette.length]; }
  function motionOn() {
    var m = settings.motion || 'system';
    if (m === 'off') { return false; }
    if (m === 'on') { return true; }
    return !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) { e.className = cls; }
    if (text) { e.textContent = text; }
    return e;
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  // Etymology text marks a root or foreign word with *asterisks*; the renderer decides how it looks
  function rootWords(s) { return esc(s).replace(/\*([^*]+)\*/g, '<i>$1</i>'); }
  function rgba(hex, a) { var n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }

  // ── DERIVED (GLOSSARY-SCHEMA.md section 8): computed here, never stored ──
  var LD = null;
  function domainName(id) { var d = LD.domains.filter(function (x) { return x.id === id; })[0]; return d ? d.name : id; }
  function wt(m, d) { return (m.weights && m.weights[d]) || 0; }
  function speaker(t, active) { return (active === LD.default && t.polysemy.home_domain) ? t.polysemy.home_domain : active; }
  function oursIndex(t, active) {
    var ms = t.polysemy.meanings;
    var col = speaker(t, active);
    var best = 0;
    ms.forEach(function (m, i) { if (m.official) { best = i; } });
    ms.forEach(function (m, i) { if (wt(m, col) > wt(ms[best], col)) { best = i; } });
    return best;
  }
  function meaningText(t, m) { return m.official ? t.definitions.official.text : m.text; }
  function drift(t, d) { var x = t.polysemy.drift && t.polysemy.drift[d]; return x ? x : { level: 0, reason: '' }; }
  function risk(t, oi, d) {
    var away = 0;
    t.polysemy.meanings.forEach(function (m, i) { if (i !== oi && wt(m, d) > away) { away = wt(m, d); } });
    return Math.max(0, Math.min(4, 2 + away - wt(t.polysemy.meanings[oi], d) + drift(t, d).level / 2));
  }

  // ── RISK AT A GLANCE: one band per domain, place from risk, width from drift ──
  // Every domain's risk, drift, heard meaning and place on the bar, left (understood) to right (misread).
  // The bar and the Meanings by domain table both read from this, so they can never disagree.
  function domainSpots(t, oi, active) {
    var own = speaker(t, active);
    var spots = LD.domains.map(function (d) { return { id: d.id, name: d.name, r: risk(t, oi, d.id), dr: drift(t, d.id), act: d.id === own, hears: hears(t, oi, d.id) }; });
    var byLevel = {};
    spots.forEach(function (p) { (byLevel[p.r] = byLevel[p.r] || []).push(p); });
    Object.keys(byLevel).forEach(function (l) { byLevel[l].forEach(function (p, k) { var base = 5 + Number(l) * 22.5; var pos = (Number(l) >= 3) ? base - k * 11 : base + k * 11; p.pos = Math.max(4, Math.min(95, pos)); }); });
    spots.sort(function (x, y) { return x.pos - y.pos; });
    // Bands sit where the analysis puts them; overlap is allowed when the evidence leans that way. Only the bar's ends
    // hold a band in, so none is cut off.
    spots.forEach(function (p) { p.w = THEME.driftWidth[p.dr.level]; p.left = Math.max(0, Math.min(100 - p.w, p.pos - p.w / 2)); });
    return spots;
  }

  // Other meanings: not ours and not any domain's first reading. Each carries the domains that hear it at all.
  function otherMeanings(t, oi, spots) {
    var heard = {};
    spots.forEach(function (p) { heard[p.hears] = true; });
    return t.polysemy.meanings.map(function (m, i) { return { m: m, i: i }; }).filter(function (x) { return x.i !== oi && !heard[x.i]; }).map(function (x) {
      var by = LD.domains.filter(function (d) { return wt(x.m, d.id) > 0; }).map(function (d) { return d.name; });
      return { m: x.m, by: by };
    });
  }

  function gradient(t, oi, active, inside) {
    var own = speaker(t, active);
    var ours = t.polysemy.meanings[oi];
    var home = (own !== active) ? ' <span class="gl-home">(home domain ' + esc(domainName(own)) + ')</span>' : '';
    var spots = domainSpots(t, oi, active);
    var bands = spots.map(function (p, n) {
      var w = p.w;
      var c = colorOf(p.id);
      var left = p.left;
      var heard = t.polysemy.meanings[p.hears];
      var why = '<em class="gl-why">Hears: <b>' + esc(heard.name) + '</b>' + (p.hears === oi ? ' (ours)' : '') + '<br>Risk: ' + LEVEL[Math.round(p.r)] + (p.dr.reason ? '<br>' + esc(p.dr.reason) : '') + '</em>';
      return '<div class="gl-band d' + p.dr.level + ' ' + (n % 2 ? 'up' : 'down') + (p.act ? ' act' : '') + (p.pos > 60 ? ' nr' : '') + '" tabindex="0" data-k="' + esc(t.term_id + '|' + p.id) + '" data-n="' + n + '" style="--c:' + c + '; --fill:' + rgba(c, THEME.fill) + '; --fillAct:' + rgba(c, THEME.fillActive) + '; left:' + left + '%; width:' + w + '%"><span>' + p.name.split(' ').map(esc).join('<br>') + why + '</span></div>';
    }).join('');
    var info = '<div class="gl-info">How likely each domain misreads <i>' + esc(t.term) + '</i> when you mean <b>' + esc(ours.name) + '</b>' + home + '.<br>Left is understood as ours, right is misread. Bar width is drift: how much a domain disagrees with itself. Hover or tap a band for the meaning it hears.<br>' + honesty(t) + '</div>';
    var others = otherMeanings(t, oi, spots);
    var marker = '';
    if (settings.showOthers && others.length) {
      marker = '<div class="gl-other" tabindex="0"><span>+' + others.length + ' other</span><em class="gl-why">Meanings none of these domains hears first:<br>' + others.map(function (o) { return '<b>' + esc(o.m.name) + '</b>' + (o.by.length ? ' (' + esc(o.by.join(', ')) + ')' : ''); }).join('<br>') + '</em></div>';
    }
    return '<div class="gl-gcard"><div class="gl-ghead"><div class="gl-lbl gl-gtitle" tabindex="0">Domain risk at a glance' + info + '</div>' + marker + '</div><div class="gl-scale">' + bands + '</div>' + (inside || '') + '</div>';
  }

  // The meaning a domain most likely hears; on a tie, ours
  function hears(t, oi, d) {
    var best = oi;
    t.polysemy.meanings.forEach(function (m, i) { if (wt(m, d) > wt(t.polysemy.meanings[best], d)) { best = i; } });
    return best;
  }
  function honesty(t) { var j = t.polysemy.judgment || {}; return j.measured ? 'Measured.' : 'Weights and drift are ' + esc(j.by || 'a') + '\'s judgment, not measured' + (j.reviewed_by ? ', reviewed by ' + esc(j.reviewed_by) : ', not yet reviewed') + '.'; }

  // Meanings by domain: one row per domain. The domain that owns ours comes first, then the rest from riskiest to least,
  // the bar read right to left. Each row shows the meaning that domain hears and its risk, the same numbers as its band.
  function meaningsTable(t, oi, active) {
    var spots = domainSpots(t, oi, active);
    var first = spots.filter(function (p) { return p.act; });
    var rest = spots.filter(function (p) { return !p.act; }).reverse();
    var rows = first.concat(rest).map(function (p) {
      var m = t.polysemy.meanings[p.hears];
      var r = p.act ? 0 : Math.round(p.r);
      var label = p.act ? 'ours' : LEVEL[r];
      var who = (p.act && p.id !== active) ? p.name + ' (home), used in ' + domainName(active) : p.name;
      var tag = (!p.act && p.hears === oi) ? ' <span class="gl-src">(ours)</span>' : '';
      return '<tr' + (p.act ? ' class="ourrow"' : '') + '><td class="dom">' + esc(who) + '</td><td class="vb"><div class="gl-k' + r + '"></div></td><td class="mn"><b>' + esc(m.name) + '</b>' + tag + '<small>' + esc(meaningText(t, m)) + '</small></td><td class="rk gl-t' + r + '">' + label + '</td></tr>';
    }).join('');
    var others = otherMeanings(t, oi, spots);
    if (others.length) {
      rows += '<tr class="gl-otherrow"><td class="dom">Other meanings</td><td class="vb"><div class="gl-kx"></div></td><td class="mn">' + others.map(function (o) { return '<div><b>' + esc(o.m.name) + '</b><small>' + esc(meaningText(t, o.m)) + (o.by.length ? ' Heard by ' + esc(o.by.join(', ')) + ', never first.' : '') + '</small></div>'; }).join('') + '</td><td class="rk"></td></tr>';
    }
    return '<table class="gl-dt"><tr><th>Domain</th><th></th><th>Hears</th><th class="r">Risk of being<br>misinterpreted</th></tr>' + rows + '</table>';
  }

  function polysemyHtml(t, active) {
    var oi = oursIndex(t, active);
    var open = !!(settings.open && settings.open[t.term_id]);
    return gradient(t, oi, active, '<button type="button" class="gl-more' + (open ? ' open' : '') + '" data-t="' + esc(t.term_id) + '" aria-expanded="' + open + '"><span class="gl-caret">&#9656;</span> Meanings by domain</button><div class="gl-mtable"' + (open ? '' : ' hidden') + '>' + meaningsTable(t, oi, active) + '<div class="gl-honest">' + honesty(t) + '</div></div>');
  }

  function renderTerm(t, byId) {
    var card = el('article', 'gl-term');
    card.id = t.term_id;
    // The term's topic (schema 1.5): a quiet line above the title that opens the Index at that topic
    var tp = TOPIC_OF[t.term_id];
    if (tp) { var tk = el('a', 'gl-tkick', String(tp.n).padStart(2, '0') + ' · ' + tp.t.name); tk.href = '#topic-' + tp.t.id; tk.setAttribute('data-topic', tp.t.id); tk.title = 'Show this topic in the Index'; card.appendChild(tk); }
    var head = el('div', 'gl-head');
    head.appendChild(el('h3', '', t.term));
    if (t.abbreviation) { head.appendChild(el('span', 'gl-abbr', t.abbreviation)); }
    if (t.polysemy) { head.appendChild(el('span', 'gl-poly', t.polysemy.meanings.length + ' MEANINGS')); }
    var link = el('a', 'gl-anchor', '#' + t.term_id);
    link.href = '#' + t.term_id;
    head.appendChild(link);
    card.appendChild(head);
    // Also known as: the Codex synonyms field, the names a search for the term may use instead
    if (t.synonyms && t.synonyms.length) { var aka = el('div', 'gl-aka'); aka.appendChild(el('span', 'gl-akalbl', 'Also known as ')); aka.appendChild(document.createTextNode(t.synonyms.join(' · '))); card.appendChild(aka); }
    var needsReview = t.review && t.review.status === 'needs-review';
    if (needsReview) {
      head.insertBefore(el('span', 'gl-rev', 'NEEDS REVIEW'), link);
      card.appendChild(el('div', 'gl-lbl', 'Review'));
      var rv = el('ul', 'gl-flags');
      t.review.flags.forEach(function (f) { var li = el('li', ''); li.appendChild(el('b', '', f.code)); li.appendChild(document.createTextNode(' ' + f.reason + ' ')); li.appendChild(el('span', 'gl-src', '(' + f.field + ')')); rv.appendChild(li); });
      card.appendChild(rv);
    }
    // Every section reads the same way: a small title on its own line, then its text (Meaning, Analogy, Etymology)
    var lay = t.definitions.layman.universal;
    card.appendChild(el('div', 'gl-lbl', 'Meaning'));
    card.appendChild(el('p', 'gl-plain', lay[0]));
    var off = el('p', 'gl-official', t.definitions.official.text);
    off.appendChild(el('span', 'gl-src', ' · ' + t.definitions.official.source_id));
    card.appendChild(off);
    card.appendChild(el('div', 'gl-lbl', 'Analogy'));
    card.appendChild(el('p', 'gl-analogy', lay[1]));
    // In practice: what the project measured or worked through for the term (Codex tribal_knowledge.real_world_note)
    var lab = t.tribal_knowledge && t.tribal_knowledge.real_world_note;
    if (lab) { card.appendChild(el('div', 'gl-lbl', 'In practice')); card.appendChild(el('p', 'gl-lab', lab)); }
    // Picture (schema 1.5): a drawing where a picture explains faster than words; a click opens it large
    if (t.illustration) {
      card.appendChild(el('div', 'gl-lbl', 'Picture'));
      var fig = el('figure', 'gl-fig');
      var img = el('img', '');
      img.src = t.illustration.file;
      img.alt = t.illustration.alt;
      img.loading = 'lazy';
      img.decoding = 'async';
      var zoomBtn = el('button', 'gl-fig-btn');
      zoomBtn.type = 'button';
      zoomBtn.title = 'Open the picture large';
      zoomBtn.appendChild(img);
      zoomBtn.addEventListener('click', function () { lightbox(t); });
      fig.appendChild(zoomBtn);
      if (t.illustration.caption) { fig.appendChild(el('figcaption', '', t.illustration.caption)); }
      card.appendChild(fig);
    }
    if (t.etymology) {
      card.appendChild(el('div', 'gl-lbl', 'Etymology'));
      var ety = el('p', 'gl-ety');
      ety.innerHTML = rootWords(t.etymology.text) + ' <span class="gl-src">· ' + esc(t.etymology.source_id || '') + (t.etymology.confidence !== 'established' ? ' · ' + esc(t.etymology.confidence) : '') + '</span>';
      card.appendChild(ety);
    }
    if (t.polysemy && LD) { card.appendChild(el('div', 'gl-polysemy')); }
    if (t.relationships && t.relationships.length) {
      card.appendChild(el('div', 'gl-lbl', 'Related'));
      var rel = el('div', 'gl-rel');
      t.relationships.forEach(function (r) {
        // The title says related; a chip names its type only when it says more (contrast, part-of, parent, ...)
        var a = el('a', 'gl-chip', (byId[r.term_id] ? byId[r.term_id].term : r.term_id));
        if (r.type !== 'related') { a.appendChild(el('span', 'gl-src', ' · ' + r.type)); }
        a.href = '#' + r.term_id;
        a.title = r.description || '';
        rel.appendChild(a);
      });
      card.appendChild(rel);
    }
    // Standards: the outside catalog entries this term covers (OWASP AI Testing Guide tests, OWASP Top 10 ids)
    if (t.catalog_refs && t.catalog_refs.length) {
      card.appendChild(el('div', 'gl-lbl', 'Standards'));
      var st = el('div', 'gl-rel');
      t.catalog_refs.forEach(function (r) {
        var c = CATALOGS[r.catalog];
        var e = c && c.byId[r.id];
        var a = el('a', 'gl-chip gl-std', r.id);
        a.title = (c ? c.c.name : r.catalog) + (e ? ': ' + e.title : '');
        if (e && e.url) { a.href = e.url; a.target = '_blank'; a.rel = 'noopener'; }
        st.appendChild(a);
      });
      card.appendChild(st);
    }
    // Coverage: on a catalog's own term, every entry of the catalog and the glossary term that covers it
    Object.keys(CATALOGS).forEach(function (cid) {
      var k = CATALOGS[cid];
      if (k.c.term_id !== t.term_id) { return; }
      var have = k.c.entries.filter(function (e) { return k.cover[e.id]; }).length;
      card.appendChild(el('div', 'gl-lbl', 'Coverage · ' + have + ' of ' + k.c.entries.length + ' in this glossary'));
      var tb = el('table', 'gl-dt gl-cov');
      tb.innerHTML = '<thead><tr><th>Id</th><th>' + esc(k.c.entry_label || 'Entry') + '</th><th>Term</th></tr></thead>';
      var body = el('tbody', '');
      k.c.entries.forEach(function (e) {
        var tr = el('tr', '');
        var td1 = el('td', 'gl-covid');
        if (e.url) { var a1 = el('a', 'gl-srclink', e.id); a1.href = e.url; a1.target = '_blank'; a1.rel = 'noopener'; td1.appendChild(a1); } else { td1.textContent = e.id; }
        tr.appendChild(td1);
        tr.appendChild(el('td', '', e.title));
        var td3 = el('td', '');
        (k.cover[e.id] || []).forEach(function (id) { var a2 = el('a', 'gl-chip', byId[id] ? byId[id].term : id); a2.href = '#' + id; td3.appendChild(a2); });
        if (!k.cover[e.id]) { td3.appendChild(el('span', 'gl-src', 'not in this glossary')); }
        tr.appendChild(td3);
        body.appendChild(tr);
      });
      tb.appendChild(body);
      card.appendChild(tb);
    });
    var srcIds = [];
    (t.references || []).forEach(function (r) { if (srcIds.indexOf(r.source_id) === -1) { srcIds.push(r.source_id); } });
    var srcs = srcIds.map(function (id) { return SOURCES[id]; }).filter(function (x) { return x && x.url; });
    if (srcs.length) {
      card.appendChild(el('div', 'gl-lbl', 'Sources'));
      var sl = el('div', 'gl-sources');
      srcs.forEach(function (x) { var a = el('a', 'gl-srclink', x.title); a.href = x.url; a.target = '_blank'; a.rel = 'noopener'; a.title = x.url; if (x.publisher) { a.appendChild(el('span', 'gl-src', ' · ' + x.publisher)); } sl.appendChild(a); });
      card.appendChild(sl);
    }
    if (t.vetting) { card.appendChild(el('div', 'gl-vetted', 'Vetted ' + t.vetting.date + ' · procedure ' + t.vetting.procedure + (t.vetting.checked ? ' · independently checked' : '') + (t.review && t.review.decided_by ? ' · review decided by ' + t.review.decided_by : ''))); }
    if (window.GlossaryAsk) { window.GlossaryAsk.decorate(card, t); }
    card.glReview = !!needsReview;
    // Search looks at two things only: the term itself, then its meanings
    card.glName = [t.term, t.term_id.replace(/-/g, ' '), t.abbreviation || ''].concat(t.synonyms || []).concat((t.catalog_refs || []).map(function (r) { return r.id; })).join(' | ').toLowerCase();
    card.glMeaning = [lay[0], t.definitions.official.text].concat(t.polysemy ? t.polysemy.meanings.map(function (m) { return m.name + ' ' + (m.text || ''); }) : []).join(' ').toLowerCase();
    card.glTerm = t.term.toLowerCase();
    return card;
  }

  // ── DOMAIN SWITCH: redraw every polysemy block, then glide each band from where it was ──
  var termsById = {};
  var SOURCES = {};
  var CATALOGS = {};
  function drawDomain(active, still) {
    var before = {};
    Array.prototype.forEach.call(document.querySelectorAll('.gl-band'), function (b) { before[b.getAttribute('data-k')] = { left: b.style.left, width: b.style.width, side: b.classList.contains('up') ? 'up' : 'down' }; });
    Array.prototype.forEach.call(document.querySelectorAll('.gl-polysemy'), function (box) { box.innerHTML = polysemyHtml(termsById[box.parentNode.id], active); });
    var bar = document.getElementById('gl-domains');
    if (bar) { bar.innerHTML = '<a class="gl-lbl gl-inline gl-domlink" href="#domain" title="The domain you are speaking in. Click for the glossary term.">Domain</a>' + LD.domains.map(function (d) { return '<button type="button" class="gl-dom' + (d.id === active ? ' on' : '') + '" data-d="' + esc(d.id) + '" style="--c:' + colorOf(d.id) + '"><span class="dot"></span>' + esc(d.name) + '</button>'; }).join('') + '<button type="button" class="gl-gear" id="gl-gear" title="Glossary settings" aria-label="Glossary settings">&#9881;</button>'; }
    if (!still) { glide(before); }
    if (glowQuery) { reglow(); }
  }
  function glide(before) {
    if (!motionOn() || !Object.keys(before).length) { return; }
    var bands = Array.prototype.slice.call(document.querySelectorAll('.gl-band'));
    var target = bands.map(function (b) { return { left: b.style.left, width: b.style.width, side: b.classList.contains('up') ? 'up' : 'down' }; });
    bands.forEach(function (b) { var o = before[b.getAttribute('data-k')]; if (!o) { return; } b.style.transition = 'none'; b.firstChild.style.transition = 'none'; b.style.left = o.left; b.style.width = o.width; b.classList.remove('up', 'down'); b.classList.add(o.side); });
    void document.body.offsetWidth;
    bands.forEach(function (b, i) { var tr = THEME.motion.duration + 'ms ' + THEME.motion.easing + ' ' + (Number(b.getAttribute('data-n')) * THEME.motion.stagger) + 'ms'; b.style.transition = 'left ' + tr + ', width ' + tr + ', background-color ' + tr; b.firstChild.style.transition = 'transform ' + tr; b.style.left = target[i].left; b.style.width = target[i].width; b.classList.remove('up', 'down'); b.classList.add(target[i].side); });
  }

  // ── GLOSSARY SETTINGS: motion and domain colors, per viewer ──
  function openSettings() {
    var old = document.getElementById('gl-settings');
    if (old) { old.remove(); return; }
    var p = el('div', 'gl-settings');
    p.id = 'gl-settings';
    var m = settings.motion || 'system';
    p.innerHTML = '<div class="gl-lbl">Glossary settings</div><label>Motion <select id="gl-motion"><option value="system"' + (m === 'system' ? ' selected' : '') + '>Follow system</option><option value="on"' + (m === 'on' ? ' selected' : '') + '>On</option><option value="off"' + (m === 'off' ? ' selected' : '') + '>Off</option></select></label><label><input type="checkbox" id="gl-others"' + (settings.showOthers ? ' checked' : '') + '> Show other meanings on the bar</label><div class="gl-lbl">Domain colors</div>' + LD.domains.map(function (d) { return '<label class="gl-crow"><input type="color" data-d="' + esc(d.id) + '" value="' + colorOf(d.id) + '"> ' + esc(d.name) + '</label>'; }).join('') + '<button type="button" id="gl-reset" class="gl-dom">Reset colors</button><div class="gl-gnote">Remembered in this browser only.</div>';
    document.getElementById('gl-domains').appendChild(p);
    p.querySelector('#gl-motion').addEventListener('change', function (e) { settings.motion = e.target.value; saveSettings(settings); });
    p.querySelector('#gl-others').addEventListener('change', function (e) { settings.showOthers = e.target.checked; saveSettings(settings); repaint(); });
    Array.prototype.forEach.call(p.querySelectorAll('input[type=color]'), function (inp) { inp.addEventListener('input', function () { settings.colors = settings.colors || {}; settings.colors[inp.getAttribute('data-d')] = inp.value; saveSettings(settings); repaint(); }); });
    p.querySelector('#gl-reset').addEventListener('click', function () { delete settings.colors; saveSettings(settings); repaint(); p.remove(); openSettings(); });
  }
  // A color change repaints in place: no motion, settings panel kept open
  function repaint() {
    var keep = document.getElementById('gl-settings');
    drawDomain(settings.domain || LD.default, true);
    if (keep) { document.getElementById('gl-domains').appendChild(keep); }
  }

  // ── SEARCH GLOW: mark every match in a shown card's text, except its title ──
  var glowQuery = '';
  function clearGlow(root) {
    Array.prototype.forEach.call(root.querySelectorAll('mark.gl-hit'), function (m) { var p = m.parentNode; p.replaceChild(document.createTextNode(m.textContent), m); p.normalize(); });
  }
  function glow(card, q) {
    if (!q) { return; }
    var walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT, { acceptNode: function (n) { var p = n.parentNode; if (p.closest('h3, .gl-anchor, mark, script, style')) { return NodeFilter.FILTER_REJECT; } return n.nodeValue.toLowerCase().indexOf(q) !== -1 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP; } });
    var nodes = [];
    while (walker.nextNode()) { nodes.push(walker.currentNode); }
    nodes.forEach(function (n) {
      var text = n.nodeValue;
      var low = text.toLowerCase();
      var frag = document.createDocumentFragment();
      var at = 0;
      var i = low.indexOf(q);
      while (i !== -1) {
        if (i > at) { frag.appendChild(document.createTextNode(text.slice(at, i))); }
        var m = document.createElement('mark');
        m.className = 'gl-hit';
        m.textContent = text.slice(i, i + q.length);
        frag.appendChild(m);
        at = i + q.length;
        i = low.indexOf(q, at);
      }
      if (at < text.length) { frag.appendChild(document.createTextNode(text.slice(at))); }
      n.parentNode.replaceChild(frag, n);
    });
  }
  function reglow() {
    var list = document.getElementById('gl-list');
    if (!list) { return; }
    clearGlow(list);
    Array.prototype.forEach.call(list.querySelectorAll('.gl-term:not([hidden])'), function (c) { glow(c, glowQuery); });
  }

  function jumpToHash() {
    var id = decodeURIComponent((location.hash || '').slice(1));
    var target = id ? document.getElementById(id) : null;
    if (!target || !target.classList.contains('gl-term')) { return; }
    if (settings.view === 'index') { var vb = document.querySelector('#gl-view button[data-v="cards"]'); if (vb) { vb.click(); } }
    target.hidden = false;
    target.scrollIntoView({ block: 'start' });
    target.classList.remove('gl-flash');
    void target.offsetWidth;
    target.classList.add('gl-flash');
  }

  // ── LIGHTBOX: one picture, large, over the page; a click or Esc closes it ──
  function lightbox(t) {
    var lb = el('div', 'gl-lb');
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-label', t.term + ' picture');
    var inner = el('div', 'gl-lb-in');
    inner.appendChild(el('div', 'gl-lb-t', t.term));
    var img = el('img', '');
    img.src = t.illustration.file;
    img.alt = t.illustration.alt;
    inner.appendChild(img);
    if (t.illustration.caption) { inner.appendChild(el('div', 'gl-lb-c', t.illustration.caption)); }
    inner.appendChild(el('div', 'gl-lb-x', 'Click anywhere or press Esc to close'));
    lb.appendChild(inner);
    function shut() { document.removeEventListener('keydown', key); if (lb.parentNode) { lb.parentNode.removeChild(lb); } }
    function key(e) { if (e.key === 'Escape') { e.stopPropagation(); shut(); } }
    lb.addEventListener('click', shut);
    document.addEventListener('keydown', key, true);
    document.body.appendChild(lb);
  }

  // ── INDEX (schema 1.5 topics): every term under its topic, in learning order, one click from its card ──
  var TOPICS = [];
  var TOPIC_OF = {};
  function buildIndex(box, byId, reviewOf) {
    box.innerHTML = '';
    box.appendChild(el('p', 'gl-ix-intro', 'Topics run in a learning order. Click a term to open its card.'));
    var grid = el('div', 'gl-ix-grid');
    TOPICS.forEach(function (tp, n) {
      var sec = el('section', 'gl-ix-topic');
      sec.id = 'topic-' + tp.id;
      var h = el('div', 'gl-ix-h');
      h.appendChild(el('span', 'gl-ix-n', String(n + 1).padStart(2, '0')));
      h.appendChild(el('span', 'gl-ix-name', tp.name));
      h.appendChild(el('span', 'gl-ix-count', String(tp.terms.length)));
      sec.appendChild(h);
      if (tp.description) { sec.appendChild(el('p', 'gl-ix-d', tp.description)); }
      var ul = el('ul', 'gl-ix-l');
      tp.terms.forEach(function (id) {
        var t = byId[id];
        if (!t) { return; }
        var li = el('li', '');
        var a = el('a', 'gl-ix-e');
        a.href = '#' + id;
        a.setAttribute('data-id', id);
        var top = el('span', 'gl-ix-top');
        top.appendChild(el('span', 'gl-ix-term', t.term));
        if (t.abbreviation) { top.appendChild(el('span', 'gl-ix-abbr', t.abbreviation)); }
        if (t.illustration) { var pic = el('span', 'gl-ix-mark pic', 'PICTURE'); pic.title = 'Has a picture'; top.appendChild(pic); }
        if (window.GlossaryAsk && window.GlossaryAsk.hasNotes && window.GlossaryAsk.hasNotes(id)) { var nt = el('span', 'gl-ix-mark notes', 'NOTES'); nt.title = 'You saved notes on this term'; top.appendChild(nt); }
        if (reviewOf(id)) { var rv = el('span', 'gl-ix-mark rev', 'REVIEW'); rv.title = 'Needs your review'; top.appendChild(rv); }
        a.appendChild(top);
        a.appendChild(el('span', 'gl-ix-m', t.definitions.layman.universal[0]));
        li.appendChild(a);
        ul.appendChild(li);
      });
      sec.appendChild(ul);
      grid.appendChild(sec);
    });
    box.appendChild(grid);
  }

  function render() {
    var data = window.DASH_GLOSSARY;
    var list = document.getElementById('gl-list');
    var count = document.getElementById('gl-count');
    var search = document.getElementById('gl-search');
    if (!list) { return; }
    document.body.classList.add('gl-page');
    if (!data || !data.terms) { list.appendChild(el('p', 'gl-empty', 'glossary/glossary-data.js did not load. Build it from glossary/glossary.json: node _docs/_dashboard/_framework/_templates/glossary/glossary-export.js from the repo root.')); return; }
    LD = data.curriculum.listener_domains || null;
    var terms = data.terms.slice().sort(function (a, b) { return a.term.localeCompare(b.term); });
    var byId = {};
    terms.forEach(function (t) { byId[t.term_id] = t; });
    TOPICS = (data.curriculum.topics || []).slice();
    TOPICS.forEach(function (tp, n) { tp.terms.forEach(function (id) { TOPIC_OF[id] = { t: tp, n: n + 1 }; }); });
    termsById = byId;
    (data.sources || []).forEach(function (x) { SOURCES[x.source_id] = x; });
    // Catalogs: index each one's entries and which terms cover them, before any card is drawn
    (data.catalogs || []).forEach(function (c) { var k = { c: c, byId: {}, cover: {} }; c.entries.forEach(function (e) { k.byId[e.id] = e; }); CATALOGS[c.catalog_id] = k; });
    terms.forEach(function (t) { (t.catalog_refs || []).forEach(function (r) { var k = CATALOGS[r.catalog]; if (k) { (k.cover[r.id] = k.cover[r.id] || []).push(t.term_id); } }); });
    // Glossary Ask (glossary-ask.js) gets the same data the cards are drawn from; without it the page works as before
    if (window.GlossaryAsk) { window.GlossaryAsk.init({ byId: byId, sources: SOURCES, catalogs: CATALOGS, domains: LD ? LD.domains : [], version: data.curriculum.version, motionOn: motionOn, title: data.curriculum.name, about: (data.curriculum.ask || {}).about, models: (data.curriculum.ask || {}).models }); }
    var cards = terms.map(function (t) { var c = renderTerm(t, byId); list.appendChild(c); return c; });
    if (LD) {
      var known = LD.domains.some(function (d) { return d.id === settings.domain; });
      if (!known) { settings.domain = LD.default; }
      drawDomain(settings.domain);
      document.getElementById('gl-domains').addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b) { return; }
        if (b.id === 'gl-gear') { openSettings(); return; }
        if (b.id === 'gl-reset' || !b.getAttribute('data-d')) { return; }
        settings.domain = b.getAttribute('data-d');
        saveSettings(settings);
        drawDomain(settings.domain);
      });
    }
    // Rank: 1 the term is the query, 2 the term starts with it, 3 the term's name or synonyms contain it, 4 a meaning contains it.
    // Ties keep alphabetical order. An empty box restores the alphabetical list.
    function rank(c, q) {
      if (c.glTerm === q) { return 1; }
      if (c.glTerm.indexOf(q) === 0) { return 2; }
      if (c.glName.indexOf(q) !== -1) { return 3; }
      if (c.glMeaning.indexOf(q) !== -1) { return 4; }
      return 0;
    }
    var reviewOnly = false;
    var revBtn = document.getElementById('gl-reviewonly');
    var revCount = cards.filter(function (c) { return c.glReview; }).length;
    if (revBtn && revCount) {
      revBtn.hidden = false;
      revBtn.textContent = 'Needs review ' + revCount;
      revBtn.addEventListener('click', function () { reviewOnly = !reviewOnly; revBtn.classList.toggle('on', reviewOnly); show(); });
    }
    // ── TOPIC FILTER (type 1.0.0): pick one or more topics to focus on; none picked shows them all. Remembered per browser ──
    var topicBar = document.getElementById('gl-topics');
    var picked = {};
    (settings.topics || []).forEach(function (id) { if (TOPICS.some(function (tp) { return tp.id === id; })) { picked[id] = true; } });
    function pickedCount() { return Object.keys(picked).length; }
    function inTopics(c) { return !pickedCount() || !!(TOPIC_OF[c.id] && picked[TOPIC_OF[c.id].t.id]); }
    function drawTopics() {
      if (!topicBar || TOPICS.length < 2) { return; }
      topicBar.hidden = false;
      topicBar.innerHTML = '';
      topicBar.appendChild(el('span', 'gl-lbl gl-inline', 'Topics'));
      var all = el('button', 'gl-topic' + (pickedCount() ? '' : ' on'), 'All');
      all.type = 'button';
      all.setAttribute('data-topic', '');
      all.setAttribute('aria-pressed', String(!pickedCount()));
      topicBar.appendChild(all);
      TOPICS.forEach(function (tp) {
        var on = !!picked[tp.id];
        var b = el('button', 'gl-topic' + (on ? ' on' : ''), tp.name);
        b.type = 'button';
        b.setAttribute('data-topic', tp.id);
        b.setAttribute('aria-pressed', String(on));
        b.title = tp.description || '';
        b.appendChild(el('span', 'gl-topic-n', String(tp.terms.length)));
        topicBar.appendChild(b);
      });
    }
    if (topicBar) {
      topicBar.addEventListener('click', function (e) {
        var b = e.target.closest('.gl-topic');
        if (!b) { return; }
        var id = b.getAttribute('data-topic');
        if (!id) { picked = {}; } else if (picked[id]) { delete picked[id]; } else { picked[id] = true; }
        settings.topics = Object.keys(picked);
        saveSettings(settings);
        drawTopics();
        show();
      });
    }
    drawTopics();
    // ── VIEW: Cards (every term in full) or Index (topics, one line each), remembered per browser ──
    var index = document.getElementById('gl-index');
    var viewBar = document.getElementById('gl-view');
    var cardOf = {};
    cards.forEach(function (c) { cardOf[c.id] = c; });
    function setView(v, still) {
      settings.view = v === 'index' && TOPICS.length ? 'index' : 'cards';
      saveSettings(settings);
      if (settings.view === 'index') { buildIndex(index, byId, function (id) { return cardOf[id] && cardOf[id].glReview; }); }
      list.hidden = settings.view !== 'cards';
      if (index) { index.hidden = settings.view !== 'index'; }
      if (viewBar) { Array.prototype.forEach.call(viewBar.querySelectorAll('button'), function (b) { var on = b.getAttribute('data-v') === settings.view; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }); }
      if (!still) { show(); }
    }
    if (viewBar && TOPICS.length) {
      viewBar.hidden = false;
      viewBar.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { setView(b.getAttribute('data-v')); } });
    }
    // A click in the Index opens that card; a topic line on a card opens the Index at that topic
    if (index) {
      index.addEventListener('click', function (e) {
        var a = e.target.closest('.gl-ix-e');
        if (!a) { return; }
        e.preventDefault();
        var id = a.getAttribute('data-id');
        setView('cards');
        if (location.hash === '#' + id) { jumpToHash(); } else { location.hash = id; }
      });
    }
    list.addEventListener('click', function (e) {
      var k = e.target.closest('.gl-tkick');
      if (!k) { return; }
      e.preventDefault();
      setView('index');
      var sec = document.getElementById('topic-' + k.getAttribute('data-topic'));
      if (sec) { sec.scrollIntoView({ block: 'start' }); sec.classList.remove('gl-flash'); void sec.offsetWidth; sec.classList.add('gl-flash'); }
    });
    var show = function () {
      var q = (search.value || '').trim().toLowerCase();
      var n = 0;
      var scored = cards.map(function (c, i) { var r = q ? rank(c, q) : 1; if (reviewOnly && !c.glReview) { r = 0; } if (!inTopics(c)) { r = 0; } return { c: c, r: r, i: i }; });
      scored.sort(function (a, b) { return ((a.r || 9) - (b.r || 9)) || (a.i - b.i); });
      scored.forEach(function (x) { x.c.hidden = !x.r; if (x.r) { n++; } list.appendChild(x.c); });
      // The Index shows the same matches: an entry is hidden with its card, a topic with no match is hidden whole
      if (index && settings.view === 'index') {
        Array.prototype.forEach.call(index.querySelectorAll('.gl-ix-e'), function (a) { var c = cardOf[a.getAttribute('data-id')]; a.parentNode.hidden = !c || c.hidden; });
        Array.prototype.forEach.call(index.querySelectorAll('.gl-ix-topic'), function (sec) { sec.hidden = !sec.querySelector('li:not([hidden])'); });
      }
      glowQuery = q;
      reglow();
      count.textContent = (q || reviewOnly || pickedCount()) ? n + ' OF ' + cards.length + ' TERMS' : cards.length + ' TERMS · ' + data.curriculum.short_name + ' v' + data.curriculum.version;
    };
    search.addEventListener('input', show);
    setView(location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1))) ? 'cards' : settings.view, true);
    show();
    // One listener opens or closes any term's meanings table and remembers it
    list.addEventListener('click', function (e) {
      var b = e.target.closest('.gl-more');
      if (!b) { return; }
      var id = b.getAttribute('data-t');
      settings.open = settings.open || {};
      var open = !settings.open[id];
      if (open) { settings.open[id] = true; } else { delete settings.open[id]; }
      saveSettings(settings);
      b.classList.toggle('open', open);
      b.setAttribute('aria-expanded', String(open));
      b.nextElementSibling.hidden = !open;
    });
    // Tips first, so a #term jump lands with the strip already in place
    tips();
    window.addEventListener('hashchange', jumpToHash);
    jumpToHash();
  }

  // ── TIPS: three things worth knowing, shown until dismissed; the User Guide, when the project has one, holds the rest ──
  var TIPS_KEY = P + '.glossary.tips.v1';
  function hasUserGuide() { var s = window.DASH_SITE; return !!(s && s.pages && s.pages.some(function (p) { return p.href === 'user-guide.html'; })); }
  function tips() {
    var top = document.querySelector('.gl-top');
    if (!top) { return; }
    var dismissed = false;
    try { dismissed = window.localStorage.getItem(TIPS_KEY) === 'done'; } catch (e) { dismissed = false; }
    var strip = null;
    // The page list (_data/site-data.js) arrives after this script, so the User Guide's ? and tip join once it is in
    function addGuide() {
      if (!hasUserGuide() || top.querySelector('.gl-help')) { return; }
      var help = el('a', 'gl-help', '?');
      help.href = 'user-guide.html';
      help.title = 'How to use this project (the User Guide)';
      help.setAttribute('aria-label', 'Open the User Guide');
      var h2 = top.querySelector('h2');
      if (h2) { h2.appendChild(help); }
      if (strip && strip.isConnected) { var g = el('span', ''); g.innerHTML = 'The <a href="user-guide.html">User Guide</a> shows everything this project can do.'; strip.insertBefore(g, strip.querySelector('.gl-tips-ok')); }
    }
    if (window.DASH_SITE) { setTimeout(addGuide, 0); } else { window.addEventListener('load', addGuide); }
    if (dismissed) { return; }
    strip = el('div', 'gl-tips');
    strip.setAttribute('role', 'note');
    var ask = (window.GlossaryAsk && window.AskLink && window.AskLink.where().served) ? '<span><b>Ask</b> on any card talks the term through with a model on this Mac.</span>' : '';
    var topics = TOPICS.length > 1 ? '<span><b>Topics</b> narrow the terms to one or more areas.</span>' : '';
    strip.innerHTML = ask + (TOPICS.length ? '<span><b>Index</b> lists every term by topic, in learning order.</span>' : '') + topics;
    var ok = el('button', 'gl-tips-ok', 'Got it');
    ok.type = 'button';
    ok.addEventListener('click', function () { try { window.localStorage.setItem(TIPS_KEY, 'done'); } catch (e) { /* shown again next time */ } strip.remove(); });
    strip.appendChild(ok);
    top.parentNode.insertBefore(strip, top.nextSibling);
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', render); } else { render(); }
})();