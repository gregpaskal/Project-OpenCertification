// ===============================================================
// @file: user-guide-config.js
// @filepath: _docs/_dashboard/user-guide/user-guide-config.js
// @version: 1.0.0
// @updated: {{FOUNDED_AT}}
// @author: Greg Paskal & Claude
// @company: MissionWares®
// @description: The User Guide page's own settings, read by user-guide-export.js when it builds user-guide/user-guide-data.js from
//   CAPABILITIES.md (the page itself never loads this file). The value after the equals sign is plain JSON: double
//   quotes, no comments inside it. about finishes the sentence "You are the User Guide for ..." that Ask the User Guide starts
//   from; groups (each { "id", "name", "blurb" }) are the pill row and the sections, and a capability joins one with a
//   "**Guide group:** Name" bullet (no groups: one list); strict true makes every capability carry "You use it to" and a
//   known group, or the export fails; starters are the first questions offered; placeholder fills the Ask box; models
//   are the preferred models, first that exists wins. A FOUNDED file: the project's from birth.
// @tags: guide, settings, page-type
// @changeLog:
// Date        Author         Version        Description
// ----------  -------------  -------------  --------------------------
// {{FOUNDED_DATE}}  Greg & Claude  1.0.0          Founded from the User Guide page type (guide) 1.1.0
// ===============================================================

window.DASH_USER_GUIDE_CONFIG = {
  "about": "this project: a searchable guide to using its tools and processes. The reader is coming back after time away to learn how to use them again, or has a question about the project.",
  "groups": [],
  "strict": false,
  "starters": ["What can I do here?", "What changed lately?"],
  "placeholder": "how do I start something here?",
  "models": ["gemma3:27b", "llama3.1:8b"]
};