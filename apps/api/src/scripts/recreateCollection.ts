import { qdrant } from "../config/vectorStore.js";

const COLLECTION_NAME = "chronosearch_chunks";

async function main(): Promise<void> {
    const collections = await qdrant.getCollections();

    const exists = collections.collections.some(
        (collection) => collection.name === COLLECTION_NAME
    );

    if (exists) {
        await qdrant.deleteCollection(COLLECTION_NAME);
        console.log("Old Qdrant collection deleted.");
    }

    await qdrant.createCollection(COLLECTION_NAME, {
        vectors: {
            size: 768,
            distance: "Cosine",
        },
    });

    console.log("New 768-dimensional collection created.");
}

main().catch((error: unknown) => {
    console.error("Collection recreation failed:", error);
    process.exitCode = 1;
});
