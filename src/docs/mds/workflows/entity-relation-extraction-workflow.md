# Entity Relation Extraction Workflow

## Overview
This workflow validates chunk and entity state files, resumes from prior progress, and invokes the relation agent to build relationships between entities on a per-chunk basis.

## Agents used
- [Relation Building Agent](../agents/relation-building-agent.md)

## Diagram
```
Inputs
  - Chunk JSON file(s)
  - Entity state JSON file
  - Persisted relations state (processed chunk IDs, prior relations)

Pipeline
  [1] Hydrate relations state
       | Output: processedChunkIds[], relations[] in state
       v
  [2] Load & validate chunks and entity state (parallel)
       | Output: validated chunks + validated entity state
       v
  [3] Select chunk list
       | Output: chunk file paths
       v
  [4] Load chunks
       | Output: chunks[]
       v
  [5] Filter processed chunks
       | Output: unprocessed chunks[]
       v
  [6] Invoke relation agent per chunk
       | Output: relations[] per chunk
       v
  [7] Filter empty results
       | Output: relations[]

Final Output
  - Array of extracted relations
```

## Steps
### 1) Hydrate relations state
**What it does:** Loads persisted relations and processed chunk IDs to allow resume support.
**Inputs:** Relations state file from prior runs.
**Outputs:** `relations[]` and `processedChunkIds[]` stored in state.
**Why it matters:** Prevents duplicate relation extraction and enables incremental processing.

### 2) Load & validate chunks and entity state (parallel)
**What it does:** Reads and validates the chunk JSON and entity-state JSON at the same time.
**Inputs:** Chunk JSON file(s) and entity-state JSON file paths.
**Outputs:** Validated chunks metadata and validated entity state.
**Why it matters:** Early validation prevents corrupted or mismatched inputs from producing unreliable relations.

### 3) Select chunk list
**What it does:** Picks the validated chunk list for loading.
**Inputs:** Output from the validation step.
**Outputs:** Chunk file paths to load.
**Why it matters:** Ensures only validated chunk sources are used for relation extraction.

### 4) Load chunks
**What it does:** Loads chunk content into memory for relation inference.
**Inputs:** Chunk file paths.
**Outputs:** `chunks[]` (chunkId, text, metadata).
**Why it matters:** Provides the exact text context needed to link entities accurately.

### 5) Filter processed chunks
**What it does:** Removes chunks already processed in previous runs.
**Inputs:** `chunks[]` and `processedChunkIds[]` from state.
**Outputs:** `unprocessed chunks[]` only.
**Why it matters:** Makes the workflow resumable and avoids duplicate relations.

### 6) Invoke relation agent per chunk
**What it does:** Calls the relation agent (relation-building-agent) for each remaining chunk, sequentially.
**Inputs:** Each unprocessed chunk plus validated entity state.
**Outputs:** `relations[]` per chunk.
**Why it matters:** Converts entity co-occurrence in text into explicit relationships.

### 7) Filter empty results
**What it does:** Removes undefined or empty relation outputs.
**Inputs:** Per-chunk relation results.
**Outputs:** Aggregated `relations[]`.
**Why it matters:** Keeps the final output clean and predictable for storage or graph ingestion.

## Inputs
- Chunk JSON file(s) produced by the chunking workflow.
- Entity-state JSON file from the entity extraction workflow.
- Persisted relations state (for resume support).

## Outputs
- Array of extracted entity relations.
- Updated relations state for incremental runs.

## Summary
Validates inputs, skips already processed chunks, and extracts relations in a resumable way to build a reliable, incremental relationship dataset.
