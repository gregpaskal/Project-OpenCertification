<!-- ===============================================================
@file: README.md
@filepath: dashboard_engine/_framework/_templates/test-results/README.md
@version: 1.0.0
@updated: 2026-11-14 07:07:33 PM CST
@author: Greg Paskal & Claude
@company: MissionWares®

@description:
The Test Results page type: what it is for, why nothing is asked before founding, the files and who
owns each, the data the mAi Framework writes, how it is seen working, and how the type changes. The
machine-readable form is template.yaml beside it.

@tags: template, page-type, test-results, mai-framework

@changeLog:
Date        Author         Version        Description
----------  -------------  -------------  --------------------------
2026-11-14  Greg & Claude  1.0.0          The Test Results page type, harvested from Automation-JAV-Framework's Results page (born 2026-10-31)
=============================================================== -->

# README.md

## What it is for

**Test Results** shows the test runs of an mAi Framework project, live from the files the framework writes. Four sections, top to bottom:

- **Run in progress**: the suite and test case now running, how far along (a progress bar), elapsed time, and failures, errors, blocked and suspect so far. Over 30 seconds without an update, it says the run may have stopped. Between runs it shows how the last one ended.
- **Latest run**: the verdict (PASSED, FAILED, or BUILD FAILED BEFORE TESTS), its facts, and lists of what failed, what the provider **blocked**, and what is **suspect** (steps not on their test case's step list).
- **Suites across runs**: seconds per suite for the last 12 runs, newest on the left, red where a test failed or errored.
- **History**: every run, newest first, with the count that passed.

One Test Results page per project: the page is `test-results.html`. It is for projects built on the mAi Framework, because only the framework writes its data.

## Before founding: nothing is asked

The data paths are fixed by the framework, so founding needs only the project's identity. "Add a test results page" is a full answer.

## The files

| Here | In a project | Role | Who changes it |
|---|---|---|---|
| `test-results.js` | `_framework/_templates/test-results/test-results.js` | stamped | Only this master. The sections and the polling |
| `test-results.css` | `_framework/_templates/test-results/test-results.css` | stamped | Only this master. The type's one stylesheet |
| `test-results.html` | `test-results.html` | founded | The project, from birth |
| (written) | `_docs/_test_results/results-data.js`, `_docs/_test_results/run-status.js` | written | Never by hand: the framework's `FW_TestRunResults` writes them |

## The data

Both files are written by the project's own Java, `framework.data.FW_TestRunResults`; nothing is built by a chat or a type tool.

- `results-data.js` sets `window.MAI_RESULTS`: one record per run, oldest first. Read again every 8 seconds; the page redraws only when the newest record changes.
- `run-status.js` sets `window.MAI_RUN_STATUS`: the run now going, or how the last one ended. Read again every 4 seconds.

A count the run did not report is null and shows as a dash. A run the framework records carries no build result, so its tests alone decide the verdict. The fields are listed in `template.yaml`.

## How it is seen working

In the browser console: `DASH_ENGINE_VERSION` names the engine, `TR_TEMPLATE_VERSION` this type's stamped code, and the page's `mai-page-template-version` meta tag the template it was founded from. With no data file yet, the Latest Run tag says so and names the file; with no status file, Run in Progress keeps its "No run has reported yet."

## Changing the type

Change the stamped files here only. Bump `templateVersion` in `template.yaml` with the files, and keep `VERSION` in `test-results.js` equal to its `@version`. The data schema is additive: fields are only ever added, and a field is added at the framework's `FW_TestRunResults` first. A changed `test-results.js` reaches every project at its next Launch.

---

*README.md v1.0.0*