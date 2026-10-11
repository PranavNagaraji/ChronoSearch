import assert from "node:assert/strict";
import { resolve } from "node:path";
import { writeFileSync, unlinkSync } from "node:fs";
import { ingestDocuments } from "./ingest.js";

async function runTests() {
    // Test 1: Ingest both sample documents successfully
    const samplePaths = [
        resolve("sample-docs", "remote-work-v1.json"),
        resolve("sample-docs", "remote-work-v2.json"),
    ];

    const result = await ingestDocuments(samplePaths);
    assert.equal(result.documents.length, 2, "Should load exactly 2 documents");
    assert.equal(result.chunks.length, 2, "Should generate exactly 2 chunks");
    assert.equal(result.documents[0].versionId, "v1");
    assert.equal(result.documents[1].versionId, "v2");

    for (const chunk of result.chunks) {
        assert.equal(typeof chunk.chunkId, "string");
        assert.equal(chunk.documentId, "remote-work-policy");
        assert.equal(typeof chunk.versionId, "string");
        assert.equal(chunk.chunkIndex, 0);
        assert.equal(typeof chunk.text, "string");
    }

    // Test 2: Empty input
    const emptyResult = await ingestDocuments([]);
    assert.deepEqual(emptyResult.documents, []);
    assert.deepEqual(emptyResult.chunks, []);

    // Test 3: Reject invalid or missing input
    await assert.rejects(async () => {
        await ingestDocuments([resolve("sample-docs", "nonexistent.json")]);
    }, "Should reject when a file path does not exist");

    // Test 4: Reject overlapping versions
    const tempFilePath = resolve("sample-docs", "remote-work-overlapping.json");
    const overlappingContent = JSON.stringify({
        documentId: "remote-work-policy",
        versionId: "v-overlap",
        title: "Overlapping Policy",
        source: "Company HR Policy",
        publishedAt: "2024-01-01",
        validFrom: "2024-01-01", // Overlaps with remote-work-v1 (2024-01-01 to 2026-01-01)
        validUntil: "2025-01-01",
        content: "Conflicting interval content.",
    });

    try {
        writeFileSync(tempFilePath, overlappingContent, "utf8");
        await assert.rejects(async () => {
            await ingestDocuments([
                resolve("sample-docs", "remote-work-v1.json"),
                tempFilePath,
            ]);
        }, /overlapping versions/, "Should reject collections with overlapping intervals");
    } finally {
        try {
            unlinkSync(tempFilePath);
        } catch {
            // Suppress cleanup errors if file was already removed
        }
    }

    console.log("All ingest tests passed successfully!");
}

runTests().catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
});