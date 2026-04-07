import { chunkArraySchema, chunkSourceModeSchema } from "@/mastra/workflows/entity-extraction/schemas"
import { loadChunksFromFileStep } from "@/mastra/workflows/entity-extraction/steps/load-chunks-from-file.step"
import { createWorkflow } from "@mastra/core/workflows"

export const dummyChunksWorkflow = createWorkflow({
  id: "dummy-chunks-workflow",
  inputSchema: chunkSourceModeSchema,
  outputSchema: chunkArraySchema,
})
  .then(loadChunksFromFileStep)
  .commit()
