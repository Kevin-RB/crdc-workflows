# Entity Extraction Workflow

## Overview
This workflow reads chunk files, skips chunks already processed in prior runs, and calls the entity extraction agent to produce a normalized entity list with resume support.

## Agents used
- [Entity Extraction Agent](../agents/entity-extraction-agent.md)

## Diagram
```
Inputs
  - Chunk files on disk
  - Persisted workflow state (known types, processed chunk IDs)

Pipeline
  [1] Hydrate known entity types
       | Output: knownTypes[] in state
       v
  [2] Load chunk list
       | Output: chunk file paths
       v
  [3] Load chunk files
       | Output: chunks[]
       v
  [4] Filter processed chunks
       | Output: unprocessed chunks[]
       v
  [5] Extract entities per chunk
       | Output: entities[] per chunk
       v
  [6] Collect entities
       | Output: entities[]

Final Output
  - Array of extracted entities
```

## Steps
### 1) Hydrate known entity types
**What it does:** Loads the known entity type list from persisted state so extraction is consistent across runs.
**Inputs:** Persisted workflow state on disk.
**Outputs:** `knownTypes[]` stored in state.
**Why it matters:** Keeps the model grounded in a stable type system instead of re-inferring types each run.

### 2) Load chunk list
**What it does:** Reads the list of available chunk files created by the chunking workflow.
**Inputs:** Chunk directory configuration.
**Outputs:** List of chunk file paths.
**Why it matters:** Defines the processing scope without loading all data at once.

### 3) Load chunk files
**What it does:** Loads chunk content from disk into memory for extraction.
**Inputs:** Chunk file paths from the prior step.
**Outputs:** `chunks[]` (chunkId, text, metadata).
**Why it matters:** Materializes the exact text that will be sent to the extraction agent.

### 4) Filter processed chunks
**What it does:** Removes chunks that were already processed in a previous run.
**Inputs:** `chunks[]` and `processedChunkIds[]` from state.
**Outputs:** `unprocessed chunks[]` only.
**Why it matters:** Enables resumable runs and avoids duplicate work and duplicate entities.

### 5) Extract entities per chunk
**What it does:** Calls the entity extraction agent for each chunk (sequentially) to produce structured entities.
**Inputs:** Each unprocessed chunk.
**Outputs:** `entities[]` per chunk.
**Why it matters:** Converts raw text into structured entity data usable by downstream graph and relation workflows.

### 6) Collect entities
**What it does:** Flattens per-chunk outputs into a single entity list.
**Inputs:** `entities[]` per chunk.
**Outputs:** Aggregated `entities[]`.
**Why it matters:** Provides a consistent output shape for storage and later relation extraction.

## Inputs
- Chunk files produced by the document chunking workflow.
- Persisted workflow state for known types and processed chunks.

## Outputs
- Array of extracted entities.
- Updated workflow state for resume support.

## Summary
Processes chunked documents into a unified entity list while preserving progress and enforcing a consistent entity type system across runs.
