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
    .max(1)
    .describe("Optional confidence score between 0 and 1 for this extraction."),
  typeStatus: z
    .enum(["existing", "new"])
    .describe("Mark as 'existing' when type matches known types, otherwise 'new'."),
})

export const chunkExtractionOutputSchema = z.array(candidateEntitySchema).describe(
  "List of candidate entities extracted from the chunk. Return an empty array when none are found.",
)

export type CandidateEntity = z.infer<typeof candidateEntitySchema>
export type ChunkExtractionOutput = z.infer<typeof chunkExtractionOutputSchema>