import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
}

const googleAI = new GoogleGenAI({ apiKey });

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL ?? "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;

export async function embedDocument(text: string): Promise<number[]> {
    const response = await googleAI.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: text,
        config: {
            taskType: "RETRIEVAL_DOCUMENT",
            outputDimensionality: EMBEDDING_DIMENSIONS,
        },
    });

    const embedding = response.embeddings?.[0]?.values;

    if (!embedding) {
        throw new Error("Google returned no document embedding");
    }

    return embedding;
}

export async function embedQuery(query: string): Promise<number[]> {
    const response = await googleAI.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: query,
        config: {
            taskType: "RETRIEVAL_QUERY",
            outputDimensionality: EMBEDDING_DIMENSIONS,
        },
    });

    const embedding = response.embeddings?.[0]?.values;

    if (!embedding) {
        throw new Error("Google returned no query embedding");
    }

    return embedding;
}
