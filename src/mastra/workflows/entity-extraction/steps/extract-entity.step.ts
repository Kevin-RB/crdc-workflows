import { chunkSchema } from "@/interface/chunk"
import { buildEntityExtractionUserPrompt } from "@/mastra/agents/entity-extraction/prompts"
import {
  chunkExtractionOutputSchema,
  type CandidateEntity,
} from "@/mastra/agents/entity-extraction/schema"
import { entityExtractionWorkflowStateSchema } from "@/mastra/workflows/entity-extraction/schemas"
import { createStep } from "@mastra/core/workflows"

const extractEntityStateSchema = entityExtractionWorkflowStateSchema.pick({
  knownTypes: true,
  rawCandidateEntities: true,
})

const normalizeValue = (value: string): string => value.trim()

export const extractEntityAgentStep = createStep({
  id: "extract-entity-agent",
  inputSchema: chunkSchema,
  outputSchema: chunkExtractionOutputSchema,
  stateSchema: extractEntityStateSchema,
  execute: async ({ inputData, state, setState, mastra }) => {
    const extractionAgent = mastra.getAgent("entityExtractionAgent")

    const knownTypes = state.knownTypes ?? []
    const rawCandidateEntities = state.rawCandidateEntities ?? []

    const prompt = buildEntityExtractionUserPrompt({
      chunkId: inputData.id,
      chunkText: inputData.content,
      chunkMetadata: inputData.metadata,
      knownTypes,
    })

    const response = await extractionAgent.generate(
      [{role: "user", content: prompt}],
      {
        structuredOutput: {
          schema: chunkExtractionOutputSchema,
        },
      },
    )

    const parsed = chunkExtractionOutputSchema.safeParse(response.object)

    if (!parsed.success) {
      throw new Error(`Failed to parse entity extraction output: ${parsed.error.message}`)
    }

    const candidateEntities: CandidateEntity[] = parsed.data.map((entity) => ({
      ...entity,
      sourceChunkId: inputData.id,
      type: normalizeValue(entity.type),
      aliases: entity.aliases ? Array.from(new Set(entity.aliases.map(normalizeValue).filter(Boolean))) : undefined,
    }))

    const knownTypeSet = new Set(knownTypes.map(normalizeValue))
    const newTypes = candidateEntities
      .map((entity) => entity.type)
      .filter((type) => !knownTypeSet.has(type))

    await setState({
      knownTypes: Array.from(new Set([...knownTypes, ...newTypes])),
      rawCandidateEntities: [...rawCandidateEntities, ...candidateEntities],
    })

    return candidateEntities
  },
})
