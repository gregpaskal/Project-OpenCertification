// ===============================================================
// @file: diagrams-data.js
// @filepath: dashboard_engine/_framework/_templates/diagrams/example/diagrams-data.js
// @version: 1.0.1
// @updated: 2026-11-12 08:09:17 PM CST
// @author: Greg Paskal & Claude
// @company: MissionWares®
// @description: The Diagrams page's data, one entry per diagram (schema 1.0.0 in template.yaml). A FOUNDED file: AiAssist
//   copies it once when it founds the page and never overwrites it; from then on it belongs to the project and grows as
//   diagrams are added. Loaded by <script src> (file:// safe), never fetched. Additive: fields are only ever added, an
//   unknown field is ignored, a missing field shows blank. The SVG named by file lives in diagrams/svg/.
// @tags: dashboard, page-type, diagram, data, template
// @changeLog:
// Date        Author         Version        Description
// ----------  -------------  -------------  --------------------------
// 2026-11-12  Greg & Claude  1.0.0          The Diagrams page's data file, schema 1.0.0, with one example entry
// 2026-11-12  Greg & Claude  1.0.1          Moved with the engine: the page types now live in dashboard_engine/_framework/_templates/, so AiAssist copies them with the engine (framework entry "- _framework/"); @filepath follows, template 1.0.1
// ===============================================================
window.DASH_DIAGRAMS = {
  "schema": "1.0.0",
  "diagrams": [
    {
      "id": "dg-example",
      "file": "dg-example.svg",
      "title": "HOW A DIAGRAM REACHES THIS PAGE",
      "added": "2026-11-12",
      "summary": "The example every founded Diagrams page starts with: an SVG filed in diagrams/svg/, one entry in diagrams-data.js, and the page draws the card. Replace it with the project's first real diagram."
    }
  ]
};