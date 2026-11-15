// ===============================================================
// @file: journal-config.js
// @filepath: _docs/_dashboard/journal/journal-config.js
// @version: 1.0.0
// @updated: {{FOUNDED_AT}}
// @author: Greg Paskal & Claude
// @company: MissionWares®
// @description: The Journal page's own settings, read by journal-export.js when it builds journal/journal-data.js and
//   journal/docs-data.js (the page itself never loads this file). The value after the equals sign is plain JSON: double
//   quotes, no comments inside it. docs are the technical documents Search indexes, as .md paths from the project root,
//   each split at its ## headings so a hit lands on a section; a listed doc that does not exist is skipped with a note.
//   A FOUNDED file: the project's from birth.
// @tags: journal, settings, page-type
// @changeLog:
// Date        Author         Version        Description
// ----------  -------------  -------------  --------------------------
// {{FOUNDED_DATE}}  Greg & Claude  1.0.0          Founded from the Journal page type 1.0.0
// ===============================================================

window.DASH_JOURNAL_CONFIG = {
  "docs": ["_docs/_capabilities/CAPABILITIES.md"]
};