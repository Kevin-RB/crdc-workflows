import { CHUNKED_OUTPUT_DIR, DEFAULT_DOC_PATH, resolveWorkspaceRoot } from "@/mastra/workflows/lib/workspace-functions"
import { chunkArraySchema } from "@/mastra/workflows/entity-extraction/schemas"
import { createStep } from "@mastra/core/workflows"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

export const writeChunksToFileStep = createStep({
  id: "write-chunks-to-file",
  inputSchema: chunkArraySchema,
  outputSchema: chunkArraySchema,
  execute: async ({ inputData }) => {
    const configuredPath = process.env.ENTITY_EXTRACTION_DOC_PATH ?? DEFAULT_DOC_PATH
    const workspaceRoot = await resolveWorkspaceRoot()

    const outputDir = path.resolve(workspaceRoot, CHUNKED_OUTPUT_DIR)
    await mkdir(outputDir, { recursive: true })

    const inputBaseName = path.basename(configuredPath, path.extname(configuredPath))
    const outputFileName = `${inputBaseName}.chunked.json`
    const outputPath = path.join(outputDir, outputFileName)

    await writeFile(outputPath, JSON.stringify(inputData, null, 2), "utf-8")
    return inputData
  },
})
