import { documentChunksSchema } from "@/mastra/workflows/entity-extraction/schemas"
import { resolveFromOutputRoot } from "@/mastra/workflows/lib/workspace-functions"
import { createStep } from "@mastra/core/workflows"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

const CHUNK_OUTPUT_DIR = resolveFromOutputRoot("chunked")

export const writeDocumentChunksStep = createStep({
  id: "write-document-chunks",
  inputSchema: documentChunksSchema,
  outputSchema: documentChunksSchema,
  execute: async ({ inputData }) => {
    await mkdir(CHUNK_OUTPUT_DIR, { recursive: true })

    const outputFileName = `${inputData.documentName}.chunked.json`
    const outputPath = path.join(CHUNK_OUTPUT_DIR, outputFileName)

    await writeFile(outputPath, JSON.stringify(inputData.chunks, null, 2), "utf-8")
    return inputData
  },
})
