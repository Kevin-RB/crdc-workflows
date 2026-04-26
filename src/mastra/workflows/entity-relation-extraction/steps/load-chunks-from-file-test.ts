import {
    entityRelationExtractionChunkArraySchema,
} from "@/mastra/workflows/entity-relation-extraction/schemas"
import { createStep } from "@mastra/core/workflows"
import { readFile } from "node:fs/promises"
import z from "zod"

export const loadChunksFromFile = createStep({
    id: "load-chunks-from-file",
    inputSchema: z.string(),
    outputSchema: entityRelationExtractionChunkArraySchema,
    description: "Loads chunk JSON from a file.",
    execute: async ({ inputData }) => {
        console.log(`[${loadChunksFromFile.id}] - Loading chunks from file: \n ${inputData}.`)

        const raw = await readFile(inputData, "utf-8")
        const parsed = JSON.parse(raw)
        const validation = entityRelationExtractionChunkArraySchema.safeParse(parsed)
        if (!validation.success) {
            throw new Error(
                `Invalid chunks JSON shape in '${inputData}': ${validation.error.message}`,
            )
        }
        console.log(`[${loadChunksFromFile.id}] - Successfully validated chunks from '${inputData}'.`)
        console.log(`[${loadChunksFromFile.id}] - Number of chunks in '${inputData}': ${validation.data.length}.`)
        console.log(`[${loadChunksFromFile.id}] - Sample chunk from '${inputData}': ${JSON.stringify(validation.data[0], null, 2)}.`)

        return validation.data
    },
})
