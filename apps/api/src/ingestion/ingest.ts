import { loadDocument } from "./loader.js";
import { validateVersionCollection } from "./versionValidator.js";
import { chunkDocument } from "./chunker.js";
import { saveDocumentVersion } from "../repositories/documentRepository.js";
import { saveChunkVector } from "../repositories/vectorRepository.js";

import type { ValidatedDocumentVersion } from "./schema.js";
import type { DocumentChunk } from "./types.js";

export async function ingestDocuments(filePaths: string[]): Promise<{
    documents: ValidatedDocumentVersion[],
    chunks: DocumentChunk[];
}> {
    const documents: ValidatedDocumentVersion[] = [];
    for (const filePath of filePaths) {
        const document = await loadDocument(filePath);
        documents.push(document);
    }
    validateVersionCollection(documents);

    const chunks: DocumentChunk[] = [];
    for (const document of documents) {
        const documentChunks = chunkDocument(document);
        chunks.push(...documentChunks);
    }

    for (const document of documents) {
        const documentChunks = chunks.filter(
            (chunk) =>
                chunk.documentId === document.documentId &&
                chunk.versionId === document.versionId
        )
        await saveDocumentVersion(document, documentChunks);
    }

    for (const chunk of chunks) {
        const document = documents.find(d => d.documentId === chunk.documentId && d.versionId === chunk.versionId);
        if (!document)
            throw new Error(`Document not found for chunk ${chunk.chunkId}`);
        await saveChunkVector(chunk, {
            validFrom: document.validFrom,
            validUntil: document.validUntil
        });
    }

    return { documents, chunks };
}