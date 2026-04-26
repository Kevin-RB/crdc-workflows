import { chunkArraySchema } from "@/mastra/workflows/entity-extraction/schemas"
import { createStep } from "@mastra/core/workflows"
import { readFile } from "node:fs/promises"
import z from "zod"

export const loadChunkFileStep = createStep({
  id: "load-chunk-file-step",
  inputSchema: z.string().trim().min(1),
  outputSchema: chunkArraySchema,
  execute: async ({ inputData }) => {
    console.log(`[${loadChunkFileStep.id}] - Loading chunk file '${inputData}'.`)

    let raw: string
    try {
      raw = await readFile(inputData, "utf-8")
    } catch (error) {
      throw new Error(`Failed to read chunk file '${inputData}'.`, { cause: error })
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch (error) {
      throw new Error(`Invalid JSON in chunk file '${inputData}'.`, { cause: error })
    }

    const validated = chunkArraySchema.safeParse(parsed)
    if (!validated.success) {
      throw new Error(
        `Chunk file validation failed for '${inputData}'.\n${z.prettifyError(validated.error)}`,
        { cause: validated.error },
      )
    }
    console.log(`[${loadChunkFileStep.id}] - Successfully loaded all chunks from '${inputData}'.`)
    return validated.data
  },
})
