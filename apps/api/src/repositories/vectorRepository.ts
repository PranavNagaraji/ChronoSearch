import { createHash } from "node:crypto";
import { qdrant } from "../vectorStore.js";
import { embedDocument, embedQuery } from "../embeddings.js";
import type { DocumentChunk } from "../ingestion/types.js";

const COLLECTION_NAME = "chronosearch_chunks";

function createPointId(chunkId: string): string {
    const hash = createHash("sha256")
        .update(chunkId)
        .digest("hex")
        .slice(0, 32);
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

export async function saveChunkVector(
    chunk: DocumentChunk,
    validity: {
        validFrom: string;
        validUntil: string | null;
    }
): Promise<void> {
    const embedding = await embedDocument(chunk.text);
    await qdrant.upsert(COLLECTION_NAME, {
        wait: true,
        points: [
            {
                id: createPointId(chunk.chunkId),
                vector: embedding,
                payload: {
                    chunkId: chunk.chunkId,
                    documentId: chunk.documentId,
                    versionId: chunk.versionId,
                    chunkIndex: chunk.chunkIndex,
                    text: chunk.text,
                    validFrom: validity.validFrom,
                    validUntil: validity.validUntil
                },
            },
        ],
    });
}

export interface SearchCandidate {
    chunkId: string,
    score: number;
}

export async function searchSimilarChunks(
    query: string,
    limit: number = 10
): Promise<SearchCandidate[]> {
    const embedding = await embedQuery(query);

    const results = await qdrant.query(COLLECTION_NAME, {
        query: embedding,
        limit,
        with_payload: true,
        with_vector: false,
    });
    return results.points.flatMap((result) => {
        const chunkId = result.payload?.chunkId;

        if (typeof chunkId !== "string") {
            return [];
        }

        return [{
            chunkId,
            score: result.score,
        }];
    });
}