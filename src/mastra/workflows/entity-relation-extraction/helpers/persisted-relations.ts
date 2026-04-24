import {
  entityRelationExtractionStructuredOutputSchema,
} from "@/mastra/agents/rocky/schema"
import { resolveWorkspaceRoot } from "@/mastra/workflows/lib/workspace-functions"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import z from "zod"

const RELATIONS_RELATIVE_OUTPUT_PATH = "src/docs/entity-extraction/relations.json"

const relationsArraySchema = z.array(entityRelationExtractionStructuredOutputSchema)

export const writePersistedEntityRelations = async (relations: unknown): Promise<string> => {
  const validated = relationsArraySchema.parse(relations)
  const workspaceRoot = await resolveWorkspaceRoot()
  const outputPath = path.resolve(workspaceRoot, RELATIONS_RELATIVE_OUTPUT_PATH)

  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, JSON.stringify(validated, null, 2), "utf-8")

  return outputPath
}
