<!-- ===============================================================
@file: {{FOUNDED_DATE}}-keeping-a-journal.md
@filepath: _docs/_dashboard/journal/{{FOUNDED_DATE}}-keeping-a-journal.md
@version: 1.0.0
@updated: {{FOUNDED_AT}}
@author: Greg Paskal & Claude
@company: MissionWares®
@description: What this Journal is for, what makes an entry, and how one is added and rebuilt. The first entry,
  founded with the page; replace or keep it.
@title: Keeping this journal
@status: seed
@terms:
@related:
@tags: journal, how-to
@changeLog:
Date        Author         Version        Description
----------  -------------  -------------  --------------------------
{{FOUNDED_DATE}}  Greg & Claude  1.0.0          Founded with the Journal page
=============================================================== -->

# {{FOUNDED_DATE}}-keeping-a-journal.md

## What belongs here

Knowledge worth keeping that is not a rule, a capability or a term: what was tried and what it showed, a design talked through, a lesson learned the hard way. A rule goes in the methodology, a capability in `CAPABILITIES.md`, a word in the Glossary. The Journal holds the thinking between them.

The picture: a lab notebook. It is dated, it is honest about what is still uncertain, and anyone who picks it up later can follow the reasoning.

## What makes an entry

- One Markdown file per entry in `journal/`, named `YYYY-MM-DD-words-in-lowercase.md`.
- The mAi header with `@title`, `@status` (seed, growing or settled), `@tags`, and optionally `@terms` (glossary term ids, when the project has a Glossary) and `@related` (other entry ids).
- The H1 is the full filename, and the last line names the file and its version, the same version as the header.

## Adding one

1. Write the file in `journal/`.
2. Rebuild: `node _docs/_dashboard/_framework/_templates/journal/journal-export.js` from the repo root, or say **update the journal**.
3. Land `journal/journal-data.js` and `journal/docs-data.js`.

The export checks every rule and writes nothing if one breaks.

*{{FOUNDED_DATE}}-keeping-a-journal.md v1.0.0*