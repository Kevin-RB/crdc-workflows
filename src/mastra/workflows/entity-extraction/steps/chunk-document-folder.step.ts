import { Chunk } from "@/interface/chunk"
import { openDataLoaderJsonSchema } from "@/interface/document"
import {
  documentChunksSchema,
  documentFolderSchema,
} from "@/mastra/workflows/entity-extraction/schemas"
import { chunkBySection } from "@/mastra/workflows/lib/chunking-function"
import { createStep } from "@mastra/core/workflows"
import { readFile } from "node:fs/promises"

export const chunkDocumentFolderStep = createStep({
  id: "chunk-document-folder",
  inputSchema: documentFolderSchema,
  outputSchema: documentChunksSchema,
  execute: async ({ inputData }) => {
    const allChunks: Chunk[] = []

    for (const filePath of inputData.documentFilePaths) {
      const raw = await readFile(filePath, "utf-8")
      const parsed = JSON.parse(raw)
      const validated = openDataLoaderJsonSchema.parse(parsed)
      const chunks = await chunkBySection(validated)
      const chunksWithDocumentId = chunks.map((chunk) => ({
        documentId: inputData.documentName,
        ...chunk,
      }))
      allChunks.push(...chunksWithDocumentId)
    }

    return {
      documentName: inputData.documentName,
      chunks: allChunks,
    }
  },
})
