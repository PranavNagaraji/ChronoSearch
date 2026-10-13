import "dotenv/config";
import { VoyageAIClient } from "voyageai";

const apiKey = process.env.VOYAGE_API_KEY;

if (!apiKey) {
    throw new Error("VOYAGE_API_KEY is not configured");
}

export const voyage = new VoyageAIClient({ apiKey });

export async function embedDocument(text: string): Promise<number[]> {
    const response = await voyage.embed({
        input: [text],
        model: "voyage-4-lite",
        inputType: "document",
    });
    const embedding = response.data?.[0]?.embedding;

    if (!embedding) {
        throw new Error("Voyage returned no embedding");
    }

    return embedding;
}

export async function embedQuery(query:string):Promise<number[]>{
    const response = await voyage.embed({
        input:[query],
        model:"voyage-4-lite",
        inputType:"query",
    });
    const embedding=response.data?.[0].embedding;
    if(!embedding){
        throw new Error("Voyage returned no embedding");
    }
    return embedding;
}