import { openDataLoaderJsonSchema } from "@/interface/document"
import { ENTITY_EXTRACTION_DOC_PATH_ENV } from "@/mastra/workflows/entity-extraction/constants"
import { readWorkspaceRelativeJson } from "@/mastra/workflows/entity-extraction/helpers/read-workspace-relative-json"
import { chunkSourceModeSchema } from "@/mastra/workflows/entity-extraction/schemas"
import { DEFAULT_DOC_PATH } from "@/mastra/workflows/lib/workspace-functions"
import { createStep } from "@mastra/core/workflows"

export const loadDocumentFromFileStep = createStep({
  id: "load-document-from-file",
  inputSchema: chunkSourceModeSchema,
  outputSchema: openDataLoaderJsonSchema,
  execute: async () => {
    const configuredPath = process.env[ENTITY_EXTRACTION_DOC_PATH_ENV] ?? DEFAULT_DOC_PATH

    const parsed = await readWorkspaceRelativeJson({
      configuredPath,
      envVarName: ENTITY_EXTRACTION_DOC_PATH_ENV,
      dataLabel: "document",
    })

    return openDataLoaderJsonSchema.parse(parsed)
  },
})
