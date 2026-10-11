import assert from "node:assert/strict";
import { validateVersionCollection, validateNewVersion } from "./versionValidator.js";
import type { ValidatedDocumentVersion } from "./schema.js";

// 1. Adjacent versions of the same document -> success
const adjacentVersions: ValidatedDocumentVersion[] = [
    {
        documentId: "remote-work-policy",
        versionId: "v1",
        title: "Remote Work Policy V1",
        source: "HR",
        publishedAt: "2025-12-01",
        validFrom: "2025-01-01",
        validUntil: "2026-01-01",
        content: "Old remote work guidelines...",
    },
    {
        documentId: "remote-work-policy",
        versionId: "v2",
        title: "Remote Work Policy V2",
        source: "HR",
        publishedAt: "2026-01-01",
        validFrom: "2026-01-01",
        validUntil: "2027-01-01",
        content: "Updated remote work guidelines...",
    },
];

assert.doesNotThrow(() => {
    validateVersionCollection(adjacentVersions);
}, "Adjacent versions should not throw an error");

// 2. Overlapping versions of the same document -> throws error
const overlappingVersions: ValidatedDocumentVersion[] = [
    {
        documentId: "remote-work-policy",
        versionId: "v1",
        title: "Remote Work Policy V1",
        source: "HR",
        publishedAt: "2025-12-01",
        validFrom: "2025-01-01",
        validUntil: "2026-06-01",
        content: "Old remote work guidelines...",
    },
    {
        documentId: "remote-work-policy",
        versionId: "v2",
        title: "Remote Work Policy V2",
        source: "HR",
        publishedAt: "2026-01-01",
        validFrom: "2026-01-01",
        validUntil: "2027-01-01",
        content: "Updated remote work guidelines...",
    },
];

assert.throws(() => {
    validateVersionCollection(overlappingVersions);
}, /overlapping versions/, "Overlapping versions should throw an error");

// 3. Different documents with overlapping dates -> success
const differentDocuments: ValidatedDocumentVersion[] = [
    {
        documentId: "remote-work-policy",
        versionId: "v1",
        title: "Remote Work Policy",
        source: "HR",
        publishedAt: "2025-12-01",
        validFrom: "2026-01-01",
        validUntil: "2026-12-31",
        content: "Remote work content...",
    },
    {
        documentId: "expense-policy",
        versionId: "v1",
        title: "Expense Policy",
        source: "Finance",
        publishedAt: "2025-12-01",
        validFrom: "2026-01-01",
        validUntil: "2026-12-31",
        content: "Expense content...",
    },
];

assert.doesNotThrow(() => {
    validateVersionCollection(differentDocuments);
}, "Different documents with overlapping dates should succeed");

// 4. Empty collection -> success
assert.doesNotThrow(() => {
    validateVersionCollection([]);
}, "Empty collection should succeed");

// 5. Single version -> success
const singleVersion: ValidatedDocumentVersion[] = [
    {
        documentId: "remote-work-policy",
        versionId: "v1",
        title: "Remote Work Policy",
        source: "HR",
        publishedAt: "2025-12-01",
        validFrom: "2026-01-01",
        validUntil: null,
        content: "Open-ended version content...",
    },
];

assert.doesNotThrow(() => {
    validateVersionCollection(singleVersion);
}, "Single version collection should succeed");

// Helper fixture base
const baseDoc: ValidatedDocumentVersion = {
    documentId: "security-policy",
    versionId: "v1",
    title: "Security Policy",
    source: "IT",
    publishedAt: "2025-01-01",
    validFrom: "2026-01-01",
    validUntil: "2026-06-01",
    content: "Base content",
};

// 1. New version with no existing versions -> success
assert.doesNotThrow(() => {
    validateNewVersion(baseDoc, []);
}, "New version with no existing versions should succeed");

// 2. New version adjacent to an existing version -> success
const existingForAdjacent: ValidatedDocumentVersion[] = [
    { ...baseDoc, versionId: "v1", validFrom: "2025-01-01", validUntil: "2026-01-01" },
];
const adjacentCandidate: ValidatedDocumentVersion = {
    ...baseDoc,
    versionId: "v2",
    validFrom: "2026-01-01",
    validUntil: "2026-12-31",
};
assert.doesNotThrow(() => {
    validateNewVersion(adjacentCandidate, existingForAdjacent);
}, "New version adjacent to existing version should succeed");

// 3. New version overlapping an existing version of the same document -> throws error
const existingForOverlap: ValidatedDocumentVersion[] = [
    { ...baseDoc, versionId: "v1", validFrom: "2026-01-01", validUntil: "2026-06-01" },
];
const overlappingCandidate: ValidatedDocumentVersion = {
    ...baseDoc,
    versionId: "v2",
    validFrom: "2026-04-01",
    validUntil: "2026-12-31",
};
assert.throws(() => {
    validateNewVersion(overlappingCandidate, existingForOverlap);
}, /overlapping versions/, "New version overlapping existing version should throw an error");

// 4. New version belonging to a different document -> accepted
const existingDifferentDoc: ValidatedDocumentVersion[] = [
    { ...baseDoc, documentId: "doc-A", validFrom: "2026-01-01", validUntil: "2026-12-31" },
];
const candidateDocB: ValidatedDocumentVersion = {
    ...baseDoc,
    documentId: "doc-B",
    validFrom: "2026-01-01",
    validUntil: "2026-12-31",
};
assert.doesNotThrow(() => {
    validateNewVersion(candidateDocB, existingDifferentDoc);
}, "New version belonging to a different document with overlapping dates should be accepted");

// 5. New open-ended version overlapping an existing version -> throws error
const existingForOpenOverlap: ValidatedDocumentVersion[] = [
    { ...baseDoc, versionId: "v1", validFrom: "2026-06-01", validUntil: null },
];
const openOverlapCandidate: ValidatedDocumentVersion = {
    ...baseDoc,
    versionId: "v2",
    validFrom: "2026-01-01",
    validUntil: "2026-09-01",
};
assert.throws(() => {
    validateNewVersion(openOverlapCandidate, existingForOpenOverlap);
}, /overlapping versions/, "New open-ended version overlapping existing version should throw an error");

// 6. New version starting after an existing version has ended -> success
const existingForAfter: ValidatedDocumentVersion[] = [
    { ...baseDoc, versionId: "v1", validFrom: "2025-01-01", validUntil: "2026-01-01" },
];
const afterCandidate: ValidatedDocumentVersion = {
    ...baseDoc,
    versionId: "v2",
    validFrom: "2026-02-01",
    validUntil: "2026-12-31",
};
assert.doesNotThrow(() => {
    validateNewVersion(afterCandidate, existingForAfter);
}, "New version starting after an existing version has ended should succeed");

// 7. Candidate overlaps one version among several existing versions -> throws error
const multipleExisting: ValidatedDocumentVersion[] = [
    { ...baseDoc, versionId: "v1", validFrom: "2025-01-01", validUntil: "2026-01-01" },
    { ...baseDoc, versionId: "v2", validFrom: "2026-06-01", validUntil: "2027-01-01" },
];
// Let's make it actually conflict with v2
const trulyConflictingCandidate: ValidatedDocumentVersion = {
    ...baseDoc,
    versionId: "v3",
    validFrom: "2025-12-01",
    validUntil: "2026-07-01", // Overlaps v1 (ends 2026-01-01)
};
assert.throws(() => {
    validateNewVersion(trulyConflictingCandidate, multipleExisting);
}, /overlapping versions/, "Candidate overlapping one version among multiple should throw an error");

console.log("All versionValidator tests (collection and single-candidate) passed successfully!");