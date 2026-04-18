import { createWorkflow } from "@mastra/core/workflows"
import {
  chunkArraySchema,
  chunkSourceModeSchema,
  entityExtractionWorkflowStateSchema,
} from "@/mastra/workflows/entity-extraction/schemas"
import { writePersistedEntityExtractionState } from "@/mastra/workflows/entity-extraction/helpers/persisted-state"
import { resolveChunkSourceModeStep } from "@/mastra/workflows/entity-extraction/steps/resolve-chunk-source-mode.step"
import { hydrateKnownTypesFromFileStep } from "@/mastra/workflows/entity-extraction/steps/hydrate-known-types-from-file.step"
import { validateChunksStep } from "@/mastra/workflows/entity-extraction/steps/validate-chunks.step"
import { documentChunksWorkflow } from "@/mastra/workflows/entity-extraction/subworkflows/document-chunks.workflow"
import { dummyChunksWorkflow } from "@/mastra/workflows/entity-extraction/subworkflows/dummy-chunks.workflow"
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
  inputSchema: chunkSourceModeSchema,
  outputSchema: chunkArraySchema,
  stateSchema: entityExtractionWorkflowStateSchema,
})
  .then(resolveChunkSourceModeStep)
  .then(hydrateKnownTypesFromFileStep)
  .branch([
    [async ({ inputData }) => inputData.useDummy === true, dummyChunksWorkflow],
    [async ({ inputData }) => inputData.useDummy !== true, documentChunksWorkflow],
  ])
  .then(validateChunksStep)
  .foreach(extractEntityAgentStep, { concurrency: 1 })
  .commit()
