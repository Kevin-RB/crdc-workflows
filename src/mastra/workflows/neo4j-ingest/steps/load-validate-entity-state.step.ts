import { entityExtractionWorkflowStateSchema } from "@/mastra/workflows/entity-extraction/schemas"
import { resolveFromOutputRoot } from "@/mastra/workflows/lib/workspace-functions"
import { createStep } from "@mastra/core/workflows"
import { access, readFile } from "node:fs/promises"
import z from "zod"

const ENTITY_STATE_PATH = resolveFromOutputRoot(
  "entity-extraction/global-state.json",
)

export const loadValidateEntityStateStep = createStep({
  id: "load-validate-entity-state",
  description: "Loads the entity extraction state JSON and validates schema.",
  inputSchema: z.object({}),
  outputSchema: entityExtractionWorkflowStateSchema,
  execute: async () => {
    await access(ENTITY_STATE_PATH)
    const raw = await readFile(ENTITY_STATE_PATH, "utf-8")
    const parsed = JSON.parse(raw)
    return entityExtractionWorkflowStateSchema.parse(parsed)
  },
})
