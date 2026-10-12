-- 1. Enable support for temporal exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. One record per logical document
CREATE TABLE IF NOT EXISTS documents (
    document_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    source TEXT NOT NULL
);

-- 3. Every version has its own content and validity interval
CREATE TABLE IF NOT EXISTS document_versions (
    document_id TEXT NOT NULL
        REFERENCES documents(document_id) ON DELETE CASCADE,

    version_id TEXT NOT NULL,
    title TEXT NOT NULL,
    source TEXT NOT NULL,
    published_at DATE,
    valid_from DATE NOT NULL,
    valid_until DATE,
    content TEXT NOT NULL,

    validity_period DATERANGE GENERATED ALWAYS AS (
        daterange(valid_from, valid_until, '[)')
    ) STORED,

    PRIMARY KEY (document_id, version_id),

    CHECK (
        valid_until IS NULL OR valid_until > valid_from
    ),

    CONSTRAINT no_overlapping_document_versions
      EXCLUDE USING GIST (
          document_id WITH =,
          validity_period WITH &&
      )
);

-- 4. Chunks belong to a specific document version
CREATE TABLE IF NOT EXISTS document_chunks (
    chunk_id TEXT PRIMARY KEY,

    document_id TEXT NOT NULL,
    version_id TEXT NOT NULL,
    chunk_index INTEGER NOT NULL CHECK (chunk_index >= 0),
    text TEXT NOT NULL,

    FOREIGN KEY (document_id, version_id)
        REFERENCES document_versions(document_id, version_id)
        ON DELETE CASCADE,

    UNIQUE (document_id, version_id, chunk_index)
);

-- 5. Indexes for common retrieval queries
CREATE INDEX IF NOT EXISTS idx_versions_document_id
    ON document_versions(document_id);

CREATE INDEX IF NOT EXISTS idx_chunks_version
    ON document_chunks(document_id, version_id);
