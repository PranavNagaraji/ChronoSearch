import { ingestDocuments } from "./ingestion/ingest.js";

async function main() {
    await ingestDocuments([
        "sample-docs/remote-work-v1.json",
        "sample-docs/remote-work-v2.json",
    ]);

    console.log("Both document versions re-ingested successfully!");
}

main().catch((error: unknown) => {
    console.error("Re-ingestion failed:", error);
    process.exitCode = 1;
});