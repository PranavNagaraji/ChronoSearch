import { searchSimilarChunks } from "../repositories/vectorRepository.js";
import type { ValidatedChunk } from "../repositories/documentRepository.js";
import { getTemporalValidChunks } from "../repositories/documentRepository.js";

export interface RetrievedChunk extends ValidatedChunk {
    score: number
}

export async function retrieveTemporalChunks(
    query: string,
    targetDate: string,
    limit: number = 10,
): Promise<RetrievedChunk[]> {

    // input validation
    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
        throw new Error("Invalid target date. Expected YYYY-MM-DD.");
    }
    const parsedDate = new Date(`${targetDate}T00:00:00.000Z`);
    if (
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== targetDate
    ) {
        throw new Error("Invalid target date. Expected a valid calendar date.");
    }

    // Step 1: Find semantically relevant chunks in Qdrant.
    const candidates = await searchSimilarChunks(query, limit);

    // Step 2: Validate their temporal validity in PostgreSQL.
    const validChunks = await getTemporalValidChunks(
        candidates.map((candidate) => candidate.chunkId),
        targetDate,
    );

    // Step 3: Preserve Qdrant scores and ranking.
    const scoresByChunkId = new Map(
        candidates.map((candidate) => [
            candidate.chunkId,
            candidate.score,
        ]),
    );

    return validChunks
        .flatMap((chunk) => {
            const score = scoresByChunkId.get(chunk.chunkId);

            if (score === undefined) {
                return [];
            }

            return [{ ...chunk, score }];
        })
        .sort((a, b) => b.score - a.score);
}