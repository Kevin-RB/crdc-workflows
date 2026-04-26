import { entityExtractionWorkflowStateSchema } from "@/mastra/workflows/entity-extraction/schemas"
import { createStep } from "@mastra/core/workflows"
import { readFile } from "node:fs/promises"
import z from "zod"

const ENTITY_EXTRACTION_STATE_PATH = ("../../docs/entity-extraction/global-state.json")

export const loadAndValidateEntityStateStep = createStep({
  id: "load-and-validate-entity-state",
  inputSchema: z.object({}),
  outputSchema: entityExtractionWorkflowStateSchema,
  description: "Loads entity state JSON and validates expected workflow schema.",
  execute: async ({ }) => {
    console.log(`[${loadAndValidateEntityStateStep.id}] - Loading and validating entity state JSON.`)
    const raw = await readFile(ENTITY_EXTRACTION_STATE_PATH, "utf-8")
    const parsed = JSON.parse(raw)
    const validation = entityExtractionWorkflowStateSchema.safeParse(parsed)
    if (!validation.success) {
      throw new Error(
        `Invalid entity state JSON shape in '${ENTITY_EXTRACTION_STATE_PATH}': ${validation.error.message}`,
      )
    }
    console.log(`[${loadAndValidateEntityStateStep.id}] - Successfully validated entity state JSON.`)
    return validation.data
  },
})
