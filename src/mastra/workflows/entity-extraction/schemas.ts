import { chunkSchema } from "@/interface/chunk"
import { candidateEntitySchema } from "@/mastra/agents/entity-extraction/schema"
import z from "zod"

export const chunkArraySchema = z.array(chunkSchema)

export const documentFolderSchema = z.object({
  documentName: z.string({ error: "Document name is required" }),
  documentFilePaths: z
    .array(z.string({ error: "Document file path is required" }))
    .nonempty({ error: "At least one document file path is required" }),
})

export const documentFolderArraySchema = z.array(documentFolderSchema)

export const documentChunksSchema = z.object({
  documentName: z.string().trim().min(1),
  chunks: chunkArraySchema,
})

export const documentChunksArraySchema = z.array(documentChunksSchema)

export const chunkSourceModeSchema = z.object({
  useDummy: z
    .boolean()
    .default(false)
    .describe(
      "Set to true to run with pre-chunked dummy data instead of loading and chunking the source document.",
    ),
})

export const entityExtractionWorkflowStateSchema = z.object({
  knownTypes: z.array(z.string().trim().min(1)).default([]),
  rawCandidateEntities: z.array(candidateEntitySchema).default([]),
  processedChunkIds: z.array(z.string().trim().min(1)).default([]),
})

export const entityExtractionPersistedStateSchema = entityExtractionWorkflowStateSchema.extend({
  updatedAt: z.string().trim().min(1),
})

export type EntityExtractionWorkflowState = z.infer<typeof entityExtractionWorkflowStateSchema>

export type GlobalState = z.infer<typeof entityExtractionPersistedStateSchema>
