<!-- ===============================================================
@file: README.md
@filepath: dashboard_engine/_framework/_templates/listing/README.md
@version: 1.0.0
@updated: 2026-11-13 09:07:14 AM CST
@author: Greg Paskal & Claude
@company: MissionWares®

@description:
The Listing page type: what it is for, the four questions asked
before a page is founded, the files it publishes and who owns each,
how a project fills a page, how it is seen working, and how the type
changes. The first repeatable type. The machine-readable form is
template.yaml beside this file.

@tags: template, page-type, listing, table, links, repeatable

@changeLog:
Date        Author         Version        Description
----------  -------------  -------------  --------------------------
2026-11-13  Greg & Claude  1.0.0          The Listing page type, harvested from Project-mAi-Methodology's Dashboard Templates page (built and proven 2026-11-13, links confirmed on Greg's Mac)
=============================================================== -->

# README.md

## What it is for

Lots of things a project keeps fit in a table: page types, references, examples, vendors, decisions. A Listing page is one table whose columns the page names, with cells that hold text, a link, or a list of both, so a row can point at an example or an outside source. It was born as the Dashboard Templates page of Project-mAi-Methodology on 2026-11-13 and harvested the same day, on Greg's word, once its links were confirmed on his Mac.

It is the first **repeatable** type: a project may have many Listing pages, each founded under its own name.

## Before founding: the four questions

Ask Greg these, in order (they are `ask` in `template.yaml`):

1. **What should the PAGES menu call it?** This is `MENU_NAME`. The slug comes from it: lowercase words joined by hyphens (Reading List: `reading-list`).
2. **What is the page's title?** This is `PAGE_TITLE`, shown in the header and above the table.
3. **How many columns, and what does each hold?** Text, code, or links. The answer becomes the `columns` of the data file.
4. **Where do the rows come from?** Either the page's own data file, filled now or added to over time, or a list kept elsewhere.

Then write `PAGE_INTRO`: one or two plain sentences on what the list is.

## The files

This whole folder is stamped into every project at `_docs/_dashboard/_framework/_templates/listing/`, used or not. A chat reads it there over the wire (readable, never written) and founds a page by copying two files out of it, once per page, as `_templates/README.md` (FOUNDING A PAGE) sets out.

| Here | In a project | Role | Who changes it |
|---|---|---|---|
| `listing.js` | `_framework/_templates/listing/listing.js` | stamped | Only this master. Draws every table on the page |
| `listing.css` | `_framework/_templates/listing/listing.css` | stamped | Only this master. The type's one stylesheet (the style gate) |
| `listing.html` | `<slug>.html` | founded | The project, from birth. The page at the dashboard root: identity and one listing section |
| `example/listing-data.js` | `<slug>/<slug>-data.js` | founded | The project. The columns and the rows (`window.DASH_LISTING`, schema 1.0.0) |

## Filling a page

The data file holds two lists:

```js
window.DASH_LISTING = {
  schema: '1.0.0',
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type', kind: 'code' },
    { key: 'source', label: 'Source' }
  ],
  rows: [
    { name: 'Selenium docs', type: 'reference', source: { text: 'selenium.dev', href: 'https://www.selenium.dev/documentation/' } }
  ]
};
```

**A cell** is one of:

| Form | Example | Opens |
|---|---|---|
| Text | `'Diagrams'` | (no link) |
| A link | `{ text: 'Diagrams', href: 'diagrams.html' }` | The same window for a path in the project, a new window for an http(s) address |
| A link, window chosen | `{ text, href, open: 'new' }` or `open: 'same'` | Whichever is named |
| Several items | `[ 'one', { text, href }, ... ]` | Each item as above, separated by commas |

A path is relative to `_docs/_dashboard/`. A new window always opens with `noopener noreferrer`, and its link shows a small arrow. Only http(s) addresses and relative paths become links; any other address is drawn as text, in the warning color, and named once in the console.

**A list kept elsewhere.** A page may draw a list that lives somewhere else: load that file by its own script include before `listing.js`, and name its global in the mount's `data-source`. The Dashboard Templates page does this with `_framework/_templates/dashboard-templates-data.js` (`DASH_TEMPLATES`). A page may also hold more than one table: each `<div class="lst-table-mount" data-source="NAME">` is drawn from its own global.

**More sections.** The founded page is the project's. Sections of its own may be added below the listing; `.lst-steps` styles a numbered list of steps in the same voice as the intro.

## How it is seen working

In the browser console: `DASH_ENGINE_VERSION` names the engine, `LST_TEMPLATE_VERSION` names this type's stamped code, and the page's `mai-page-template-version` meta tag names the template it was founded from. The console line `[listing 1.0.0] drew 1 list(s)` confirms the table was drawn. With the data file missing, the page says "The list is not here yet." and names the file.

## Changing the type

Change the stamped files here only, never in a project. Bump `templateVersion` in `template.yaml` with the files, keep `VERSION` in `listing.js` equal to its `@version`, and add fields to the schema only (the additive data law, `_templates/README.md`). A changed type reaches every project at its next Launch; pages already founded keep their own page file until they are upgraded.

---

*README.md v1.0.0*