import z from "zod";

const availableRelationTypes = z.enum([
    "CAUSES",
    "PREVENTS",
    "IMPROVES",
    "REDUCES",
    "INCREASES",
    "USED_FOR",
    "USED_IN",
    "APPLIED_TO",
    "MEASURED_BY",
    "INDICATES",
    "PART_OF",
    "PRODUCES",
    "CONTAINS",
    "ASSOCIATED_WITH",
    "MANAGED_BY",
    "CONTROLLED_BY",
    "LOCATED_IN",
    "OCCURS_IN"
])

export const entityRelationExtractionStructuredOutputSchema = z.object({
    sourceEntity: z.string({ message: "Source entity name is required" })
        .describe("Exact same entity name provided in the entity list."),
    targetEntity: z.string({ message: "Target entity name is required" })
        .describe("Exact same entity name provided in the entity list."),
    relation: availableRelationTypes
        .describe("The type of relationship between the source and target entities."),
})

export type EntityRelationExtractionStructuredOutput = z.infer<typeof entityRelationExtractionStructuredOutputSchema>