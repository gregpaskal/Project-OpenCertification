<!-- ===============================================================
@file: README.md
@filepath: dashboard_engine/_framework/_templates/diagrams/README.md
@version: 1.0.1
@updated: 2026-11-12 08:09:17 PM CST
@author: Greg Paskal & Claude
@company: MissionWares®

@description:
The Diagrams page type: what it is for, the files it publishes and
who owns each, how a project adds a diagram, and how the type
changes. The machine-readable form is template.yaml beside this
file.

@tags: template, page-type, diagram, catalog, viewer

@changeLog:
Date        Author         Version        Description
----------  -------------  -------------  --------------------------
2026-11-12  Greg & Claude  1.0.0          The Diagrams page type, the first template; harvested from Project-AI-Local (2026-10-31)
2026-11-12  Greg & Claude  1.0.1          Moved with the engine to dashboard_engine/_framework/_templates/diagrams/; a chat founds the page by reading this folder over the wire (readable since 2026-11-12, never written), as _templates/README.md says; template 1.0.1
=============================================================== -->

# README.md

## What it is for

A project that explains itself in pictures gets one Diagrams page: every diagram as a card with a short summary, each opening full window on an infinite canvas (pan and zoom without limit, text sharp at any size). Born in Project-AI-Local on 2026-10-31 for Greg, who learns from visuals and wants them unbounded by the screen; harvested here on 2026-11-12 as the first page type.

## The files

This whole folder is stamped into every project at `_docs/_dashboard/_framework/_templates/diagrams/`, used or not. A chat reads it there over the wire (readable, never written) and founds the page by copying three files out of it, once, as `_templates/README.md` (FOUNDING A PAGE) sets out.

| Here | In a project | Role | Who changes it |
|---|---|---|---|
| `diagrams.js` | `_framework/_templates/diagrams/diagrams.js` | stamped | Only this master. The card renderer and the viewer |
| `diagrams.css` | `_framework/_templates/diagrams/diagrams.css` | stamped | Only this master. The type's one stylesheet (the style gate) |
| `diagrams.html` | `diagrams.html` | founded | The project, from birth. The page at the dashboard root: identity and two authored sections |
| `example/diagrams-data.js` | `diagrams/diagrams-data.js` | founded | The project. One entry per diagram (`window.DASH_DIAGRAMS`, schema 1.0.0) |
| `example/svg/dg-example.svg` | `diagrams/svg/dg-example.svg` | founded | The project. The example; replace it with the first real diagram |

## Adding a diagram

1. File the SVG in `diagrams/svg/`. It carries the mAi header in an XML comment, and its changelog ruler uses underscores: an XML comment cannot hold two hyphens in a row, and a browser refuses the image.
2. Add one entry to `diagrams/diagrams-data.js`: `id` (the card's anchor, unique), `file` (the SVG's name), `title`, `added` (YYYY-MM-DD), `summary`.
3. Nothing else. Both are the project's files under `_docs/_dashboard/diagrams/`, so the wire can land them.

A card written by hand as `<article class="dg-card" data-src=… data-title=… data-added=…>` inside `#dg-grid` still renders, so a page founded before this template keeps working until it is upgraded.

## How it is seen working

In the browser console: `DASH_ENGINE_VERSION` names the engine, `DG_TEMPLATE_VERSION` names this type's stamped code, and the page's `mai-page-template-version` meta tag names the template it was founded from. `window.DG_VIEWER.open(src, title)` opens the same viewer from any page, so no page builds a second one.

## Changing the type

Change the stamped files here only, never in a project. Bump `templateVersion` in `template.yaml` with the files, keep `TEMPLATE_VERSION` in `diagrams.js` equal to its `@version`, and add fields to the schema only (the additive data law, `_templates/README.md`). A changed type reaches every project at its next Launch; pages already founded keep their own page file until they are upgraded.

---

*README.md v1.0.1*