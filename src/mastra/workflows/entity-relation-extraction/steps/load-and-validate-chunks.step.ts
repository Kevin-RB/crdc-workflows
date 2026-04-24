import { readWorkspaceRelativeJson } from "@/mastra/workflows/entity-extraction/helpers/read-workspace-relative-json"
import {
  entityRelationExtractionWorkflowInputSchema,
  entityRelationExtractionChunkArraySchema,
} from "@/mastra/workflows/entity-relation-extraction/schemas"
import { createStep } from "@mastra/core/workflows"
import z from "zod"

export const loadAndValidateChunksStep = createStep({
  id: "load-and-validate-chunks",
  inputSchema: entityRelationExtractionWorkflowInputSchema,
  outputSchema: entityRelationExtractionChunkArraySchema,
  description: "Loads chunk JSON and validates it against chunk schema array.",
  execute: async ({ inputData }) => {
    const parsed = await readWorkspaceRelativeJson({
      configuredPath: inputData.chunksFilePath,
      envVarName: "chunksFilePath",
      dataLabel: "chunks data",
    })
    entityRelationExtractionChunkArraySchema
    const validation = entityRelationExtractionChunkArraySchema.safeParse(parsed)
    if (!validation.success) {
      throw new Error(
        `Invalid chunks JSON shape in '${inputData.chunksFilePath}': ${validation.error.message}`,
      )
    }

    return validation.data
  },
})
