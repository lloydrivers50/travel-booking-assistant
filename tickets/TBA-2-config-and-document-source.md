# TBA-2 — Config-driven document source (kill the hardcoded path)

**Status:** TODO
**Size:** medium (~45–60 min)
**Who codes:** you (meaty new Nest — custom providers, DI tokens, config)
**Files in play:** `apps/api/src/ingestion/` (new `document-source.ts`,
`local-file.document-source.ts`, edits to `ingestion.service.ts` +
`ingestion.module.ts`), new `apps/api/.env`, `app.module.ts` (ConfigModule)

## Why (the arch bit)

TBA-1 hardcoded a filesystem path inside the service — fine to prove wiring, wrong
to keep. Two problems it bakes in: (1) the path is environment-specific and breaks
the moment cwd changes (Docker, prod); (2) the service reaches into `fs` directly,
so it's welded to "bytes come from disk." But the locked design
(`docs/architecture/data-pipeline.md`) says production bytes come from a **file
store / bucket**, fetched by the worker — not from disk.

This ticket introduces the seam that makes the eventual Azure swap a non-event:
- **Config** moves the location out of code into env (`@nestjs/config`).
- A **`DocumentSource` abstraction** means the service asks a *source* for bytes and
  doesn't know or care whether they came from disk (now) or an Azure blob (TBA-3).
  The service depends on the interface; the implementation is swapped behind a DI
  token. This is the same dependency-inversion you did with InversifyJS.

When a later ticket adds `AzureBlobDocumentSource` (TBA-4), nothing in
`IngestionService` changes. (TBA-3 was resequenced to the `Parser` seam — a separate
abstraction: `DocumentSource` says *where bytes come from*, `Parser` says *what bytes
become*.)

## Nest concepts in play (new to you — read these)

- **`ConfigModule` / `ConfigService`** — load `.env`, read values type-safely.
- **Custom providers + injection tokens** — Nest injects classes by default, but an
  *interface* has no runtime identity, so you bind an implementation to a **token**
  (a string or `Symbol`) with `{ provide: TOKEN, useClass: ... }` and inject it via
  `@Inject(TOKEN)`. This is the core of swappable implementations in Nest.

## Acceptance criteria

1. `@nestjs/config` installed; `ConfigModule.forRoot({ isGlobal: true })` registered
   in `AppModule`.
2. `apps/api/.env` holds `POLICY_SAMPLE_PATH=...` (relative path to the sample PDF).
   `.env` is already gitignored — confirm it stays untracked.
3. A `DocumentSource` interface with one method, e.g. `getBytes(): Promise<Buffer>`,
   plus an injection token for it.
4. `LocalFileDocumentSource implements DocumentSource` — reads the file at the path
   from `ConfigService`, not a hardcoded string.
5. `IngestionModule` binds the token to `LocalFileDocumentSource`
   (`{ provide: DOCUMENT_SOURCE, useClass: LocalFileDocumentSource }`).
6. `IngestionService` injects the source via `@Inject(DOCUMENT_SOURCE)` and calls
   `getBytes()` — it no longer imports `fs` or `path` at all.
7. Boots clean and still logs `257757` bytes. Behaviour identical to TBA-1; only the
   wiring changed.

## Out of scope

The Azure blob implementation, any real bucket/cloud, parsing, BullMQ, branch-twice,
config validation schemas (Joi/zod). TBA-3+. Resist.

## Reading first (~15–20 min)

**Nest**
- Configuration / `@nestjs/config`: `docs.nestjs.com/techniques/configuration`
- Custom providers (tokens, `useClass`, `@Inject`):
  `docs.nestjs.com/fundamentals/custom-providers`

**Azure (forward context — what the TBA-3 implementation will target; skim, don't act)**
- Azure Blob Storage overview: `learn.microsoft.com/azure/storage/blobs/storage-blobs-introduction`
- Azure AI Document Intelligence overview: `learn.microsoft.com/azure/ai-services/document-intelligence/overview`
  — note it can analyse a document straight from a **blob URL / SAS URL**, which is
  why "source" returns bytes/a reference, not a local path.

## Review

Boot with `npm run start:dev`; expect the same `257757` byte count with no `fs` left
in the service. Say "done"; Claude reviews the `git diff` against the criteria.
