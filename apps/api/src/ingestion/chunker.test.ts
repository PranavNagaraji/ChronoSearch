import assert from "node:assert/strict";
import { chunkDocument } from "./chunker.js";
import {ValidatedDocumentVersion} from "./schema.js";

const document: ValidatedDocumentVersion = {
    documentId: "remote-work-policy",
    versionId: "v1",
    title: "Remote Work Policy",
    source: "Company HR Policy",
    publishedAt: "2023-12-15",
    validFrom: "2024-01-01",
    validUntil: "2026-01-01",
    content: "Employees may work remotely two days per week. The annual equipment allowance is $300.",
};

const chunks = chunkDocument(document, 5, 2);

assert.equal(chunks.length, 5);
assert.equal(chunks[0].chunkId, "remote-work-policy-v1-0");
assert.equal(chunks[0].chunkIndex, 0);
assert.equal(chunks[1].chunkIndex, 1);
assert.equal(chunks[0].documentId, "remote-work-policy");
assert.equal(chunks[0].versionId, "v1");
assert.equal(chunks[0].text, "Employees may work remotely two");

assert.equal(chunks[0].text.split(" ").slice(-2).join(" "), chunks[1].text.split(" ").slice(0,2).join(" "));

assert.throws(()=>chunkDocument(document,5,5), /overlapWords/);
assert.throws(()=>chunkDocument(document,0,0), /maxWords/);

console.log("Chunker tests passed");
console.log(chunks);