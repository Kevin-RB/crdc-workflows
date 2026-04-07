import { chunkArraySchema, chunkSourceModeSchema } from "@/mastra/workflows/entity-extraction/schemas"
import { chunkDocumentStep } from "@/mastra/workflows/entity-extraction/steps/chunk-document.step"
import { loadDocumentFromFileStep } from "@/mastra/workflows/entity-extraction/steps/load-document-from-file.step"
import { writeChunksToFileStep } from "@/mastra/workflows/entity-extraction/steps/write-chunks-to-file.step"
import { createWorkflow } from "@mastra/core/workflows"

export const documentChunksWorkflow = createWorkflow({
  id: "document-chunks-workflow",
  inputSchema: chunkSourceModeSchema,
  outputSchema: chunkArraySchema,
})
  .then(loadDocumentFromFileStep)
  .then(chunkDocumentStep)
  .then(writeChunksToFileStep)
  .commit()
