import { createStep } from "@mastra/core/workflows"
import { chunkArraySchema } from "@/mastra/workflows/entity-extraction/schemas"
import { resolveFromProjectRoot, resolveWorkspaceRoot } from "@/mastra/workflows/lib/workspace-functions"
import { access, readdir, readFile } from "node:fs/promises"
import path from "node:path"
import z from "zod"

const CHUNKS_DIR = resolveFromProjectRoot("src/docs/chunked")

const chunkFileArraySchema = z.array(chunkArraySchema)

export const loadValidateChunksStep = createStep({
  id: "load-validate-chunks",
  description: "Loads chunk JSON files and validates their schema.",
  inputSchema: z.object({}),
  outputSchema: chunkArraySchema,
  execute: async () => {
    await resolveWorkspaceRoot()
    await access(CHUNKS_DIR)

    const entries = await readdir(CHUNKS_DIR, { withFileTypes: true })
    const chunkFiles = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => path.join(CHUNKS_DIR, entry.name))

    if (chunkFiles.length === 0) {
      throw new Error(`No chunk JSON files found in '${CHUNKS_DIR}'.`)
    }

    const rawFiles = await Promise.all(
      chunkFiles.map(async (filePath) => {
        const raw = await readFile(filePath, "utf-8")
        return JSON.parse(raw)
      }),
    )

    const parsed = chunkFileArraySchema.parse(rawFiles)
    return parsed.flat()
  },
})
