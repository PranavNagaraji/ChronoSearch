import "dotenv/config";
import { gemini } from "./gemini.js";

async function main(): Promise<void> {
    try {
        const response = await gemini.models.generateContent({
            model: process.env.GEMINI_MODEL!,
            contents: "Reply with exactly: ChronoSearch Gemini connection successful.",
        });

        console.log("Gemini response:", response.text);
    } catch (error: unknown) {
        console.error("Gemini API test failed:", error);
        process.exitCode = 1;
    }
}

main();
