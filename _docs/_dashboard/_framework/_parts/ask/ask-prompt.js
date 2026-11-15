// ===============================================================
// @file: ask-prompt.js
// @filepath: dashboard_engine/_framework/_parts/ask/ask-prompt.js
// @version: 2.0.0
// @updated: 2026-11-13 04:51:30 PM CST
// @author: Greg Paskal & Claude
// @company: MissionWares®
// @description: The Ask part's grounding, pure functions with no page access, so the same code runs in the browser and in
//   Node tests. For a glossary: card() turns one vetted term into the CARD text the model answers from, messages()
//   builds the chat, takeaway() asks for three short lessons. For a User Guide: userGuideText() and userGuideMessages() ground answers
//   on window.DASH_USER_GUIDE (built from CAPABILITIES.md), cited as [Cap 7]. parse() reads a reply as it streams: sentences
//   inside <beyond> tags go past the record, [Meaning], [S2] or [Cap 7] name the part used, and a closing FOLLOW-UPS:
//   list offers three next questions. Who the reader is comes from the data (ctx.about, g.about) and the User Guide's groups
//   from g.groups, so no project's words are baked in. The reply format was tuned on Greg's Mac against gemma3:27b and
//   llama3.1:8b (Project-AI-Local, _docs/_test_results/ask/). A STAMPED file: changed only at the engine home.
// @tags: dashboard, ask, glossary, user-guide, grounding, prompt, parser, shared-part
// @changeLog:
// Date        Author         Version        Description
// ----------  -------------  -------------  --------------------------
// 2026-11-03  Greg & Claude  1.0.0          First (Project-AI-Local): card text, chat messages, streaming-safe parser, takeaway request
// 2026-11-04  Greg & Claude  1.1.0          Ask the Guide: guideText() and guideMessages() ground answers on the Guide; [Cap N] citations parsed and stripped
// 2026-11-13  Greg & Claude  1.2.0          Harvested into the engine as the shared Ask part (Greg): the glossary rules' reader line comes from ctx.about and ctx.title (rulesFor), the Guide rules' reader and groups from g.about and g.groups (guideRulesFor), so no project's words are baked in; the parser and the card are unchanged
// 2026-11-13  Greg & Claude  1.3.0          The User Guide (Greg): the Guide rules open "You are the User Guide for", and the default reader line names its purpose, learning to use the project's tools and processes again and asking about the project
// 2026-11-13  Greg & Claude  2.0.0          The User Guide functions renamed with the type (Greg: get everything changed over to user guide): userGuideText, userGuideMessages, userGuideRulesFor; they ground on window.DASH_USER_GUIDE
// ===============================================================
(function (root) {
  'use strict';
  var SECTIONS = ['Meaning', 'Analogy', 'Also known as', 'Domains', 'Related', 'Standards', 'Etymology'];
  var MAX_SOURCES = 8;

  // ── THE CARD: one term's vetted data as plain labeled text ──
  // ctx: { byId, sources (by source_id), catalogs (by catalog_id: { c, byId }), domains [{id,name}], version }
  function card(t, ctx) {
    var L = [];
    var lay = t.definitions.layman.universal;
    L.push('Term: ' + t.term + (t.abbreviation ? ' (' + t.abbreviation + ')' : ''));
    L.push('[Meaning] ' + lay[0] + ' Precisely: ' + t.definitions.official.text);
    if (lay[1]) { L.push('[Analogy] ' + lay[1]); }
    if (t.synonyms && t.synonyms.length) { L.push('[Also known as] ' + t.synonyms.join('; ')); }
    if (t.polysemy) {
      var names = {};
      (ctx.domains || []).forEach(function (d) { names[d.id] = d.name; });
      var ms = t.polysemy.meanings.map(function (m) {
        var hear = Object.keys(m.weights || {}).filter(function (d) { return m.weights[d] >= 3; }).map(function (d) { return names[d] || d; });
        var txt = m.official ? 'the meaning above' : m.text;
        return m.name + (txt ? ': ' + txt : '') + (hear.length ? ' (heard often by ' + hear.join(', ') + ')' : '');
      });
      L.push('[Domains] The word means different things to different listeners. ' + ms.join(' | '));
    }
    var rel = (t.relationships || []).filter(function (r) { return ctx.byId[r.term_id]; });
    if (rel.length) { L.push('[Related] ' + rel.map(function (r) { return ctx.byId[r.term_id].term + ': ' + (r.description || ''); }).join(' | ')); }
    var std = (t.catalog_refs || []).map(function (r) { var k = ctx.catalogs[r.catalog]; var e = k && k.byId[r.id]; return r.id + (e ? ' ' + e.title : '') + (k ? ' (' + k.c.name + ')' : ''); });
    if (std.length) { L.push('[Standards] ' + std.join(' | ')); }
    if (t.etymology) { L.push('[Etymology] ' + t.etymology.text.replace(/\*/g, '')); }
    var src = sourceList(t, ctx);
    if (src.length) { L.push('[Sources] ' + src.map(function (s, i) { return 'S' + (i + 1) + ' ' + s.title + (s.publisher ? ', ' + s.publisher : ''); }).join(' | ')); }
    return L.join('\n');
  }

  // The pages behind the definition and facts first, then meanings; each page once, at most MAX_SOURCES
  function sourceList(t, ctx) {
    var order = ['definition', 'fact'];
    var refs = (t.references || []).slice().sort(function (a, b) { var x = order.indexOf(a.supports); var y = order.indexOf(b.supports); return (x === -1 ? 9 : x) - (y === -1 ? 9 : y); });
    var seen = {};
    var out = [];
    refs.forEach(function (r) { var s = ctx.sources[r.source_id]; if (!s || !s.url || seen[r.source_id] || out.length >= MAX_SOURCES) { return; } seen[r.source_id] = true; out.push(s); });
    return out;
  }

  // The first line says who reads the glossary; a project gives its own as ctx.about (Project-AI-Local's, from which this
  // was harvested: "The reader is an experienced software tester learning how AI really works by running models on his own Mac.")
  function rulesFor(ctx) { return ['You are the Ask helper in ' + ((ctx && ctx.title) || 'a glossary') + '. ' + ((ctx && ctx.about) || 'The reader wants to understand this term in plain words.') + ' Answer the reader\'s question about the glossary term described in the CARD below. When you mention the CARD, call it "the card".'].concat(RULES_REST).join('\n'); }
  var RULES_REST = [
    'How to answer:',
    '1. Answer the question in your first sentence. Start from the card: it is vetted, so prefer its facts and its words.',
    '2. Put every sentence the card does not support inside <beyond> and </beyond> tags. Be strict: general knowledge, numbers, names, tools and advice that are not on the card all go inside the tags. If the card does not answer the question, say so in one sentence, then answer inside the tags. Never mention the tags themselves.',
    '3. After a sentence that uses the card, name the part you used in square brackets: [Meaning], [Analogy], [Also known as], [Domains], [Standards], [Etymology], a source such as [S2], or a related term such as [Related: test oracle].',
    '4. Keep it short and plain: two to four short paragraphs, no headings, no em dashes. An everyday analogy helps when it fits.',
    '5. If you are not sure, say so plainly.',
    '6. Always finish with the line FOLLOW-UPS: and then three short questions he might ask next, one per line, each starting with "- ".',
    'Example of the form (about a different term):',
    'A seed is the starting number for the model\'s random choices, so the same seed can repeat an answer [Meaning]. It is like recording how a deck was shuffled [Analogy].',
    '<beyond>Many test harnesses log the seed with every run so a failure can be replayed.</beyond>',
    'FOLLOW-UPS:',
    '- Why does the same seed sometimes give a different answer?',
    '- How does temperature change what the seed does?',
    '- Should my tests always fix the seed?'
  ];
  var RULES = rulesFor(null);

  // history: [{ q, a }] earlier turns (a = the reply text as the model wrote it)
  function messages(t, ctx, history, question) {
    var m = [{ role: 'system', content: rulesFor(ctx) + '\n\nCARD\n' + card(t, ctx) }];
    (history || []).forEach(function (h) { m.push({ role: 'user', content: h.q }); m.push({ role: 'assistant', content: h.a }); });
    m.push({ role: 'user', content: question });
    return m;
  }

  // ── THE TAKEAWAY: three lessons from the conversation, in the reader's notebook voice ──
  function takeaway(t, ctx, history) {
    var talk = history.map(function (h) { return 'Q: ' + h.q + '\nA: ' + strip(h.a); }).join('\n\n');
    var sys = 'You write study notes. From the conversation below about the glossary term "' + t.term + '", write exactly three takeaways the reader should remember. Each is one plain sentence of at most 25 words, written as a fact (not "you learned"), no em dashes. Prefer what the CARD supports. Output only the three lines, each starting with "- ".\n\nCARD\n' + card(t, ctx);
    return [{ role: 'system', content: sys }, { role: 'user', content: talk }];
  }

  // ── ASK THE GUIDE: the Guide (window.DASH_USER_GUIDE, from CAPABILITIES.md) as plain numbered text ──
  function userGuideText(g) {
    var out = ['CAPABILITIES (as of ' + g.asOf + ')'];
    g.sections.forEach(function (c) {
      out.push('');
      out.push('Cap ' + c.n + '. ' + c.title);
      out.push('You use it to: ' + c.use);
      c.fields.forEach(function (f) { out.push((f.label ? f.label + ': ' : '') + f.text.replace(/\*\*/g, '')); });
    });
    if (g.rules && g.rules.length) { out.push(''); out.push('RULES'); g.rules.forEach(function (r) { out.push('- ' + r.replace(/\*\*/g, '')); }); }
    if (g.changes && g.changes.length) { out.push(''); out.push('RECENT CHANGES (newest first)'); g.changes.slice(0, 6).forEach(function (c) { out.push('- ' + c.date + ' ' + c.version + ': ' + c.text); }); }
    if (g.threads && g.threads.length) { out.push(''); out.push('OPEN THREADS (not finished yet)'); g.threads.forEach(function (r) { out.push('- ' + r); }); }
    return out.join('\n');
  }

  // ── ASK THE GUIDE RULES: who the Guide is for and its groups come from the data (g.about, g.groups), so every project
  // gets its own; Project-AI-Local's, from which this was harvested, read "Greg's AI Lab, a project on his own Mac. He is
  // an experienced software tester coming back after time away and wants to know what the lab can do and how to start it."
  function userGuideRules(g) {
    var about = (g && g.about) || 'this project: a searchable guide to using its tools and processes. The reader is coming back after time away to learn how to use them again, or has a question about the project.';
    var groups = ((g && g.groups) || []).filter(function (x) { return x.id !== 'other'; }).map(function (x) { return x.name.toLowerCase(); });
    var broad = groups.length > 1 ? 'If the reader asks broadly what they can do, give one short sentence for each group of capabilities (' + groups.join(', ') + '), each naming one or two capabilities.' : 'If the reader asks broadly what they can do, name the three or four capabilities that matter most, one short sentence each.';
    return [
      'You are the User Guide for ' + about + ' Answer from the CAPABILITIES below, which are the project\'s own record.',
      'How to answer:',
      '1. Answer in your first sentence. Name the capability and say how to start it, using only words the CAPABILITIES give: the words to say to Claude in double quotes, the exact command, or the page to open.',
      '2. After a sentence that uses a capability, name it in square brackets by its number, such as [Cap 7]. Use square brackets, never parentheses.',
      '3. ' + broad,
      '4. If the reader asks what changed, name the three newest RECENT CHANGES in one short paragraph.',
      '5. If no capability does what the reader asks, say so in your first sentence, for example: This project cannot do that yet. Mention an open thread only if one listed below matches; never invent one. Then point to the closest capability.',
      '6. Put every sentence the CAPABILITIES do not support inside <beyond> and </beyond> tags.',
      '7. Keep it short and plain: one to three short paragraphs, no lists, no headings, no em dashes, no praise.',
      '8. Always finish with the line FOLLOW-UPS: and then three short questions about the reader\'s question that they might ask next, one per line, each starting with "- ". Write new ones; never copy the example.',
      'Example of the form only (about a different question and a capability that may not exist here, "how do I write down what I learned?"):',
      'Say "journal this" to Claude, and Claude writes the entry and delivers it [Cap 10]. The Journal page then shows it [Cap 10].',
      'FOLLOW-UPS:',
      '- How do I find an old journal entry?',
      '- Can a journal entry link to another page?',
      '- Where are journal entries kept?'
    ].join('\n');
  }
  var USER_GUIDE_RULES = userGuideRules(null);

  function userGuideMessages(g, history, question) {
    var m = [{ role: 'system', content: userGuideRules(g) + '\n\n' + userGuideText(g) }];
    (history || []).forEach(function (h) { m.push({ role: 'user', content: h.q }); m.push({ role: 'assistant', content: h.a }); });
    m.push({ role: 'user', content: question });
    return m;
  }

  // The follow-ups heading must be a whole line, so prose that starts "Follow-ups are..." never cuts an answer short
  var FU_HEAD = /(^|\n)[ \t]*\**FOLLOW-UPS:?\**[ \t]*(?=\n|$)/i;

  // A reply without its markup: for history in the takeaway, and for copying
  function strip(text) {
    return String(text).split(FU_HEAD)[0].replace(/<\/?beyond>/gi, '').replace(/\[(?:Cap\s*\d+|S\d+|Meaning|Analogy|Also known as|Domains|Related|Standards|Etymology|Card)(?::[^\]\n]*)?\]/gi, '').replace(/[ \t]+([.,;:])/g, '$1').replace(/[ \t]{2,}/g, ' ').trim();
  }

  // ── THE PARSER: safe on a partial stream ──
  // Returns { paras: [ { beyond: bool, parts: [ { text } | { cite, detail } ] } ], followups: [string] }
  // An unfinished tag, bracket or follow-ups heading at the very end is held back until the next piece arrives.
  function parse(text, final) {
    var s = String(text).replace(/\r/g, '');
    var fu = [];
    var cut = s.search(FU_HEAD);
    if (cut !== -1) {
      var tail = s.slice(cut).replace(/^\n?[ \t]*\**FOLLOW-UPS:?\**[ \t]*/i, '');
      tail.split('\n').forEach(function (l) { var m = l.match(/^\s*(?:[-*•]|\d+[.)])\s*(.+?)\s*$/); if (m && fu.length < 3) { var q = m[1].replace(/^\*\*|\*\*$/g, '').trim(); if (q.length > 3) { fu.push(q); } } });
      s = s.slice(0, cut);
    }
    if (!final) { s = s.replace(/<[^>]{0,8}$/, '').replace(/\[[^\]\n]{0,72}$/, '').replace(/\n[ \t]*\**F(?:O(?:L(?:L(?:O(?:W(?:-(?:U(?:P(?:S(?::?\**)?)?)?)?)?)?)?)?)?)?$/i, ''); }
    s = s.replace(/\*\*/g, '');
    var paras = [];
    var beyond = false;
    s.split(/\n\s*\n/).forEach(function (block) {
      var tokens = block.split(/(<\/?beyond>)/i);
      var cur = null;
      tokens.forEach(function (tok) {
        if (/^<beyond>$/i.test(tok)) { beyond = true; cur = null; return; }
        if (/^<\/beyond>$/i.test(tok)) { beyond = false; cur = null; return; }
        if (!tok) { return; }
        if (!tok.trim() && cur === null) { return; }
        if (!cur || cur.beyond !== beyond) { cur = { beyond: beyond, parts: [] }; paras.push(cur); }
        cites(tok, cur.parts);
      });
    });
    paras.forEach(function (p) { var first = p.parts[0]; if (first && first.text) { first.text = first.text.replace(/^\s+/, ''); } var last = p.parts[p.parts.length - 1]; if (last && last.text) { last.text = last.text.replace(/\s+$/, ''); } });
    return { paras: paras.filter(function (p) { return p.parts.some(function (x) { return x.cite || (x.text && x.text.trim()); }); }), followups: fu };
  }

  var CITE = /\[(Cap\s*\d+|S\d+|Meaning|Analogy|Also known as|Domains|Related|Standards|Etymology|Card)(?::\s*([^\]\n]{1,60}))?\]/gi;
  function cites(text, out) {
    var last = 0;
    var m;
    CITE.lastIndex = 0;
    while ((m = CITE.exec(text)) !== null) {
      if (m.index > last) { out.push({ text: text.slice(last, m.index) }); }
      var name = m[1];
      var canon = /^cap\s*\d+$/i.test(name) ? 'Cap ' + name.replace(/\D/g, '') : /^s\d+$/i.test(name) ? name.toUpperCase() : SECTIONS.filter(function (x) { return x.toLowerCase() === name.toLowerCase(); })[0] || 'Card';
      out.push(m[2] ? { cite: canon, detail: m[2].trim() } : { cite: canon });
      last = CITE.lastIndex;
    }
    if (last < text.length) { out.push({ text: text.slice(last) }); }
  }

  root.AskPrompt = { version: '2.0.0', rulesFor: rulesFor, userGuideRulesFor: userGuideRules, card: card, sourceList: sourceList, messages: messages, takeaway: takeaway, parse: parse, strip: strip, rules: RULES, userGuideText: userGuideText, userGuideMessages: userGuideMessages, userGuideRules: USER_GUIDE_RULES };
})(typeof window !== 'undefined' ? window : globalThis);