// ===============================================================
// @file: user-guide-export.js
// @filepath: dashboard_engine/_framework/_templates/user-guide/user-guide-export.js
// @version: 2.0.0
// @updated: 2026-11-13 04:51:30 PM CST
// @author: Greg Paskal & Claude
// @company: MissionWares®
// @description: Builds a project's User Guide from its one source, _docs/_capabilities/CAPABILITIES.md (Core_06): reads every
//   numbered capability heading ("## 7. Title" or "### 7. Title"), the bold-labelled bullets under it, the rules, the
//   open threads, the As of line and the changelog, checks them, and writes _docs/_dashboard/user-guide/user-guide-data.js
//   (window.DASH_USER_GUIDE), the file:// safe wrapper the User Guide page loads. Who the User Guide is for, its groups, its starter
//   questions and how strict to be come from the page's own user-guide/user-guide-config.js; which pages exist comes from
//   _docs/_dashboard/_data/site-data.js when it is there. The wrapper carries the source's version and sha256, so a stale
//   User Guide is visible. Node stdlib only; fails loudly (exit 1) and writes nothing on any failed check. A STAMPED file: a
//   chat runs it from the project's _framework/_templates/user-guide/ copy (read over the wire) against a folder holding the
//   three inputs, then lands the data file.
//   Usage: node user-guide-export.js [project root]
// @tags: guide, capabilities, export, validation, dashboard, page-type
// @changeLog:
// Date        Author         Version        Description
// ----------  -------------  -------------  --------------------------
// 2026-11-04  Greg & Claude  1.0.0          First (Project-AI-Local _tools/): sections, fields, say-this phrases, commands, pages, rules, threads, changes
// 2026-11-04  Greg & Claude  1.0.1          Independent review: an unknown ## heading fails; wrapped and indented lines stay with their bullet; "run x.js" is a phrase to say; quoted phrases keep their backticked words
// 2026-11-13  Greg & Claude  1.1.0          The Guide page type (Greg: Guide first): groups, who it is for, starters and strictness from guide/guide-config.js; capabilities under ## or ### numbered headings; both label styles (Start it or Words that start it, Watch it or Where to watch it, Files or Files involved); a missing You use it to falls back to What it does (labelled so on the card, and not repeated under Details), and a missing or unknown group to More, unless strict; pages from _data/site-data.js; more Terminal commands recognized
// 2026-11-13  Greg & Claude  2.0.0          Renamed from the guide type to user-guide (Greg: get everything changed over to user guide): the type key, folder, file names, page file user-guide.html, data folder user-guide/, globals DASH_USER_GUIDE and UG_TEMPLATE_VERSION, the ug- class prefix, storage keys and the update the user guide trigger
// ===============================================================
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = process.argv[2] || process.cwd();
const SRC = path.join(root, '_docs/_capabilities/CAPABILITIES.md');
const CONFIG = path.join(root, '_docs/_dashboard/user-guide/user-guide-config.js');
const SITE = path.join(root, '_docs/_dashboard/_data/site-data.js');
const DEST = path.join(root, '_docs/_dashboard/user-guide/user-guide-data.js');
const fail = (m) => { console.error('FAIL: ' + m); process.exit(1); };
const warns = [];
const OTHER = { id: 'other', name: 'More', blurb: 'Everything else this project can do.' };
// A backticked word that starts with one of these is a Terminal command; anything else short and plain is said to Claude
const COMMANDS = /^(node|npm|npx|java|javac|mvn|swift|xcodebuild|bash|sh|zsh|ollama|open |curl|git |cd |ls |cat |grep |\.\/|\/|WIRE_[A-Z_]+=)/;

// ── THE PAGE'S OWN SETTINGS (founded with the page, the project's to edit) ──
let cfg = {};
// The file is a header, then window.DASH_USER_GUIDE_CONFIG = { plain JSON }; read as data, never run
if (fs.existsSync(CONFIG)) { const txt = fs.readFileSync(CONFIG, 'utf8'); const m = txt.match(/window\.DASH_USER_GUIDE_CONFIG\s*=\s*([\s\S]*?);?\s*$/); if (!m) { fail('user-guide/user-guide-config.js has no window.DASH_USER_GUIDE_CONFIG = { ... }'); } try { cfg = JSON.parse(m[1]); } catch (e) { fail('user-guide/user-guide-config.js: the value after the equals sign is not plain JSON: ' + e.message); } }
const GROUPS = Array.isArray(cfg.groups) ? cfg.groups.slice() : [];
GROUPS.forEach((g, i) => { if (!g || !g.id || !g.name) { fail('user-guide-config.js group ' + (i + 1) + ' needs an id and a name'); } });
const strict = cfg.strict === true;

// ── THE SOURCE ──
if (!fs.existsSync(SRC)) fail('CAPABILITIES.md not found at ' + SRC);
const raw = fs.readFileSync(SRC, 'utf8');
const sha = crypto.createHash('sha256').update(raw).digest('hex');
const version = ((raw.match(/^@version:\s*(\S+)/m) || [])[1]) || fail('no @version in the header');

// The changelog: one row per version, newest last in the file, newest first in the User Guide
const changes = [];
raw.split('\n').forEach((l) => { const m = l.match(/^(\d{4}-\d{2}-\d{2})\s{2,}\S.*?\s{2,}(\d+\.\d+\.\d+)\s{2,}(.+)$/); if (m) { changes.push({ date: m[1], version: m[2], text: m[3].trim() }); } });
changes.reverse();

const body = raw.replace(/^<!--[\s\S]*?-->\s*/, '');
const asOf = ((body.match(/\*\*As of:\*\*\s*([^\n]+)/) || [])[1]) || '';

// ── PAGES: the courier's manifest names the pages that exist; a page mentioned anywhere else is plain text ──
const PAGES = {};
if (fs.existsSync(SITE)) {
  try { const site = JSON.parse(fs.readFileSync(SITE, 'utf8').replace(/^[\s\S]*?=\s*/, '').replace(/;\s*$/, '')); (site.pages || []).forEach((p) => { if (p && /^[a-z0-9-]+\.html$/i.test(p.href)) { PAGES[p.href] = p.label || p.href; } }); } catch (e) { warns.push('_data/site-data.js could not be read (' + e.message + '); pages stay plain text'); }
} else { warns.push('no _data/site-data.js beside the dashboard; pages stay plain text'); }

// ── SPLIT INTO HEADED BLOCKS (## or ###), each with its bullets ──
const blocks = body.split(/\n(?=#{2,3} )/).filter((b) => /^#{2,3} /.test(b));
const sections = [];
let rules = [];
let threads = [];
blocks.forEach((b) => {
  const head = b.split('\n')[0].replace(/^#{2,3}\s+/, '').trim();
  const bullets = [];
  // A line that is not a new bullet belongs to the bullet above it (wrapped text, or an indented sub-bullet); a blank line ends it
  let open = false;
  b.split('\n').slice(1).forEach((l) => { if (/^- /.test(l)) { bullets.push(l.slice(2).trim()); open = true; } else if (!l.trim() || /^---/.test(l)) { open = false; } else if (open) { bullets[bullets.length - 1] += (/^\s+- /.test(l) ? ' · ' + l.trim().slice(2) : ' ' + l.trim()); } });
  const num = head.match(/^(\d+)\.\s+(.+)$/);
  if (!num) {
    if (/rules/i.test(head)) { rules = rules.concat(bullets); return; }
    if (/open threads/i.test(head)) { threads = threads.concat(bullets); return; }
    // A heading that only holds numbered capabilities below it (THE CAPABILITIES) carries no bullets of its own
    if (bullets.length) { fail('heading "' + head + '" holds bullets but is neither a numbered capability ("### 7. Title"), the rules nor the open threads; the User Guide would lose them'); }
    return;
  }
  const fields = [];
  const sec = { n: Number(num[1]), id: 'cap-' + num[1], title: num[2], use: null, group: null, say: [], run: [], pages: [], fields: fields };
  let does = null;
  bullets.forEach((x) => {
    const m = x.match(/^\*\*([^*]+?):\*\*\s*(.*)$/);
    if (!m) { fields.push({ label: '', text: x }); return; }
    const label = m[1].trim();
    const text = m[2].trim();
    if (/^You use it to$/i.test(label)) { sec.use = text; return; }
    if (/^(User )?Guide group$/i.test(label)) { sec.group = text; return; }
    if (/^What it does$/i.test(label)) { does = text; }
    fields.push({ label: label, text: text });
    if (/^(Words that start it|Start it|How to start it)$/i.test(label)) {
      // Quoted words are said to Claude; backticked words are said to Claude too unless they are a Terminal command
      (text.match(/"([^"]{3,120})"/g) || []).forEach((q) => sec.say.push(q.slice(1, -1).replace(/`/g, '')));
      (text.match(/`([^`]{2,160})`/g) || []).forEach((c) => { const w = c.slice(1, -1); if (COMMANDS.test(w) && w !== 'open dashboard') { sec.run.push(w); } else if (/^run \S+\.(js|sh)$/.test(w) || (!/[<>_\/.]/.test(w) && !/^[-@]/.test(w))) { sec.say.push(w); } });
    }
  });
  (b.match(/\b([a-z0-9-]+\.html)\b/g) || []).forEach((h) => { if (PAGES[h] && sec.pages.indexOf(h) === -1) { sec.pages.push(h); } });
  if (!sec.use && does && !strict) { sec.use = does; sec.useLabel = 'What it does'; sec.fields = fields.filter((f) => !/^What it does$/i.test(f.label)); warns.push('capability ' + sec.n + ' has no "You use it to"; What it does stands in'); }
  sections.push(sec);
});

// ── CHECKS: every capability reaches the User Guide with a sentence and a group ──
if (!sections.length) fail('no numbered capabilities found ("## 7. Title" or "### 7. Title")');
const seen = new Set();
let usedOther = false;
sections.forEach((s) => {
  if (seen.has(s.n)) fail('capability ' + s.n + ' appears twice');
  seen.add(s.n);
  if (!s.use) fail('capability ' + s.n + ' (' + s.title + ') has no "You use it to" bullet' + (strict ? ' (strict)' : ' and no "What it does" to stand in'));
  if (strict && (!/^[a-z]/.test(s.use) || s.use.length > 220)) fail('capability ' + s.n + ': "You use it to" should be one plain sentence starting in lower case (it follows the words "You use it to")');
  const g = GROUPS.filter((x) => x.name.toLowerCase() === String(s.group || '').toLowerCase() || x.id === String(s.group || '').toLowerCase())[0];
  if (!g) {
    if (strict) fail('capability ' + s.n + ' (' + s.title + ') has Guide group "' + (s.group || '') + '"; known groups: ' + GROUPS.map((x) => x.name).join(', '));
    if (GROUPS.length) { warns.push('capability ' + s.n + ' has ' + (s.group ? 'an unknown Guide group "' + s.group + '"' : 'no Guide group') + '; it shows under More'); }
    s.group = OTHER.id;
    usedOther = true;
    return;
  }
  s.group = g.id;
});
if (usedOther) { GROUPS.push(GROUPS.length ? OTHER : { id: OTHER.id, name: 'Capabilities', blurb: 'What this project can do, and how to start each thing.' }); }
const written = JSON.stringify([sections, rules, threads, changes]);
if (/\u2014/.test(written)) fail('an em dash in the User Guide text (Plain Voice): ' + written.match(/.{0,40}\u2014.{0,20}/)[0]);

const starters = Array.isArray(cfg.starters) && cfg.starters.length ? cfg.starters : ['What can I do here?', 'What changed lately?'];
const data = { source: '_docs/_capabilities/CAPABILITIES.md', version: version, sha256: sha, asOf: asOf, about: cfg.about || '', placeholder: cfg.placeholder || '', starters: starters, models: Array.isArray(cfg.models) ? cfg.models : [], pages: PAGES, groups: GROUPS, sections: sections, rules: rules, threads: threads, changes: changes };
fs.mkdirSync(path.dirname(DEST), { recursive: true });
fs.writeFileSync(DEST, '// @file: user-guide-data.js (GENERATED by user-guide-export.js from CAPABILITIES.md; never edit by hand)\n// @source: CAPABILITIES.md ' + version + ' sha256 ' + sha + '\nwindow.DASH_USER_GUIDE = ' + JSON.stringify(data) + ';\n');
warns.forEach((w) => console.log('NOTE: ' + w));
const per = GROUPS.map((g) => g.name + ' ' + sections.filter((s) => s.group === g.id).length).join(', ');
console.log('PASS: ' + sections.length + ' capabilities (' + per + ') · ' + sections.reduce((a, s) => a + s.say.length, 0) + ' phrases to say · ' + changes.length + ' changes · user-guide/user-guide-data.js written · CAPABILITIES.md ' + version + ' sha256 ' + sha.slice(0, 12));