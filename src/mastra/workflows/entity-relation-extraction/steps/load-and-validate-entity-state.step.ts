import { readWorkspaceRelativeJson } from "@/mastra/workflows/entity-extraction/helpers/read-workspace-relative-json"
import { entityExtractionWorkflowStateSchema } from "@/mastra/workflows/entity-extraction/schemas"
import {
  entityRelationExtractionWorkflowInputSchema,
  loadedChunksPayloadSchema,
} from "@/mastra/workflows/entity-relation-extraction/schemas"
import { createStep } from "@mastra/core/workflows"
import z from "zod"

export const loadAndValidateEntityStateStep = createStep({
  id: "load-and-validate-entity-state",
  inputSchema: entityRelationExtractionWorkflowInputSchema,
  outputSchema: entityExtractionWorkflowStateSchema,
  description: "Loads entity state JSON and validates expected workflow schema.",
  execute: async ({ inputData, setState }) => {
    const parsed = await readWorkspaceRelativeJson({
      configuredPath: inputData.entitiesStateFilePath,
      envVarName: "entitiesStateFilePath",
      dataLabel: "entity extraction state",
    })

    const validation = entityExtractionWorkflowStateSchema.safeParse(parsed)
    if (!validation.success) {
      throw new Error(
        `Invalid entity state JSON shape in '${inputData.entitiesStateFilePath}': ${validation.error.message}`,
      )
    }

    return validation.data
  },
})
