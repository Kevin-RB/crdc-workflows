import { createWorkflow } from "@mastra/core/workflows"
import { loadValidateChunksStep } from "@/mastra/workflows/neo4j-ingest/steps/load-validate-chunks.step"
import { loadValidateEntityStateStep } from "@/mastra/workflows/neo4j-ingest/steps/load-validate-entity-state.step"
import { loadValidateRelationsStep } from "@/mastra/workflows/neo4j-ingest/steps/load-validate-relations.step"
import { ingestNeo4jStep } from "@/mastra/workflows/neo4j-ingest/steps/ingest-neo4j.step"
import z from "zod"

export const neo4jIngestWorkflow = createWorkflow({
  id: "neo4j-ingest-workflow",
  description: "Validates saved chunk, entity, and relation files then ingests into Neo4j.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    chunksLoaded: z.number(),
    entityRowsProcessed: z.number(),
    mentionLinksLoaded: z.number(),
    mentionLinksSkipped: z.number(),
    relationshipsLoaded: z.number(),
    relationshipsSkipped: z.number(),
    nodeCount: z.number(),
    relationshipCount: z.number(),
    termToTermRelationshipCount: z.number(),
  }),
})
  .parallel([loadValidateChunksStep, loadValidateEntityStateStep, loadValidateRelationsStep])
  .map(async ({ inputData }) => {
    return {
      chunks: inputData["load-validate-chunks"],
      entityState: inputData["load-validate-entity-state"],
      relations: inputData["load-validate-relations"],
    }
  })
  .then(ingestNeo4jStep)
  .commit()
