import assert from "node:assert/strict";
import "dotenv/config";
import { answerQuestion } from "./rag.js";

async function main(): Promise<void> {
    try {
        const question = "What was the annual equipment allowance?";

        const v1 = await answerQuestion(question, "2025-06-01");

        console.log("\nV1 RAG response:\n", v1);

        assert.equal(v1.targetDate, "2025-06-01");
        assert.ok(v1.retrievedChunks > 0);
        assert.match(v1.answer, /\$300/);

        const v2 = await answerQuestion(question, "2026-01-01");

        console.log("\nV2 RAG response:\n", v2);

        assert.equal(v2.targetDate, "2026-01-01");
        assert.ok(v2.retrievedChunks > 0);
        assert.match(v2.answer, /\$600/);

        // Test 3: Question not covered by the documents
        const unknown = await answerQuestion(
            "What is the company's parental leave policy?",
            "2026-06-01"
        );

        console.log("\nInsufficient evidence test:\n", unknown);

        console.log("\nEnd-to-end RAG test passed!");


    } catch (error: unknown) {
        console.error("\nEnd-to-end RAG test failed:", error);
        process.exitCode = 1;
    }
}

main();
