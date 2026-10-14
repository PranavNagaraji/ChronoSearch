import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { answerQuestion } from "../rag.js";

// Represents one test case from evaluation-dataset.json.
// expectedAnswer contains the key phrase we expect the generated answer to include.
// A null expectedAnswer means the system should abstain due to missing evidence.
interface EvaluationCase {
    id: string;
    question: string;
    targetDate: string;
    expectedVersion: string | null;
    expectedAnswer: string | null;
    expectedRetrievedChunks: number;
}

async function evaluateAnswers(): Promise<void> {
    // Resolve the dataset path relative to the apps/api working directory.
    const datasetPath = resolve(
        process.cwd(),
        "sample-docs/evaluation-dataset.json"
    );

    // Read the JSON file and parse it into typed evaluation cases.
    const dataset: EvaluationCase[] = JSON.parse(
        readFileSync(datasetPath, "utf-8")
    );

    // Counts how many test cases satisfy our answer evaluation criteria.
    let passedCount = 0;

    console.log("\n=== ChronoSearch Answer Evaluation ===\n");

    // Evaluate each question independently.
    for (const testCase of dataset) {
        // Execute the complete RAG pipeline:
        // 1. Retrieve relevant chunks for the question and target date.
        // 2. Generate an answer using the retrieved evidence.
        const result = await answerQuestion(
            testCase.question,
            testCase.targetDate
        );

        // Convert the answer to lowercase so phrase matching is
        // case-insensitive (e.g., "$300" remains "$300").
        const answer = result.answer.toLowerCase();

        let passed: boolean;

        if (testCase.expectedAnswer === null) {
            // When no answer is expected, check that retrieval returned
            // no evidence and that the answer does not state known policy facts.
            //
            // These phrases are specific to our current sample policy.
            // This is a basic safety check, not a complete hallucination detector.
            const unsupportedFacts = [
                "$300",
                "$600",
                "two days per week",
                "fully remotely",
            ];

            passed =
                result.retrievedChunks === 0 &&
                !unsupportedFacts.some((fact) => answer.includes(fact));
        } else {
            // For answerable questions, check whether the generated answer
            // contains the expected key phrase, ignoring letter case.
            //
            // This is a simple deterministic check; it does not verify
            // every claim or prove that the answer is grounded in evidence.
            passed = answer.includes(
                testCase.expectedAnswer.toLowerCase()
            );
        }

        // Increment the pass counter only when the current test passes.
        if (passed) {
            passedCount++;
        }

        // Print the test ID, expected result, and actual generated answer.
        console.log(
            `${passed ? "PASS" : "FAIL"} | ${testCase.id} | ` +
            `Expected: ${testCase.expectedAnswer ?? "abstain"}`
        );

        console.log(`Answer: ${result.answer}\n`);
    }

    // Calculate the percentage of test cases that passed.
    const totalCount = dataset.length;
    const accuracy =
        totalCount === 0 ? 0 : (passedCount / totalCount) * 100;

    // Print the final evaluation summary.
    console.log("=== Answer Evaluation Summary ===");
    console.log(`Total test cases: ${totalCount}`);
    console.log(`Passed: ${passedCount}`);
    console.log(`Failed: ${totalCount - passedCount}`);
    console.log(`Answer evaluation pass rate: ${accuracy.toFixed(2)}%`);

    // Return a non-zero exit code if any evaluation case fails.
    // This is useful when running evaluations in CI pipelines later.
    if (passedCount !== totalCount) {
        process.exitCode = 1;
    }
}

// Catch errors such as file-reading failures, API errors, or retrieval errors.
evaluateAnswers().catch((error: unknown) => {
    console.error("Answer evaluation failed:", error);
    process.exitCode = 1;
});
