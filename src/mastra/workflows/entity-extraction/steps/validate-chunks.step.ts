import { chunkArraySchema } from "@/mastra/workflows/entity-extraction/schemas"
import { createStep } from "@mastra/core/workflows"
import z from "zod"

export const validateChunksStep = createStep({
  id: "validate-chunks",
  inputSchema: z.object({
    "dummy-chunks-workflow": chunkArraySchema.optional(),
    "document-chunks-workflow": chunkArraySchema.optional(),
  }),
  outputSchema: chunkArraySchema,
  execute: async ({ inputData }) => {
    const selectedChunks = inputData["dummy-chunks-workflow"] ?? inputData["document-chunks-workflow"]
    if (!selectedChunks) {
      throw new Error("Branch output did not contain chunk data.")
    }

    return chunkArraySchema.parse(selectedChunks)
  },
})
