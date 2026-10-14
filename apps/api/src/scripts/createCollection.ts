import { qdrant} from "../config/vectorStore.js";
const COLLECTION_NAME = "chronosearch_chunks";

async function main(): Promise<void> {
    const collections = await qdrant.getCollections();
    const exists = collections.collections.some(
        (collection) => collection.name === COLLECTION_NAME
    );
    if (exists) {
        console.log(`Collection ${COLLECTION_NAME} already exists!`);
        return;
    }
    await qdrant.createCollection(COLLECTION_NAME, {
        vectors: {
            size: 768,
            distance: "Cosine",
        }
    });
    console.log(`Collection "${COLLECTION_NAME}" created successfully!`);
}

main().catch((error: unknown) => {
    console.error("Collection creation failed:", error);
    process.exitCode = 1;
});