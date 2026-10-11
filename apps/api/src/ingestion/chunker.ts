import type {DocumentVersion, DocumentChunk} from "./types.js";

export function chunkDocument(document:DocumentVersion, maxWords:number=40, overlapWords:number=5) : DocumentChunk[]{
    if(!Number.isInteger(maxWords) || maxWords<=0)
        throw new Error("maxWords must be a positive Integer");
    if(!Number.isInteger(overlapWords) || overlapWords<0 || overlapWords>=maxWords)
        throw new Error("overlapWords must be a non-negative integer smaller than maxWords");
    const words=document.content.trim().split(/\s+/);
    const chunks:DocumentChunk[]=[];
    const step:number=maxWords-overlapWords;
    for(let i=0;i<words.length;i+=step){
        const chunkwords=words.slice(i,i+maxWords);
        chunks.push({
            chunkId:`${document.documentId}-${document.versionId}-${chunks.length}`,
            documentId:document.documentId,
            versionId:document.versionId,
            chunkIndex:chunks.length,
            text:chunkwords.join(" "),
        });
    }
    return chunks;
}