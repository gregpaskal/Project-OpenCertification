// ===============================================================
// @file: journal-export.js
// @filepath: dashboard_engine/_framework/_templates/journal/journal-export.js
// @version: 1.0.0
// @updated: 2026-11-13 05:16:26 PM CST
// @author: Greg Paskal & Claude
// @company: MissionWares®
// @description: The Journal page type's build tool. Validates every journal entry in _docs/_dashboard/journal/*.md and
//   writes two generated wrappers the file:// dashboard can load by script include (Core_16: a file:// page cannot
//   fetch): journal/journal-data.js (window.DASH_JOURNAL, each entry's header fields plus its body as HTML and as plain
//   text) and journal/docs-data.js (window.DASH_DOCS, the project's technical docs split into sections, and the
//   glossary's terms when the project has a Glossary, for Search). Which docs are indexed comes from the page's own
//   journal/journal-config.js. Markdown is converted here, once, so the page only displays. Node stdlib only; fails
//   loudly on any rule break (exit 1). A STAMPED file: changed only at the engine home.
//   Run from the project root after adding or editing an entry:
//   node _docs/_dashboard/_framework/_templates/journal/journal-export.js [root]
// @tags: journal, export, validation, search, markdown, page-type
// @changeLog:
// Date        Author         Version        Description
// ----------  -------------  -------------  --------------------------
// 2026-11-13  Greg & Claude  1.0.0          Harvested into the Journal page type from Project-AI-Local _tools/journal-export.js 1.0.0: entry rules and Markdown unchanged, except that a link is kept only to an http(s) address or a project path; the docs list from journal/journal-config.js; the Glossary optional (an entry names terms only when the project has one) and its terms carried into docs-data.js for Search, so the page loads no glossary file; @updated in CDT or CST; globals DASH_JOURNAL and DASH_DOCS
// ===============================================================
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = process.argv[2] || process.cwd();
const dir = path.join(root, '_docs/_dashboard/journal');
const glossaryFile = path.join(root, '_docs/_dashboard/glossary/glossary.json');
const configFile = path.join(dir, 'journal-config.js');
const STATUSES = ['seed', 'growing', 'settled'];
const STAMP = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} (AM|PM) (CDT|CST)$/;

const fail = (m) => { console.error('FAIL: ' + m); process.exit(1); };

// ── CONFIG: the page's own settings; the file is a header, then window.DASH_JOURNAL_CONFIG = { plain JSON }, read as data, never run ──
let cfg = {};
if (fs.existsSync(configFile)) { const txt = fs.readFileSync(configFile, 'utf8'); const m = txt.match(/window\.DASH_JOURNAL_CONFIG\s*=\s*([\s\S]*?);?\s*$/); if (!m) fail('journal/journal-config.js has no window.DASH_JOURNAL_CONFIG = { ... }'); try { cfg = JSON.parse(m[1]); } catch (e) { fail('journal/journal-config.js: the value after the equals sign is not plain JSON: ' + e.message); } }
// The technical docs Search reads, as paths from the project root; a missing one is skipped with a note, never invented
const DOCS = Array.isArray(cfg.docs) ? cfg.docs : ['_docs/_capabilities/CAPABILITIES.md'];
DOCS.forEach((d) => { if (typeof d !== 'string' || !/\.md$/.test(d) || /(^|\/)\.\.(\/|$)/.test(d)) fail('journal-config.js docs: each is a .md path from the project root, inside it: ' + JSON.stringify(d)); });
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ── HEADER: the mAi header block, its @fields (a field may continue on indented lines) ──
function readHeader(text, where) {
  const m = text.match(/^<!-- =+\n([\s\S]*?)\n=+ -->\n/);
  if (!m) fail(where + ': no terminated mAi header block at line 1');
  const fields = {};
  let last = null;
  m[1].split('\n').forEach((line) => {
    const f = line.match(/^@([a-zA-Z-]+):\s?(.*)$/);
    if (f) { last = f[1]; fields[last] = f[2].trim(); return; }
    if (last && last !== 'changeLog' && /^\s+\S/.test(line)) { fields[last] += ' ' + line.trim(); }
  });
  return { fields: fields, body: text.slice(m[0].length) };
}

const list = (v) => (v || '').split(',').map((x) => x.trim()).filter(Boolean);

// ── MARKDOWN: headings, paragraphs, lists, fences, tables, bold, italic, code, links; HTML escaped first ──
function inline(s) {
  let t = esc(s);
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  t = t.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  t = t.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<i>$2</i>');
  // A link is kept only to an http(s) address or a path in the project; any other scheme (javascript:, data:) stays text
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, href) => (/^https?:\/\//i.test(href) || !/^[^/?#]*:/.test(href)) ? '<a href="' + href + '">' + label + '</a>' : m);
  return t;
}

function markdown(md, idPrefix) {
  const lines = md.replace(/\r/g, '').split('\n');
  const out = [];
  const sections = [];
  let i = 0;
  let para = [];
  const flush = () => { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } };
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) { flush(); const code = []; i++; while (i < lines.length && !/^```/.test(lines[i])) { code.push(lines[i]); i++; } i++; out.push('<pre>' + esc(code.join('\n')) + '</pre>'); continue; }
    const h = line.match(/^(#{2,4})\s+(.*)$/);
    if (h) { flush(); const id = idPrefix + '-' + slug(h[2]); sections.push({ id: id, title: h[2] }); out.push('<h' + (h[1].length + 1) + ' id="' + id + '">' + inline(h[2]) + '</h' + (h[1].length + 1) + '>'); i++; continue; }
    if (/^\s*[-*]\s+/.test(line)) { flush(); const items = []; while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { items.push('<li>' + inline(lines[i].replace(/^\s*[-*]\s+/, '')) + '</li>'); i++; } out.push('<ul>' + items.join('') + '</ul>'); continue; }
    if (/^\s*\d+\.\s+/.test(line)) { flush(); const items = []; while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { items.push('<li>' + inline(lines[i].replace(/^\s*\d+\.\s+/, '')) + '</li>'); i++; } out.push('<ol>' + items.join('') + '</ol>'); continue; }
    if (/^\|.*\|\s*$/.test(line)) { flush(); const rows = []; while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) { rows.push(lines[i]); i++; } out.push(table(rows)); continue; }
    if (/^\s*$/.test(line)) { flush(); i++; continue; }
    if (/^#\s/.test(line) || /^\*[^*]+\.md v[\d.]+\*$/.test(line.trim())) { flush(); i++; continue; }
    para.push(line.trim());
    i++;
  }
  flush();
  return { html: out.join('\n'), sections: sections };
}

function table(rows) {
  const cells = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
  const body = rows.filter((r, n) => !(n === 1 && /^\|[\s:|-]+\|$/.test(r.trim())));
  const head = cells(body[0]).map((c) => '<th>' + inline(c) + '</th>').join('');
  const rest = body.slice(1).map((r) => '<tr>' + cells(r).map((c) => '<td>' + inline(c) + '</td>').join('') + '</tr>').join('');
  return '<table><thead><tr>' + head + '</tr></thead><tbody>' + rest + '</tbody></table>';
}

const plain = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

// ── JOURNAL ENTRIES ──
// The Glossary is optional: with none, an entry may not name terms
const glossary = fs.existsSync(glossaryFile) ? JSON.parse(fs.readFileSync(glossaryFile, 'utf8')) : null;
const termIds = new Set(glossary ? glossary.terms.map((t) => t.term_id) : []);
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort();
const entries = files.map((f) => {
  const where = 'journal/' + f;
  const text = fs.readFileSync(path.join(dir, f), 'utf8');
  const parsed = readHeader(text, where);
  const h = parsed.fields;
  const id = f.replace(/\.md$/, '');
  if (!/^\d{4}-\d{2}-\d{2}-[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) fail(where + ': filename must be YYYY-MM-DD-words-in-lowercase.md');
  if (h.file !== f) fail(where + ': @file "' + h.file + '" does not match the filename');
  if (h.filepath !== '_docs/_dashboard/journal/' + f) fail(where + ': @filepath does not match where the file lives');
  if (!/^\d+\.\d+\.\d+$/.test(h.version || '')) fail(where + ': @version must be X.Y.Z');
  if (!STAMP.test(h.updated || '')) fail(where + ': @updated must be YYYY-MM-DD HH:MM:SS AM/PM CDT (or CST)');
  if (!h.title) fail(where + ': @title missing');
  if (!h.description || h.description.length < 10) fail(where + ': @description missing or under 10 characters');
  if (STATUSES.indexOf(h.status) === -1) fail(where + ': @status must be one of ' + STATUSES.join(', '));
  if (!parsed.body.startsWith('\n# ' + f + '\n')) fail(where + ': the H1 must sit directly below the header and be the full filename');
  const footer = parsed.body.trim().split('\n').pop().trim();
  if (footer !== '*' + f + ' v' + h.version + '*') fail(where + ': footer must read *' + f + ' v' + h.version + '* (header and footer versions agree)');
  const terms = list(h.terms);
  terms.forEach((t) => { if (!glossary) fail(where + ': @terms names "' + t + '", but this project has no glossary/glossary.json'); if (!termIds.has(t)) fail(where + ': @terms names "' + t + '", which is not in the glossary'); });
  const md = markdown(parsed.body, id);
  return { id: id, file: f, title: h.title, date: id.slice(0, 10), version: h.version, updated: h.updated, status: h.status, description: h.description, tags: list(h.tags), terms: terms, related: list(h.related), sections: md.sections, html: md.html, text: plain(md.html) };
});
const ids = new Set(entries.map((e) => e.id));
entries.forEach((e) => e.related.forEach((r) => { if (!ids.has(r)) fail('journal/' + e.file + ': @related names "' + r + '", which is not a journal entry'); }));

// ── TECHNICAL DOCS, split at ## headings so a search hit lands on a section ──
const docs = [];
DOCS.forEach((rel) => {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) { console.log('NOTE: ' + rel + ' not found, skipped'); return; }
  const raw = fs.readFileSync(full, 'utf8');
  const body = raw.replace(/^<!-- =+[\s\S]*?=+ -->\n/, '');
  const name = path.basename(rel);
  const parts = body.split(/\n(?=## )/);
  parts.forEach((part) => {
    const t = part.match(/^## (.*)$/m);
    const title = t ? t[1].trim() : name;
    const id = 'doc-' + slug(name.replace(/\.md$/, '')) + '-' + slug(title);
    const md = markdown(part.replace(/^## .*$/m, ''), id);
    const text = plain(md.html);
    if (text.length) { docs.push({ id: id, doc: name, path: rel, title: title, html: md.html, text: text }); }
  });
});

// ── WRITE ──
const digest = (o) => crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
const journal = { version: '1.0.0', count: entries.length, entries: entries };
// The glossary's terms, as Search and the By term view need them (name, other names, plain text); none without a Glossary
const terms = glossary ? glossary.terms.map((t) => { const lay = (t.definitions.layman && t.definitions.layman.universal) || []; return { id: t.term_id, term: t.term, keys: [t.term_id, t.abbreviation || ''].concat(t.synonyms || []).join(' ').trim(), text: (lay.join(' ') + ' ' + t.definitions.official.text).trim() }; }) : [];
const docsOut = { version: '1.0.0', count: docs.length, sections: docs, glossary: !!glossary, terms: terms };
fs.writeFileSync(path.join(dir, 'journal-data.js'), '// @file: journal-data.js (GENERATED by the Journal type\'s journal-export.js; never edit by hand)\n// @content-sha256: ' + digest(journal) + '\nwindow.DASH_JOURNAL = ' + JSON.stringify(journal) + ';\n');
fs.writeFileSync(path.join(dir, 'docs-data.js'), '// @file: docs-data.js (GENERATED by the Journal type\'s journal-export.js; never edit by hand)\n// @content-sha256: ' + digest(docsOut) + '\nwindow.DASH_DOCS = ' + JSON.stringify(docsOut) + ';\n');
console.log('PASS: ' + entries.length + ' journal entr' + (entries.length === 1 ? 'y' : 'ies') + ' validated · ' + docs.length + ' doc sections indexed · ' + terms.length + ' glossary terms carried · journal-data.js and docs-data.js written');