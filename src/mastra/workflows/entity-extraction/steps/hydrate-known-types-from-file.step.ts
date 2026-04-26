import { entityExtractionPersistedStateSchema, entityExtractionWorkflowStateSchema } from "@/mastra/workflows/entity-extraction/schemas"
import { createStep } from "@mastra/core/workflows"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import z from "zod"

const hydrateKnownTypesStateSchema = entityExtractionWorkflowStateSchema.pick({
  knownTypes: true,
  rawCandidateEntities: true,
  processedChunkIds: true,
})
const GLOBAL_STATE_PATH = path.resolve(process.cwd(), "../../docs/entity-extraction/global-state.json")

const normalizeKnownTypes = (values: string[]): string[] =>
  Array.from(new Set(values.map((value) => value.trim()).filter((value) => value.length > 0)))

export const hydrateKnownTypesFromFileStep = createStep({
  id: "hydrate-known-types-from-file",
  inputSchema: z.object({}).optional().default({}),
  outputSchema: z.object({}),
  stateSchema: hydrateKnownTypesStateSchema,
  description: "Loads global knownTypes and rawCandidateEntities from persisted workflow state.",
  execute: async ({ inputData, setState }) => {
    console.log(`[${hydrateKnownTypesFromFileStep.id}] - Loading known types and candidate entities from persisted state file '${GLOBAL_STATE_PATH}'.`)
    let raw: string
    try {
      raw = await readFile(GLOBAL_STATE_PATH, "utf-8")
    } catch (error) {
      const err = error as NodeJS.ErrnoException
      if (err.code !== "ENOENT") {
        throw error
      }

      const initialState = entityExtractionPersistedStateSchema.parse({
        knownTypes: [],
        rawCandidateEntities: [],
        processedChunkIds: [],
        updatedAt: new Date().toISOString(),
      })

      await mkdir(path.dirname(GLOBAL_STATE_PATH), { recursive: true })
      await writeFile(GLOBAL_STATE_PATH, JSON.stringify(initialState, null, 2), "utf-8")
      raw = JSON.stringify(initialState)
      console.log(`[${hydrateKnownTypesFromFileStep.id}] - Persisted state file did not exist. Created new file at '${GLOBAL_STATE_PATH}'.`)
    }

    const parsedJson = JSON.parse(raw)
    const parsedState = entityExtractionPersistedStateSchema.parse(parsedJson)

    await setState({
      knownTypes: normalizeKnownTypes(parsedState.knownTypes),
      rawCandidateEntities: parsedState.rawCandidateEntities,
      processedChunkIds: parsedState.processedChunkIds,
    })

    return inputData
  },
})
