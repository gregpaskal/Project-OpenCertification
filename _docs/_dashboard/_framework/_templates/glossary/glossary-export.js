// ===============================================================
// @file: glossary-export.js
// @filepath: dashboard_engine/_framework/_templates/glossary/glossary-export.js
// @version: 1.0.0
// @updated: 2026-11-13 05:16:26 PM CST
// @author: Greg Paskal & Claude
// @company: MissionWares®
// @description: The Glossary page type's build tool. Validates the project's glossary/glossary.json (the single source
//   of truth, in the Lexicon engine's curriculum shape) and writes glossary/glossary-data.js, the window.DASH_GLOSSARY
//   wrapper the file:// dashboard can load (Core_16: a file:// page cannot fetch JSON). The wrapper carries the source's
//   sha256, so drift is visible. Schema 1.3 to 1.6 fields (listener_domains, polysemy, etymology, visibility, sources,
//   references, review, vetting, catalogs, catalog_refs, topics, illustration, ask) are checked against the rules in
//   this folder's GLOSSARY-SCHEMA.md section 10; that spec is the contract this tool builds to.
//   Run from the project root: node _docs/_dashboard/_framework/_templates/glossary/glossary-export.js [root]
//   Node stdlib only; fails loudly on any shape error (exit 1). A STAMPED file: changed only at the engine home.
// @tags: glossary, lexicon, export, validation, codex-schema, page-type
// @changeLog:
// Date        Author         Version        Description
// ----------  -------------  -------------  --------------------------
// 2026-11-13  Greg & Claude  1.0.0          Harvested into the Glossary page type from Project-AI-Local _tools/glossary-export.js 1.4.0: rules 1 to 15 unchanged; the source is glossary/glossary.json and the global DASH_GLOSSARY; NEW rule 16 (schema 1.6), curriculum.ask: who the glossary is for and the preferred models
// ===============================================================
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = process.argv[2] || process.cwd();
const src = path.join(root, '_docs/_dashboard/glossary/glossary.json');
const dest = path.join(root, '_docs/_dashboard/glossary/glossary-data.js');
const fail = (m) => { console.error('FAIL: ' + m); process.exit(1); };
const bytes = fs.readFileSync(src);
const sha = crypto.createHash('sha256').update(bytes).digest('hex');
const data = JSON.parse(bytes.toString('utf8'));

// ── Lexicon curriculum shape (schema 1.2) ───────────────────────────────────
['curriculum', 'terms', 'term_count'].forEach((k) => { if (!(k in data)) fail('missing top-level key ' + k); });
['id', 'name', 'short_name', 'version'].forEach((k) => { if (!data.curriculum[k]) fail('curriculum.' + k + ' missing'); });
if (data.term_count !== data.terms.length) fail('term_count ' + data.term_count + ' != terms ' + data.terms.length);
const seen = new Set();
data.terms.forEach((t, i) => {
  const where = 'term ' + i + ' (' + (t.term_id || '?') + ')';
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(t.term_id || '')) fail(where + ': term_id breaks the convention');
  if (seen.has(t.term_id)) fail(where + ': duplicate term_id');
  seen.add(t.term_id);
  if (!t.term) fail(where + ': term missing');
  if (!t.definitions || !t.definitions.official || !t.definitions.official.text || !t.definitions.official.source_id) fail(where + ': definitions.official text and source_id required');
  if (!t.definitions.layman || !Array.isArray(t.definitions.layman.universal) || t.definitions.layman.universal.length < 2) fail(where + ': layman.universal needs [plain, analogy]');
  (t.relationships || []).forEach((r) => { if (!data.terms.some((x) => x.term_id === r.term_id)) fail(where + ': relationship to unknown term ' + r.term_id); });
});

// ── Schema 1.3 (GLOSSARY-SCHEMA.md section 10) ──────────────────────────────
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ld = data.curriculum.listener_domains;
const domainIds = new Set();
if (ld) {
  if (!Array.isArray(ld.domains) || !ld.domains.length) fail('curriculum.listener_domains.domains must list the domains');
  ld.domains.forEach((d) => { if (!ID.test(d.id || '') || !d.name) fail('listener domain needs a hyphenated id and a name: ' + JSON.stringify(d)); if (domainIds.has(d.id)) fail('duplicate listener domain ' + d.id); domainIds.add(d.id); });
  if (!domainIds.has(ld.default)) fail('listener_domains.default ' + ld.default + ' is not a listed domain');
}
const sourceIds = new Set((data.sources || []).map((s) => s.source_id));
const knownSource = (id) => !data.sources || sourceIds.has(id);
const isDomain = (id) => domainIds.has(id);
// Rule 8: no new field carries presentation; checked by key name and by value shape
const PRESENTATION_KEY = /(color|colour|width|height|size|position|pos|left|top|emoji|icon|style|css)$/i;
const PRESENTATION_VALUE = /^#[0-9a-f]{3,8}$|^rgba?\(|\d+(px|%|em|rem)$|[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/iu;
function noPresentation(obj, where) {
  if (obj && typeof obj === 'object') { Object.keys(obj).forEach((k) => { if (PRESENTATION_KEY.test(k)) fail(where + ': presentation key "' + k + '" does not belong in data (rule 8)'); noPresentation(obj[k], where + '.' + k); }); return; }
  if (typeof obj === 'string' && PRESENTATION_VALUE.test(obj)) fail(where + ': presentation value "' + obj + '" does not belong in data (rule 8)');
}
let polyCount = 0;
let etyCount = 0;
data.terms.forEach((t) => {
  const where = 'term ' + t.term_id;
  if ('visibility' in t && t.visibility !== 'public' && t.visibility !== 'private') fail(where + ': visibility must be public or private (rule 7)');
  if (t.etymology) {
    etyCount++;
    if (!t.etymology.text) fail(where + ': etymology.text required');
    if (['established', 'probable', 'folk'].indexOf(t.etymology.confidence) === -1) fail(where + ': etymology.confidence must be established, probable or folk (rule 6)');
    if (t.etymology.source_id && !knownSource(t.etymology.source_id)) fail(where + ': etymology source ' + t.etymology.source_id + ' is not in sources');
    noPresentation(t.etymology, where + '.etymology');
  }
  const p = t.polysemy;
  if (!p) { return; }
  polyCount++;
  if (!ld) fail(where + ': polysemy needs curriculum.listener_domains');
  if (!Array.isArray(p.meanings) || p.meanings.length < 2) fail(where + ': polysemy needs at least two meanings (rule 1)');
  const mids = new Set();
  let officials = 0;
  p.meanings.forEach((m) => {
    const mw = where + ' meaning ' + (m.meaning_id || '?');
    if (!ID.test(m.meaning_id || '')) fail(mw + ': meaning_id breaks the convention');
    if (mids.has(m.meaning_id)) fail(mw + ': duplicate meaning_id (rule 1)');
    mids.add(m.meaning_id);
    if (!m.name) fail(mw + ': name required');
    if (m.official === true) { officials++; } else if (!m.text) { fail(mw + ': text required when not official (rule 2)'); }
    if (m.source_id && !knownSource(m.source_id)) fail(mw + ': source ' + m.source_id + ' is not in sources');
    if (!isDomain(m.domain)) fail(mw + ': domain ' + m.domain + ' is not a listener domain (rule 3)');
    if (!m.weights || typeof m.weights !== 'object') fail(mw + ': weights required');
    Object.keys(m.weights).forEach((k) => { const v = m.weights[k]; if (!isDomain(k)) fail(mw + ': weight for unknown domain ' + k + ' (rule 3)'); if (!Number.isInteger(v) || v < 0 || v > 4) fail(mw + ': weight ' + k + '=' + v + ' must be a whole number 0 to 4 (rule 4)'); });
  });
  if (officials > 1) fail(where + ': more than one meaning is official (rule 2)');
  if (p.home_domain !== undefined && !isDomain(p.home_domain)) fail(where + ': home_domain ' + p.home_domain + ' is not a listener domain (rule 3)');
  Object.keys(p.drift || {}).forEach((k) => { const d = p.drift[k]; if (!isDomain(k)) fail(where + ': drift for unknown domain ' + k + ' (rule 3)'); if (!d || !Number.isInteger(d.level) || d.level < 0 || d.level > 3) fail(where + ': drift ' + k + ' level must be a whole number 0 to 3 (rule 4)'); if (!d.reason) fail(where + ': drift ' + k + ' needs a reason (rule 4)'); });
  if (!p.judgment || typeof p.judgment.measured !== 'boolean') fail(where + ': polysemy.judgment.measured required (rule 5)');
  noPresentation(p, where + '.polysemy');
});

// ── Evidence, review and vetting (rules 9 to 12) ──
const SUPPORTS = /^(definition|fact|etymology|meaning:[a-z0-9]+(-[a-z0-9]+)*|drift:[a-z0-9]+(-[a-z0-9]+)*)$/;
const seenSource = new Set();
(data.sources || []).forEach((src) => {
  if (!src.source_id || seenSource.has(src.source_id)) fail('sources: missing or duplicate source_id ' + src.source_id + ' (rule 9)');
  seenSource.add(src.source_id);
  if (src.url && !/^https:\/\//.test(src.url)) fail('source ' + src.source_id + ': url must be https (rule 9)');
});
let reviewCount = 0;
let vettedCount = 0;
data.terms.forEach((t) => {
  const where = 'term ' + t.term_id;
  (t.references || []).forEach((r, i) => {
    if (!knownSource(r.source_id)) fail(where + ' reference ' + i + ': unknown source ' + r.source_id + ' (rule 10)');
    if (r.supports !== undefined) {
      if (!SUPPORTS.test(r.supports)) fail(where + ' reference ' + i + ': supports "' + r.supports + '" is not a known form (rule 10)');
      const [kind, id] = r.supports.split(':');
      if (kind === 'meaning' && !(t.polysemy && t.polysemy.meanings.some((m) => m.meaning_id === id))) fail(where + ' reference ' + i + ': supports an unknown meaning ' + id + ' (rule 10)');
      if (kind === 'drift' && !isDomain(id)) fail(where + ' reference ' + i + ': supports drift for unknown domain ' + id + ' (rule 10)');
    }
  });
  if (t.review) {
    if (['clear', 'needs-review'].indexOf(t.review.status) === -1) fail(where + ': review.status must be clear or needs-review (rule 11)');
    const flags = t.review.flags || [];
    if (t.review.status === 'needs-review' && !flags.length) fail(where + ': needs-review without flags (rule 11)');
    flags.forEach((fl) => { if (!/^F[1-6]$/.test(fl.code || '') || !fl.field || !fl.reason) fail(where + ': each flag needs a code F1 to F6, a field and a reason (rule 11)'); });
    if (t.review.status === 'needs-review') reviewCount++;
  }
  if (t.vetting) {
    if (!/^\d+\.\d+\.\d+$/.test(t.vetting.procedure || '')) fail(where + ': vetting.procedure must be a version number (rule 12)');
    vettedCount++;
  }
});

// ── Catalogs: outside lists of named items (OWASP AITG tests, OWASP Top 10 ids) and the terms that cover them (rule 13) ──
const catalogs = {};
const coverLines = [];
(data.catalogs || []).forEach((c) => {
  if (!c.catalog_id || catalogs[c.catalog_id]) fail('catalogs: missing or duplicate catalog_id ' + c.catalog_id + ' (rule 13)');
  if (!c.name || !Array.isArray(c.entries) || !c.entries.length) fail('catalog ' + c.catalog_id + ': needs a name and entries (rule 13)');
  if (c.url && !/^https:\/\//.test(c.url)) fail('catalog ' + c.catalog_id + ': url must be https (rule 13)');
  if (c.term_id && !data.terms.some((t) => t.term_id === c.term_id)) fail('catalog ' + c.catalog_id + ': term_id ' + c.term_id + ' is not a term (rule 13)');
  const ids = new Set();
  c.entries.forEach((e) => { if (!e.id || !e.title || ids.has(e.id)) fail('catalog ' + c.catalog_id + ': each entry needs a unique id and a title (' + e.id + ', rule 13)'); if (e.url && !/^https:\/\//.test(e.url)) fail('catalog ' + c.catalog_id + ' entry ' + e.id + ': url must be https (rule 13)'); ids.add(e.id); });
  catalogs[c.catalog_id] = { c: c, ids: ids, covered: new Set() };
});
data.terms.forEach((t) => {
  (t.catalog_refs || []).forEach((r) => {
    const k = catalogs[r.catalog];
    if (!k) fail('term ' + t.term_id + ': catalog_ref names an unknown catalog ' + r.catalog + ' (rule 13)');
    if (!k.ids.has(r.id)) fail('term ' + t.term_id + ': catalog_ref ' + r.id + ' is not an entry of ' + r.catalog + ' (rule 13)');
    k.covered.add(r.id);
  });
});
Object.keys(catalogs).forEach((id) => { const k = catalogs[id]; const open = k.c.entries.map((e) => e.id).filter((e) => !k.covered.has(e)); coverLines.push('COVERAGE ' + id + ': ' + k.covered.size + ' of ' + k.ids.size + ' entries have a term' + (open.length ? ' · none yet: ' + open.join(', ') : '')); });

// ── Topics (rule 14): every term in exactly one topic, in the order the Index shows ──
const topicOf = {};
const topics = data.curriculum.topics;
if (topics !== undefined) {
  if (!Array.isArray(topics) || !topics.length) fail('curriculum.topics must be a non-empty list (rule 14)');
  const tids = new Set();
  topics.forEach((tp) => {
    if (!tp.id || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(tp.id) || tids.has(tp.id)) fail('topics: missing, malformed or duplicate id ' + tp.id + ' (rule 14)');
    tids.add(tp.id);
    if (!tp.name || !Array.isArray(tp.terms) || !tp.terms.length) fail('topic ' + tp.id + ': needs a name and terms (rule 14)');
    tp.terms.forEach((id) => { if (!data.terms.some((t) => t.term_id === id)) fail('topic ' + tp.id + ': ' + id + ' is not a term (rule 14)'); if (topicOf[id]) fail('term ' + id + ' is in two topics, ' + topicOf[id] + ' and ' + tp.id + ' (rule 14)'); topicOf[id] = tp.id; });
  });
  data.terms.forEach((t) => { if (!topicOf[t.term_id]) fail('term ' + t.term_id + ' is in no topic (rule 14)'); });
}
// ── Illustrations (rule 15): an existing svg or png under glossary/illustrations/, with alt text ──
let picCount = 0;
data.terms.forEach((t) => {
  if (t.illustration === undefined) return;
  const il = t.illustration;
  if (!il || !/^glossary\/illustrations\/[a-z0-9-]+\.(svg|png)$/.test(il.file || '')) fail('term ' + t.term_id + ': illustration.file must be glossary/illustrations/<name>.svg or .png (rule 15)');
  if (!fs.existsSync(path.join(root, '_docs/_dashboard', il.file))) fail('term ' + t.term_id + ': illustration file ' + il.file + ' does not exist (rule 15)');
  if (!il.alt || il.alt.length < 20) fail('term ' + t.term_id + ': illustration.alt must describe the picture (rule 15)');
  picCount++;
});
// ── Ask (rule 16, schema 1.6): who the glossary is for, finishing "You are the Ask helper in <name>.", and the preferred models ──
const ask = data.curriculum.ask;
if (ask !== undefined) {
  if (!ask || typeof ask !== 'object') fail('curriculum.ask must be an object (rule 16)');
  if (ask.about !== undefined && (typeof ask.about !== 'string' || ask.about.length < 10)) fail('curriculum.ask.about must be a sentence (rule 16)');
  if (ask.models !== undefined && (!Array.isArray(ask.models) || ask.models.some((m) => typeof m !== 'string' || !m))) fail('curriculum.ask.models must be a list of model names (rule 16)');
  noPresentation(ask, 'curriculum.ask');
}
if (topics !== undefined) coverLines.push('TOPICS: ' + topics.length + ' topics hold all ' + data.terms.length + ' terms · ' + picCount + ' terms have a picture');

const out = '// @file: glossary-data.js (GENERATED by the Glossary type\'s glossary-export.js; never edit by hand)\n// @source: glossary.json sha256 ' + sha + '\nwindow.DASH_GLOSSARY = ' + JSON.stringify(data) + ';\n';
fs.writeFileSync(dest, out);
coverLines.forEach((l) => console.log(l));
console.log('PASS: ' + data.terms.length + ' terms validated (' + polyCount + ' with polysemy, ' + etyCount + ' with etymology, ' + vettedCount + ' vetted, ' + reviewCount + ' need review, schema ' + (data.curriculum.schema_version || '1.2') + ') · glossary-data.js written · source sha256 ' + sha.slice(0, 12));