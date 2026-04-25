import { createWorkflow } from "@mastra/core/workflows"
import {
  chunkArraySchema,
  chunkSourceModeSchema,
  entityExtractionWorkflowStateSchema,
} from "@/mastra/workflows/entity-extraction/schemas"
import { writePersistedEntityExtractionState } from "@/mastra/workflows/entity-extraction/helpers/persisted-state"
import { hydrateKnownTypesFromFileStep } from "@/mastra/workflows/entity-extraction/steps/hydrate-known-types-from-file.step"
import { validateChunksStep } from "@/mastra/workflows/entity-extraction/steps/validate-chunks.step"
import { extractEntityAgentStep } from "@/mastra/workflows/entity-extraction/steps/extract-entity.step"
import z from "zod"

export const entityExtractionWorkflow = createWorkflow({
  id: "entity-extraction-workflow",
  description: "A workflow that extracts entities from a document",
  options: {
    validateInputs: true,
    onError: async ({ error, state }) => {
      console.error("Error in entity extraction workflow:", error?.name)
    },
    onFinish: async ({ status, state, result, error }) => {
      if (status === "success") {
        console.log("Entity extraction workflow finished successfully.")

        try {
          await writePersistedEntityExtractionState(state)
          console.log("Persisted global entity-extraction state.")
        } catch (persistError) {
          console.error("Failed to persist global entity-extraction state:", persistError)
        }
        return
      }

      console.warn(`Entity extraction workflow finished with status '${status}'.`)
    },
  },
  inputSchema: z.object({}),
  outputSchema: chunkArraySchema,
  stateSchema: entityExtractionWorkflowStateSchema,
})
  .then(hydrateKnownTypesFromFileStep)
// .then(validateChunksStep)
// .foreach(extractEntityAgentStep, { concurrency: 1 })
// .commit()
