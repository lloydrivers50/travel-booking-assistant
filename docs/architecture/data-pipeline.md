# PDF Policy Ingestion — How It Fits the Travel Assistant

How a corporate travel-policy PDF becomes **two synchronized representations**:
one the LLM can *explain* (RAG), one deterministic code can *enforce* (the policy
engine). This is not a generic RAG doc — every decision here is pinned to this
app's locked stack and core rule.

---

## 0. The one assumption everything rests on

**Policy ingestion is low-volume, offline, and accuracy-critical.**

A company uploads its travel policy maybe once, updates it a few times a year. We
process a handful of PDFs, not a firehose. Nobody is waiting on a response.

This single assumption unlocks the whole design:

- **Offline** → it's a background job, not a request path. We can afford a slow,
  accurate parser. (Runs on **BullMQ**, already in the stack.)
- **Low-volume** → a human reviewing each new policy version is *cheap and
  correct*, not a scaling problem.
- **Accuracy-critical** → a misread digit becomes an enforced rule. Speed is
  worthless if the number is wrong.

If that assumption ever breaks (high-volume, real-time doc ingestion), this
design changes. It won't break for this app.

---

## 1. The non-negotiable (this is the whole point)

`CLAUDE.md` core rule: **the LLM decides, deterministic code does. The LLM never
sets a limit.**

A parser extracting `per_diem = £50` straight into the enforcement table **is the
LLM setting a limit.** It doesn't matter that it's "just extraction" — if a
misread `£50 → £60` flows untouched into the engine, deterministic code will
enforce the hallucination *confidently and forever*. That's worse than a bad RAG
chunk, which at least gets re-reasoned at query time.

So the structured path has a hard gate:

> **LLM/parser proposes → human approves → code enforces.**
>
> HITL = human-in-the-loop: a person signs off before a value can be enforced.

Nothing reaches the enforcement table without crossing that gate. This is the
same machinery as the booking-approval workflow — **LangGraph** (durable,
resumable, human-in-the-loop), reused, not reinvented.

---

## 2. Architecture, mapped to the actual stack

```text
   Next.js upload ──► file store ──► enqueue BullMQ job
                                          │
                                   ┌──────┴──────┐
                                   │ NestJS worker│
                                   │  PARSE ONCE  │   (managed parser, §6)
                                   └──────┬──────┘
                                          │  layout-aware elements
                          ┌───────────────┴───────────────┐
                          ▼                               ▼
                 ┌─────────────────┐             ┌──────────────────────┐
                 │  PIPELINE A      │             │  PIPELINE B           │
                 │  EXPLAIN (RAG)   │             │  ENFORCE (structured) │
                 └────────┬─────────┘             └──────────┬───────────┘
                          ▼                                  ▼
                chunk → embed (OpenAI)             extract candidate facts
                          ▼                                  ▼
                  pgvector  (+ policyVersionId)     policy_fact_STAGING (Prisma)
                          │                                  ▼
                          │                         LangGraph human review  ← HITL gate
                          │                                  ▼
                          │                         policy_fact  (enforce table)
                          ▼                                  ▼
              "what does the policy say?"          "what is the allowed value?"
                  (LLM reads vectors)               (engine reads rows ONLY)
```

The enforcement engine **never** touches vectors and **never** touches staging.
It reads `policy_fact`, active version, full stop.

---

## 3. Parse once, branch twice

One parse pass over the PDF. Don't parse twice for the two pipelines — that's two
chances to disagree about what the document said. Parse to a neutral list of
layout-aware **elements** (`heading`, `paragraph`, `table`, `figure`, with page
+ bbox + confidence), then fan out.

```json
{ "type": "table", "page": 12, "confidence": 0.94,
  "cells": [["Country","Rate"],["UK","£50"],["France","€60"]] }
```

`confidence` here is **parser/OCR confidence only** — "how sure that glyph is
£50" — *not* whether the extraction mapped it to the right rule. Those are
different errors (§5). Two more parser realities to handle: a table can **span
pages** (pp.12–14 arrive as three `table` elements that must be stitched on a
shared header before extraction), and parser confidence is **not calibrated
probability** — treat it as an ordering hint, tuned per-parser, never a gate.

---

## 4. Pipeline A — Explain (RAG)

Goal: semantic search + natural-language explanation. Soft understanding.
Mistakes here degrade *answers*, not *enforcement*, so the bar is "good," not
"provably correct."

1. **Shape meaning** — tables → markdown; flowcharts/diagrams → prose via a
   vision model (the *only* good way to turn an approval flowchart into
   retrievable text). Diagrams live **here only** — never on the enforce path.
2. **Chunk structure-first** — split on section/table boundaries, not blind
   character windows. When a section is too big for one chunk, go hierarchical
   (parent section + child chunks) — this is where your **PageIndex** study
   applies. Character chunking is the *fallback*.
3. **Embed** — OpenAI `text-embedding-3-small`. (Note: Anthropic ships no
   embedding model, so embeddings are OpenAI/Voyage/Cohere regardless of which
   chat model you use.) For each policy fact, embed both the markdown table *and*
   a one-line natural-language summary ("France daily allowance is €60") — recall
   is better when the chunk reads like the question.
4. **Store** — pgvector row: `text`, `embedding`, `metadata{page, section,
   source, policyVersionId}`.

---

## 5. Pipeline B — Enforce: the rule taxonomy (the real workhorse)

A scalar `{ country, rate }` was the easy 10%. Real policy is conditional and
heterogeneous — none of these is a `claim > limit` compare:

- "Business class **if** flight > 6h" — conditional eligibility
- "Hotel cap £180/night **in London**, £120 elsewhere" — scoped limit
- "Book **≥14 days** out" — time-window constraint
- "Trips **over £2k** → director approval" — threshold that triggers a workflow

Different operators → they can't share one row shape. `policy_fact` stores a
**discriminated union**: a small fixed set of rule `type`s, each evaluated by its
own function in the engine (a discriminated union = records sharing a `type` tag
that decides which fields and which evaluator apply).

A rule (sketch — the thing to lock before anything downstream):

```ts
{
  id,            // stable identity key — drives the diff, see §7
  type,          // 'cap' | 'eligibility' | 'threshold' | 'window' | 'allowlist'
  subject,       // dimension: hotel_nightly | flight_class | booking_lead | trip_total
  scope,         // when it applies: { location: 'London' } | { flight_hours_gt: 6 }
  operator,      // '<=' | '>=' | 'requires' | 'in'
  value,         // scalar | range | set | { approverRole: 'director' }
  effect,        // 'deny' | 'allow' | 'require_approval'
  provenance,    // { versionId, page, sourceSpan, method: 'table'|'prose', reviewedBy }
}
```

The engine becomes **one evaluator per `type`**, dispatched on the tag —
deterministic, exhaustive, extensible. A new policy shape = a new type + its
evaluator, not a rewrite. Lock this and three holes close at once:

- **Extraction targets** are now "fill these typed fields," not "grab a number."
- **The diff key** (§7) falls out: `type + subject + scopeKey`, e.g.
  `cap:hotel_nightly:location=london`.
- **The engine's operators** are enumerated by `type`, not improvised per row.

### Extraction has two sources, and prose is the hard one

Tables are the easy source. Most enforceable rules above are **prose** — "economy
for flights under 6 hours" is a sentence, and a confidence-scoring parser gives
you *nothing* for it (sentences have no cell confidence). Two paths feed staging:

- **Table → typed rows** via the managed parser; per-cell OCR confidence is a
  triage hint.
- **Prose → proposed typed rules** via an LLM, each **citing the exact source
  sentence** (`provenance.sourceSpan`). No calibrated confidence exists here.

**Canonicalize, or the §7 diff key is sand.** `subject` and `scope` must come from
a **controlled vocabulary**, not free LLM text. Left raw, the model phrases the
same scope as `London` / `london` / `Greater London` across versions, the identity
key `type+subject+scopeKey` shifts, and an unchanged rule reads as *remove + add*
(or a real change hides behind a drifted key). The extractor maps to enumerated
subjects/scope dimensions, or it flags the rule — next point.

**Fail loud, never force-fit (the taxonomy is open-world).** A new policy shape is
a new `type` — a code change, not config. So when a rule fits no type, or its
scope isn't in the vocabulary, the extractor emits `type: 'unrepresentable'` and
routes to a human/engineer queue. On an accuracy-critical path, force-fitting a
window into a threshold is *worse* than dropping it: a wrong rule enforces
silently; a flagged one gets seen.

**The prose path's real failure is omission — and the gate can't catch it.** This
is the deletion-by-omission hole (§7) one level upstream: a rule the LLM never
proposes never reaches staging, so the reviewer audits recall *against nothing*.
Mitigation, not cure — a **coverage check**: every `paragraph` element either
yields a rule or is explicitly marked "no rule here" by the extractor, so the
reviewer triages *un-extracted* prose too instead of re-reading the whole PDF.
Residual risk (a rule split across paragraphs, or merely implied) stays a **named
known limit**, not a solved problem.

Both are **proposals**. Neither is trusted — the entire point of §1.

### Correcting last round: the trust story does not run on confidence

The previous draft oversold parser confidence as "the feature." It isn't.
Confidence only triages **table-OCR** uncertainty. It says nothing about whether
the LLM mapped the right column to "currency" (a **semantic-mapping** error, which
has *no* score), and nothing about prose. Two distinct errors were hiding under
one `0.71`.

The real control was always the **human gate + the §0 low-volume assumption**: a
few PDFs a year means *every rule in every new version is human-reviewed*, period.
Confidence is demoted to a **queue-sorter** — it orders what the reviewer sees
first; it never decides what skips review.

### Stage → gate → promote (now over typed rules)

1. Extract (table + prose) → `policy_fact_staging` as typed proposals, each with
   provenance. The engine cannot see this table.
2. **LangGraph human gate** — reviewer confirms/corrects, shown the source span
   beside each proposed rule and (on re-ingest) the three-way diff (§7).
3. **Promote** on approval → `policy_fact`, tagged `policyVersionId`. *Only now*
   enforceable.

This is the answer to the killer question — *"what stops a misread digit from
poisoning the engine?"* The digit can't reach the engine. It sits in staging as a
typed proposal behind a human who is shown its source span and any diff.

### Precedence — one evaluator resolves one rule; policy is rules-plus-exceptions

Per-type dispatch evaluates a *single* rule. It does **not** resolve *competing*
rules — and real policy is general-rule-plus-exceptions: a cap "£120 elsewhere",
an exception "London £180", maybe "UK cities £150", all scope-overlapping on a
London claim. Without a defined **precedence**, enforcement is arbitrary — a
correctness hole, not a footnote. **Locked: most-specific scope wins**, where
specificity = the **count of bound scope constraints** (`{location:'London'}`
beats the unscoped `{}` default). A **promote-time consistency check** rejects what
that can't rank: incomparable ties (equal count, different dimensions —
`{location:'London'}` vs `{flight_hours_gt:6}`) and true conflicts (same `type`,
same scope, different value) are **flagged for the human**, never silently ordered.
Deterministic and cheap; the only cases it punts are exactly the ones a human
should see (§0).

---

## 6. The parse-tool decision (and the door most people miss)

Three doors, not two:

| Door | What it is | Verdict |
|---|---|---|
| **TS-native libs** (`pdfjs-dist`, `unpdf`) | extract text/coords in-process | ✗ no real table recovery, **no confidence scores** |
| **Python sidecar** (Unstructured, Docling) | best-in-class parsing, separate service | ✗ second language, a TS↔Py contract, double deploy surface — too much tax for a solo, low-volume case |
| **Managed parsing API** (AWS Textract, Azure Document Intelligence, LlamaParse) | HTTP call, layout + tables + **per-cell confidence** | ✓ **picked** |

**Decision: a managed, confidence-scoring parser** (Textract or Azure DI) for the
structured path; **a vision model** (Claude/GPT) for diagram→prose on the explain
path only.

Why this wins and survives scrutiny:

- **Python-grade parsing, zero Python in the repo.** The "TS-native vs Python
  service" framing is a false binary; the managed API is the third door. Stack
  stays single-language, as locked.
- **Confidence scores are a triage hint, not the trust mechanism** (§5 corrects
  the last draft on this). They sort the review queue for *table-OCR* uncertainty
  only — they don't catch semantic-mapping errors and don't exist for prose. The
  human gate is the control; confidence just orders it. A pure-VLM parser gives no
  calibrated confidence at all and *will* hallucinate digits, which is why
  diagrams (VLM) stay quarantined to the explain path.
- **Offline + low-volume** (the §0 assumption) means the per-page API cost and
  latency don't matter.

**Owned tradeoff — data residency.** Policy text leaves your box **twice**, not
once: the parser (PDF → managed API) *and* embeddings (chunks → OpenAI). Counting
only the parser, as the last draft did, was half the leak. Travel policies are
rarely PII-heavy, but if a client demands residency: Textract/Azure DI run in your
own region, embeddings move to an in-region or self-hosted model (Voyage, or a
local model), and the Python+Docling sidecar is the documented parser escape
hatch. Deferred cost, not a locked-in one — but it's a *two-service* deferral.

---

## 7. Versioning, diffing & audit — the desync killers

Two representations from one source *will* drift unless forced not to: RAG
explaining v4 while the engine enforces v3 is a confidently inconsistent system.

**One version id.** A policy doc has **versions**; every vector and every
`policy_fact` row carries one `policyVersionId`. Re-ingesting builds a **new**
version fully in the background (new vectors + new staged facts) while the old
stays serving.

**Idempotent, all-or-nothing build.** Background jobs crash and BullMQ retries —
so a re-run must not double-write. Every write **upserts** keyed on
`policyVersionId` (+ the §5 identity key), never blind-inserts. A version is
**promotable only when both pipelines have completed** — a half-built version
(embedded but not extracted) can never be activated.

**A real three-way diff, keyed on identity.** On re-ingest the reviewer needs more
than "what changed." Using the §5 key (`type+subject+scopeKey`) we compute:

- **changed** — value differs from the prior active version,
- **added** — key absent before (a new rule the reviewer must see),
- **removed** — key present before, gone now (a rule silently *un-enforced* — the
  one thing a diff exists to catch; deletion-by-omission is the classic miss).

**Effective-dating with computed ranges (not stored, not mutated).** Real policies
say "new per diems from July 1," but approval might happen in June. So a version
carries an `effectiveFrom`, and the version in force at a date `D` is **computed**:
*the approved version with the greatest `effectiveFrom ≤ D`.* Computed, not stored,
on purpose — writing `effectiveTo` onto v3 when v4 lands would mutate the
supposedly-immutable old version and nick the all-or-nothing promote.
Greatest-`effectiveFrom`-wins also makes overlap impossible and leaves exactly one
legitimate gap (dates before the first policy — there is none). The thing the doc
must pin and didn't: **which date is `D`** — travel, booking-action, or approval?
They pick different versions for a trip booked June 28 for July 3 travel.
Decision: **`D` = travel date** (per diems are about when you travel); stated
explicitly, because the audit pin records what *was* used — it can't decide what
*should* be.

**Audit lives on the booking, not on version history.** "What rule was enforced on
the date of this booking?" is answerable only if each **booking persists the
`policyVersionId` it was evaluated against** (and the rule ids that fired). Keeping
old versions undeleted is necessary but not sufficient — the booking-side pin is
the actual audit mechanism.

**The invariant, corrected.** The previous wording — "active-now for explanation,
effective-dated for a booking" — described *two* resolutions and called them one,
silently re-opening the desync it claims to kill. Concrete: in June, ask RAG "per
diem for my July trip?" — naive RAG resolves active-now (v3) and explains the old
number while the engine, on the July travel date, enforces v4. The same divergence
§7 exists to prevent.

The honest invariant is **per-date**: *for a given date `D`, both halves resolve
to the same version.* So **explanation also takes a date** — the trip's travel
date when a trip is in context (matching enforcement), else today — and every
explanation is **stamped with the version + effective date it answered for**. A
free-text question with no trip has no enforcement counterpart to desync from: it
explains today's version and says so. Desync for the *same* date is now
impossible — and that is a claim the mechanism can actually back.

---

## 8. How it survives turd-throwing

The attacks a fresh adversary will throw, and where each one dies:

| Attack | Defense |
|---|---|
| "A misread digit poisons the deterministic engine." | It can't reach the engine — staging + HITL gate (§1, §5). |
| "Real policy isn't scalar lookups." | Rule taxonomy: a discriminated union, one evaluator per `type` (§5). |
| "Enforceable rules live in prose, not just tables." | Two extraction sources; prose → LLM-proposed typed rules citing the source sentence, human-gated like everything else (§5). |
| "Confidence only catches OCR noise, not semantic errors." | Conceded — confidence is demoted to a queue-sorter; the human gate, not confidence, is the control, and every rule of a new version is reviewed (§5, §0). |
| "A diff misses deleted rules." | Three-way diff (added/removed/changed) keyed on the §5 identity key (§7). |
| "You can't prove what was enforced for a past booking." | The booking persists its `evaluatedPolicyVersionId` + fired rule ids (§7). |
| "Approve-now = enforce-now breaks future-dated policy." | Active is date-ranged (`effectiveFrom`); the booking's date selects the version (§7). |
| "A crashed/retried job double-writes or half-promotes." | Upsert keyed on version id; promotable only when both pipelines finish (§7). |
| "You added a Python service to a locked-TS stack." | We didn't — managed API is the third door (§6). |
| "RAG and the engine disagree after an update." | One `policyVersionId`, both halves resolve the version identically (§7). |
| "Effective-dating re-opens desync: RAG explains v3 while a July booking enforces v4." | Conceded as a real hole — fixed: per-date invariant, explanation takes a date and is version-stamped (§7). |
| "The prose extractor silently misses a rule that's in the PDF." | Conceded as a *known limit*; coverage-check forces every paragraph to yield a rule or an explicit "no rule here" (§5). |
| "A novel rule shape gets force-fit into the wrong type." | Extractor emits `unrepresentable` → human queue; fail loud beats force-fit (§5). |
| "Scope phrasing drift breaks the identity key." | Controlled vocabulary for `subject`/`scope`; unmappable → flagged (§5). |
| "Overlapping rules (general + exception) enforce arbitrarily." | Most-specific-scope-wins precedence + promote-time consistency check (§5). |
| "Which date selects the version?" | Pinned: `D` = travel date; ranges computed (greatest `effectiveFrom ≤ D`), not stored, so no old-version mutation (§7). |
| "Human review doesn't scale." | Volume is a few PDFs a year (§0) — review is cheap and belongs here. |
| "Policy text leaks to third parties." | Conceded as a *two-service* leak (parser + embeddings); in-region/self-host options, Docling escape hatch (§6). |

The shape of every defense is the same: **nothing becomes enforceable without a
human, and for any given date the two representations can never show different
policies.**

---

## 9. Build order

Per `CLAUDE.md` — build the DECIDE half first.

1. **Lock the rule taxonomy, then manual-seed.** Define the §5 discriminated
   union first — it shapes extraction, the diff key, and the engine's operators.
   Then hand-write a few `policy_fact` rows across *more than one* `type` (a cap
   *and* a conditional) and build the per-type evaluators. Prove enforcement
   against known-good rules *before* any parsing exists.
2. **Pipeline A (RAG)** — parse → chunk → embed → pgvector → retrieval. This is
   the surface you already know; get explanation working.
3. **Pipeline B (structured)** — extraction → staging → the LangGraph HITL gate →
   promotion. This is the new, hard, app-defining part.
4. **Versioning (§7)** — only once re-ingestion is a real scenario.

The embedding model is not the smart part. **The rule taxonomy, the gate, and the
versioning are.**
