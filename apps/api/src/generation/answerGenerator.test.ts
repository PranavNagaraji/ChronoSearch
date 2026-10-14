import assert from "node:assert/strict";
import "dotenv/config";

import { retrieveTemporalChunks } from "../retrieval/temporalRetrieval.js";
import { generateAnswer } from "./answerGenerator.js";

async function main(): Promise<void> {
    try {
        const question = "What was the annual equipment allowance?";

        // Test v1: June 1, 2025
        const v1Chunks = await retrieveTemporalChunks(
            question,
            "2025-06-01",
            10,
        );

        const v1Answer = await generateAnswer(
            question,
            "2025-06-01",
            v1Chunks,
        );

        console.log("\nAnswer for 2025-06-01:\n", v1Answer);

        assert.match(
            v1Answer,
            /\$300/,
            "Expected the v1 answer to mention the $300 allowance",
        );

        // Test v2: January 1, 2026
        const v2Chunks = await retrieveTemporalChunks(
            question,
            "2026-01-01",
            10,
        );

        const v2Answer = await generateAnswer(
            question,
            "2026-01-01",
            v2Chunks,
        );

        console.log("\nAnswer for 2026-01-01:\n", v2Answer);

        assert.match(
            v2Answer,
            /\$600/,
            "Expected the v2 answer to mention the $600 allowance",
        );

        console.log("\nAnswer-generation tests passed!");
    } catch (error: unknown) {
        console.error("\nAnswer-generation test failed:", error);
        process.exitCode = 1;
    }
}

main();
