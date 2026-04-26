import {
  entityRelationExtractionStructuredOutputSchema,
} from "@/mastra/agents/rocky/schema"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import z from "zod"

const RELATIONS_OUTPUT_PATH = path.resolve(
  process.cwd(),
  "../../docs/entity-extraction/relations.json",
)

const relationsArraySchema = z.array(entityRelationExtractionStructuredOutputSchema)

export const writePersistedEntityRelations = async (relations: unknown): Promise<string> => {
  const validated = relationsArraySchema.parse(relations)

  await mkdir(path.dirname(RELATIONS_OUTPUT_PATH), { recursive: true })
  await writeFile(RELATIONS_OUTPUT_PATH, JSON.stringify(validated, null, 2), "utf-8")

  return RELATIONS_OUTPUT_PATH
}
