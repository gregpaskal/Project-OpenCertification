<!-- ===============================================================
@file: README.md
@filepath: dashboard_engine/_framework/_templates/completed/README.md
@version: 1.0.0
@updated: 2026-11-17 01:27:17 PM CST
@author: Greg Paskal & Claude
@company: MissionWares®

@description:
The Completed page type: what it is for, the one record of finished work, entries and their
completions, the files and who owns each, how a chat records finished work, how an old page moves
in, how it is seen working, and how the type changes. The machine-readable form is template.yaml
beside it.

@tags: template, page-type, completed, trophy-room

@changeLog:
Date        Author         Version        Description
----------  -------------  -------------  --------------------------
2026-11-17  Greg & Claude  1.0.0          The Completed page type, harvested from Automation-JAV-AIModels completed.html 1.1.0 and Project-mAi-Methodology completed.html 1.2.0 (Greg, asked by Automation-JAV-AIModels chat 01)
=============================================================== -->

# README.md

## What it is for

**Completed** is the trophy room (Core_16 law 15): every finished feature and backlog item, whole and dated, newest first. Home holds only work in progress and the Backlog only future work; when work finishes, it moves here. Every project has one, beside its Backlog.

## One record

`completed/completed-data.js` is the one record of finished work. The page is never written by hand. Both pages this type came from wrote each finished thing twice, once on the page and once as the retired board, and the two copies had already drifted apart (a board recorded 6 steps at its start, its page "4 of 4"). When Greg declares a board finished, its final rows are copied here once, as they stand.

## Entries

One entry per finished thing:

- **A finished feature** keeps its board id (`rubric-pilot`) as its id and anchor, and carries the board's final rows.
- **A finished backlog item** keeps its BL- number (`BL-007`) as its id; the page shows the number before the title.
- **A withdrawn item or idea** has `outcome: withdrawn`: it is recorded, so nothing is lost, and marked withdrawn.
- **A reopened entry that finishes again** gains a second completion on the same entry, never a second entry. The card shows each completion, the latest first, the earlier marked "earlier". The page names an id used twice.

Entries can be in any order; the page shows the newest completion first. The fields are listed in `template.yaml`.

## Before founding: nothing is asked

A Completed page starts empty. "Add a completed page" is a full answer.

## The files

| Here | In a project | Role | Who changes it |
|---|---|---|---|
| `completed.js` | `_framework/_templates/completed/completed.js` | stamped | Only this master. Draws the cards, checks the record |
| `completed.css` | `_framework/_templates/completed/completed.css` | stamped | Only this master |
| `completed.html` | `completed.html` | founded | The project, from birth |
| `example/completed-data.js` | `completed/completed-data.js` | founded | The project: an entry each time work finishes |

## Recording finished work

A chat changes only `completed/completed-data.js`, over the wire as an update with its base sha256 (the `wire` tool), in the same delivery that takes the work off the Backlog or retires its board. Every change bumps the data file's `@version`. Times are Chicago time, fetched, never guessed.

## Moving an old page in

A Completed page written by hand moves to this type the next time serious work is done in its project, on Greg's word: carry every card and every record line into the data file (count before and after), keep each board id and BL- number, and leave nothing on the page.

## How it is seen working

In the browser console: `DASH_ENGINE_VERSION` names the engine, `CP_TEMPLATE_VERSION` this type's stamped code, and the page's `mai-page-template-version` meta tag the template it was founded from. With no data file, the page says so and names the file.

## Changing the type

Change the stamped files here only. Bump `templateVersion` in `template.yaml` with the files, and keep `VERSION` in `completed.js` equal to its `@version`. The data schema is additive. A changed `completed.js` reaches every project at its next Launch.

---

*README.md v1.0.0*