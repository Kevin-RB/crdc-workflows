import z from "zod"

const nonEmptyStringSchema = z.string().trim().min(1, { message: "Required" })

const uniqueStringArraySchema = z
  .array(nonEmptyStringSchema)
  .transform((values) => Array.from(new Set(values.map((value) => value.trim()))))

const nonEmptyUniqueStringArraySchema = z
  .array(nonEmptyStringSchema)
  .min(1)
  .transform((values) => Array.from(new Set(values.map((value) => value.trim()))))

export const candidateEntitySchema = z.object({
  chunkIds: nonEmptyUniqueStringArraySchema,
  name: nonEmptyStringSchema.describe(
    "Canonical entity name from the chunk. Use the shortest unambiguous label, e.g. 'Cotton plant'.",
  ),
  type: nonEmptyStringSchema.describe(
    "Entity category label. Prefer one of the provided known types when it matches; otherwise propose a new broad type.",
  ),
  aliases: uniqueStringArraySchema.describe(
    "Alternative names seen in the chunk for the same entity. Omit duplicates and near-duplicates.",
  ),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Optional confidence score between 0 and 1 for this extraction."),
})

export const candidateEntityExtractionOutputSchema = candidateEntitySchema.pick({
  name: true,
  type: true,
  aliases: true,
  confidence: true
})

export const chunkExtractionOutputSchema = z.array(candidateEntityExtractionOutputSchema).describe(
  "List of candidate entities extracted from the chunk. Return an empty array when none are found.",
)

export type CandidateEntity = z.infer<typeof candidateEntitySchema>
export type ChunkExtractionOutput = z.infer<typeof chunkExtractionOutputSchema>
