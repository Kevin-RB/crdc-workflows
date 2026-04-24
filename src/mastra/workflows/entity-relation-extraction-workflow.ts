import { createWorkflow } from "@mastra/core/workflows"
import { entityRelationExtractionStructuredOutputSchema } from "@/mastra/agents/rocky/schema"
import { writePersistedEntityRelations } from "@/mastra/workflows/entity-relation-extraction/helpers/persisted-relations"
import {
  entityRelationExtractionWorkflowInputSchema,
} from "@/mastra/workflows/entity-relation-extraction/schemas"
import { loadAndValidateChunksStep } from "@/mastra/workflows/entity-relation-extraction/steps/load-and-validate-chunks.step"
import { loadAndValidateEntityStateStep } from "@/mastra/workflows/entity-relation-extraction/steps/load-and-validate-entity-state.step"
import { invokeRockyOnChunkStep } from "@/mastra/workflows/entity-relation-extraction/steps/invoke-rocky-on-chunk.step"
import z from "zod"

const relationArraySchema = z.array(entityRelationExtractionStructuredOutputSchema)

export const entityRelationExtractionWorkflow = createWorkflow({
  id: "entity-relation-extraction-workflow",
  description:
    "Validates chunk and entity-state JSON files, links entities by chunkId, and invokes Rocky per chunk.",
  inputSchema: entityRelationExtractionWorkflowInputSchema,
  outputSchema: relationArraySchema,
  options: {
    onFinish: async ({ status, result }) => {
      if (status !== "success") {
        return
      }

      try {
        const persistedPath = await writePersistedEntityRelations(result)
        console.log(`Persisted extracted relations to '${persistedPath}'.`)
      } catch (error) {
        console.error("Failed to persist extracted relations:", error)
      }
    },
  },
})
  .parallel([loadAndValidateChunksStep, loadAndValidateEntityStateStep])
  .map(async ({ inputData }) => {
    const chunks = inputData['load-and-validate-chunks']
    return chunks
  })
  .foreach(invokeRockyOnChunkStep, { concurrency: 1 })
  .map(async ({ inputData }) => {
    return inputData.filter((relation) => relation !== undefined)
  })
  .commit()
