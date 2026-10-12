# ChronoSearch

ChronoSearch is a temporal Retrieval-Augmented Generation (RAG) project designed to retrieve evidence from the document version that was valid at a requested point in time.

The project is being built incrementally as a hands-on learning project, with TypeScript introduced and learned through implementation.

> **Current status:** Stage 2 — document ingestion, PostgreSQL persistence, embeddings, and Qdrant vector storage — has been implemented and verified on the sample documents. Temporal retrieval and answer generation are not implemented yet.

## Core idea

Traditional semantic retrieval finds text that is similar to a question. Temporal RAG also needs to establish **which version of that text was valid at the requested time**.

For example, ChronoSearch contains two versions of a remote-work policy:

- **v1:** valid from `2024-01-01` until `2026-01-01` (end exclusive).
- **v2:** valid from `2026-01-01` onward.

A future question about the policy in 2025 should use v1, while a question about 2026 should use v2, assuming the requested date falls within the corresponding validity interval.

## Technology stack

| Component | Role |
|---|---|
| TypeScript / Node.js | API and ingestion implementation |
| Express | API framework already set up in `apps/api` |
| Next.js | Web application in `apps/web` |
| Supabase PostgreSQL | Document metadata, version history, validity dates, and chunk text |
| Voyage AI (`voyage-4-lite`) | Text embedding generation; tested output dimension: 1,024 |
| Qdrant Cloud | Vector storage and semantic similarity search |
| Zod | Runtime input validation |
| Node.js test scripts / `tsx` | Running TypeScript verification scripts |

## Architecture so far

```text
Sample JSON documents
        |
        v
JSON loader + Zod validation
        |
        v
Temporal version-overlap validation
        |
        v
Text chunking
        |
        +----------------------------+
        |                            |
        v                            v
Supabase PostgreSQL             Voyage AI
(document/version/chunk data)   (text -> vector)
                                     |
                                     v
                                  Qdrant
                           (vector + payload metadata)
```

PostgreSQL is the authoritative store for document versions and temporal validity. Qdrant stores vectors and payload metadata (`chunkId`, `documentId`, `versionId`, `chunkIndex`, and chunk text) for retrieval.

## Repository layout

```text
ChronoSearch/
├── apps/
│   ├── api/
│   │   ├── migrations/
│   │   │   ├── 001_initial_schema.sql
│   │   │   └── 002_enable_rls.sql
│   │   ├── sample-docs/
│   │   │   ├── remote-work-v1.json
│   │   │   └── remote-work-v2.json
│   │   ├── src/
│   │   │   ├── ingestion/
│   │   │   │   ├── types.ts
│   │   │   │   ├── schema.ts
│   │   │   │   ├── loader.ts
│   │   │   │   ├── chunker.ts
│   │   │   │   ├── temporal.ts
│   │   │   │   ├── versionValidator.ts
│   │   │   │   ├── ingest.ts
│   │   │   │   ├── loader.test.ts
│   │   │   │   ├── chunker.test.ts
│   │   │   │   ├── temporal.test.ts
│   │   │   │   ├── versionValidator.test.ts
│   │   │   │   └── ingest.test.ts
│   │   │   ├── repositories/
│   │   │   │   ├── documentRepository.ts
│   │   │   │   ├── vectorRepository.ts
│   │   │   │   └── vectorRepository.test.ts
│   │   │   ├── db.ts
│   │   │   ├── db.test.ts
│   │   │   ├── embeddings.ts
│   │   │   ├── embeddings.test.ts
│   │   │   ├── vectorStore.ts
│   │   │   ├── qdrant.test.ts
│   │   │   └── createCollection.ts
│   │   └── .env                 # Local secrets; must not be committed
│   └── web/                     # Next.js application
└── README.md
```

This is the intended/currently reported layout; check the working tree if files have been renamed or moved.

## Stage 2: ingestion and vector storage

The current ingestion flow in `apps/api/src/ingestion/ingest.ts`:

1. Loads each JSON document.
2. Validates its fields and dates with Zod.
3. Rejects overlapping validity intervals for versions of the same document.
4. Chunks each document's content.
5. Saves document metadata, version records, and chunks to PostgreSQL.
6. Generates one embedding per chunk through Voyage AI.
7. Upserts each vector into Qdrant with a deterministic point ID and identifying payload metadata.

### PostgreSQL schema

- `documents`: one row per logical document.
- `document_versions`: version metadata, content, `valid_from`, `valid_until`, and a generated `daterange` validity period. An exclusion constraint prevents overlapping version intervals for the same document.
- `document_chunks`: chunk text and identifiers, linked to a document version.

The validity interval convention is half-open: `[valid_from, valid_until)`. A `NULL` end date represents an open-ended interval.

### Qdrant collection

- Collection: `chronosearch_chunks`
- Vector dimension: `1024`
- Distance: `Cosine`
- Payload fields: `chunkId`, `documentId`, `versionId`, `chunkIndex`, `text`

## Setup

### Requirements

- Node.js and npm
- A Supabase project / PostgreSQL connection string
- A Qdrant Cloud cluster and API key
- A Voyage AI API key

### API environment variables

Create `apps/api/.env` locally:

```env
DATABASE_URL="your-postgresql-connection-string"
QDRANT_URL="your-qdrant-cluster-url"
QDRANT_API_KEY="your-qdrant-api-key"
VOYAGE_API_KEY="your-voyage-api-key"
```

Never commit `.env` or share secret values. Confirm the root `.gitignore` excludes `.env` files.

### Install and build

From the API directory:

```powershell
cd apps/api
npm install
npm run build
```

### Database migrations

Run the SQL in `migrations/001_initial_schema.sql` and `migrations/002_enable_rls.sql` in the Supabase SQL Editor, if they have not already been applied. These files are currently managed manually rather than by an automated migration runner.

### Create the Qdrant collection

After environment variables are configured, run:

```powershell
npx tsx src/createCollection.ts
```

The script checks whether `chronosearch_chunks` already exists before creating it.

## Verification commands

Run from `apps/api`:

```powershell
npm run build
npx tsx src/db.test.ts
npx tsx src/qdrant.test.ts
npx tsx src/embeddings.test.ts
npx tsx src/repositories/vectorRepository.test.ts
npx tsx src/ingestion/ingest.test.ts
```

The ingestion and vector repository tests call remote services and write data; they are integration checks rather than isolated unit tests. Re-running them can affect existing records, so idempotency and cleanup should be addressed before relying on repeated test execution.

## Current verification status

Verified during development:

- TypeScript build passes.
- Supabase PostgreSQL connection works.
- Voyage embedding generation works and returns 1,024 dimensions.
- Qdrant connectivity works.
- Qdrant collection exists with the expected vector configuration.
- Sample ingestion test passes.
- Supabase contains two sample chunks for `v1` and `v2`.
- Qdrant contains two points with matching version payloads.

## Roadmap

### Stage 3 — Temporal retrieval
- Accept a user question and target date.
- Embed the question using Voyage with the correct query input type.
- Search Qdrant for semantically relevant chunks.
- Filter/validate candidates against PostgreSQL temporal validity.
- Return evidence from the version valid on the requested date.
- Test cases where semantic similarity points to the wrong historical version.

### Stage 4 — RAG answer generation
- Supply retrieved temporal evidence to an LLM.
- Generate grounded answers with citations/references to source versions.
- Handle insufficient evidence and dates with no valid version.

### Stage 5 — Evaluation and application integration
- Build a small temporal evaluation set.
- Measure retrieval correctness and answer grounding.
- Connect the API to the Next.js frontend.
- Improve error handling, idempotency, reconciliation, observability, and security.

## Important caveats

- PostgreSQL and Qdrant do not participate in one shared transaction. A partial failure can leave their data inconsistent; recovery/reconciliation is future work.
- Repeated ingestion is not yet fully verified as idempotent, especially for PostgreSQL inserts.
- Row Level Security has been enabled on the database tables, but the backend connection uses a database connection string. Do not assume RLS protects the application until the connection role and policies have been reviewed.
- Keep all credentials in environment variables and rotate any key that is accidentally exposed.

## Learning approach

This is a hands-on TypeScript learning project. Prefer small, incremental changes to existing files, explain unfamiliar TypeScript concepts when they appear, preserve existing logic unless a change is required, and verify each milestone before proceeding.
