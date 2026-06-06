# TBA-1 — Ingestion service reads the local policy PDF

**Status:** DONE — boots clean, logs `257757` bytes from the local sample PDF.
**Size:** small (~20–30 min)
**Who codes:** you (new Nest learning — type every line)
**Files in play:** `apps/api/src/ingestion/ingestion.service.ts` only

## Why (the arch bit)

Rung 1 of the ingestion ladder (option A — local file, **no cloud infra**). Before
Azure Document Intelligence, before a queue, before parse-once-branch-twice, we prove
the smallest thing: the Nest wiring is sound and the service can get **bytes off disk**.
The whole DECIDE pipeline in `docs/architecture/data-pipeline.md` starts with "PARSE
ONCE" — and parsing needs bytes. Everything downstream sits on this rung. Tiny,
load-bearing, no surprises.

## Nest concepts in play (new to you — read these)

- **Provider / service** — `IngestionService` is already generated and registered in
  `IngestionModule`'s `providers`. Nothing to wire this ticket.
- **`OnModuleInit`** — a lifecycle hook Nest calls automatically once the module is
  ready. It's our trigger so we don't need a controller or endpoint yet.
- **`Logger`** — Nest's built-in logger. Use it instead of `console.log` (structured,
  tagged with context, the idiom you'll keep using).

## Acceptance criteria

1. `IngestionService` implements `OnModuleInit` (interface from `@nestjs/common`).
2. `onModuleInit()` reads `docs/sample-policies/nhs-expenses.pdf` using
   `fs/promises` `readFile` — returns a `Buffer`.
3. The path resolves correctly **regardless of cwd**. The app runs from `apps/api`;
   the PDF lives at the repo root under `docs/`. Make the path deliberate, not a
   fragile relative guess — that's the real thinking bit of this ticket.
4. Logs the file's byte length on startup via Nest's **`Logger`** (a `Buffer` has
   `.length`).
5. Nothing else: no parsing, no Azure, no queue, no controller. Bytes read → length
   logged on boot → done.

## Out of scope

Azure DI, the parser boundary/interface, BullMQ, branch-twice, any controller or HTTP
endpoint, validation. All of that is TBA-2 and later. Resist it.

## Reading first (~10 min)

- Nest — **Lifecycle Events** (`OnModuleInit`): `docs.nestjs.com/fundamentals/lifecycle-events`
- Nest — **Logger**: `docs.nestjs.com/techniques/logger` (why `Logger` beats `console.log`)
- Node — **`fs/promises` `readFile`**: returns a `Buffer`; `Buffer.length` is the byte count.

## Review

Boot with `npm run start:dev`; you should see your byte count logged on startup.
Say "done" and Claude reviews the `git diff` against the criteria above.
