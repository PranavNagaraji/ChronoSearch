import assert from "node:assert/strict";
import {resolve} from "node:path";
import {loadDocument} from "./loader.js";
import { chunkDocument } from "./chunker.js";

async function main(){
    const v1=await loadDocument(
        resolve("sample-docs", "remote-work-v1.json")
    );
    const v2=await loadDocument(
        resolve("sample-docs", "remote-work-v2.json")
    );

    assert.equal(v1.documentId, v2.documentId);
    assert.notEqual(v1.versionId, v2.versionId);

    assert.equal(v1.validFrom, "2024-01-01");
    assert.equal(v1.validUntil, "2026-01-01");
    assert.equal(v2.validFrom, "2026-01-01");
    assert.equal(v2.validUntil, null);

    const chunksV1=chunkDocument(v1,5,2);
    const chunksV2=chunkDocument(v2,5,2);

    assert.ok(chunksV1.length>0);
    assert.ok(chunksV2.length>0);

    assert.ok(chunksV1.every((chunk)=>chunk.versionId==="v1"));
    assert.ok(chunksV2.every((chunk)=>chunk.versionId==="v2"));

    console.log("Loader + chunker integration tests passed!");
    console.log("V1 chunks:", chunksV1.length);
    console.log("V2 chunks:", chunksV2.length);
}

main().catch((error:unknown)=>{
    console.log("Integration Test failed: ", error);
    process.exitCode=1;
});