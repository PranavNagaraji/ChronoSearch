# ChronoSearch

ChronoSearch is a temporal retrieval-augmented question-answering project. Given a question and a target date, its API modules find semantically relevant document chunks, keep only chunks from versions valid on that date, and can generate an evidence-grounded answer with Gemini.

## Current state

- The API contains document ingestion, temporal retrieval, Gemini embeddings, Gemini answer generation, and retrieval/answer evaluation code.
- The Express server currently exposes only `GET /health`. The RAG pipeline is available through the `answerQuestion()` function in `apps/api/src/rag.ts`; it is not yet exposed as an HTTP question-answering endpoint.
- The Next.js page checks the API health endpoint and displays its status. It does not yet provide a question or date input.

## How temporal retrieval works

Document versions use half-open validity intervals: `[validFrom, validUntil)`. A version is valid on date `D` when `validFrom <= D` and `D < validUntil`; a `null` `validUntil` means the version has no scheduled end date.

For a question and target date, the retrieval module:

1. Embeds the question with Gemini using the `RETRIEVAL_QUERY` task type.
2. Searches the `chronosearch_chunks` Qdrant collection for the 10 most similar chunks by default.
3. Checks those candidate chunk IDs against PostgreSQL and keeps only chunks whose versions were valid on the target date.
4. Passes the validated evidence to Gemini for answer generation. If no evidence remains, the answer module returns an abstention message.

Temporal filtering happens after the top-10 vector search, so the number of returned chunks can be lower than 10. `retrieveTemporalChunks()` validates target dates in `YYYY-MM-DD` format.

## Architecture

```text
JSON document versions
        |
        v
Zod validation + overlap checks
        |
        v
40-word chunks (5-word overlap)
        |
        +----------------------------+
        |                            |
        v                            v
PostgreSQL                    Gemini embeddings
documents, versions,                |
and chunk text                      v
        |                         Qdrant
        +---- temporal check ---- candidate chunk IDs
                                      |
                                      v
                                Gemini answer
```

PostgreSQL stores the authoritative document, version, validity, and chunk records. Qdrant stores 768-dimensional cosine vectors and chunk metadata. Gemini supplies both embeddings and generated answers.

## Repository layout

```text
apps/
  api/
    migrations/       PostgreSQL schema and RLS migrations
    sample-docs/      Sample policy versions and evaluation dataset
    src/
      ingestion/      JSON validation, temporal checks, chunking, ingestion
      retrieval/      Date-aware retrieval and validation
      generation/     Evidence-grounded answer generation
      repositories/   PostgreSQL and Qdrant access
      evaluation/     Retrieval and answer evaluation scripts
      scripts/         Collection and sample-data utilities
      server.ts        Express health endpoint
  web/
    app/              Next.js health-status page
README.md
```

The API and web app are separate npm projects; install dependencies from each app directory.

## Requirements

- Node.js and npm
- A PostgreSQL database (the project has Supabase-compatible migrations)
- A Qdrant instance
- A Google Gemini API key with access to the configured embedding and generation models

## Configure the API

Create `apps/api/.env`:

```env
DATABASE_URL="your-postgresql-connection-string"
QDRANT_URL="your-qdrant-url"
QDRANT_API_KEY="your-qdrant-api-key"
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="your-supported-gemini-generation-model"
# Optional; defaults to gemini-embedding-001
EMBEDDING_MODEL="gemini-embedding-001"
```

The embedding code requests 768 dimensions, and the Qdrant collection must use the same vector size. `GEMINI_MODEL` has no code default and is required when generating an answer with evidence. Keep `.env` files and credentials out of version control.

## Database and vector setup

From the API directory, install dependencies and build:

```powershell
cd apps/api
npm ci
npm run build
```

Apply these SQL files to the configured PostgreSQL database, in order, if they have not already been applied:

1. `migrations/001_initial_schema.sql`
2. `migrations/002_enable_rls.sql`

Migrations are applied manually; there is no migration runner. The initial schema creates `documents`, `document_versions`, and `document_chunks`, and prevents overlapping validity intervals for versions of the same document. The RLS migration enables row-level security but does not create policies; review database roles and policies before relying on RLS for access control.

Create the Qdrant collection, then load the sample policy versions:

```powershell
npx tsx src/scripts/createCollection.ts
npx tsx src/scripts/reingest.ts
```

Run these commands with `apps/api` as the working directory. The collection is named `chronosearch_chunks`, with 768 dimensions and cosine distance. The sample files in `sample-docs/` show the expected JSON fields: `documentId`, `versionId`, `title`, `source`, `publishedAt`, `validFrom`, `validUntil`, and `content`.

The sample ingestion utility inserts version and chunk rows into PostgreSQL. It is not safe to treat repeated runs as a clean upsert: those rows have unique keys, and the current repository catches database write errors without returning them to the caller. The separate `recreateCollection.ts` utility deletes and recreates the Qdrant collection, which removes its vectors.

## Run the applications

Start the API in one terminal:

```powershell
cd apps/api
npm run dev
```

The server listens on `http://localhost:3000`; check it at `http://localhost:3000/health`.

Start the web app in another terminal:

```powershell
cd apps/web
npm ci
npm run dev -- --port 3001
```

Open `http://localhost:3001`. The page calls `http://localhost:3000/health`, and the API CORS configuration allows that web origin. The health URL and ports are currently hard-coded in the source.

For a production API process, run `npm run build` and then `npm start` from `apps/api`. For the web app, run `npm run build` and then `npm start` from `apps/web`. The web package also provides `npm run lint`.

## Evaluation

The API package's `evaluate` script runs both retrieval and answer evaluation against `sample-docs/evaluation-dataset.json`:

```powershell
cd apps/api
npm run evaluate
```

It requires the sample documents to have been ingested and calls Qdrant and Gemini. The answer evaluation calls the generation model for each case and may incur API usage. These checks use a small sample set and simple expected-version/key-phrase assertions; their pass rate is not a general accuracy guarantee.

## Important limitations

- There is no HTTP route for asking questions yet; call `answerQuestion(question, targetDate)` from API code.
- PostgreSQL and Qdrant writes are separate operations and do not share a transaction, so a partial ingestion failure can leave them out of sync.
- The ingestion flow and its database writes are not currently safe for repeated runs without handling existing records.
- Row-level security is enabled without policies in the checked-in migration. The API connects through `DATABASE_URL`; verify the database role and policies before relying on RLS.
- Keep API keys and database credentials private, and rotate any secret that is accidentally exposed.
