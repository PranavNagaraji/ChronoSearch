import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { retrieveTemporalChunks } from "../retrieval/temporalRetrieval.js";

// Represents one test case from evaluation-dataset.json.
// expectedVersion is the version that should be valid for targetDate.
// A null expectedVersion means no policy should exist on that date.
interface EvaluationCase {
    id: string;
    question: string;
    targetDate: string;
    expectedVersion: string | null;
    expectedAnswer: string | null;
    expectedRetrievedChunks: number;
}

// Stores the actual retrieval result and whether the test passed.
interface EvaluationResult {
    id: string;
    targetDate: string;
    expectedVersion: string | null;
    retrievedVersions: string[];
    retrievedChunks: number;
    passed: boolean;
}

async function evaluateRetrieval(): Promise<void> {
    // Load the evaluation dataset relative to the apps/api working directory.
    const datasetPath = resolve(
        process.cwd(),
        "sample-docs/evaluation-dataset.json"
    );

    // Parse the JSON dataset into typed test cases.
    const dataset: EvaluationCase[] = JSON.parse(
        readFileSync(datasetPath, "utf-8")
    );

    // Collect results so we can calculate overall evaluation metrics.
    const results: EvaluationResult[] = [];

    console.log("\n=== ChronoSearch Retrieval Evaluation ===\n");

    // Run each test case independently using its question and target date.
    for (const testCase of dataset) {
        // Reuse the existing temporal retrieval pipeline:
        // query embedding -> Qdrant similarity search -> PostgreSQL date filtering.
        // This evaluates retrieval only; it does not generate an LLM answer.
        const chunks = await retrieveTemporalChunks(
            testCase.question,
            testCase.targetDate
        );

        // Extract unique version IDs from the retrieved chunks.
        // Set removes duplicates when multiple chunks belong to the same version.
        const retrievedVersions = [
            ...new Set(chunks.map((chunk) => chunk.versionId)),
        ];

        // A test passes if:
        // 1. No version is expected and retrieval returns zero chunks, OR
        // 2. A version is expected, at least one chunk is returned,
        //    and every returned chunk belongs to that expected version.
        //
        // This catches incorrect historical versions and mixed-version results.
        const passed =
            testCase.expectedVersion === null
                ? chunks.length === 0
                : chunks.length > 0 &&
                chunks.every(
                    (chunk) => chunk.versionId === testCase.expectedVersion
                );

        // Save the actual outcome for the final summary.
        results.push({
            id: testCase.id,
            targetDate: testCase.targetDate,
            expectedVersion: testCase.expectedVersion,
            retrievedVersions,
            retrievedChunks: chunks.length,
            passed,
        });

        // Print a concise result for the current test case.
        console.log(
            `${passed ? "PASS" : "FAIL"} | ${testCase.id} | ` +
            `Date: ${testCase.targetDate} | ` +
            `Expected: ${testCase.expectedVersion ?? "no version"} | ` +
            `Retrieved: ${retrievedVersions.length > 0
                ? retrievedVersions.join(", ")
                : "no chunks"
            } | Chunks: ${chunks.length}`
        );
    }

    // Calculate the percentage of test cases that passed.
    // This is accuracy on our evaluation dataset, not a universal accuracy guarantee.
    const passedCount = results.filter((result) => result.passed).length;
    const totalCount = results.length;
    const accuracy =
        totalCount === 0 ? 0 : (passedCount / totalCount) * 100;

    console.log("\n=== Evaluation Summary ===");
    console.log(`Total test cases: ${totalCount}`);
    console.log(`Passed: ${passedCount}`);
    console.log(`Failed: ${totalCount - passedCount}`);
    console.log(`Retrieval accuracy: ${accuracy.toFixed(2)}%`);

    // Return a non-zero process exit code if any test failed.
    // This will also make the script useful in future CI pipelines.
    if (passedCount !== totalCount) {
        process.exitCode = 1;
    }
}

// Handle unexpected errors, such as missing files or retrieval/API failures.
evaluateRetrieval().catch((error: unknown) => {
    console.error("Retrieval evaluation failed:", error);
    process.exitCode = 1;
});
