import { loadDocument } from "./loader.js";
import { validateVersionCollection } from "./versionValidator.js";
import { chunkDocument } from "./chunker.js";

import type { ValidatedDocumentVersion } from "./schema.js";
import type { DocumentChunk } from "./types.js";

export async function ingestDocuments(filePaths:string[]) : Promise<{
    documents:  ValidatedDocumentVersion[],
    chunks:DocumentChunk[];
}>{
    const documents:ValidatedDocumentVersion[]=[];
    for(const filePath of filePaths){
        const document=await loadDocument(filePath);
        documents.push(document);
    }
    validateVersionCollection(documents);

    const chunks:DocumentChunk[]=[];
    for(const document of documents){
        const documentChunks=chunkDocument(document);
        chunks.push(...documentChunks);
    }
    return {documents, chunks};
}   