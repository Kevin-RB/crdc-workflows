import { createStep } from "@mastra/core/workflows"
import { readdir } from "node:fs/promises"
import path from "node:path"
import z from "zod"

const TARGET_DOCUMENT_DIR = "../../docs/chunked"

export const loadChunksStep = createStep({
  id: "load-chunks-step",
  inputSchema: z.object({}),
  outputSchema: z.array(z.string({ error: "Expected file path" })),
  execute: async ({ inputData }) => {
    console.log(`[${loadChunksStep.id}] - Loading chunks...`)

    const folder = await readdir(TARGET_DOCUMENT_DIR, { withFileTypes: true })

    const validFiles = folder
      .filter((dirent) => dirent.isFile() && dirent.name.endsWith(".json"))
      .map((dirent) => {
        console.log(`[${loadChunksStep.id}] - File path: ${path.join(TARGET_DOCUMENT_DIR, dirent.name)}`)
        return path.join(TARGET_DOCUMENT_DIR, dirent.name)
      })

    if (validFiles.length === 0) {
      console.warn(`[${loadChunksStep.id}] - No chunk files found in '${TARGET_DOCUMENT_DIR}'.`)
      return []
    }
    console.log(`[${loadChunksStep.id}] - Found: \n ${validFiles.join("\n")}.`)

    return validFiles
  },
})
