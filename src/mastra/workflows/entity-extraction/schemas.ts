import { chunkSchema } from "@/interface/chunk"
import { candidateEntitySchema } from "@/mastra/agents/entity-extraction/schema"
import z from "zod"

export const chunkArraySchema = z.array(chunkSchema)

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
})

export const entityExtractionPersistedStateSchema = entityExtractionWorkflowStateSchema.extend({
  updatedAt: z.string().trim().min(1),
})