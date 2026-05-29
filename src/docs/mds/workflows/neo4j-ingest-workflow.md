# Neo4j Ingest Workflow

## Overview
This workflow validates saved chunk, entity, and relation files, then ingests the data into Neo4j.

## Agents used
- None.

## Diagram
```
Inputs
  - Chunk JSON file(s)
  - Entity state JSON file
  - Relations JSON file

Pipeline
  [1] Load & validate chunks, entity state, relations (parallel)
       | Output: validated chunks + entity state + relations
       v
  [2] Ingest into Neo4j
       | Output: node + relationship counts

Final Output
  - Ingest metrics (counts)
```

## Steps
### 1) Load & validate chunks, entity state, relations (parallel)
**What it does:** Reads and validates the chunk, entity, and relation files before ingest.
**Inputs:** Chunk JSON file(s), entity-state JSON, relations JSON.
**Outputs:** `chunks`, `entityState`, `relations` validated and ready for ingest.
**Why it matters:** Ensures malformed inputs do not corrupt the graph.

### 2) Ingest into Neo4j
**What it does:** Writes entities, mentions, and relationships into Neo4j.
**Inputs:** Validated chunks, entity state, and relations.
**Outputs:** Counts of ingested nodes and relationships.
**Why it matters:** Produces the final graph representation for querying and analysis.

## Inputs
- Chunk JSON file(s) produced by the document chunking workflow.
- Entity-state JSON file from the entity extraction workflow.
- Relations JSON file from the entity relation extraction workflow.

## Outputs
- Neo4j node and relationship counts from the ingest run.

## Summary
Validates inputs and ingests entities and relations into Neo4j with visibility into ingest metrics.
