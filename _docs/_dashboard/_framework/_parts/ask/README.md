<!-- ===============================================================
@file: README.md
@filepath: dashboard_engine/_framework/_parts/ask/README.md
@version: 1.2.0
@updated: 2026-11-13 05:16:26 PM CST
@author: Greg Paskal & Claude
@company: MissionWares®

@description:
The Ask part: the shared code that lets a dashboard page ask a model
on Greg's Mac about its own data. What a shared part is, the two
files and their APIs, where it works and where it does not, what the
spike that proved it found, and how a page uses it. Harvested from
Project-AI-Local (Glossary Ask, Ask the Guide, the ask spike).

@tags: shared-part, ask, ollama, local-ai, dashboard

@changeLog:
Date        Author         Version        Description
----------  -------------  -------------  --------------------------
2026-11-13  Greg & Claude  1.0.0          The Ask part, harvested from Project-AI-Local's ask-link.js 1.0.0, ask-prompt.js 1.1.0 and ask-spike.html 1.0.0 (Greg: Ask becomes a shared part, Guide first); the spike retires into the findings below
2026-11-13  Greg & Claude  1.1.0          The User Guide (type user-guide, renamed from guide, Greg): its functions are userGuideMessages and userGuideText, on DASH_USER_GUIDE; ask-prompt.js 2.0.0
2026-11-13  Greg & Claude  1.2.0          The Glossary page type joins as the second type to use Ask (Greg: add the Glossary to our templates)
=============================================================== -->

# README.md

## What a shared part is

A page type is a page. A **shared part** is code more than one page type uses, kept once in `_framework/_parts/<part>/` so every type loads the same copy. It is stamped into every project with the engine, like a page type, and founded nowhere: no page is made from it. A page type names the parts it loads in its `template.yaml` (`uses: [ask]`). The User Guide is the first type to use Ask; the Glossary is the second (its `glossary-ask.js` draws the drawer and hands `messages()` a ctx with the glossary's `title` and `about`).

## The two files

| File | Global | What it does |
|---|---|---|
| `ask-link.js` | `window.AskLink` | The ONE piece of a dashboard that talks to a model. `where()` says whether the page is served; `reach()` finds Ollama on this Mac; `models()` lists the models, largest first; `chat(request, onToken)` streams one answer and returns `{ promise, stop }`. Swapping the connection later (an AiAssist broker) changes this file and no page. |
| `ask-prompt.js` | `window.AskPrompt` | The grounding, pure functions that also run in Node. For a User Guide: `userGuideMessages(g, history, question)` answers from `DASH_USER_GUIDE`, citing `[Cap 7]`. For a glossary: `messages(term, ctx, history, question)` answers from one term's card, citing `[Meaning]`, `[S2]` and the rest; `takeaway()` asks for three lessons. `parse(text, final)` reads a reply as it streams. Who the reader is comes from the data (`g.about`, `ctx.about`), never from this file. |

Each announces its version: `AskLink.version`, `AskPrompt.version` in the console.

## Where it works

**Only on the served page.** A page opened from disk (`file://`) sends `Origin: null`, and Ollama refuses it. Served by AiAssist's Dashboard Host (`http://localhost:8765/...`), the page is an allowed origin by default. A page using Ask must say so plainly when it is opened from disk, and everything else on it must still work.

**Only on Greg's Mac.** Ollama answers on `127.0.0.1:11434`; the Dashboard Host serves this Mac only.

## What the spike found (Project-AI-Local, 2026-11-03 and 2026-11-04)

- A page from disk cannot reach Ollama; the served page can. That is why the Dashboard Host exists for Ask.
- **gemma3:27b** answered all six Guide probe questions right; **llama3.1:8b** answered four of six. gemma3:27b is the default where it exists.
- The first question makes the model read the whole record once (Project-AI-Local's Guide, about 6,500 tokens, took gemma3:27b about 32 seconds); after that Ollama keeps the reading and answers start in under a second. So a page warms the model with a one-token question when the reader first touches the Ask box.
- Ollama reloads a model when `num_ctx` changes, so every page asks with the same context, 16384.

The spike page itself retired with this part; its measurements live in Project-AI-Local's `_docs/_test_results/ask/`.

## Using it from a page type

Load both files after the engine and the page's data, before the type's own script:

```html
<script src="_framework/_parts/ask/ask-link.js"></script>
<script src="_framework/_parts/ask/ask-prompt.js"></script>
```

Then: `AskLink.where()`; on the served page `AskLink.reach()`, then `AskLink.models()`; ask with `AskLink.chat({ model, messages: AskPrompt.userGuideMessages(...), options: { temperature: 0.2, num_ctx: 16384 } }, onPiece)`; draw each piece with `AskPrompt.parse(text, false)` and the last with `parse(text, true)`. Mark every answer not vetted, and make every citation a way back to the record it names.

## Changing it

Change it here only, never in a project. Bump each file's `@version` and its announced `version` together. A change to the prompt text is proved against a real model on Greg's Mac before it ships, because the reply format was tuned there.

---

*README.md v1.2.0*