<!-- ===============================================================
@file: GLOSSARY-SCHEMA.md
@filepath: dashboard_engine/_framework/_templates/glossary/GLOSSARY-SCHEMA.md
@version: 1.7.0
@updated: 2026-11-13 05:16:26 PM CST
@author: Greg Paskal & Claude
@company: MissionWares®
@description: Lexicon Codex schema 1.3 addition: polysemy (meanings by listener domain, risk and drift), etymology and
visibility. Every new field is optional, so a term without them renders exactly as it does today in Lexicon and the
dashboard. Data only: nothing here says how anything looks.

  Since 1.7.0 it lives with the Glossary page type at the engine home, the contract for every project's glossary/glossary.json.
@tags: glossary, lexicon, codex-schema, polysemy, etymology, domain, data-format, page-type
@changeLog:
Date        Author         Version        Description
----------  -------------  -------------  --------------------------
2026-11-02  Greg & Claude  1.0.0          First spec, from the Risk at a glance mockups (locked at 6.2.1) and a study of the Lexicon engine (v3.44.0)
2026-11-02  Greg & Claude  1.1.0          Section 8: meaning risk, which ranks Meanings by domain riskiest first against ours
2026-11-02  Greg & Claude  1.2.0          Section 8: Meanings by domain is one row per domain in the bar's order; meaning risk retired
2026-11-02  Greg & Claude  1.3.0          Section 8: Other meanings; section 9: the Show other meanings setting
2026-11-02  Greg & Claude  1.4.0          Sections 7a to 7c: evidence through the Codex sources and references, the review flags, the vetting stamp (VETTING-PROCEDURE.md)
2026-11-03  Greg & Claude  1.5.0          Schema 1.4: section 7d catalogs (file level) and catalog_refs (term level), so a term names the OWASP AI Testing Guide tests and OWASP Top 10 entries it covers and coverage is derived; rule 13
2026-11-04  Greg & Claude  1.6.0          Schema 1.5: section 7e topics (file level, the Index), 7f illustration (term level), 7g the lab note in the Codex tribal_knowledge.real_world_note; rules 14 and 15
2026-11-13  Greg & Claude  1.7.0          Harvested into the Glossary page type (Greg): the source is glossary/glossary.json, the wrapper window.DASH_GLOSSARY; schema 1.6, section 7h curriculum.ask and rule 16; topics also drive the page's topic filter; the lab note is shown as In practice; domain colors come from a palette in domain order
=============================================================== -->

# GLOSSARY-SCHEMA.md

## 1. What this is

An addition to the Lexicon Codex schema (`CODEX-SCHEMA.md` 1.2 in the Lexicon engine). The Codex rule is that a minor
version means new optional fields, so this is **schema 1.3**, with catalogs (section 7d) **schema 1.4**, and with topics and illustrations (sections 7e, 7f) **schema 1.5**, and with Ask (section 7h) **schema 1.6**. Nothing existing changes, nothing existing is removed.

New term fields: `polysemy`, `etymology`, `visibility`, `review`, `vetting`, `catalog_refs`, `illustration`. New file-level fields: `listener_domains`, `catalogs`, `topics`, `ask`. Evidence uses the Codex's own top-level `sources` and per-term `references`, each with two optional additions (`url` and `supports` on a reference, `kind` and `accessed` on a source).

## 2. Two words that must not be confused

| Word | Where | Means |
|---|---|---|
| `domain` in `codex_metadata` | Existing Lexicon field | The **subject**: which book (`software-testing`). Untouched. |
| `listener_domains`, and `domain` inside a `polysemy` meaning | New | The **listener**: who reads over your shoulder (AI Lab, QA Engineer, ...). |

On screen the listener axis is called **Domain**. In data it only ever appears inside `listener_domains` or `polysemy`.

## 3. The separation rule

**Data** holds facts and judgments: meanings, weights, drift, reasons, sources, visibility, whether a value was measured.

**Presentation** holds everything about appearance and is never written into a term: domain colors, band widths,
positions on the gradient, label placement, motion. It lives in the renderer and its theme.

**Derived** values are computed by the renderer at read time and never stored: which meaning is ours, each domain's risk
level, its place on the gradient.

The test: the same term file must drive the dashboard Glossary, lexicon.missionwares.com and istqb.missionwares.com,
each drawing it its own way.

Existing Lexicon presentation fields (`curriculum.icon`, `curriculum.color`, `tribal_knowledge.emoji`, `popup_title`)
stay as they are, because the live site reads them. New fields add none.

## 4. File level: `listener_domains`

In a curriculum file it sits inside `curriculum`; in a future hub master it sits in `codex_metadata`.

```json
"listener_domains": {
  "default": "ai-lab",
  "domains": [
    { "id": "ai-lab", "name": "AI Lab" },
    { "id": "qa-engineer", "name": "QA Engineer" },
    { "id": "software-developer", "name": "Software Developer" },
    { "id": "business", "name": "Business" },
    { "id": "general-public", "name": "General Public" }
  ]
}
```

| Field | Required | Description |
|---|---|---|
| `default` | yes | The domain the page speaks in first. AI Lab here; QA Engineer on istqb.missionwares.com. |
| `domains` | yes | Every listener domain, in display order. `id` is lowercase hyphenated, like `term_id`. |

## 5. Term level: `polysemy`

```json
"polysemy": {
  "home_domain": "qa-engineer",
  "meanings": [ ... ],
  "drift": { ... },
  "judgment": { "measured": false, "by": "Claude", "reviewed_by": "Greg", "date": "2026-11-02" }
}
```

| Field | Required | Description |
|---|---|---|
| `home_domain` | no | The domain that owns this word's meaning even when the page speaks in the default domain. `result` is at home in QA Engineer and used in the AI Lab. |
| `meanings` | yes | Every meaning of the word, ours included. |
| `drift` | no | How much each domain disagrees with itself about the word. A domain left out has drift 0. |
| `judgment` | yes | Where the numbers came from. `measured: false` means judgment, and every page that shows the numbers says so. |

### 5.1 A meaning

```json
{ "meaning_id": "test-result", "name": "Test result: PASS, WARN, FAIL", "official": true, "domain": "qa-engineer",
  "weights": { "ai-lab": 2, "qa-engineer": 4, "software-developer": 3, "business": 1, "general-public": 0 } }
```

| Field | Required | Description |
|---|---|---|
| `meaning_id` | yes | Lowercase hyphenated, unique within the term. |
| `name` | yes | Short label for the meaning. |
| `text` | yes, unless `official` | The meaning's definition. |
| `official` | no | `true` on the one meaning that is the term's `definitions.official`; it takes its text and source from there, so the definition is never written twice. |
| `source_id` | no | Where the meaning comes from, from the Codex `sources` list. ISTQB wording stays distinct from Greg's. |
| `domain` | yes | The listener domain that most owns this meaning. |
| `weights` | yes | Per domain id, how strongly that domain hears the word this way. A domain left out is 0. |

**Weights scale:** 0 never hears it this way · 1 rarely · 2 sometimes · 3 often · 4 first and foremost.

Weights are keyed by domain id, not by position, so a sixth domain can be added without touching existing terms.

### 5.2 Drift

```json
"drift": {
  "qa-engineer": { "level": 2, "reason": "Split into actual result, expected result and test result (all ISTQB)." },
  "ai-lab": { "level": 2, "reason": "Result and output are used for the same thing." }
}
```

**Drift scale:** 0 firm · 1 a little · 2 noticeable · 3 the domain disagrees with itself.

`reason` is plain text, one sentence, shown in the hover note on the band.

## 6. Term level: `etymology`

```json
"etymology": { "text": "Latin *resultare*, \"to spring back\". What springs back from an action: in testing, the verdict of a run.", "source_id": "mai-ai-lab", "confidence": "established" }
```

| Field | Required | Description |
|---|---|---|
| `text` | yes | Plain text. A word in `*asterisks*` is a foreign or root word; the renderer decides how to show it. |
| `source_id` | no | Where the etymology comes from. |
| `confidence` | yes | `established` (dictionaries agree) · `probable` (likely, not settled) · `folk` (a popular story, not supported). |

## 7. Term level: `visibility`

`"public"` (the default when absent) or `"private"`. A private term (Learning Card, the fingerprint names) appears on
the project dashboard and never on a public site.

## 7a. Evidence: Codex `sources` and `references`

Evidence reuses the Lexicon Codex objects as they are, so the Lexicon engine reads them unchanged.

**`sources`** (top level, one entry per page or document cited):

```json
{ "source_id": "wikipedia-token-disambiguation", "title": "Token (disambiguation)", "type": "article", "kind": "encyclopedia", "publisher": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Token", "accessed": "2026-11-02", "license_notes": "CC BY-SA 4.0" }
```

`type` keeps the Codex values (`syllabus`, `glossary`, `standard`, `book`, `article`, `specification`). The optional `kind` says more (`dictionary`, `documentation`, `encyclopedia`, `paper`, `glossary`). The project's own sources (`mai-ai-lab`, `istqb-glossary`, `etymonline`) stay as broad entries.

**`references`** (per term, Codex field):

```json
{ "source_id": "wikipedia-token-disambiguation", "supports": "meaning:crypto-token", "context": "Lists the crypto token sense among the main uses of the word.", "usage_type": "definition", "accessed": "2026-11-02" }
```

| Field | Required | Description |
|---|---|---|
| `source_id` | yes | An entry in `sources`. |
| `supports` | yes | What the reference backs: `definition`, `fact`, `etymology`, `meaning:<meaning_id>` or `drift:<domain id>`. |
| `context` | no | One sentence in our own words: what the page showed. Never copied text. |
| `usage_type` | no | Codex values: `definition`, `explanation`, `example`, `contrast`, `application`. |
| `accessed` | no | The date the page was read. |

## 7b. Term level: `review`

```json
"review": { "status": "needs-review", "flags": [ { "code": "F1", "field": "etymology", "reason": "Two dictionaries give different roots." } ], "decided_by": null }
```

`status` is `clear` or `needs-review`. `flags` use the codes F1 to F6 of VETTING-PROCEDURE.md section 6. A `needs-review` term has at least one flag. When Greg decides, the flags are resolved and `decided_by` records him.

## 7c. Term level: `vetting`

```json
"vetting": { "procedure": "1.1.0", "date": "2026-11-02", "by": "Claude", "checked": true, "notes": ["Considered a business meaning; one source only, not added."] }
```

Which version of VETTING-PROCEDURE.md the term passed, when, by whom, and whether the independent check covered it. `notes` (optional) records what the research considered and set aside, and disagreements about things our text does not claim (VETTING-PROCEDURE.md section 6a).

## 7d. Catalogs: `catalogs` (file level) and `catalog_refs` (term level)

A catalog is an outside, numbered list that terms answer to: the OWASP AI Testing Guide's tests, the OWASP Top 10 for LLM Applications, the OWASP Top 10 for Agentic Applications. The file holds each catalog once, with every entry, so coverage can be derived; a term names the entries it covers.

```json
"catalogs": [ { "catalog_id": "owasp-aitg", "name": "OWASP AI Testing Guide", "publisher": "OWASP Foundation", "version": "1.0", "url": "https://owasp.org/www-project-ai-testing-guide/", "term_id": "owasp-ai-testing-guide", "entry_label": "Test", "source_id": "owasp-aitg",
  "entries": [ { "id": "AITG-APP-01", "title": "Testing for Prompt Injection", "group": "Application", "url": "https://..." } ] } ]
```

```json
"catalog_refs": [ { "catalog": "owasp-aitg", "id": "AITG-APP-11" }, { "catalog": "owasp-llm-top10-2025", "id": "LLM09:2025" } ]
```

| Field | Required | Description |
|---|---|---|
| `catalog_id` | yes | Unique. Terms refer to it. |
| `name`, `entries` | yes | Each entry has a unique `id` and a `title` as the catalog gives them; `url` and `group` optional. |
| `term_id` | no | The glossary term that describes the catalog itself; its card shows the Coverage table. |
| `entry_label` | no | What an entry is called (Test, Risk). |
| `catalog_refs[].catalog`, `.id` | yes | A known catalog and one of its entry ids. A term may cover several entries; an entry may be covered by several terms. |

The renderer derives coverage (which entries have a term, and which have none); nothing about coverage is stored.

## 7e. Topics (file level, in `curriculum`)

The Index: every term in exactly one topic, topics in a learning order, terms in a learning order within each. With two or more topics the page also offers the topic filter: the reader picks one or more topics to focus on.

```json
"topics": [ { "id": "how-models-work", "name": "How models work", "description": "What a model is, what it is made of, and how it picks each next word.", "terms": ["model", "model-family", "parameter"] } ]
```

| Field | Required | Description |
|---|---|---|
| `id` | yes | Lowercase hyphenated, unique. |
| `name` | yes | Shown as the topic's title, and on each card's topic line. |
| `description` | no | One sentence. |
| `terms` | yes | term_ids in reading order. Each term belongs to exactly one topic. |

## 7f. Term level: `illustration`

```json
"illustration": { "file": "glossary/illustrations/token.svg", "alt": "A sentence cut into six colored token boxes...", "caption": "Four words, six tokens." }
```

| Field | Required | Description |
|---|---|---|
| `file` | yes | An svg or png under `glossary/illustrations/`, relative to the page. Several terms may share one file. |
| `alt` | yes | What the picture shows, in words, for anyone who cannot see it. |
| `caption` | no | One line under the picture: what to take from it. |

The drawing is content, so its own colors live in the file; the page decides only where and how large it appears.

## 7g. The lab note: Codex `tribal_knowledge.real_world_note`

What the project measured or worked through for the term (for example tokens per second on this Mac). Shown as **In
practice**. It reuses the Codex field as it is, so the Lexicon engine reads it unchanged.

## 7h. Ask (file level, in `curriculum`)

```json
"ask": { "about": "The reader is an experienced software tester learning how AI really works.", "models": ["gemma3:27b", "llama3.1:8b"] }
```

| Field | Required | Description |
|---|---|---|
| `about` | no | One sentence on who reads the glossary. Ask's instructions open "You are the Ask helper in <curriculum.name>." and then this line. |
| `models` | no | Preferred models, the first one present on the Mac wins until the reader picks another. |

## 8. What the renderer derives (never stored)

| Value | Rule |
|---|---|
| Ours | In the default domain with a `home_domain` set: the home domain's strongest meaning. Otherwise: the active domain's strongest meaning. |
| Hold on ours | The domain's weight for the ours meaning. |
| Pull away | The domain's highest weight for any other meaning. |
| Risk | `2 + pull away - hold on ours + drift / 2`, kept within 0 to 4: 0 understood as ours, 4 very likely misread. |
| Band position and width | Position from risk, width from drift. Scales live in the renderer. |
| Heard meaning | For each domain, the meaning it weights highest; on a tie, ours. |
| Meanings by domain | One row per domain, built from the same risk values as the bands: the domain that owns ours first, then the rest from riskiest to least (the bar read right to left). Each row shows the meaning that domain hears and its risk word. Then one closing **Other meanings** row. |
| Other meanings | Every meaning that is neither ours nor any domain's heard meaning, with the domains that hear it at all. They have no place on the bar, because no listener group hears them first. |
| Other marker | When the viewer turns it on, a "+N other" marker on the right of the box title, its rollover listing the other meanings. Off by default. It raises awareness of readings the chosen domains would not expect. |

## 9. Theme (presentation, not data)

Held by the renderer, overridable per viewer in Glossary settings, remembered per browser:

| Setting | Default |
|---|---|
| Domain colors | By the order `listener_domains.domains` lists them: `#ffffff`, `#d2a8ff`, `#58a6ff`, `#f778ba`, `#9aa5b5`, `#ffa657`, `#7ee787`, then round again. Cyan is reserved for "ours". |
| Motion | Follow system (On, Off, Follow system). Duration 700 ms, stagger 35 ms, easing `cubic-bezier(0.16, 1, 0.3, 1)`. |
| Show other meanings on the bar | Off. |

## 10. Validation (glossary-export.js)

1. `polysemy.meanings` has at least two meanings, `meaning_id` unique within the term.
2. At most one meaning has `official: true`; a meaning without it has `text`.
3. Every `domain`, `home_domain`, `weights` key and `drift` key is an id in `listener_domains`.
4. Weights are whole numbers 0 to 4; drift levels are whole numbers 0 to 3, each with a `reason`.
5. `judgment.measured` is present.
6. `etymology.confidence` is one of the three values.
7. `visibility` is `public` or `private` when present.
8. No new field carries a color, a size, a position or an emoji.
9. Every `sources` entry has a unique `source_id`; a `url`, when given, is https.
10. Every reference names a known source, and `supports` names a real meaning or listener domain when it points at one.
11. `review.status` is `clear` or `needs-review`; a `needs-review` term has flags; every flag code is F1 to F6 and has a field and a reason.
12. `vetting.procedure` is a version number.
13. Every catalog has a unique `catalog_id`, a name and entries with unique ids and titles; urls are https; a catalog's `term_id` is a term; every `catalog_refs` entry names a known catalog and one of its entry ids. The export prints each catalog's coverage.
14. Topics: unique lowercase ids, each with a name and terms; every term is in exactly one topic.
15. An illustration's file is an svg or png under `glossary/illustrations/` that exists, and its `alt` describes it.
16. `curriculum.ask`, when present, is an object; `about` is a sentence and `models` a list of model names.

## 11. Compatibility

- A term without the new fields renders as today in Lexicon and the dashboard.
- Lexicon's `app.js` reads named fields, which suggests it ignores fields it does not know. **Not yet verified**; verify
  before any term carrying these fields is served by the Lexicon engine.
- Lexicon's build and validate tools are Python; this project's are Node (`glossary-export.js`). Which one the hub uses
  is decided on the hub day (Innovation Ledger line 10).

---

*GLOSSARY-SCHEMA.md v1.7.0*