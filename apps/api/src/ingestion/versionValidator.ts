import type { ValidatedDocumentVersion } from "./schema.js";
import { intervalsOverlap } from "./temporal.js";

export function validateVersionCollection(documents: ValidatedDocumentVersion[]): void {
    for (let i = 0; i < documents.length; i++) {
        const document = documents[i];
        for (let j = i + 1; j < documents.length; j++) {
            const other = documents[j];
            if (document.documentId === other.documentId && intervalsOverlap(document, other)) {
                throw new Error(
                    `Document ${document.documentId} has overlapping versions: 
                    ${document.versionId} and ${other.versionId}`
                );
            }
        }
    }
}

export function validateNewVersion(candidate: ValidatedDocumentVersion, existingDocuments: ValidatedDocumentVersion[]): void {
    for (const existing of existingDocuments) {
        if (candidate.documentId === existing.documentId && intervalsOverlap(candidate, existing)) {
            throw new Error(
                `Document ${candidate.documentId} has overlapping versions: ` +
                `${candidate.versionId} and ${existing.versionId}`,
            );
        }
    }
}