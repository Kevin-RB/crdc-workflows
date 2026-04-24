import { chunkSchema } from "@/interface/chunk"
import { candidateEntitySchema } from "@/mastra/agents/entity-extraction/schema"
import z from "zod"

const workspaceRelativePathSchema = z
  .string()
  .trim()
  .min(1, { message: "Required" })
  .refine((value) => !value.startsWith("/") && !/^[A-Za-z]:[\\/]/.test(value), {
    message: "Path must be workspace-relative",
  })

export const entityRelationExtractionWorkflowInputSchema = z.object({
  chunksFilePath: workspaceRelativePathSchema.describe(
    "Workspace-relative path to the JSON file containing chunk array data.",
  ).default("src\\docs\\chunked\\Chapter 5.chunked.json"),
  entitiesStateFilePath: workspaceRelativePathSchema.describe(
    "Workspace-relative path to the JSON file containing entity extraction workflow state.",
  ).default("src\\docs\\entity-extraction\\global-state.json"),
})

export const entityRelationExtractionChunkArraySchema = z.array(chunkSchema)

export const loadedChunksPayloadSchema = z.object({
  chunks: entityRelationExtractionChunkArraySchema,
  entitiesStateFilePath: workspaceRelativePathSchema,
})