import assert from "node:assert/strict";
import { searchSimilarChunks } from "./vectorRepository.js";

async function main(): Promise<void> {
    try {
        const results = await searchSimilarChunks(
            "What is the remote work policy?",
            10,
        );

        console.log("Search results:", results);

        assert.ok(
            results.length > 0,
            "Expected at least one matching chunk",
        );

        assert.ok(
            results.every(
                (result) =>
                    typeof result.chunkId === "string" &&
                    typeof result.score === "number",
            ),
            "Every result should contain a chunk ID and similarity score",
        );

        console.log("Semantic search test passed!");
    } catch (error: unknown) {
        console.error("Semantic search test failed:", error);
        process.exitCode = 1;
    }
}

main();
