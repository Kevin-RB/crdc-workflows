import { createStep } from "@mastra/core/workflows"
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import z from "zod"

const TARGET_DOCUMENT_DIR = "../../docs/chunked"

export const loadAndValidateChunksStep = createStep({
  id: "load-and-validate-chunks",
  inputSchema: z.object({}),
  outputSchema: z.array(z.string()),
  description: "Loads chunk JSON and validates it against chunk schema array.",
  execute: async ({ inputData }) => {
    console.log(`[${loadAndValidateChunksStep.id}] - Loading and validating chunks from ${TARGET_DOCUMENT_DIR}`)

    const folder = await readdir(TARGET_DOCUMENT_DIR, { withFileTypes: true })

    const filePaths = folder
      .filter((dirent) => dirent.isFile() && dirent.name.endsWith(".json"))
      .map((dirent) => path.join(TARGET_DOCUMENT_DIR, dirent.name))

    return filePaths
  },
})
