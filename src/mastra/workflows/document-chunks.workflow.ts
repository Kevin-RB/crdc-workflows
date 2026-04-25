import { chunkArraySchema } from "@/mastra/workflows/entity-extraction/schemas"
import { chunkDocumentFolderStep } from "@/mastra/workflows/entity-extraction/steps/chunk-document-folder.step"
import { readDocumentFoldersStep } from "@/mastra/workflows/entity-extraction/steps/read-document-folders.step"
import { writeDocumentChunksStep } from "@/mastra/workflows/entity-extraction/steps/write-document-chunks.step"
import { createWorkflow } from "@mastra/core/workflows"
import z from "zod"

export const documentChunksWorkflow = createWorkflow({
  id: "chunk-document-workflow",
  inputSchema: z.object({}),
  outputSchema: chunkArraySchema,
})
  .then(readDocumentFoldersStep)
  .foreach(chunkDocumentFolderStep)
  .foreach(writeDocumentChunksStep)
  .map(async ({ inputData }) => inputData.flatMap((item) => item.chunks))
  .commit()
