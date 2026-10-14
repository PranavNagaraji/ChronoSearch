import "dotenv/config";
import {QdrantClient} from "@qdrant/js-client-rest";

const url=process.env.QDRANT_URL;
const apiKey=process.env.QDRANT_API_KEY;

if(!url || !apiKey) 
    throw new Error("Qdrant URL or API key not found");

export const qdrant=new QdrantClient({
    url, 
    apiKey
});