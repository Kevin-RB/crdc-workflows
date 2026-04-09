import { openDataLoaderJsonSchema } from "@/interface/document"
import { ENTITY_EXTRACTION_DOC_PATH_ENV } from "@/mastra/workflows/entity-extraction/constants"
import { readWorkspaceRelativeJson } from "@/mastra/workflows/entity-extraction/helpers/read-workspace-relative-json"
import { chunkSourceModeSchema } from "@/mastra/workflows/entity-extraction/schemas"
import { createStep } from "@mastra/core/workflows"

export const loadDocumentFromFileStep = createStep({
  id: "load-document-from-file",
  inputSchema: chunkSourceModeSchema,
  outputSchema: openDataLoaderJsonSchema,
  execute: async () => {
    const configuredPath = process.env[ENTITY_EXTRACTION_DOC_PATH_ENV]

    if (!configuredPath) {
      throw new Error(
        `Environment variable ${ENTITY_EXTRACTION_DOC_PATH_ENV} is not set.`,
      )
    }

    const parsed = await readWorkspaceRelativeJson({
      configuredPath,
      envVarName: ENTITY_EXTRACTION_DOC_PATH_ENV,
      dataLabel: "document",
    })

    return openDataLoaderJsonSchema.parse(parsed)
  },
})
