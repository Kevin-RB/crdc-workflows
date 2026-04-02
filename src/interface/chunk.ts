import z from "zod";

export const chunkSchema = z.object({
  id: z.string(),
  content: z.string(),
  metadata: z.object({
    heading: z.string().nullable(),
    page: z.number().int().nullable(),
    source: z.string().nullable(),
  }),
})

export type Chunk = z.infer<typeof chunkSchema>
