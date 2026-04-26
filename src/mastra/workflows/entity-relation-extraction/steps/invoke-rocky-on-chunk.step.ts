import { chunkSchema } from "@/interface/chunk"
import { entityRelationExtractionStructuredOutputSchema } from "@/mastra/agents/rocky/schema"
import { RELATION_EXTRACTION_SYSTEM_PROMPT } from "@/mastra/agents/rocky/system-prompts"
import { loadAndValidateEntityStateStep } from "@/mastra/workflows/entity-relation-extraction/steps/load-and-validate-entity-state.step"
import {
  entityRelationExtractionWorkflowStateSchema,
  type EntityRelationExtractionWorkflowState,
  writePersistedEntityRelationsState,
} from "@/mastra/workflows/entity-relation-extraction/helpers/persisted-relations"
import { createStep } from "@mastra/core/workflows"
import z from "zod"

const invokeRockyStateSchema = entityRelationExtractionWorkflowStateSchema

export const invokeRockyOnChunkStep = createStep({
  id: "invoke-rocky-on-chunk",
  inputSchema: chunkSchema,
  outputSchema: entityRelationExtractionStructuredOutputSchema.optional(),
  stateSchema: invokeRockyStateSchema,
  description: "Finds related entities for a chunk and asks Rocky for a fact.",
  execute: async ({ inputData, state, setState, mastra, getStepResult }) => {
    const processedChunkIds = state?.processedChunkIds ?? []
    const existingRelations = state?.relations ?? []

    if (processedChunkIds.includes(inputData.chunkId)) {
      console.log(`[invokeRockyOnChunkStep] Chunk ${inputData.chunkId} already processed. Skipping.`)
      return undefined
    }

    console.log(`[invokeRockyOnChunkStep] Executing for chunkId: ${inputData.chunkId}`)

    const rocky = mastra.getAgent("rockyAgent")

    const entityList = getStepResult(loadAndValidateEntityStateStep)

    if (!entityList.rawCandidateEntities) {
      throw new Error("Entity list not found in workflow state. Ensure loadAndValidateEntityStateStep executed successfully.")
    }

    const relatedEntities = entityList.rawCandidateEntities.filter((entity) =>
      entity.chunkIds.includes(inputData.chunkId),
    ).map((entity) => ({
      name: entity.name,
      type: entity.type,
      aliases: entity.aliases,
    }))

    const chunkContent = inputData.content

    const prompt = `
    CHUNK CONTENT:
    ${chunkContent}

    Related ENTITIES:
    ${JSON.stringify(relatedEntities, null, 2)}
    `

    const response = await rocky.generate(
      prompt,
      {
        system: RELATION_EXTRACTION_SYSTEM_PROMPT,
        structuredOutput: {
          schema: entityRelationExtractionStructuredOutputSchema,
          errorStrategy: "warn"
        }
      }
    )

    console.log(`[Rocky][chunk:${inputData.chunkId}] ${JSON.stringify(response.object, null, 2)}`)

    const parsedResult = entityRelationExtractionStructuredOutputSchema.safeParse(response.object)

    if (!parsedResult.success) {
      console.error(`[invokeRockyOnChunkStep] Rocky response failed schema validation for chunkId ${inputData.chunkId}:`, z.prettifyError(parsedResult.error))
    }

    const relation = parsedResult.success ? parsedResult.data : undefined

    if (relation) {
      const nextState: EntityRelationExtractionWorkflowState = {
        processedChunkIds: [...processedChunkIds, inputData.chunkId],
        relations: [...existingRelations, relation],
      }

      await setState(nextState)

      await writePersistedEntityRelationsState(nextState)
      console.log(`[invokeRockyOnChunkStep] Persisted state for chunk ${inputData.chunkId}. Total relations: ${nextState.relations.length}`)
    }

    return relation
  }
})
