import { chunkSchema } from "@/interface/chunk"
import { entityRelationExtractionStructuredOutputSchema } from "@/mastra/agents/rocky/schema"
import { RELATION_EXTRACTION_SYSTEM_PROMPT } from "@/mastra/agents/rocky/system-prompts"
import { loadAndValidateEntityStateStep } from "@/mastra/workflows/entity-relation-extraction/steps/load-and-validate-entity-state.step"
import { createStep } from "@mastra/core/workflows"
import z from "zod"

export const invokeRockyOnChunkStep = createStep({
  id: "invoke-rocky-on-chunk",
  inputSchema: chunkSchema,
  outputSchema: entityRelationExtractionStructuredOutputSchema.optional(),
  description: "Finds related entities for a chunk and asks Rocky for a fact.",
  execute: async ({ inputData, state, mastra, getStepResult }) => {
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
      // Depending on requirements, you might want to throw an error here to trigger a retry, or return a default value.
      // For now, we'll return the raw text response even if it doesn't match the schema.
    }

    return parsedResult.success ? parsedResult.data : undefined
  }
})
