import { embedDocument } from "./embeddings.js";

async function main(): Promise<void> {
    const embedding = await embedDocument(
        "Employees may work remotely two days per week."
    );

    console.log("Embedding generated successfully!");
    console.log("Vector dimensions:", embedding.length);
    console.log("First five values:", embedding.slice(0, 5));

    if (embedding.length !== 1024) {
        throw new Error(
            `Expected 1024 dimensions, got ${embedding.length}`
        );
    }
}

main().catch((error: unknown) => {
    console.error("Embedding test failed:", error);
    process.exitCode = 1;
});
