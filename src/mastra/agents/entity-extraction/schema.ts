import z from "zod"

const nonEmptyStringSchema = z.string().trim().min(1, { message: "Required" })

const uniqueStringArraySchema = z
  .array(nonEmptyStringSchema)
  .transform((values) => Array.from(new Set(values.map((value) => value.trim()))))

export const candidateEntitySchema = z.object({
  name: nonEmptyStringSchema.describe(
    "Canonical entity name from the chunk. Use the shortest unambiguous label, e.g. 'Cotton plant'.",
  ),
  type: nonEmptyStringSchema.describe(
    "Entity category label. Prefer one of the provided known types when it matches; otherwise propose a new broad type.",
  ),
  aliases: uniqueStringArraySchema.describe(
    "Alternative names seen in the chunk for the same entity. Omit duplicates and near-duplicates.",
  ),
  description: nonEmptyStringSchema.describe(
    "Concise factual description grounded in the chunk text. Do not invent details not present in the chunk.",
  ),
  confidence: z
    .number()
    .min(0)
    .max(10)
    .describe("Optional confidence score between 0 and 1 for this extraction."),
  typeStatus: z
    .enum(["existing", "new"])
    .describe("Mark as 'existing' when type matches known types, otherwise 'new'."),
})

export const chunkExtractionOutputSchema = z.array(candidateEntitySchema).describe(
  "List of candidate entities extracted from the chunk. Return an empty array when none are found.",
)

export const consolidatedEntitySchema = z.object({
  name: nonEmptyStringSchema,
  type: nonEmptyStringSchema,
  aliases: uniqueStringArraySchema,
  description: nonEmptyStringSchema,
  sourceChunkIds: uniqueStringArraySchema.describe(
    "All unique chunk IDs where this consolidated entity was detected.",
  ),
  evidence: uniqueStringArraySchema.optional(),
  confidence: z.number().min(0).max(1).optional(),
})

export const consolidatedEntitiesDocumentSchema = z.object({
  documentId: nonEmptyStringSchema,
  sourceFile: nonEmptyStringSchema,
  generatedAt: nonEmptyStringSchema.describe("ISO-8601 timestamp for when this file was generated."),
  knownTypesSnapshot: uniqueStringArraySchema,
  candidateEntities: z.array(consolidatedEntitySchema),
})

export const knownTypesFileSchema = z.object({
  knownTypes: uniqueStringArraySchema.describe("Global list of known entity types accumulated across documents."),
  updatedAt: nonEmptyStringSchema.describe("ISO-8601 timestamp for last taxonomy update."),
})

export type CandidateEntity = z.infer<typeof candidateEntitySchema>
export type ChunkExtractionOutput = z.infer<typeof chunkExtractionOutputSchema>
export type ConsolidatedEntity = z.infer<typeof consolidatedEntitySchema>
export type ConsolidatedEntitiesDocument = z.infer<typeof consolidatedEntitiesDocumentSchema>
export type KnownTypesFile = z.infer<typeof knownTypesFileSchema>
