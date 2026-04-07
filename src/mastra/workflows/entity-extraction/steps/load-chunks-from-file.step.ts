import {
  DEFAULT_DUMMY_CHUNK_PATH,
  ENTITY_EXTRACTION_CHUNK_PATH_ENV,
} from "@/mastra/workflows/entity-extraction/constants"
import { readWorkspaceRelativeJson } from "@/mastra/workflows/entity-extraction/helpers/read-workspace-relative-json"
import { chunkArraySchema, chunkSourceModeSchema } from "@/mastra/workflows/entity-extraction/schemas"
import { createStep } from "@mastra/core/workflows"

export const loadChunksFromFileStep = createStep({
  id: "load-chunks-from-file",
  inputSchema: chunkSourceModeSchema,
  outputSchema: chunkArraySchema,
  execute: async () => {
    const configuredPath = process.env[ENTITY_EXTRACTION_CHUNK_PATH_ENV] ?? DEFAULT_DUMMY_CHUNK_PATH

    const parsed = await readWorkspaceRelativeJson({
      configuredPath,
      envVarName: ENTITY_EXTRACTION_CHUNK_PATH_ENV,
      dataLabel: "chunk",
    })

    return chunkArraySchema.parse(parsed)
  },
})
