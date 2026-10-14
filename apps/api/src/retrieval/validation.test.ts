import assert from "node:assert/strict";
import "dotenv/config";
import { retrieveTemporalChunks } from "./temporalRetrieval.js";

async function main(): Promise<void> {
    try {
        // Test 1: The previous version must not be valid at its exclusive end date.
        const boundary = await retrieveTemporalChunks(
            "What was the annual equipment allowance?",
            "2026-01-01"
        );

        assert.ok(boundary.length > 0);
        assert.ok(boundary.every((chunk) => chunk.versionId === "v2"));
        console.log("PASS: Temporal boundary selects v2.");

        // Test 2: No version should be valid before the policy begins.
        const beforePolicy = await retrieveTemporalChunks(
            "What was the annual equipment allowance?",
            "2023-12-31"
        );

        assert.equal(beforePolicy.length, 0);
        console.log("PASS: No evidence before the policy begins.");

        // Test 3: Reject an impossible calendar date.
        await assert.rejects(
            () => retrieveTemporalChunks(
                "What was the annual equipment allowance?",
                "2026-02-30"
            )
        );
        console.log("PASS: Impossible date rejected.");

        // Test 4: Reject an incorrectly formatted date.
        await assert.rejects(
            () => retrieveTemporalChunks(
                "What was the annual equipment allowance?",
                "01-01-2026"
            )
        );
        console.log("PASS: Incorrect date format rejected.");

        console.log("\nRetrieval validation tests passed!");
    } catch (error: unknown) {
        console.error("\nRetrieval validation tests failed:", error);
        process.exitCode = 1;
    }
}

main();
