<!-- ===============================================================
@file: README.md
@filepath: dashboard_engine/_framework/_templates/glossary/README.md
@version: 1.0.0
@updated: 2026-11-13 05:16:26 PM CST
@author: Greg Paskal & Claude
@company: MissionWares®

@description:
The Glossary page type: what it is for, the three founding questions, the files and who owns
each, how the data is built from glossary/glossary.json and kept current, the topic filter, Ask
on every card, how it is seen working, and how the type changes. The machine-readable form is
template.yaml beside it; the data contract is GLOSSARY-SCHEMA.md.

@tags: template, page-type, glossary, lexicon, codex, topics, ask

@changeLog:
Date        Author         Version        Description
----------  -------------  -------------  --------------------------
2026-11-13  Greg & Claude  1.0.0          The Glossary page type, harvested from Project-AI-Local's glossary (born 2026-10-31, Ask added 2026-11-03, Index and pictures 2026-11-04); NEW the topic filter (Greg: one glossary, with filters to focus on one or more areas of knowledge)
=============================================================== -->

# README.md

## What it is for

**The Glossary** holds the words a project uses. Each term is a card: a plain meaning, an analogy, the precise wording and its source, and, when the data has them, its etymology, related terms, the standards it answers to, a picture, what the project worked out about it (**In practice**), and how differently other listeners hear the word (**Domain risk at a glance**). Search finds a term by its name, synonyms or meaning as you type. The **Index** lists every term by topic, in learning order. The **topic filter** narrows the page to one or more areas of knowledge. **Ask** on any card talks the term through with a model on this Mac, grounded on that card.

One Glossary per project: the page is `glossary.html` and its data folder `glossary/`. The terms are in the Lexicon Codex curriculum shape, so the same file can later feed a public Lexicon site.

## Before founding: three questions

Each has a default, so "use the defaults" is a full answer. The answers go into `glossary/glossary.json`.

1. **Who reads it?** One sentence for `curriculum.ask.about`; Ask opens "You are the Ask helper in the <project> Glossary." and then this line.
2. **Which topics?** The areas of knowledge, in learning order (`curriculum.topics`). Every term sits in exactly one. With two or more, the page offers the topic filter.
3. **Which listener domains?** Who else hears these words differently (`curriculum.listener_domains`), for the Risk at a glance bar. Leave them out and the bar and the domain pills are not drawn.

## The files

| Here | In a project | Role | Who changes it |
|---|---|---|---|
| `glossary.js` | `_framework/_templates/glossary/glossary.js` | stamped | Only this master. Draws the cards, the Index, the filters and Risk at a glance |
| `glossary-ask.js` | `_framework/_templates/glossary/glossary-ask.js` | stamped | Only this master. Ask on every card: the drawer, the takeaway, My notes |
| `glossary.css` | `_framework/_templates/glossary/glossary.css` | stamped | Only this master. The type's one stylesheet |
| `glossary-export.js` | `_framework/_templates/glossary/glossary-export.js` | stamped | Only this master. Validates the json and builds the data |
| `GLOSSARY-SCHEMA.md` | `_framework/_templates/glossary/GLOSSARY-SCHEMA.md` | stamped | Only this master. The data contract, rules 1 to 16 |
| `glossary.html` | `glossary.html` | founded | The project, from birth |
| `example/glossary.json` | `glossary/glossary.json` | founded | The project: its terms, the single source of truth |
| (built) | `glossary/glossary-data.js` | built | Never by hand: `glossary-export.js` writes it |
| (the project's) | `glossary/illustrations/*.svg` | the project's | Pictures a term names (rule 15) |

The type uses the **Ask part** (`_framework/_parts/ask/`, stamped with the engine).

## Building the data

`glossary-export.js` reads `_docs/_dashboard/glossary/glossary.json`, checks every rule in GLOSSARY-SCHEMA.md section 10, and writes `_docs/_dashboard/glossary/glossary-data.js` (`window.DASH_GLOSSARY`, with the json's sha256). It fails loudly and writes nothing on any break, and prints each catalog's coverage and the topic count.

A chat does it over the wire: read `glossary.json` (and any pictures it names) and the project's own stamped `glossary-export.js` into a folder with the same layout, run `node glossary-export.js <that folder>`, then land `glossary/glossary-data.js`. Say **update the glossary** whenever the json changes. Adding a term means: write it in `glossary.json`, put it in exactly one topic, raise `term_count`, rebuild.

## The topic filter

With two or more topics, a row of pills sits under the search: **All**, then each topic with its term count. Click a topic to focus on it; click more to add them; click one again to drop it; **All** clears the pick. The pick works with search, the Needs review filter and both views, and the count says how many terms show. It is remembered in this browser.

## Ask on every card

It works on the served page only (the Ask part's README says why). Opened from disk, the drawer gives the served address to open instead, and everything else works. Answers start from the card's vetted data; anything else is marked **Beyond the card**, and each part used is a chip that glows on the card. A **Takeaway** turns the conversation into three notes you edit and save to the card's **My notes**, kept in this browser under the project's own keys.

## How it is seen working

In the browser console: `DASH_ENGINE_VERSION` names the engine, `GL_TEMPLATE_VERSION` names this type's stamped code, `GlossaryAsk.version` the Ask drawer, `AskLink.version` and `AskPrompt.version` the Ask part, and the page's `mai-page-template-version` meta tag the template it was founded from. The header count names the glossary's `short_name` and version. With the data missing, the page says so and names the build command.

## Changing the type

Change the stamped files here only. Bump `templateVersion` in `template.yaml` with the files, and keep `VERSION` in `glossary.js` equal to its `@version`. The schema is additive: a minor version adds optional fields, and a term without them draws as before. A changed `glossary-export.js` reaches every project at its next Launch; each project's data is rebuilt the next time someone says **update the glossary**.

---

*README.md v1.0.0*