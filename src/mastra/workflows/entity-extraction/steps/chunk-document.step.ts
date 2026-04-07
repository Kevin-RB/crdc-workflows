import { openDataLoaderJsonSchema } from "@/interface/document"
import { chunkBySection } from "@/mastra/workflows/lib/chunking-function"
import { chunkArraySchema } from "@/mastra/workflows/entity-extraction/schemas"
import { createStep } from "@mastra/core/workflows"

export const chunkDocumentStep = createStep({
  id: "chunk-document",
  inputSchema: openDataLoaderJsonSchema,
  outputSchema: chunkArraySchema,
  execute: async ({ inputData }) => chunkBySection(inputData),
})
