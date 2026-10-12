import { qdrant } from "./vectorStore.js";

async function main(): Promise<void> {
    try {
        const result = await qdrant.getCollections();
        console.log("Qdrant connection successful!");
        console.log("Available collections:", result.collections);
    } catch (error: unknown) {
        console.error("Qdrant connection failed:", error);
        process.exitCode = 1;
    }
}

main();
