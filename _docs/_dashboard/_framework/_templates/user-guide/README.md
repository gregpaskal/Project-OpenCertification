<!-- ===============================================================
@file: README.md
@filepath: dashboard_engine/_framework/_templates/user-guide/README.md
@version: 2.0.0
@updated: 2026-11-13 04:51:30 PM CST
@author: Greg Paskal & Claude
@company: MissionWares®

@description:
The User Guide page type (key user-guide): what it is for, the two founding questions, the
files and who owns each, how the data is built from CAPABILITIES.md
and kept current, Ask the User Guide, how it is seen working, and how the
type changes. The machine-readable form is template.yaml beside it.

@tags: template, page-type, user-guide, capabilities, ask

@changeLog:
Date        Author         Version        Description
----------  -------------  -------------  --------------------------
2026-11-13  Greg & Claude  1.0.0          The Guide page type, harvested from Project-AI-Local's Guide (born 2026-11-04, Greg: "what if I am away from it for a while and forget I have this capability")
2026-11-13  Greg & Claude  1.1.0          Named User Guide (Greg): what it is for, the founding default and the names on the page; the type key, file names and the update the guide trigger stay
2026-11-13  Greg & Claude  2.0.0          Renamed from the guide type to user-guide (Greg: get everything changed over to user guide): the type key, folder, file names, page file user-guide.html, data folder user-guide/, globals DASH_USER_GUIDE and UG_TEMPLATE_VERSION, the ug- class prefix, storage keys and the update the user guide trigger
=============================================================== -->

# README.md

## What it is for

**The User Guide** is a searchable, AI integrated user guide to a project's tools and processes (Greg, 2026-11-13). It fills one gap: away from a project for a while, you come to the User Guide to learn how to use it again, and you can ask it questions about the project as well. Its type key is `user-guide`, its page `user-guide.html` and its data folder `user-guide/` (renamed from `guide` on 2026-11-13).

Coming back to a project after time away, the question is "what can this do, and how do I start it?" Every mAi project already answers it in `_docs/_capabilities/CAPABILITIES.md` (Core_06). The User Guide turns that page into cards: each capability with one plain sentence, the words to say to Claude and the commands to run (click to copy), the pages to open, and its details. Search filters as you type, What's new shows the changes since this browser last looked, and **Ask the User Guide** answers how-to questions and questions about the project in plain words from a model on this Mac, naming the capability it used.

One User Guide per project: the page is `user-guide.html`.

## Before founding: two questions

Both have a default, so "use the defaults" is a full answer. The answers go into `user-guide/user-guide-config.js`.

1. **Who is the User Guide for?** One sentence that finishes "You are the User Guide for ...". Default: this project, a searchable guide to using its tools and processes, for the reader coming back after time away or with a question about the project.
2. **Groups, or one list?** Groups are a name and a one-line blurb each; a capability joins one with a `**Guide group:** Name` (or `**User Guide group:** Name`) bullet in `CAPABILITIES.md`. With no groups the User Guide is one list.

## The files

| Here | In a project | Role | Who changes it |
|---|---|---|---|
| `user-guide.js` | `_framework/_templates/user-guide/user-guide.js` | stamped | Only this master. Draws the User Guide and runs Ask the User Guide |
| `user-guide.css` | `_framework/_templates/user-guide/user-guide.css` | stamped | Only this master. The type's one stylesheet |
| `user-guide-export.js` | `_framework/_templates/user-guide/user-guide-export.js` | stamped | Only this master. Builds the data from `CAPABILITIES.md` |
| `user-guide.html` | `user-guide.html` | founded | The project, from birth |
| `example/user-guide-config.js` | `user-guide/user-guide-config.js` | founded | The project: who it is for, groups, starters, models |
| (built) | `user-guide/user-guide-data.js` | built | Never by hand: `user-guide-export.js` writes it |

The type uses the **Ask part** (`_framework/_parts/ask/`, stamped with the engine).

## Building the data

`user-guide-export.js` reads three inputs, laid out as in the project, and writes `_docs/_dashboard/user-guide/user-guide-data.js`:

- `_docs/_capabilities/CAPABILITIES.md`, the one source;
- `_docs/_dashboard/user-guide/user-guide-config.js`, the page's settings;
- `_docs/_dashboard/_data/site-data.js`, the courier's page manifest (only pages listed there become links).

A chat does it over the wire: read the three files and the project's own stamped `user-guide-export.js` into a folder with the same layout, run `node user-guide-export.js <that folder>`, then land `user-guide/user-guide-data.js` (an add at founding, an update after). Say **update the user guide** whenever `CAPABILITIES.md` changes; the page shows the source version and sha256 it was built from, so a stale User Guide is visible.

**What the export reads in CAPABILITIES.md.** A capability is a numbered heading, `## 7. Title` or `### 7. Title`. Under it, bullets of the form `- **Label:** text`; a line that is not a bullet belongs to the bullet above. These labels mean something:

| Label | Becomes |
|---|---|
| `You use it to` | The card's sentence (it follows the words "You use it to") |
| `What it does` | The card's sentence when there is no `You use it to`, labelled so |
| `Guide group` or `User Guide group` | The group it joins |
| `Words that start it` or `Start it` | Quoted words and short backticked words become **Say to Claude** chips; backticked Terminal commands become **Or run** chips |

Every other label shows under Details. A heading whose name contains "Rules" gives the rules, one containing "Open threads" the threads. Any other heading must hold no bullets of its own, or the export fails: the User Guide never loses a line silently. The changelog rows become What's new.

**Strict.** With `"strict": true` in `user-guide-config.js`, every capability must carry `You use it to` and a known `Guide group`, or the export fails and writes nothing. Project-AI-Local runs strict; a new project starts lenient and the export notes what is missing.

## Ask the User Guide

It works on the served page only (the Ask part's README says why). Opened from disk, the box says so and everything else works. The first answer waits while the model reads the User Guide once; the page starts that reading when the reader first touches the box. Every answer is marked not vetted, sentences the User Guide does not support are marked Beyond the User Guide, and each `[Cap 7]` is a chip that opens the capability.

## How it is seen working

In the browser console: `DASH_ENGINE_VERSION` names the engine, `UG_TEMPLATE_VERSION` names this type's stamped code, `AskLink.version` and `AskPrompt.version` name the Ask part, and the page's `mai-page-template-version` meta tag names the template it was founded from. The foot of the page names the `CAPABILITIES.md` version and sha256 the data was built from. With the data missing, the page says so and names **update the user guide**.

## Changing the type

Change the stamped files here only. Bump `templateVersion` in `template.yaml` with the files, and keep `VERSION` in `user-guide.js` equal to its `@version`. The data schema is additive: fields are only ever added. A changed `user-guide-export.js` reaches every project at its next Launch; each project's data is rebuilt the next time someone says **update the user guide**.

---

*README.md v2.0.0*