import {
  DUMMY_JSON_RELATIVE_FILE_PATH,
} from "@/mastra/workflows/entity-extraction/constants"
import { readWorkspaceRelativeJson } from "@/mastra/workflows/entity-extraction/helpers/read-workspace-relative-json"
import { chunkArraySchema, chunkSourceModeSchema } from "@/mastra/workflows/entity-extraction/schemas"
import { createStep } from "@mastra/core/workflows"

export const loadChunksFromFileStep = createStep({
  id: "load-chunks-from-file",
  inputSchema: chunkSourceModeSchema,
  outputSchema: chunkArraySchema,
  execute: async () => {
    const configuredPath = process.env[DUMMY_JSON_RELATIVE_FILE_PATH]

    if (!configuredPath) {
      throw new Error(
        `Environment variable ${DUMMY_JSON_RELATIVE_FILE_PATH} is not set.`,
      )
    }

    const parsed = await readWorkspaceRelativeJson({
      configuredPath,
      envVarName: DUMMY_JSON_RELATIVE_FILE_PATH,
      dataLabel: "dummy data",
    })

    return chunkArraySchema.parse(parsed)
  },
})
