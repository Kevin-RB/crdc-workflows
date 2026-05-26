import { entityRelationExtractionStructuredOutputSchema } from "@/mastra/agents/relation-building/schema"
import { resolveFromProjectRoot, resolveWorkspaceRoot } from "@/mastra/workflows/lib/workspace-functions"
import { createStep } from "@mastra/core/workflows"
import { access, readFile } from "node:fs/promises"
import z from "zod"

const RELATIONS_PATH = resolveFromProjectRoot(
  "src/docs/entity-extraction/relations.json",
)

const relationsSchema = z.array(entityRelationExtractionStructuredOutputSchema)

const fromFileSchema = z.object({
  processedChunkIds: z.array(z.string()),
  relations: relationsSchema,
})

export const loadValidateRelationsStep = createStep({
  id: "load-validate-relations",
  description: "Loads the relations JSON and validates schema.",
  inputSchema: z.object({}),
  outputSchema: relationsSchema,
  execute: async () => {
    await resolveWorkspaceRoot()
    await access(RELATIONS_PATH)
    const raw = await readFile(RELATIONS_PATH, "utf-8")
    const parsed = JSON.parse(raw)
    return fromFileSchema.parse(parsed).relations
  },
})
