<!-- ===============================================================
@file: 01_Mission_Why_and_What.md
@filepath: _docs/_ai_directive_mission/01_Mission_Why_and_What.md
@version: 1.0.0
@updated: 2026-10-01 07:10:30 PM CDT
@author: Greg Paskal & Claude
@company: MissionWares
@description:
The foundational mission file for Open Certification and the Guild.
States the problem being solved, the vision, and the governing
principles every later decision is checked against. WHAT and WHY
only, never HOW.

@tags: open-certification, guild, mission, problem, vision, principles

@changeLog:
Date        Author         Version        Description
----------  -------------  -------------  --------------------------
2026-10-01  Greg & Claude  1.0.0          Created from the create mission directive interview (Open Cert - Phase 2)
=============================================================== -->

# 01_Mission_Why_and_What.md

## Working Names

| Name | What it refers to | Status |
|---|---|---|
| **Open Certification** | The shared, trade-neutral framework for proving competence | Working title |
| **The Guild** | The community of craftspeople who use the framework | Working term |
| **Rwanda QA Guild** | The first local chapter | Pending ratification by its members |

The layers, from the outside in:

```
THE GUILD                 the community and identity (any trade, any country)
  └── OPEN CERTIFICATION  the framework for proving competence
        └── QA            the first trade
              └── RWANDA  the pilot cohort
```

Design rules that govern the Guild stay trade-neutral. Content specific to one trade (for QA: boundary value analysis, test suites, defects) belongs to that trade's Body of Knowledge. A second trade later is a new Body of Knowledge, not a rebuild.

---

## The Problem

**Cost.** In Rwanda, ISTQB exam fees are:

| Exam | Fee (RWF) | Approx. USD (per source) | Share of a ~$250 month |
|---|---|---|---|
| ISTQB Foundation | 250,000 | $169.40 | ~68% |
| Specialist | 300,000 | $203.28 | ~81% |
| ISTQB Advanced | 350,000 | $237.15 | ~95% |

Sources: fee figures from a reference fee table provided by Greg Paskal (original source and date to be recorded). USD values are as stated in that table and move with exchange rates; RWF is the primary figure. The ~$250 monthly salary figure is the founders' own observation of typical QA engineer pay in Rwanda. The share column is arithmetic against that figure.

For an engineer at that wage, a single Foundation exam competes directly with rent. Foundation plus Advanced together equal about 2.4 months of pay.

**Signal.** In the founders' experience working with Rwandan engineers and their employers, the existing credential gives employers a weak signal of real ability. It tests recall of vocabulary more than the application of principles. Engineers can hold the credential and still be unable to apply foundational techniques such as boundary value analysis.

**Control.** A professional community that depends on a single gatekeeper can be blocked, captured, or steered by that gatekeeper. The founders have seen this happen locally.

---

## The Vision

> A cross-cultural guild of craftspeople that shares knowledge freely, gives its members a common professional identity, and vouches for demonstrated competence through a traceable lineage of trusted evaluators.

QA is the first trade. Rwanda is the first chapter. The framework is built so any trade, in any country, can adopt it.

---

## The Principles

These are the check-against for every decision. A proposal that conflicts with one of them is out of bounds until the principle itself is deliberately changed.

1. **Competence is earned, never purchased.**
   The Guild does not sell credentials. It recognizes competence.

2. **The Commission.**
   What has been entrusted to you, you are commissioned to share with others. Every member who earns a level accepts the duty to help those coming behind them. Evaluator time is given under The Commission, never paid for by the candidate.

3. **No single person, company, or institution controls the Guild.**
   Authority to evaluate comes from The Commission and the members, never from position, ownership, or affiliation.

4. **Lineage.**
   Every Guild Seal names the evaluator who gave it, and every evaluator's own standing traces back, step by step, to the founders. Trust can be followed; abuse can be found.

5. **Evaluate down.**
   Only a member holding a higher level evaluates a candidate for a lower one.

6. **Application over recall.**
   The Guild asks a candidate to show the work, not repeat the definition.

   ```
   Recall:       "What is boundary value analysis?"
   Application:  "Here is a field that accepts ages 18 to 65.
                  Show me your tests, and tell me why."
   ```

7. **Why first.**
   Every area of study begins with why it exists, then what it is, how it is applied, and finally the candidate shows it. Precise in understanding and execution; not rigid in exact wording.

8. **Open contribution, vetted inclusion.**
   Like open source, anyone may propose additions to a trade's Body of Knowledge. Proposals are reviewed before inclusion. Not rigid, and not a free-for-all.

---

*01_Mission_Why_and_What.md v1.0.0*
