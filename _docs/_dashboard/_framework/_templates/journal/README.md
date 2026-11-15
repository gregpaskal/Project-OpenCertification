<!-- ===============================================================
@file: README.md
@filepath: dashboard_engine/_framework/_templates/journal/README.md
@version: 1.0.0
@updated: 2026-11-13 05:16:26 PM CST
@author: Greg Paskal & Claude
@company: MissionWares®

@description:
The Journal page type: what it is for, the founding question, the files and who owns each, what
makes an entry, how the data is built and kept current, Search, how it is seen working, and how
the type changes. The machine-readable form is template.yaml beside it.

@tags: template, page-type, journal, search

@changeLog:
Date        Author         Version        Description
----------  -------------  -------------  --------------------------
2026-11-13  Greg & Claude  1.0.0          The Journal page type, harvested from Project-AI-Local's Journal and Lab Search (born 2026-10-31)
=============================================================== -->

# README.md

## What it is for

**The Journal** keeps knowledge worth keeping that is not a rule, a capability or a term: what was tried and what it showed, a design talked through, a lesson learned. Each entry is one Markdown file. The page shows the entries **by date**, **by tag** and, when the project has a Glossary, **by term**; opening one shows it in the **Reader**, and every entry and every heading inside it has its own anchor. **Search** at the top finds glossary terms, journal entries and sections of the project's technical docs from one box.

One Journal per project: the page is `journal.html` and its folder `journal/`.

## Before founding: one question

**Which docs should Search cover?** The technical documents, as `.md` paths from the project root. Default: `_docs/_capabilities/CAPABILITIES.md`. The answer goes into `journal/journal-config.js` and can change any time.

## The files

| Here | In a project | Role | Who changes it |
|---|---|---|---|
| `journal.js` | `_framework/_templates/journal/journal.js` | stamped | Only this master. The views, the Reader, the anchors |
| `journal-search.js` | `_framework/_templates/journal/journal-search.js` | stamped | Only this master. Search across terms, entries and docs |
| `journal.css` | `_framework/_templates/journal/journal.css` | stamped | Only this master. The type's one stylesheet |
| `journal-export.js` | `_framework/_templates/journal/journal-export.js` | stamped | Only this master. Validates the entries and builds the data |
| `journal.html` | `journal.html` | founded | The project, from birth |
| `example/journal-config.js` | `journal/journal-config.js` | founded | The project: which docs Search covers |
| `example/keeping-a-journal.md` | `journal/<founding day>-keeping-a-journal.md` | founded | The project: the first entry, kept or replaced |
| (built) | `journal/journal-data.js`, `journal/docs-data.js` | built | Never by hand: `journal-export.js` writes them |

## What makes an entry

- One file per entry in `journal/`, named `YYYY-MM-DD-words-in-lowercase.md`; the date is the entry's date.
- The mAi header, with `@file` and `@filepath` matching where the file lives, `@version`, `@updated` in CDT or CST, `@description`, and the Journal's own fields: `@title`, `@status` (`seed`, `growing` or `settled`), `@tags`, and optionally `@terms` (glossary term ids; only when the project has a Glossary, and each must exist there) and `@related` (other entry ids, each must exist).
- The H1 directly below the header is the full filename; the last line reads `*<filename> v<version>*`, the same version as the header.
- The body is Markdown: `##` to `####` headings (each becomes an anchor), paragraphs, lists, tables, code fences, bold, italic, code and links. A link is kept only to an `http(s)` address or a path in the project.

## Building the data

`journal-export.js` reads every `journal/*.md`, the docs `journal-config.js` lists and, when present, `glossary/glossary.json`, then writes `journal/journal-data.js` (`window.DASH_JOURNAL`) and `journal/docs-data.js` (`window.DASH_DOCS`: the doc sections, and the glossary's terms for Search and By term, so the page loads no glossary file). It fails loudly and writes nothing on any broken rule.

A chat does it over the wire: read those inputs and the project's own stamped `journal-export.js` into a folder with the same layout, run `node journal-export.js <that folder>`, then land the two data files. Say **update the journal** after adding or changing an entry, or when a listed doc changes.

## How it is seen working

In the browser console: `DASH_ENGINE_VERSION` names the engine, `JN_TEMPLATE_VERSION` this type's stamped code, `JournalSearch.version` the search, and the page's `mai-page-template-version` meta tag the template it was founded from. The Search count says how much is indexed. With the data missing, the page says so and names the build command.

## Changing the type

Change the stamped files here only. Bump `templateVersion` in `template.yaml` with the files, and keep `VERSION` in `journal.js` equal to its `@version`. The data schema is additive: fields are only ever added. A changed `journal-export.js` reaches every project at its next Launch; each project's data is rebuilt the next time someone says **update the journal**.

---

*README.md v1.0.0*