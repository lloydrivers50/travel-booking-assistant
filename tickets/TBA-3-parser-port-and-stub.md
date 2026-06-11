# TBA-3 — Parser port + stub (turn bytes into elements, no cloud)

**Status:** TODO
**Size:** medium (~45–60 min)
**Who codes:** you (reinforces TBA-2 DI + one new TypeScript concept)
**Files in play:** `apps/api/src/ingestion/` — new `parser.ts`,
new `stub.parser.ts`, edits to `ingestion.service.ts` + `ingestion.module.ts`.
No new deps, no `.env` change.

## Why (the arch bit)

`docs/architecture/data-pipeline.md` §3 is **"parse once, branch twice."** Right now
the ingestion service has *bytes* (TBA-1/2) and nothing that understands them. Bytes
are opaque — a wall of PDF. Before anything interesting (chunk, embed, extract a rule)
can happen, those bytes have to become a **neutral list of layout-aware elements**:
headings, paragraphs, tables — each tagged with a page. That element list is the
single chokepoint the *entire* downstream pipeline reads from. Nothing downstream is
ever allowed to touch raw PDF again; it only sees elements.

The real parser is a managed cloud API (Azure Document Intelligence) — an account, a
key, credits, network calls. **We are deliberately not reaching for that yet.** This
ticket builds the *seam* (a `Parser` interface) and a *stub* behind it (a hand-written
element list from the real sample PDF). That seam does two things:

1. It unblocks every downstream agentic step **today**, with zero cloud setup.
2. The stub isn't throwaway — it becomes your permanent **test fixture**. You never
   want chunk/embed/extract tests calling a paid Azure API over the network (slow,
   flaky, costs money). They run against this stub forever.

When TBA-4 adds `AzureDocumentIntelligenceParser`, it implements the *same* interface
and binds to the *same* token — `IngestionService` doesn't change one line. This is
the identical dependency-inversion move you just did with `DocumentSource` in TBA-2,
applied to a second seam. Doing it twice is the point: the pattern should start to
feel routine.

## Concepts in play

**New (one TypeScript idea):**
- **Discriminated union** — a type that's "one of several shapes," where a shared
  `type` field (the *discriminant*) tells TypeScript which shape you're holding. A
  `heading` element has `text`; a `table` element has `cells` and `confidence`. Same
  union, different fields per `type`. This is exactly the rule-taxonomy shape from
  §5 of the design doc — you're meeting it here in its easy form first.
  ```ts
  type Element =
    | { type: 'heading';   page: number; text: string }
    | { type: 'paragraph'; page: number; text: string }
    | { type: 'table';     page: number; cells: string[][]; confidence: number };
  ```

**Reinforcement (you did these in TBA-2 — do them cold this time, no peeking):**
- **Injection token + custom provider** — interfaces have no runtime identity, so you
  bind the implementation to a token: `{ provide: PARSER, useClass: StubParser }`,
  inject with `@Inject(PARSER)`.

## Acceptance criteria

1. **`parser.ts`** exports three things:
   - the `Element` discriminated union (the three shapes above — start with exactly
     these three, no more);
   - a `Parser` interface with one method: `parse(bytes: Buffer): Promise<Element[]>`;
   - a `PARSER` injection token (string or `Symbol`, same style you used for
     `DOCUMENT_SOURCE`).
2. **`stub.parser.ts`** — `StubParser implements Parser`. `parse()` ignores the bytes
   and returns a **hand-written array of ~5 elements transcribed from the real sample
   PDF** (`docs/sample-policies/nhs-expenses.pdf`). Open the PDF, find a real heading,
   two real paragraphs, and one real table; type them in. Make it *honest* data — this
   is what Azure will eventually produce, so it should look like the real thing
   (correct page numbers, a table with real rows). Put `confidence: 1` on the table
   (a stub is certain by definition; the real parser's confidence comes in TBA-4).
3. **`ingestion.module.ts`** binds the token: `{ provide: PARSER, useClass: StubParser }`.
4. **`ingestion.service.ts`** injects the parser via `@Inject(PARSER)`, and in
   `onModuleInit` does: `getBytes()` → `parse(bytes)` → log a **summary** of what came
   back, e.g. `parsed 5 elements: 1 heading, 2 paragraphs, 1 table (1 page)`. Compute
   the counts from the array; don't hardcode the sentence.
5. Boots clean with `npm run start:dev`; the summary line appears on startup. The old
   `257757` byte log can stay or go — your call.

## Out of scope (resist)

- **Azure / any cloud parser** — that's TBA-4, behind this same interface.
- **`bbox` / coordinates on elements** — the real parser returns them, but nothing
  downstream needs coordinates yet. Adding them now is building for an imagined future
  (the premature-complexity trap). Add the field in TBA-4 when something consumes it.
- **The fan-out itself** — chunk, embed, extract, branch-twice. This ticket *produces*
  the element list; later tickets *consume* it. Stop at "elements logged."
- **Page-spanning table stitching, confidence-as-a-gate, the `unrepresentable` type** —
  all real (§5), all later.
- BullMQ, controllers, HTTP. Still not yet.

## Reading first (~15 min)

- TypeScript — **Discriminated unions**:
  `typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions`
  (read just the discriminated-unions section — how the `type` field narrows the rest).
- Design doc — re-read **§3 "Parse once, branch twice"** of
  `docs/architecture/data-pipeline.md` (one screen; it's the whole rationale for this
  ticket — the element shape, page tagging, and why one parse pass).
- Nest custom providers — only if TBA-2 felt shaky; otherwise do it from memory.

## Review

Boot with `npm run start:dev`; expect your element-summary line on startup. Say
"done" and Claude reviews the `git diff` against the criteria above — paying special
attention to whether the `Element` union is clean and the service stays ignorant of
*which* parser it's talking to.
