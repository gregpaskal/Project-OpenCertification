// ===============================================================
// @file: dashboard-templates-data.js
// @filepath: dashboard_engine/_framework/_templates/dashboard-templates-data.js
// @version: 1.9.0
// @updated: 2026-11-17 01:27:17 PM CST
// @author: Greg Paskal & Claude
// @company: MissionWares®
// @description: DASHBOARD TEMPLATES, the master index of the page types the Living Dashboard offers: one row per
//   type, in the order types arrive. It is the one list (Greg, 2026-11-13: no point in two documents that do the same
//   thing). The Dashboard Templates page draws it; a chat in any project reads it from its own
//   _docs/_dashboard/_framework/_templates/ over the wire before it adds a page. Copied with the engine into every
//   project at Launch, changed only here, in the same delivery that adds or changes a type (README.md beside this
//   file, GROWING THE LIBRARY). Loaded by script include (the file:// law, Core_16). Fields are only ever added,
//   never renamed or removed (the additive data law); a page shows a missing field blank.
//   A cell is text, a link { text, href, open } or a list of both; open is 'same' or 'new', defaulting to new for an
//   http(s) address and same for a path. A path is relative to _docs/_dashboard/. Only http(s) addresses and relative
//   paths become links (the listing renderer, 1.1.0 and later); a chat reading this file takes the text.
// @tags: dashboard-templates, page-types, catalog, data, additive-data-law, links
// @changeLog:
// Date        Author         Version        Description
// ----------  -------------  -------------  --------------------------
// 2026-11-13  Greg & Claude  1.1.0–1.2.0    [pruned 2026-11-17; spans 2026-11-13] Links in cells (Greg): the diagrams type links to its README in a new window; the cell forms named in the description; 1.2.0: Listing 1.0.0 joins, harvested from this project's Dashboard Templates page; its type links to its README
// 2026-11-13  Greg & Claude  1.3.0          Guide 1.0.0 joins, harvested from Project-AI-Local, with the shared Ask part; its type links to its README
// 2026-11-13  Greg & Claude  1.4.0          Guide 1.1.0 is named User Guide (Greg): a searchable, AI integrated guide to the project's tools and processes
// 2026-11-13  Greg & Claude  1.4.1          Fix: the apostrophe in the User Guide row is escaped; 1.4.0 ended its string there, so the whole file failed to run and the page said the list was not here (Greg saw it)
// 2026-11-13  Greg & Claude  1.5.0          The guide type is renamed user-guide (Greg): its row's type and README link follow, and the rows run in alphabetical order
// 2026-11-13  Greg & Claude  1.6.0          Glossary 1.0.0, Journal 1.0.0 and Instruments 1.0.0 join, harvested from Project-AI-Local (Greg: add all three so we can streamline this process); each type links to its README
// 2026-11-14  Greg & Claude  1.7.0          Test Results 1.0.0 joins, harvested from Automation-JAV-Framework's Results page (Greg: add the Results page, call it Test Results); its type links to its README
// 2026-11-17  Greg & Claude  1.8.0          Backlog 1.0.0 joins, need required (Greg: every project has a dashboard and a backlog, every item a BL- number, groups optional); its type links to its README
// 2026-11-17  Greg & Claude  1.9.0          Completed 1.0.0 joins, need required beside Backlog (Greg: its own data file, a reopened feature's second completion on the same card; asked by Automation-JAV-AIModels chat 01); its type links to its README; 1.1.0 and 1.2.0 folded into a range line
// 2026-11-13  Greg & Claude  1.0.0          Created: the list of page types moves out of the templates README (1.1.0, "The catalog") into this one file, named Dashboard Templates, so the page and every chat read the same rows; one row, Diagrams 1.0.1
// ===============================================================

window.DASH_TEMPLATES = {
  v: 1,
  title: 'Dashboard Templates',
  columns: [
    { key: 'type', label: 'Type', kind: 'code' },
    { key: 'page', label: 'Page' },
    { key: 'need', label: 'Need' },
    { key: 'version', label: 'Version' },
    { key: 'what', label: 'What it is' },
    { key: 'from', label: 'Harvested from' }
  ],
  rows: [
    { type: { text: 'backlog', href: '_framework/_templates/backlog/README.md', open: 'new' }, page: 'Backlog', need: 'required', version: '1.0.0', what: 'The project\'s future work, highest value on top: every item numbered BL-001 and up for life, in optional groups that can be made or changed later; the page checks the numbers', from: 'Project-mAi-Methodology, 2026-11-17' },
    { type: { text: 'completed', href: '_framework/_templates/completed/README.md', open: 'new' }, page: 'Completed', need: 'required', version: '1.0.0', what: 'The trophy room: every finished feature and backlog item, whole and dated, newest first, from one record; a reopened one gains a second dated completion on the same card', from: 'Automation-JAV-AIModels and Project-mAi-Methodology, 2026-11-17' },
    { type: { text: 'diagrams', href: '_framework/_templates/diagrams/README.md', open: 'new' }, page: 'Diagrams', need: 'optional', version: '1.0.1', what: 'Diagrams as cards, each opening full window on an infinite pan-and-zoom canvas', from: 'Project-AI-Local, 2026-10-31' },
    { type: { text: 'glossary', href: '_framework/_templates/glossary/README.md', open: 'new' }, page: 'Glossary', need: 'optional', version: '1.0.0', what: 'The words the project uses, each with a plain meaning, an analogy and its source; search, an Index by topic, a filter for one or more topics, and Ask on every card from a model on this Mac', from: 'Project-AI-Local, 2026-11-04' },
    { type: { text: 'instruments', href: '_framework/_templates/instruments/README.md', open: 'new' }, page: 'Instruments', need: 'optional', version: '1.0.0', what: 'A run being measured, live from an instrument lane: a status strip, gauges with sparklines and a table of finished runs, with a learning card on every gauge and column', from: 'Project-AI-Local, 2026-10-31' },
    { type: { text: 'journal', href: '_framework/_templates/journal/README.md', open: 'new' }, page: 'Journal', need: 'optional', version: '1.0.0', what: 'Knowledge worth keeping, one Markdown file per entry, by date, by tag and by glossary term, with one search across the glossary, the journal and the docs', from: 'Project-AI-Local, 2026-10-31' },
    { type: { text: 'listing', href: '_framework/_templates/listing/README.md', open: 'new' }, page: 'named when founded', need: 'optional', version: '1.0.0', what: 'A table of rows under columns the page names; a cell holds text, a link or a list of both. Repeatable: one project may have many', from: 'Project-mAi-Methodology, 2026-11-13' },
    { type: { text: 'test-results', href: '_framework/_templates/test-results/README.md', open: 'new' }, page: 'Test Results', need: 'optional', version: '1.0.0', what: 'The test runs of an mAi Framework project, live from the files the framework writes: the run in progress, the latest run with what failed, was blocked or is suspect, each suite across the last 12 runs, and the full history', from: 'Automation-JAV-Framework, 2026-10-31' },
    { type: { text: 'user-guide', href: '_framework/_templates/user-guide/README.md', open: 'new' }, page: 'User Guide', need: 'optional', version: '2.0.0', what: 'A searchable, AI integrated user guide to the project\'s tools and processes, built from its CAPABILITIES.md, for coming back after time away; Ask the User Guide answers how-to questions and questions about the project from a model on this Mac', from: 'Project-AI-Local, 2026-11-04' }
  ]
};