import {
  entityExtractionPersistedStateSchema,
  EntityExtractionWorkflowState,
  entityExtractionWorkflowStateSchema,
} from "@/mastra/workflows/entity-extraction/schemas"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

const ENTITY_EXTRACTION_STATE_PATH = path.resolve(
  process.cwd(),
  "../../docs/entity-extraction/global-state.json",
)

export const normalizeKnownTypes = (values: string[]): string[] =>
  Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  )

export const buildPersistedEntityExtractionState = (state: EntityExtractionWorkflowState) => {
  const parsedState = entityExtractionWorkflowStateSchema.parse(state)

  return entityExtractionPersistedStateSchema.parse({
    ...parsedState,
    knownTypes: normalizeKnownTypes(parsedState.knownTypes),
    updatedAt: new Date().toISOString(),
  })
}

export const writePersistedEntityExtractionState = async (state: EntityExtractionWorkflowState): Promise<void> => {
  const persistedState = buildPersistedEntityExtractionState(state)

  await mkdir(path.dirname(ENTITY_EXTRACTION_STATE_PATH), { recursive: true })
  await writeFile(ENTITY_EXTRACTION_STATE_PATH, JSON.stringify(persistedState, null, 2), "utf-8")
}
