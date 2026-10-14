import assert from "node:assert/strict";
import { loadDocument } from "../ingestion/loader.js";
import { chunkDocument } from "../ingestion/chunker.js";
import { saveChunkVector } from "./vectorRepository.js";
import { qdrant } from "../config/vectorStore.js";

async function main(): Promise<void> {
    try {
        const document = await loadDocument(
            "sample-docs/remote-work-v2.json"
        );

        const chunks = chunkDocument(document);

        assert.ok(chunks.length > 0, "Expected at least one chunk");

        for (const chunk of chunks) {
            await saveChunkVector(chunk, {
                validFrom: document.validFrom,
                validUntil: document.validUntil,
            });
        }

        const result = await qdrant.count("chronosearch_chunks", {
            exact: true,
        });

        const points = await qdrant.scroll("chronosearch_chunks", {
            limit: 10,
            with_payload: true,
            with_vector: false,
        });

        console.log(
            "Stored payloads:",
            points.points.map((point) => point.payload)
        );

        console.log("Vector storage test passed!");
        console.log("Vectors stored:", result.count);

        assert.ok(result.count >= chunks.length);
    } catch (error: unknown) {
        console.error("Vector storage test failed:", error);
        process.exitCode = 1;
    }
}

main();
