<!-- ===============================================================
@file: README.md
@filepath: dashboard_engine/_framework/_templates/backlog/README.md
@version: 1.0.0
@updated: 2026-11-17 08:13:40 AM CST
@author: Greg Paskal & Claude
@company: MissionWares®

@description:
The Backlog page type: what it is for, the numbering rule, groups, the files and who owns each,
how a chat changes the backlog, how it is seen working, and how the type changes. The
machine-readable form is template.yaml beside it.

@tags: template, page-type, backlog

@changeLog:
Date        Author         Version        Description
----------  -------------  -------------  --------------------------
2026-11-17  Greg & Claude  1.0.0          The Backlog page type, harvested from Project-mAi-Methodology's Backlog page 2.1.0 with numbers and groups added (Greg, asked by RepoMon chat 27)
=============================================================== -->

# README.md

## What it is for

**Backlog** is the project's future work: everything worth building, highest value on top. It holds only work not yet done; a finished or dropped item leaves it for the Completed record (Core_16). Every project has one, because every project has a dashboard (Greg, 2026-11-17). It replaces `BACKLOG.md`, which is retired.

## Numbers

Every item gets a reference number when it is added: **BL-001**, BL-002 and on, so a chat and Greg can name one item exactly.

- The number comes from `next` in the data file, and `next` then goes up by one.
- A number belongs to its item for life. It does not change when the item moves up or down, or into another group.
- A number is never reused, not even after its item is finished or dropped. The Completed record keeps it.
- The page checks the numbers as it draws and names any fault above the cards: a number not in BL-001 form, a number used twice, or `next` not above every number.

## Groups (optional)

A backlog may group its items, to show work that would be done together. Groups can be added, renamed, reordered or removed at any time; an item changes group by changing its `group`, and keeps its number. Groups show in the data's order, each as a card; items with no group (or a group that is gone) show last, as UNGROUPED. A backlog with no groups shows one card, IDEAS & DREAMS.

## Before founding: nothing is asked

A backlog starts empty and grows. "Add a backlog page" is a full answer.

## The files

| Here | In a project | Role | Who changes it |
|---|---|---|---|
| `backlog.js` | `_framework/_templates/backlog/backlog.js` | stamped | Only this master. Draws the groups and rows, checks the numbers |
| `backlog.css` | `_framework/_templates/backlog/backlog.css` | stamped | Only this master |
| `backlog.html` | `backlog.html` | founded | The project, from birth |
| `example/backlog-data.js` | `backlog/backlog-data.js` | founded | The project: every new item, regrouping and removal |

## Changing the backlog

A chat changes only `backlog/backlog-data.js`, over the wire as an update with its base sha256 (the `wire` tool). To add an item: give it the number in `next`, put it where its value places it, and add one to `next`. To finish one: take it out and record it, with its number, on the Completed page. Every change bumps the data file's `@version`.

An item is `{ id, title, status, group, note, added }`: `status` is `idea` (the default, ○), `next` (◐) or `blocked` (■); `note` says what it is, why it exists and what unblocks it. The fields are listed in `template.yaml`.

## Moving an old backlog in

A project with a `BACKLOG.md`, or a Backlog page written by hand, moves to this type the next time serious work is done there: found the page, carry every open item into the data file in its order with a number from BL-001, count before and after, then retire the old file.

## How it is seen working

In the browser console: `DASH_ENGINE_VERSION` names the engine, `BL_TEMPLATE_VERSION` this type's stamped code, and the page's `mai-page-template-version` meta tag the template it was founded from. With no data file, the page says so and names the file.

## Changing the type

Change the stamped files here only. Bump `templateVersion` in `template.yaml` with the files, and keep `VERSION` in `backlog.js` equal to its `@version`. The data schema is additive. A changed `backlog.js` reaches every project at its next Launch.

---

*README.md v1.0.0*