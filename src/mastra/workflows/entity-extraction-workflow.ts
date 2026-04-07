import { createWorkflow } from "@mastra/core/workflows"
import {
  chunkArraySchema,
  chunkSourceModeSchema,
  entityExtractionWorkflowStateSchema,
} from "@/mastra/workflows/entity-extraction/schemas"
import { resolveChunkSourceModeStep } from "@/mastra/workflows/entity-extraction/steps/resolve-chunk-source-mode.step"
import { validateChunksStep } from "@/mastra/workflows/entity-extraction/steps/validate-chunks.step"
import { documentChunksWorkflow } from "@/mastra/workflows/entity-extraction/subworkflows/document-chunks.workflow"
import { dummyChunksWorkflow } from "@/mastra/workflows/entity-extraction/subworkflows/dummy-chunks.workflow"
import { extractEntityAgentStep } from "@/mastra/workflows/entity-extraction/steps/extract-entity.step"

export const entityExtractionWorkflow = createWorkflow({
  id: "entity-extraction-workflow",
  description: "A workflow that extracts entities from a document",
  options: {
    validateInputs: true,
  },
  inputSchema: chunkSourceModeSchema,
  outputSchema: chunkArraySchema,
  stateSchema: entityExtractionWorkflowStateSchema,
})
  .then(resolveChunkSourceModeStep)
  .branch([
    [async ({ inputData }) => inputData.useDummy === true, dummyChunksWorkflow],
    [async ({ inputData }) => inputData.useDummy !== true, documentChunksWorkflow],
  ])
  .then(validateChunksStep)
  .foreach(extractEntityAgentStep)
  .commit()
