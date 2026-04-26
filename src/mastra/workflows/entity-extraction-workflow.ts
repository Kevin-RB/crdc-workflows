import { createWorkflow } from "@mastra/core/workflows"
import {
  entityExtractionWorkflowStateSchema,
} from "@/mastra/workflows/entity-extraction/schemas"
import { hydrateKnownTypesFromFileStep } from "@/mastra/workflows/entity-extraction/steps/hydrate-known-types-from-file.step"
import z from "zod"
import { loadChunksStep } from "@/mastra/workflows/entity-extraction/steps/load-chunks-step"
import { loadChunkFileStep } from "@/mastra/workflows/entity-extraction/steps/load-chunk-file-step"
import { extractEntityAgentStep } from "@/mastra/workflows/entity-extraction/steps/extract-entity.step"
import { chunkExtractionOutputSchema } from "@/mastra/agents/entity-extraction/schema"

export const entityExtractionWorkflow = createWorkflow({
  id: "entity-extraction-workflow",
  description: "A workflow that extracts entities from a document",
  options: {
    onError: async ({ error, state }) => {
      console.error("Error in entity extraction workflow:", error?.name)
    },
    onFinish: async ({ status, state, result, error }) => {
      if (status === "success") {
        const parsedState = entityExtractionWorkflowStateSchema.safeParse(state)
        const knownTypesCount = parsedState.success ? parsedState.data.knownTypes.length : 0
        const candidateEntityCount = parsedState.success ? parsedState.data.rawCandidateEntities.length : 0
        const processedChunkCount = parsedState.success ? parsedState.data.processedChunkIds.length : 0

        console.log(
          `Entity extraction workflow finished successfully. Extracted ${result.length} entities from ${processedChunkCount} chunk(s). Known types: ${knownTypesCount}, candidate entities in state: ${candidateEntityCount}.`,
        )

        if (!parsedState.success) {
          console.warn("Workflow state summary unavailable due to state schema parse error.")
        }

        return
      }

      const parsedState = entityExtractionWorkflowStateSchema.safeParse(state)
      const processedChunkCount = parsedState.success ? parsedState.data.processedChunkIds.length : 0
      console.warn(
        `Entity extraction workflow finished with status '${status}'. Processed chunks so far: ${processedChunkCount}.`,
      )
    },
  },
  inputSchema: z.object({}).optional().default({}),
  outputSchema: chunkExtractionOutputSchema,
  stateSchema: entityExtractionWorkflowStateSchema,
})
  .then(hydrateKnownTypesFromFileStep)
  .then(loadChunksStep)
  .foreach(loadChunkFileStep, { concurrency: 1 })
  .map(async ({ inputData, state }) => {
    const flattenedChunks = inputData.flat()
    const processedChunkIds = new Set(state?.processedChunkIds ?? [])
    return flattenedChunks.filter((chunk) => !processedChunkIds.has(chunk.chunkId))
  })
  .foreach(extractEntityAgentStep, { concurrency: 1 })
  .map(async ({ inputData }) => inputData.flat())
  .commit()
