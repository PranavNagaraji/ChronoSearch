// export interface DocumentVersion {
//   documentId: string;
//   versionId: string;
//   title: string;
//   source: string;
//   publishedAt: string | null;
//   validFrom: string;
//   validUntil: string | null;
//   content: string;
// }

export interface DocumentChunk {
  chunkId: string;
  documentId: string;
  versionId: string;
  chunkIndex: number;
  text: string;
}