// ===============================================================
// @file: completed-data.js
// @filepath: _docs/_dashboard/completed/completed-data.js
// @version: 1.0.0
// @updated: {{FOUNDED_AT}}
// @author: Greg Paskal & Claude
// @company: MissionWares®
// @description: The Completed page's data (window.DASH_COMPLETED, schema 1.0.0 in the Completed type's template.yaml):
//   the one record of finished work, one entry per finished feature (its board id) or backlog item (its BL- number),
//   each completion dated. A FOUNDED file: copied once when the page was founded, then the project's own. A reopened
//   entry that finishes again gains a second completion. Loaded by <script src> (file:// safe), never fetched.
// @tags: dashboard, page-type, completed, data
// @changeLog:
// Date        Author         Version        Description
// ----------  -------------  -------------  --------------------------
// {{FOUNDED_DATE}}  Greg & Claude  1.0.0          Founded from the Completed page type 1.0.0, empty
// ===============================================================

window.DASH_COMPLETED = {
  schema: '1.0.0',
  entries: []
};