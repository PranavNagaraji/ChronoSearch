import { pool } from "../config/db.js";
import type { ValidatedDocumentVersion } from "../ingestion/schema.js";
import type { DocumentChunk } from "../ingestion/types.js";

export async function saveDocumentVersion(
    document: ValidatedDocumentVersion,
    chunks: DocumentChunk[],
): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query("BEGIN;");
        await client.query(
            `
                INSERT INTO documents (document_id, title, source)
                VALUES ($1, $2, $3)
                ON CONFLICT (document_id)
                DO UPDATE SET title=EXCLUDED.title, source=EXCLUDED.source;`,
            [document.documentId, document.title, document.source],
        );

        await client.query(
            `INSERT INTO document_versions (
                document_id, version_id, title, source,
                published_at, valid_from, valid_until, content
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
            [
                document.documentId,
                document.versionId,
                document.title,
                document.source,
                document.publishedAt,
                document.validFrom,
                document.validUntil,
                document.content,
            ],
        );

        for (const chunk of chunks) {
            await client.query(
                `INSERT INTO document_chunks (
                    chunk_id, document_id, version_id, chunk_index, text
                )
                VALUES ($1, $2, $3, $4, $5)`,
                [
                    chunk.chunkId,
                    chunk.documentId,
                    chunk.versionId,
                    chunk.chunkIndex,
                    chunk.text,
                ],
            );
        }
        await client.query("COMMIT");
    } catch (error: unknown) {
        try {
            await client.query("ROLLBACK");
        } catch (rollbackError: unknown) {
            console.error("Transaction rollback failed:", rollbackError);
        }
    } finally {
        client.release();
    }
}

export interface ValidatedChunk {
    chunkId: string;
    documentId: string;
    versionId: string;
    chunkIndex: number;
    text: string;
    validFrom: string;
    validUntil: string | null;
    title: string;
    source: string;
}

// What this function does
// - Accepts candidate chunk IDs retrieved from Qdrant.
// - Checks each candidate's validity against PostgreSQL.
// - Uses your existing half-open interval: validFrom <= targetDate < validUntil.
// - Returns only temporally valid chunks, including their text and document metadata.
// - Returns an empty array immediately if Qdrant finds no candidates.

export async function getTemporalValidChunks(
    candidateChunkIds: string[],
    targetDate: string,
): Promise<ValidatedChunk[]> {
    if (candidateChunkIds.length === 0) {
        return [];
    }
    const result = await pool.query<ValidatedChunk>(
        `
            SELECT
                c.chunk_id AS "chunkId",
                c.document_id AS "documentId",
                c.version_id AS "versionId",
                c.chunk_index AS "chunkIndex",
                c.text,
                v.valid_from::text AS "validFrom",
                v.valid_until::text AS "validUntil",
                v.title,
                v.source
            FROM document_chunks c
            JOIN document_versions v
                ON c.document_id = v.document_id
                AND c.version_id = v.version_id
            WHERE c.chunk_id = ANY($1::text[])
                AND v.valid_from <= $2::date
                AND (
                    v.valid_until IS NULL
                    OR v.valid_until > $2::date
                );
        `,
        [candidateChunkIds, targetDate],
    );
    return result.rows;
}