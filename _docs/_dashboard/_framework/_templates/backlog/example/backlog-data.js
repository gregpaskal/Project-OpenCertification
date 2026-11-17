// ===============================================================
// @file: backlog-data.js
// @filepath: _docs/_dashboard/backlog/backlog-data.js
// @version: 1.0.0
// @updated: {{FOUNDED_AT}}
// @author: Greg Paskal & Claude
// @company: MissionWares®
// @description: The Backlog page's data (window.DASH_BACKLOG, schema 1.0.0 in the Backlog type's template.yaml): the
//   project's future work as numbered items in optional groups. A FOUNDED file: copied once when the page was founded,
//   then the project's own. A new item takes the number in next (BL-001, BL-002, ...) and next goes up by one; a number
//   is never changed or reused. Regrouping changes an item's group, never its number. A finished item leaves for the
//   Completed record with its number. Loaded by <script src> (file:// safe), never fetched.
// @tags: dashboard, page-type, backlog, data
// @changeLog:
// Date        Author         Version        Description
// ----------  -------------  -------------  --------------------------
// {{FOUNDED_DATE}}  Greg & Claude  1.0.0          Founded from the Backlog page type 1.0.0, empty
// ===============================================================

window.DASH_BACKLOG = {
  schema: '1.0.0',
  next: 1,
  groups: [],
  items: []
};