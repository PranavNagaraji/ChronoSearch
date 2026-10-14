import { retrieveTemporalChunks } from "./retrieval/temporalRetrieval.js";
import { generateAnswer } from "./generation/answerGenerator.js";

export interface RagResponse {
    question: string;
    targetDate: string;
    answer: string;
    retrievedChunks: number;
}

export async function answerQuestion(
    question: string,
    targetDate: string
): Promise<RagResponse> {
    const chunks = await retrieveTemporalChunks(
        question,
        targetDate
    );
    const answer = await generateAnswer(
        question,
        targetDate,
        chunks,
    );
    return {
        question,
        targetDate,
        answer,
        retrievedChunks: chunks.length,
    };
}