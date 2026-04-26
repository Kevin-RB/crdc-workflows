import {
  entityRelationExtractionStructuredOutputSchema,
} from "@/mastra/agents/rocky/schema"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import z from "zod"

const RELATIONS_OUTPUT_PATH = path.resolve(
  process.cwd(),
  "../../docs/entity-extraction/relations.json",
)

const relationsArraySchema = z.array(entityRelationExtractionStructuredOutputSchema)

export const entityRelationExtractionWorkflowStateSchema = z.object({
  processedChunkIds: z.array(z.string().trim().min(1)).default([]),
  relations: relationsArraySchema.default([]),
})

export const entityRelationExtractionPersistedStateSchema =
  entityRelationExtractionWorkflowStateSchema.extend({
  updatedAt: z.string().trim().min(1),
  })

export type EntityRelationExtractionWorkflowState = z.infer<
  typeof entityRelationExtractionWorkflowStateSchema
>

export type EntityRelationExtractionPersistedState = z.infer<
  typeof entityRelationExtractionPersistedStateSchema
>

export const initializePersistedEntityRelationsState = async (): Promise<EntityRelationExtractionPersistedState> => {
  const initialState: EntityRelationExtractionPersistedState = {
    processedChunkIds: [],
    relations: [],
    updatedAt: new Date().toISOString(),
  }

  await mkdir(path.dirname(RELATIONS_OUTPUT_PATH), { recursive: true })
  await writeFile(RELATIONS_OUTPUT_PATH, JSON.stringify(initialState, null, 2), "utf-8")

  return initialState
}

export const loadPersistedEntityRelationsState = async (): Promise<EntityRelationExtractionPersistedState> => {
  const raw = await readFile(RELATIONS_OUTPUT_PATH, "utf-8")
  const parsed = JSON.parse(raw)
  return entityRelationExtractionPersistedStateSchema.parse(parsed)
}

export const writePersistedEntityRelationsState = async (
  state: EntityRelationExtractionWorkflowState,
): Promise<void> => {
  const persistedState: EntityRelationExtractionPersistedState = {
    ...state,
    updatedAt: new Date().toISOString(),
  }

  await mkdir(path.dirname(RELATIONS_OUTPUT_PATH), { recursive: true })
  await writeFile(RELATIONS_OUTPUT_PATH, JSON.stringify(persistedState, null, 2), "utf-8")
}
