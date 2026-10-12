import { pool } from "../db.js";
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