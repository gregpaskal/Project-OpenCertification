<!-- ===============================================================
@file: README.md
@filepath: dashboard_engine/_framework/_templates/README.md
@version: 1.7.0
@updated: 2026-11-14 07:07:33 PM CST
@author: Greg Paskal & Claude
@company: MissionWares®

@description:
The page-template law for the Living Dashboard: what a page type
is, the two naming rules, where a type lives here and in a project,
which files a project owns and which AiAssist copies, how a chat
founds a page from a type, what to do when no type fits, the
additive data law, the style gate, page identity, repeatable types, shared parts and built data, where Dashboard
Templates (the one list of types) lives, and how the library grows. These are the masters AiAssist copies into
every project's _docs/_dashboard/_framework/ with the engine; a
chat in any project reads this file there, over the wire, before
it adds a page.

@tags: templates, page-types, dashboard, engine, founding, harvest, dashboard-templates, additive-data-law, repeatable, shared-parts

@changeLog:
Date        Author         Version        Description
----------  -------------  -------------  --------------------------
2026-11-12  Greg & Claude  1.0.0          Founded with the Diagrams page type (Greg: one folder per page type, common CSS and JS, a _templates folder beside _framework and _tools; Diagrams first; the two-tree layout approved)
2026-11-12  Greg & Claude  1.1.0          THE LIBRARY TRAVELS AND GROWS (Greg: use this across our projects; great dashboard pages found elsewhere are brought here and added): the types moved inside the engine (dashboard_engine/_framework/_templates/), so the one framework entry "- _framework/" copies them into every project with the engine and the framework phrase covers them; _framework/ is readable over the wire and never written (courier 2.32.0, file lane 1.4.0), so a chat founds a page by reading its type where it already is; new sections FOUNDING A PAGE, WHEN NO TYPE FITS and GROWING THE LIBRARY; the catalog reads Diagrams 1.0.1
2026-11-13  Greg & Claude  1.2.0          ONE LIST, DASHBOARD TEMPLATES (Greg: call the catalog Dashboard Templates; no point in two documents that do the same thing): the table of types leaves this file for dashboard-templates-data.js beside it, which the Dashboard Templates page draws and every chat reads; THE CATALOG becomes DASHBOARD TEMPLATES, a pointer; FOUNDING A PAGE step 2, GROWING THE LIBRARY step 7, Page identity and both trees follow
2026-11-13  Greg & Claude  1.3.0          The Listing page type joins (harvested from this project's Dashboard Templates page): REPEATABLE TYPES, a type founded many times under names chosen at founding (repeatable and ask in template.yaml); naming rule 1, FOUNDING A PAGE steps 1, 4 and 5 (the page tokens PAGE_SLUG, PAGE_TITLE, MENU_NAME, PAGE_INTRO, FOUNDED_DATE), Page identity (LST_TEMPLATE_VERSION) and both trees follow
2026-11-13  Greg & Claude  1.4.0          The Guide page type joins (harvested from Project-AI-Local) with the first shared part, Ask (Greg: Ask becomes a shared part, Guide first): SHARED PARTS (_framework/_parts/, named by a type's uses) and BUILT DATA (a type's build tool writes its data from a project source, at founding and on request); FOUNDING A PAGE step 5 and 9, Page identity (GD_TEMPLATE_VERSION) and both trees follow
2026-11-13  Greg & Claude  1.5.0          The guide type is renamed user-guide (Greg: get everything changed over to user guide): both trees, SHARED PARTS, BUILT DATA ("update the user guide") and Page identity (UG_TEMPLATE_VERSION) follow
2026-11-13  Greg & Claude  1.6.0          The Glossary, Journal and Instruments page types join (harvested from Project-AI-Local; Greg: add all three so we can streamline this process): both trees, SHARED PARTS (the Glossary uses Ask), BUILT DATA ("update the glossary", "update the journal") and Page identity (GL_, JN_, IN_TEMPLATE_VERSION) follow; FOUNDING A PAGE step 5 names LANE_TOPIC
2026-11-14  Greg & Claude  1.7.0          The Test Results page type joins (harvested from Automation-JAV-Framework's Results page; Greg: add the Results page, call it Test Results): both trees, BUILT DATA (data the project's own code writes) and Page identity (TR_TEMPLATE_VERSION) follow
=============================================================== -->

# README.md

## What a page type is

A page type is a kind of dashboard page any project can carry, built once here and copied by AiAssist into every project, so a good page is not reinvented in every project. Each type has one folder here with a `template.yaml` that machines and chats read and a `README.md` that people read.

**The library grows.** When Greg finds a great dashboard page in one project, he brings it to Project-mAi-Methodology and it is harvested here as a new type (GROWING THE LIBRARY, below). Dashboard Templates, the list in `dashboard-templates-data.js` beside this file, is the list at this moment, not a fixed set: before adding any page, read it again, because a type may have arrived since the last time you looked.

## The two naming rules

1. **One folder per page type, named exactly like the page:** `_templates/diagrams/` makes `diagrams.html`, and the page's own data folder is `diagrams/`. A repeatable type (REPEATABLE TYPES, below) is the one exception: each page takes the slug chosen when it is founded, so `_templates/listing/` makes `reading-list.html` and `reading-list/`.
2. **A leading underscore means machines own it; no underscore means the project owns it** (the convention of `_framework/` and `_data/`).

## Here, at the engine home

```
dashboard_engine/
├── README.md                     the engine law and its gates
├── index.html                    the founding template for Home (AiAssist uses it once)
├── _tools/
│   └── wire.js
└── _framework/                   everything AiAssist copies into every project
    ├── dashboard.js
    ├── styles.css                the base stylesheet
    ├── _parts/                   shared parts: code more than one page type loads (SHARED PARTS, below)
    │   └── ask/                  ask-link.js, ask-prompt.js, README.md
    └── _templates/               every page type a dashboard can have
        ├── README.md             this file: the page-type law
        ├── dashboard-templates-data.js   DASHBOARD TEMPLATES: the one list of types
        ├── diagrams/             OPTIONAL
        │   ├── template.yaml
        │   ├── README.md
        │   ├── diagrams.html     the starting page
        │   ├── diagrams.js       cards and the viewer
        │   ├── diagrams.css      its one stylesheet
        │   └── example/          what a new page starts with
        │       ├── diagrams-data.js
        │       └── svg/dg-example.svg
        ├── glossary/             OPTIONAL, USES ask
        │   ├── template.yaml
        │   ├── README.md
        │   ├── GLOSSARY-SCHEMA.md    the data contract (Lexicon Codex schema 1.6)
        │   ├── glossary.html     the starting page
        │   ├── glossary.js       cards, Index, search, topic filter, Risk at a glance
        │   ├── glossary-ask.js   Ask on every card
        │   ├── glossary.css      its one stylesheet
        │   ├── glossary-export.js    validates glossary.json and builds the data
        │   └── example/
        │       └── glossary.json
        ├── instruments/          OPTIONAL
        │   ├── template.yaml
        │   ├── README.md
        │   ├── instruments.html  the starting page
        │   ├── instruments.js    reads the instrument lane, gauges, runs, learning cards
        │   ├── instruments.css   its one stylesheet
        │   └── example/
        │       └── instruments-config.js
        ├── journal/              OPTIONAL
        │   ├── template.yaml
        │   ├── README.md
        │   ├── journal.html      the starting page
        │   ├── journal.js        views by date, tag and term, the Reader
        │   ├── journal-search.js     one search across terms, entries and docs
        │   ├── journal.css       its one stylesheet
        │   ├── journal-export.js     validates the entries and builds the data
        │   └── example/
        │       ├── journal-config.js
        │       └── keeping-a-journal.md
        ├── listing/              OPTIONAL, REPEATABLE
        │   ├── template.yaml
        │   ├── README.md
        │   ├── listing.html      the starting page
        │   ├── listing.js        draws every table on the page
        │   ├── listing.css       its one stylesheet
        │   └── example/          what a new page starts with
        │       └── listing-data.js
        ├── test-results/         OPTIONAL, mAi Framework projects
        │   ├── template.yaml
        │   ├── README.md
        │   ├── test-results.html the starting page
        │   ├── test-results.js   reads the framework's run files, redraws when they change
        │   └── test-results.css  its one stylesheet
        └── user-guide/           OPTIONAL, USES ask
            ├── template.yaml
            ├── README.md
            ├── user-guide.html   the starting page
            ├── user-guide.js     cards, search, What's new, Ask the User Guide
            ├── user-guide.css    its one stylesheet
            ├── user-guide-export.js   builds the data from CAPABILITIES.md
            └── example/
                └── user-guide-config.js
```

Home, Backlog and Lanes become types of their own in a later pass; until then Home is founded from `index.html` by AiAssist and the others are drawn by the engine or written by hand.

## There, in a project's _docs/_dashboard/

```
_docs/_dashboard/
├── index.html                Home          (the project's, founded once)
├── backlog.html              Backlog       (the project's)
├── diagrams.html             Diagrams      (only once founded)
├── glossary.html             Glossary      (only once founded)
├── instruments.html          Instruments   (only once founded)
├── journal.html              Journal       (only once founded)
├── reading-list.html         a Listing page (as many as are founded, each under its own slug)
├── test-results.html         Test Results  (only once founded; reads ../_test_results/, which the framework writes)
├── user-guide.html           User Guide    (only once founded)
├── backlog/                  the Backlog's own data
├── diagrams/                 the Diagrams page's own data (only once founded)
│   ├── diagrams-data.js
│   └── svg/
├── glossary/                 the Glossary's terms and its built data
│   ├── glossary.json         the single source of truth, edited by the project
│   ├── glossary-data.js      built from glossary.json, never edited
│   └── illustrations/        pictures terms name
├── instruments/              the Instruments page's settings
│   └── instruments-config.js
├── journal/                  one Markdown file per entry, the settings and the built data
│   ├── YYYY-MM-DD-words.md
│   ├── journal-config.js
│   ├── journal-data.js       built, never edited
│   └── docs-data.js          built, never edited
├── reading-list/             that Listing page's own data
│   └── reading-list-data.js
├── user-guide/               the User Guide's settings and its built data
│   ├── user-guide-config.js
│   └── user-guide-data.js    built from CAPABILITIES.md, never edited
├── _framework/               COPIED by AiAssist at Launch; readable over the wire, never written
│   ├── dashboard.js
│   ├── styles.css
│   ├── _parts/               every shared part
│   └── _templates/           every page type, used or not
│       ├── README.md         this file: the law a chat follows
│       ├── dashboard-templates-data.js   DASHBOARD TEMPLATES: the list a chat reads
│       ├── diagrams/         here when not used: a page the dashboard can have
│       ├── glossary/         the same
│       ├── instruments/      the same
│       ├── journal/          the same
│       ├── listing/          the same
│       ├── test-results/     the same
│       └── user-guide/       the same
└── _data/                    written by the courier and Launch only
```

Page files sit at the root because a page opened as `file://` reaches `_framework/`, `_data/` and the other pages by relative paths; a page inside a folder would break every one of them, and every link to it.

## Who owns what

- **Copied with the engine:** this whole folder sits inside `_framework/`, and every project's config names the engine with one entry, `- _framework/`, so AiAssist copies every type into `_framework/_templates/` at every Launch, used or not, and the Living Dashboard phrase covers them. A type changed or added here reaches every project at its next Launch. Never edited in a project (Core_16 law 6). Over the wire `_framework/` is readable and never written: the courier refuses every change to it in code, whatever a project's rules say.
- **Founded:** adding a page copies the files `template.yaml` names under `found`, once, tokens swapped (founding refuses if a token survives). They belong to the project from then on and are never overwritten (FOUNDED, NOT SYNCED, Core_16): the page at the root and its data folder.
- **Machine-written:** `_data/` stays the courier's and Launch's alone (Core_16 law 7). A page's own data is founded and lives in its data folder, where the wire may land it.

## Founding a page

When Greg asks for a page ("add a diagram page to our dashboard"), a chat in any project does this, over the wire, in order. This section is the one home of these steps: the `dashboard-engine` tool's triggers and lookalikes lead a chat here, and the tool does not repeat them.

1. **Is it there already?** List `_docs/_dashboard/`. A page file with the type's name, or a page whose `mai-page-type` meta names the type, means the page exists: say so and stop. For a repeatable type, only a page file with the chosen slug means it exists; other pages of the same type are expected. Founding never overwrites; a page is founded again only when Greg asks for exactly that.
2. **Read Dashboard Templates:** `_docs/_dashboard/_framework/_templates/dashboard-templates-data.js`, the list as the project holds it, beside this file. Choose by what the page is for, not by its name alone: "a page for our architecture drawings" is Diagrams.
3. **No type fits:** follow WHEN NO TYPE FITS, below.
4. **Read the type:** its `template.yaml` (the `found` list and the data schema) and its `README.md`, from `_framework/_templates/<type>/`. When it lists `ask`, put those questions to Greg in order before building anything; their answers become the page tokens and the data.
5. **Build each founded file:** read the `from` file from `_framework/_templates/<type>/`; swap every token its entry lists: `{{PROJECT_KEY}}` is the project's routing key (the lowercased registered name the wire uses), `{{PROJECT_NAME}}` the project's name as Greg writes it, `{{FOUNDED_AT}}` the time from `TZ=America/Chicago date` (`{{FOUNDED_DATE}}` its day, YYYY-MM-DD). A type with `ask` adds the page tokens its README defines (Listing: `{{PAGE_SLUG}}`, `{{PAGE_TITLE}}`, `{{MENU_NAME}}`, `{{PAGE_INTRO}}`; Instruments: `{{LANE_TOPIC}}`), and a `to` path may carry `{{PAGE_SLUG}}`, swapped the same way. A type with `build` also builds its data with its tool (BUILT DATA, below) and delivers what the tool writes with the founded files. Then search the result for `{{`: if any token survives, stop and say which.
6. **Deliver each file as an add** to `_docs/_dashboard/<to>` (`wire.js put` with no base). The dashboard's built-in rules allow html, css, js, svg, json, md and txt there; an add refuses if the file exists, which is the second guard against overwriting. Report the delivery table.
7. **It joins the menu by itself:** the courier adds every page it lands to `_data/site-data.js`, and the PAGES group of every page shows it. Nobody edits a menu.
8. **Prove it:** Greg hard-reloads the page; the console answers `DASH_ENGINE_VERSION` for the engine and the type's own announcement (its README names it, `DG_TEMPLATE_VERSION` for Diagrams); the page's `mai-page-template-version` meta names the template version it was founded from.
9. **Fill it:** the starting data is an example. Replace it with the project's own, in the page's data folder, by the type's README (for Diagrams, "Adding a diagram"). Built data is already the project's own: the User Guide shows the project's capabilities from the first load.

Never: copy a page from another project (it carries that project's content and an unknown version); edit or write anything under `_framework/`; build a page by hand when a type fits.

## When no type fits

Build the page for this project by hand: Core_16's structure, the base stylesheet's tokens, one stylesheet of its own only if it needs selectors the base lacks (the style gate). Then put one row on the project's board: "harvest candidate: <page>". A page that proves itself is how the library grows; the next time Greg sees it, it can come here.

## Repeatable types

Most types make one page per project. A type whose `template.yaml` says `repeatable: true` may be founded many times, each page under a slug chosen at founding: the slug names the page file and its data folder in place of the type's name, and `mai-page-type` still names the type. Its `ask` list holds the questions put to Greg before founding, in order. Listing is the first; its README names its tokens.

## Shared parts

A shared part is code more than one page type loads, kept once in `_framework/_parts/<part>/` and stamped with the engine like a type, but founded nowhere: no page is made from it. A type names the parts it loads in its `template.yaml` (`uses: [ask]`), and its starting page loads them from `_framework/_parts/`. Each part's README is its law. The Ask part (`_parts/ask/`: the User Guide first, then the Glossary) is the only one so far.

## Built data

Some types' data is not copied but built from a project source: `template.yaml` names the tool under `build` (its `tool`, what it `reads`, what it `writes`). The tool is stamped with the type; a chat reads the inputs and the project's own copy of the tool over the wire into a folder laid out as the project, runs it, and lands what it writes (an add at founding, an update after). Built data is never edited by hand; it is built again when its source changes (the User Guide: "update the user guide"; the Glossary: "update the glossary"; the Journal: "update the journal"). One type's data is neither copied nor built: Test Results reads `_docs/_test_results/`, which the project's own mAi Framework code writes as its tests run, so its `build` is null and no chat ever writes that data.

## The additive data law

A page's data has a schema version and a field list in `template.yaml`. Within a major version a field is only ever added: never renamed, retyped or removed. A page reads the fields it knows, ignores the rest, and shows a missing field blank: no error, no invented default. A retired field stops being written and is marked retired in the schema with its date. So an old page keeps working on new data, and a new page works on old data.

## The style gate

One base stylesheet plus one stylesheet per page type as needed (Greg, 2026-11-12). `_framework/styles.css` is the base and holds every token. A type adds one stylesheet in its folder only when it has selectors of its own, and only those; no selector appears in two stylesheets. The engine README's gates 3 and 4 check this across the whole set.

## Page identity

A page founded from a type carries `<meta name="mai-page-type">` (the type's name, exactly as its folder) and `<meta name="mai-page-template-version">` (the type's `templateVersion` when it was founded). Its copied code announces itself in the console (`DG_TEMPLATE_VERSION` for Diagrams, `LST_TEMPLATE_VERSION` for Listing, `UG_TEMPLATE_VERSION` for User Guide, `GL_TEMPLATE_VERSION` for Glossary, `JN_TEMPLATE_VERSION` for Journal, `IN_TEMPLATE_VERSION` for Instruments, `TR_TEMPLATE_VERSION` for Test Results; a shared part as its README says), as the engine does with `DASH_ENGINE_VERSION`. Section ids are stable across template versions (Core_16 law 3): a version may add or reorder sections, never rename one. These two tags are what a later review compares against Dashboard Templates to find pages founded from an older template.

## Dashboard Templates

The list of page types is one file, `dashboard-templates-data.js`, beside this one (`window.DASH_TEMPLATES`): one row per type, in the order types arrive, with its type, page, need, version, what it is and where it was harvested from. It is the only list. The Dashboard Templates page in Project-mAi-Methodology draws it, and a chat in any project reads it from its own `_framework/_templates/`. A new row there is how every project learns a type exists; a changed version there is how a review finds pages founded from an older template. Its fields follow the additive data law.

## Growing the library

Types are harvested, never invented: a page earns a place here by working in a real project first (Innovation Capture, Core_06: proven first). Greg brings the page to Project-mAi-Methodology, usually as that project's dashboard files, and a chat here does this (this section is the one home of these steps, as FOUNDING A PAGE is of its own):

1. **Study it:** the page, its script, its stylesheet and its data. Name what makes it good, and what in it belongs to that one project (its content, its names, its paths).
2. **Name the type** like its page: one lowercase word or hyphenated words (`diagrams`, `release-notes`). The name becomes the folder, the page file, the data folder and the `mai-page-type` value.
3. **Generalize it:** the project's content becomes example data under `example/`; the project's names become tokens (`{{PROJECT_KEY}}`, `{{PROJECT_NAME}}`, `{{FOUNDED_AT}}`); its code reads its data from the page's own data folder by script include (the file:// law, Core_16), never by fetch; its code announces a template version in the console.
4. **Split it:** the code and the one stylesheet the page loads from `_framework/_templates/<type>/` (copied, changed only here); the page file and its starting data under `found` (copied once, the project's).
5. **Write `template.yaml`:** `type`, `title`, `need`, `templateVersion` (1.0.0), `description`, `harvestedFrom` (project, files and their versions, date), `stamp.to`, `found` with each entry's tokens, and `data` with its schema version and fields. **Write `README.md`:** what it is for, the files and who owns each, how a project fills it, how it is seen working, how it changes.
6. **Check it:** the engine README's gates (the style gate across the whole set, no em dashes, headers and footers), a token search on every founded file, and the page opened from disk with the example data.
7. **Enter it:** a row in `dashboard-templates-data.js` (Dashboard Templates), the `dashboard-engine` tool's home table updated in the same delivery, and a line in this project's capabilities and innovation ledger crediting where it came from.
8. **Release it:** Greg places the files and runs Launch here; every project receives the type at its next Launch, and the Living Dashboard phrase changes everywhere, which is the system working.
9. **Offer it back:** the project it came from can found the type in place of its own page when Greg says so; its page's data carries over when the fields match.

**Changing a type:** change its files here only; bump each changed file's version and the type's `templateVersion`, and its row's version in Dashboard Templates; add data fields only (the additive data law). Projects receive the copied code at their next Launch; a page already founded keeps its own page file, and a later review, comparing each page's `mai-page-template-version` with Dashboard Templates, offers the upgrade page by page, only on Greg's word.

---

*README.md v1.7.0*