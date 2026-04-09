import { chunkSchema } from "@/interface/chunk"
import { buildEntityExtractionUserPrompt } from "@/mastra/agents/entity-extraction/prompts"
import {
  chunkExtractionOutputSchema,
  type CandidateEntity,
} from "@/mastra/agents/entity-extraction/schema"
import { entityExtractionWorkflowStateSchema } from "@/mastra/workflows/entity-extraction/schemas"
import { createStep } from "@mastra/core/workflows"
import z from "zod"

const extractEntityStateSchema = entityExtractionWorkflowStateSchema.pick({
  knownTypes: true,
  rawCandidateEntities: true,
})

const extractEntitySuspendSchema = z.object({
  chunkId: z.string(),
  message: z.string(),
  errorType: z.string().optional(),
})

const extractEntityResumeSchema = z.object({
  action: z.literal("retry"),
})

const normalizeValue = (value: string): string => value.trim()

export const extractEntityAgentStep = createStep({
  id: "extract-entity-agent",
  inputSchema: chunkSchema,
  outputSchema: chunkExtractionOutputSchema,
  stateSchema: extractEntityStateSchema,
  suspendSchema: extractEntitySuspendSchema,
  resumeSchema: extractEntityResumeSchema,
  description: "Step that uses an agent to extract candidate entities from a chunk of text.",
  retries: 1,
  execute: async ({ inputData, state, setState, mastra, suspend, resumeData}) => {
    const extractionAgent = mastra.getAgent("entityExtractionAgent")

    const knownTypes = state.knownTypes ?? []
    const rawCandidateEntities = state.rawCandidateEntities ?? []

    const persistEntities = async (entities: CandidateEntity[]): Promise<CandidateEntity[]> => {
      const knownTypeSet = new Set(knownTypes.map(normalizeValue))
      const newTypes = entities
        .map((entity) => entity.type)
        .filter((type) => !knownTypeSet.has(type))

      await setState({
        knownTypes: Array.from(new Set([...knownTypes, ...newTypes])),
        rawCandidateEntities: [...rawCandidateEntities, ...entities],
      })

      return entities
    }

    if (resumeData && resumeData.action !== "retry") {
      throw new Error("Unsupported resume action for extract-entity-agent step.")
    }

    const prompt = buildEntityExtractionUserPrompt({
      chunkText: inputData.content,
      knownTypes,
    })

    try {
      const response = await extractionAgent.generate(
        [{ role: "user", content: prompt }],
        {
          structuredOutput: {
            schema: chunkExtractionOutputSchema,
          },
        },
      )

      const parsed = chunkExtractionOutputSchema.safeParse(response.object)

      if (!parsed.success) {
        throw new Error(z.prettifyError(parsed.error))
      }

      const candidateEntities: CandidateEntity[] = parsed.data.map((entity) => ({
        ...entity,
        sourceChunkId: inputData.id,
        type: normalizeValue(entity.type),
        aliases: Array.from(new Set(entity.aliases.map(normalizeValue).filter(Boolean))),
      }))

      return persistEntities(candidateEntities)
    } catch (error) {
      return suspend(
        {
          chunkId: inputData.id,
          message: error instanceof Error ? error.message : String(error),
          errorType: error instanceof Error ? error.name : "UnknownError",
        },
        {
          resumeLabel: `chunk:${inputData.id}`,
        },
      )
    }
  },
})
