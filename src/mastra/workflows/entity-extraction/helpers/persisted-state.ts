import {
  ENTITY_EXTRACTION_STATE_RELATIVE_FILE_PATH,
} from "@/mastra/workflows/entity-extraction/constants"
import {
  entityExtractionPersistedStateSchema,
  entityExtractionWorkflowStateSchema,
} from "@/mastra/workflows/entity-extraction/schemas"
import { resolveWorkspaceRoot } from "@/mastra/workflows/lib/workspace-functions"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

export const normalizeKnownTypes = (values: string[]): string[] =>
  Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  )

export const getPersistedEntityExtractionStatePath = async (): Promise<string> => {
  const workspaceRoot = await resolveWorkspaceRoot()
  const statePath = process.env[ENTITY_EXTRACTION_STATE_RELATIVE_FILE_PATH]
  if (!statePath) {
    throw new Error(`Environment variable '${ENTITY_EXTRACTION_STATE_RELATIVE_FILE_PATH}' is not set`)
  }
  return path.resolve(workspaceRoot, statePath)
}

export const readPersistedEntityExtractionStateRaw = async (): Promise<unknown> => {
  const persistedPath = await getPersistedEntityExtractionStatePath()
  const raw = await readFile(persistedPath, "utf-8")
  return raw
}

export const parsePersistedEntityExtractionState = (raw: unknown) => {
  const parsed = entityExtractionPersistedStateSchema.parse(raw)
  return {
    ...parsed,
    knownTypes: normalizeKnownTypes(parsed.knownTypes),
  }
}

export const buildPersistedEntityExtractionState = (state: unknown) => {
  const parsedState = entityExtractionWorkflowStateSchema.parse(state)

  return entityExtractionPersistedStateSchema.parse({
    ...parsedState,
    knownTypes: normalizeKnownTypes(parsedState.knownTypes),
    updatedAt: new Date().toISOString(),
  })
}

export const writePersistedEntityExtractionState = async (state: unknown): Promise<void> => {
  const persistedPath = await getPersistedEntityExtractionStatePath()
  const persistedState = buildPersistedEntityExtractionState(state)

  await mkdir(path.dirname(persistedPath), { recursive: true })
  await writeFile(persistedPath, JSON.stringify(persistedState, null, 2), "utf-8")
}
