import { readFile } from "node:fs/promises";
import { DocumentVersionSchema } from "./schema.js";
import type {ValidatedDocumentVersion} from "./schema.js";

export async function loadDocument(filePath: string):Promise<ValidatedDocumentVersion>{
    const fileContents=await readFile(filePath, "utf-8");
    const parsedData:unknown=JSON.parse(fileContents);
    return DocumentVersionSchema.parse(parsedData);    
}