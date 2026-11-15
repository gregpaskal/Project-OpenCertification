// ===============================================================
// @file: {{PAGE_SLUG}}-data.js
// @filepath: _docs/_dashboard/{{PAGE_SLUG}}/{{PAGE_SLUG}}-data.js
// @version: 1.0.0
// @updated: {{FOUNDED_AT}}
// @author: Greg Paskal & Claude
// @company: MissionWares®
// @description: The {{PAGE_TITLE}} page's data (window.DASH_LISTING, schema 1.0.0 in the Listing type's template.yaml):
//   its columns and its rows. A FOUNDED file: copied once when the page was founded from the example, then the
//   project's own; it grows as rows are added. Loaded by <script src> (file:// safe), never fetched. Additive: a field is
//   only ever added; a row missing a column's field shows that cell blank.
//   A cell is text, a link { text, href, open } or a list of both. open is 'same' or 'new', defaulting to new for an
//   http(s) address and same for a path; a path is relative to _docs/_dashboard/. Only http(s) addresses and relative
//   paths become links. A column's kind is 'text' (the default) or 'code'.
// @tags: dashboard, page-type, listing, data
// @changeLog:
// Date        Author         Version        Description
// ----------  -------------  -------------  --------------------------
// {{FOUNDED_DATE}}  Greg & Claude  1.0.0          Founded from the Listing page type 1.0.0
// ===============================================================

window.DASH_LISTING = {
  schema: '1.0.0',
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'kind', label: 'Kind', kind: 'code' },
    { key: 'notes', label: 'Notes' },
    { key: 'link', label: 'Link' }
  ],
  rows: [
    { name: 'The example row', kind: 'example', notes: 'Every founded Listing page starts with these rows. Replace them, and the columns, with the page\'s own.', link: { text: 'Home', href: 'index.html' } },
    { name: 'A row with an outside link', kind: 'example', notes: 'An http(s) address opens in a new window and shows an arrow.', link: { text: 'MissionWares', href: 'https://missionwares.com' } },
    { name: 'A row with two links', kind: 'example', notes: 'A cell can hold a list of items.', link: [ { text: 'Home', href: 'index.html' }, { text: 'Lanes', href: 'index.html#lanes' } ] }
  ]
};