import { createWorkflow } from "@mastra/core/workflows"
import { entityRelationExtractionStructuredOutputSchema } from "@/mastra/agents/rocky/schema"
import { entityRelationExtractionWorkflowStateSchema } from "@/mastra/workflows/entity-relation-extraction/helpers/persisted-relations"

import { hydrateRelationsStateStep } from "@/mastra/workflows/entity-relation-extraction/steps/hydrate-relations-state.step"
import { loadAndValidateChunksStep } from "@/mastra/workflows/entity-relation-extraction/steps/load-and-validate-chunks.step"
import { loadAndValidateEntityStateStep } from "@/mastra/workflows/entity-relation-extraction/steps/load-and-validate-entity-state.step"
import { invokeRockyOnChunkStep } from "@/mastra/workflows/entity-relation-extraction/steps/invoke-rocky-on-chunk.step"
import z from "zod"
import { loadChunksFromFile } from "@/mastra/workflows/entity-relation-extraction/steps/load-chunks-from-file-test"

const relationArraySchema = z.array(entityRelationExtractionStructuredOutputSchema)

export const entityRelationExtractionWorkflow = createWorkflow({
  id: "entity-relation-extraction-workflow",
  description:
    "Validates chunk and entity-state JSON files, links entities by chunkId, and invokes Rocky per chunk.",
  inputSchema: z.object({}).optional().default({}),
  outputSchema: relationArraySchema,
  stateSchema: entityRelationExtractionWorkflowStateSchema,
  options: {
    onFinish: async ({ status, state, result }) => {
      if (status !== "success") {
        return
      }

      const processedCount = state?.processedChunkIds?.length ?? 0
      const persistedCount = state?.relations?.length ?? 0
      console.log(
        `Entity relation extraction workflow finished successfully. Returned ${result.length} relation(s) this run only. Persisted relation count (cumulative across resumed runs): ${persistedCount}. Processed chunks (cumulative): ${processedCount}.`,
      )
    },
  },
})
  .then(hydrateRelationsStateStep)
  .parallel([loadAndValidateChunksStep, loadAndValidateEntityStateStep])
  .map(async ({ inputData }) => {
    const chunks = inputData['load-and-validate-chunks']
    return chunks
  })
  .foreach(loadChunksFromFile)
  .map(async ({ inputData, state }) => {
    const flattenedChunks = inputData.flat()
    const processedChunkIds = new Set(state?.processedChunkIds ?? [])
    const filteredChunks = flattenedChunks.filter((chunk) => !processedChunkIds.has(chunk.chunkId))
    console.log(`Total chunks to process: ${flattenedChunks.length}. Already processed: ${flattenedChunks.length - filteredChunks.length}, Remaining: ${filteredChunks.length}.`)
    return filteredChunks
  })
  .foreach(invokeRockyOnChunkStep, { concurrency: 1 })
  .map(async ({ inputData }) => inputData.filter((relation) => relation !== undefined))
  .commit()
