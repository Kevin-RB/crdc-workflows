import z from "zod";

export const chunkSchema = z.object({
  documentId: z.string().trim().min(1, { message: "Required" }),
  chapterId: z.string().trim().min(1, { message: "Required" }),
  chunkId: z.string().trim().min(1, { message: "Required" }),
  content: z.string().trim().min(1, { message: "Required" }),
  metadata: z.object({
    heading: z.string().nullable(),
    page: z.number().int().nullable(),
    source: z.string().nullable(),
  }),
})

export type Chunk = z.infer<typeof chunkSchema>
