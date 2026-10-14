
import assert from "node:assert/strict";
import "dotenv/config";
import { embedDocument, embedQuery } from "./embeddings.js";

async function main(): Promise<void> {
    try {
        const documentEmbedding = await embedDocument(
            "The annual equipment allowance is $600."
        );

        const queryEmbedding = await embedQuery(
            "What is the equipment allowance?"
        );

        assert.equal(documentEmbedding.length, 768);
        assert.equal(queryEmbedding.length, 768);

        assert.ok(documentEmbedding.every(Number.isFinite));
        assert.ok(queryEmbedding.every(Number.isFinite));

        console.log("Document dimensions:", documentEmbedding.length);
        console.log("Query dimensions:", queryEmbedding.length);
        console.log("Google embedding tests passed!");
    } catch (error: unknown) {
        console.error("Google embedding tests failed:", error);
        process.exitCode = 1;
    }
}

main();
