import { createStep } from "@mastra/core/workflows"
import { chunkSourceModeSchema } from "@/mastra/workflows/entity-extraction/schemas"

export const resolveChunkSourceModeStep = createStep({
  id: "resolve-chunk-source-mode",
  inputSchema: chunkSourceModeSchema,
  outputSchema: chunkSourceModeSchema,
  execute: async ({ inputData }) => ({
    useDummy: inputData.useDummy ?? false,
  }),
})
