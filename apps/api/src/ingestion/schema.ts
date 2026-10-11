import {z} from "zod";

export const DocumentVersionSchema=z.object({
    documentId:z.string().min(1),
    versionId:z.string().min(1),
    title: z.string().min(1),
    source: z.string().min(1),
    publishedAt:z.iso.date().nullable(),
    validFrom: z.iso.date(),
    validUntil: z.iso.date().nullable(),
    content: z.string().min(1),
});

export type ValidatedDocumentVersion=z.infer<typeof DocumentVersionSchema>;