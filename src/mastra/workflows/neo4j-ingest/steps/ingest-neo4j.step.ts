import { candidateEntitySchema } from "@/mastra/agents/entity-extraction/schema"
import { entityRelationExtractionStructuredOutputSchema } from "@/mastra/agents/relation-building/schema"
import { chunkSchema } from "@/interface/chunk"
import {
  coerceList,
  makeTermId,
  normaliseRelationType,
  normaliseText,
} from "@/mastra/workflows/neo4j-ingest/helpers/neo4j-utils"
import { createStep } from "@mastra/core/workflows"
import neo4j from "neo4j-driver"
import type { Session } from "neo4j-driver"
import z from "zod"

const ingestInputSchema = z.object({
  chunks: z.array(chunkSchema),
  entityState: z.object({
    rawCandidateEntities: z.array(candidateEntitySchema),
  }),
  relations: z.array(entityRelationExtractionStructuredOutputSchema),
})

const ingestOutputSchema = z.object({
  chunksLoaded: z.number(),
  entityRowsProcessed: z.number(),
  mentionLinksLoaded: z.number(),
  mentionLinksSkipped: z.number(),
  relationshipsLoaded: z.number(),
  relationshipsSkipped: z.number(),
  nodeCount: z.number(),
  relationshipCount: z.number(),
  termToTermRelationshipCount: z.number(),
})

const CREATE_CONSTRAINTS = [
  `
  CREATE CONSTRAINT document_doc_id_unique IF NOT EXISTS
  FOR (d:Document)
  REQUIRE d.doc_id IS UNIQUE
  `,
  `
  CREATE CONSTRAINT chunk_chunk_id_unique IF NOT EXISTS
  FOR (c:Chunk)
  REQUIRE c.chunk_id IS UNIQUE
  `,
  `
  CREATE CONSTRAINT term_term_id_unique IF NOT EXISTS
  FOR (t:Term)
  REQUIRE t.term_id IS UNIQUE
  `,
  `
  CREATE CONSTRAINT term_type_name_unique IF NOT EXISTS
  FOR (tt:TermType)
  REQUIRE tt.name IS UNIQUE
  `,
]

const MERGE_DOCUMENT_QUERY = `
MERGE (d:Document {doc_id: $doc_id})
ON CREATE SET
  d.title = $title,
  d.created_at = datetime()
SET
  d.last_loaded_at = datetime(),
  d.last_source_json_file = $source_json_file
`

const MERGE_CHUNK_QUERY = `
MERGE (c:Chunk {chunk_id: $chunk_id})
ON CREATE SET
  c.text = $text,
  c.chapter_id = $chapter_id,
  c.section = $section,
  c.page = $page,
  c.source = $source,
  c.created_at = datetime()
ON MATCH SET
  c.text = CASE WHEN c.text IS NULL OR c.text = "" THEN $text ELSE c.text END,
  c.chapter_id = CASE WHEN c.chapter_id IS NULL OR c.chapter_id = "" THEN $chapter_id ELSE c.chapter_id END,
  c.section = CASE WHEN c.section IS NULL OR c.section = "" THEN $section ELSE c.section END,
  c.page = CASE WHEN c.page IS NULL THEN $page ELSE c.page END,
  c.source = CASE WHEN c.source IS NULL OR c.source = "" THEN $source ELSE c.source END,
  c.last_loaded_at = datetime(),
  c.last_source_json_file = $source_json_file
WITH c
MATCH (d:Document {doc_id: $doc_id})
MERGE (d)-[:HAS_CHUNK]->(c)
`

const MERGE_TERM_AND_LINKS_QUERY = `
MATCH (c:Chunk {chunk_id: $chunk_id})
MERGE (t:Term {term_id: $term_id})
ON CREATE SET
  t.name = $name,
  t.name_norm = $name_norm,
  t.aliases = $aliases,
  t.confidence = $confidence,
  t.created_at = datetime()
ON MATCH SET
  t.aliases = CASE
    WHEN t.aliases IS NULL THEN $aliases
    ELSE reduce(acc = t.aliases, a IN $aliases |
      CASE WHEN a IN acc THEN acc ELSE acc + a END)
  END,
  t.confidence = CASE
    WHEN t.confidence IS NULL THEN $confidence
    WHEN $confidence IS NULL THEN t.confidence
    WHEN $confidence > t.confidence THEN $confidence
    ELSE t.confidence
  END,
  t.last_loaded_at = datetime()
WITH c, t
MERGE (tt:TermType {name: $type_name})
ON CREATE SET tt.created_at = datetime()
MERGE (t)-[:HAS_TYPE]->(tt)
MERGE (c)-[:MENTIONS]->(t)
RETURN count(t) AS loaded_count
`

const NODE_COUNT_QUERY = "MATCH (n) RETURN count(n) AS c"
const REL_COUNT_QUERY = "MATCH ()-[r]->() RETURN count(r) AS c"
const TERM_REL_COUNT_QUERY = `
MATCH (:Term)-[r]->(:Term)
WHERE type(r) <> "HAS_TYPE"
RETURN count(r) AS c
`

const wipeDatabase = async (session: Session) => {
  await session.run("MATCH (n) DETACH DELETE n")
}

export const ingestNeo4jStep = createStep({
  id: "ingest-neo4j",
  description: "Ingests chunks, entities, and relations into Neo4j.",
  inputSchema: ingestInputSchema,
  outputSchema: ingestOutputSchema,
  execute: async ({ inputData }) => {
    const uri = process.env.NEO4J_URI
    const username = process.env.NEO4J_USERNAME
    const password = process.env.NEO4J_PASSWORD
    const database = process.env.NEO4J_DATABASE ?? "neo4j"
    const wipeFirst = (process.env.WIPE_FIRST ?? "false").toLowerCase() === "true"

    if (!uri || !username || !password) {
      throw new Error("Missing NEO4J_URI, NEO4J_USERNAME, or NEO4J_PASSWORD")
    }

    const driver = neo4j.driver(uri, neo4j.auth.basic(username, password))
    await driver.verifyConnectivity()

    const session = driver.session({ database })

    try {
      for (const query of CREATE_CONSTRAINTS) {
        await session.run(query)
      }

      if (wipeFirst) {
        await wipeDatabase(session)
      }

      let chunksLoaded = 0
      let entityRowsProcessed = 0
      let mentionLinksLoaded = 0
      let mentionLinksSkipped = 0
      let relationshipsLoaded = 0
      let relationshipsSkipped = 0

      for (const chunk of inputData.chunks) {
        const sourceJsonFile = chunk.metadata?.source ?? ""

        await session.executeWrite((tx) =>
          tx.run(MERGE_DOCUMENT_QUERY, {
            doc_id: chunk.documentId,
            title: chunk.documentId,
            source_json_file: sourceJsonFile,
          }),
        )

        await session.executeWrite((tx) =>
          tx.run(MERGE_CHUNK_QUERY, {
            chunk_id: chunk.chunkId,
            doc_id: chunk.documentId,
            chapter_id: chunk.chapterId,
            section: chunk.metadata?.heading ?? null,
            page: chunk.metadata?.page ?? null,
            source: chunk.metadata?.source ?? null,
            text: chunk.content,
            source_json_file: sourceJsonFile,
          }),
        )

        chunksLoaded += 1
      }

      for (const entity of inputData.entityState.rawCandidateEntities) {
        const chunkIds = entity.chunkIds

        if (!chunkIds || chunkIds.length === 0) {
          mentionLinksSkipped += 1
          continue
        }

        entityRowsProcessed += 1

        for (const chunkId of chunkIds) {
          const cleanedChunkId = chunkId.trim()
          if (!cleanedChunkId) {
            mentionLinksSkipped += 1
            continue
          }

          const name = entity.name.trim()
          if (!name) {
            mentionLinksSkipped += 1
            continue
          }

          const typeName = entity.type?.trim() || "Unknown"
          const aliases = coerceList(entity.aliases)
          const confidence = entity.confidence
          const termId = makeTermId(name)
          const nameNorm = normaliseText(name)

          const result = await session.executeWrite((tx) =>
            tx.run(MERGE_TERM_AND_LINKS_QUERY, {
              chunk_id: cleanedChunkId,
              term_id: termId,
              name,
              name_norm: nameNorm,
              aliases,
              confidence,
              type_name: typeName,
            }),
          )

          const loadedCount = result.records[0]?.get("loaded_count")?.toNumber?.() ?? 0
          if (loadedCount > 0) {
            mentionLinksLoaded += 1
          } else {
            mentionLinksSkipped += 1
          }
        }
      }

      for (const relation of inputData.relations) {
        const sourceEntity = relation.sourceEntity.trim()
        const targetEntity = relation.targetEntity.trim()
        const relationType = normaliseRelationType(relation.relation)

        if (!sourceEntity || !targetEntity) {
          relationshipsSkipped += 1
          continue
        }

        const sourceTermId = makeTermId(sourceEntity)
        const targetTermId = makeTermId(targetEntity)

        const query = `
        MATCH (source:Term {term_id: $source_term_id})
        MATCH (target:Term {term_id: $target_term_id})
        MERGE (source)-[r:${relationType}]->(target)
        SET
          r.source_json_file = $source_json_file,
          r.last_loaded_at = datetime()
        RETURN count(r) AS created_count
        `

        const result = await session.executeWrite((tx) =>
          tx.run(query, {
            source_term_id: sourceTermId,
            target_term_id: targetTermId,
            source_json_file: "relations.json",
          }),
        )

        const createdCount = result.records[0]?.get("created_count")?.toNumber?.() ?? 0
        if (createdCount > 0) {
          relationshipsLoaded += 1
        } else {
          relationshipsSkipped += 1
        }
      }

      const nodeCountResult = await session.run(NODE_COUNT_QUERY)
      const relationshipCountResult = await session.run(REL_COUNT_QUERY)
      const termRelCountResult = await session.run(TERM_REL_COUNT_QUERY)

      const nodeCount = nodeCountResult.records[0]?.get("c")?.toNumber?.() ?? 0
      const relationshipCount = relationshipCountResult.records[0]?.get("c")?.toNumber?.() ?? 0
      const termToTermRelationshipCount = termRelCountResult.records[0]?.get("c")?.toNumber?.() ?? 0

      return {
        chunksLoaded,
        entityRowsProcessed,
        mentionLinksLoaded,
        mentionLinksSkipped,
        relationshipsLoaded,
        relationshipsSkipped,
        nodeCount,
        relationshipCount,
        termToTermRelationshipCount,
      }
    } finally {
      await session.close()
      await driver.close()
    }
  },
})
