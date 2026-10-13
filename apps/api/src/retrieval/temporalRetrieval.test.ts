import assert from "node:assert/strict";
import { retrieveTemporalChunks } from "./temporalRetrieval.js";

async function main(): Promise<void> {
    try {
        const query = "What is the remote work policy?";

        const v1Results = await retrieveTemporalChunks(
            query,
            "2025-06-01",
            10,
        );

        console.log("Results for 2025-06-01:", v1Results);

        assert.ok(v1Results.length > 0, "Expected valid v1 results");
        assert.ok(
            v1Results.every(
                (chunk) => chunk.versionId === "v1",
            ),
            "Only v1 should be valid on 2025-06-01",
        );

        const v2Results = await retrieveTemporalChunks(
            query,
            "2026-01-01",
            10,
        );

        console.log("Results for 2026-01-01:", v2Results);

        assert.ok(v2Results.length > 0, "Expected valid v2 results");
        assert.ok(
            v2Results.every(
                (chunk) => chunk.versionId === "v2",
            ),
            "Only v2 should be valid on 2026-01-01",
        );


        // Edge case 1: Before the first version becomes valid.
        const beforeFirstVersion = await retrieveTemporalChunks(
            query,
            "2023-12-31",
            10,
        );

        console.log(
            "Results before first version:",
            beforeFirstVersion,
        );

        assert.equal(
            beforeFirstVersion.length,
            0,
            "Expected no results before the first version becomes valid",
        );

        // Edge case 2: Invalid date should be rejected.
        await assert.rejects(
            () => retrieveTemporalChunks(query, "not-a-date", 10),
            "Expected an invalid date to be rejected",
        );

        console.log("Temporal edge-case tests passed!");


        console.log("Temporal retrieval tests passed!");
    } catch (error: unknown) {
        console.error("Temporal retrieval tests failed:", error);
        process.exitCode = 1;
    }
}

main();
