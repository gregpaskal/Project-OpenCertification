<!-- ===============================================================
@file: README.md
@filepath: dashboard_engine/_framework/_templates/instruments/README.md
@version: 1.0.0
@updated: 2026-11-13 05:16:26 PM CST
@author: Greg Paskal & Claude
@company: MissionWares®

@description:
The Instruments page type: what it is for, the two founding questions, the files and who owns
each, the settings file, the lane messages it reads, the learning cards, how it is seen working,
and how the type changes. The machine-readable form is template.yaml beside it.

@tags: template, page-type, instruments, instrument-lane, gauges

@changeLog:
Date        Author         Version        Description
----------  -------------  -------------  --------------------------
2026-11-13  Greg & Claude  1.0.0          The Instruments page type, harvested from Project-AI-Local's Instruments (born 2026-10-31 for AI LAB INSTRUMENTS S2)
=============================================================== -->

# README.md

## What it is for

**The Instruments** page shows a run being measured, live. Something in the project (a sampler, a test, a build) sends readings to an **instrument lane**, an ntfy topic; the page reads the last 12 hours the relay keeps, then follows the lane live. Its anatomy, locked in Project-AI-Local on 2026-10-31: a **Status Strip** (LIVE, DONE or NO RESULT, and what is running), a **Gauge Row** (each gauge an arc and a sparkline of the current run), a **Runs Table** of finished runs, newest first, and a legend. A value not read is shown as a dash, never a zero. The page is read-only: it sends nothing.

Every gauge and every column title with a key carries a **learning card**: what it measures, an analogy, what has been measured, what to watch for, and links to the Glossary when the project has one. Hover to see it beside the gauge; click to pin it. Pinned cards drag by their title bar, resize from their corner (the text shrinks to fit), and several can be open at once; where they sit is remembered.

One Instruments page per project: the page is `instruments.html` and its folder `instruments/`.

## Before founding: two questions

1. **Which lane?** The ntfy topic the readings arrive on (`topic`). It is the lane's name only: a relay token is never written into a page.
2. **What is measured?** The gauges and the Runs Table. The default is the example, a local model on the Mac as Project-AI-Local's `model-sampler.js` sends it (speed, first word, memory, GPU share, free memory, swap, thermal). Its cards carry no measurements yet: fill in `measured` as runs are seen.

## The files

| Here | In a project | Role | Who changes it |
|---|---|---|---|
| `instruments.js` | `_framework/_templates/instruments/instruments.js` | stamped | Only this master. Reads the lane, draws everything, runs the cards |
| `instruments.css` | `_framework/_templates/instruments/instruments.css` | stamped | Only this master. The type's one stylesheet |
| `instruments.html` | `instruments.html` | founded | The project, from birth |
| `example/instruments-config.js` | `instruments/instruments-config.js` | founded | The project: the lane, the gauges, the columns, the cards |

Nothing is built: the page loads its settings file and reads the lane itself.

## The settings file

`instruments/instruments-config.js` sets `window.DASH_INSTRUMENTS` to plain JSON. `template.yaml` lists every field. The ones that shape the page:

- **meters**, the gauges, in order. Each has a `key` (the field in a reading's metrics), `title`, `unit`, `max` (the arc's full scale), `digits`, optional `warnBelow` and `badBelow` (amber and red), `word: true` for a text gauge, a `note` under the value, and its card: `what`, `like`, `measured`, `watch`, `terms`. An empty card field is left out.
- **columns**, the Runs Table left to right. Each has a `label`, a `path` to its value (`when`, `model`, `tag`, `host`, `result.x`, `run.x.y`, `last.x`, or a list of paths where the first with a value wins), optional `digits`, `left` alignment, `level` (a gauge key whose amber and red color the cell) and `key` (whose card the title opens).
- **cards**, for columns with no gauge of their own (Model, Ctx, Load, Tokens in the example).

## The lane messages

Each relay message is one JSON object: `{ kind, project, runId, host, model, tag, seq, phase, metrics, run }`. Only the configured `kind` from the configured `project` is kept. Readings group by `runId` (or, for older senders, by host and model, a new run starting at `seq` 1). A message with `phase: "result"` closes its run: its `metrics` become the result and its `run` block is what `run.` paths read. Any other phase is a sample for the sparklines.

## How it is seen working

In the browser console: `DASH_ENGINE_VERSION` names the engine, `IN_TEMPLATE_VERSION` this type's stamped code, and the page's `mai-page-template-version` meta tag the template it was founded from. The Status Strip says the wire's state (connecting, live, reconnecting, catch-up failed). With no settings file the strip says NO CONFIG; with no topic, NO LANE.

## Changing the type

Change the stamped files here only. Bump `templateVersion` in `template.yaml` with the files, and keep `VERSION` in `instruments.js` equal to its `@version`. The settings schema is additive: fields are only ever added, and a page reads the fields it knows.

---

*README.md v1.0.0*