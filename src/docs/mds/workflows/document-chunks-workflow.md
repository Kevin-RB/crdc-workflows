# Document Chunks Workflow

## Overview
This workflow reads document folders, splits each document into chunks, and writes the chunks to disk so downstream workflows can process stable, repeatable inputs.

## Agents used
- None.

## Diagram
```
Inputs
  - Document folders (configured paths)

Pipeline
  [1] Read document folders
       | Output: list of document folders + files
       v
  [2] Chunk each document
       | Output: { document, chunks[] }
       v
  [3] Write chunks to disk
       | Output: { document, chunks[], filePaths[] }
       v
  [4] Collect all chunks
       | Output: chunks[]

Final Output
  - Array of chunks
```

## Steps
### 1) Read document folders
**What it does:** Scans the configured document directories and loads document metadata needed for chunking.
**Inputs:** Document folder paths from environment/configuration.
**Outputs:** A list of documents with source paths and metadata.
**Why it matters:** Establishes the authoritative set of documents to process, which keeps the workflow deterministic across runs.

### 2) Chunk each document
**What it does:** Splits each document into smaller, consistent chunks sized for later LLM processing.
**Inputs:** The list of documents from the previous step.
**Outputs:** An array of per-document results: `{ document, chunks[] }`.
**Why it matters:** Chunking creates bounded, context-ready units so later extraction steps stay accurate and within model limits.

### 3) Write chunks to disk
**What it does:** Persists the chunk outputs into files so later workflows can read them directly.
**Inputs:** `{ document, chunks[] }` for each document.
**Outputs:** `{ document, chunks[], filePaths[] }` where `filePaths` are the saved chunk files.
**Why it matters:** Makes the pipeline repeatable and restart-safe without re-chunking every run.

### 4) Collect all chunks
**What it does:** Flattens the per-document results into a single chunk list.
**Inputs:** All per-document chunk results.
**Outputs:** `chunks[]` aggregated across all documents.
**Why it matters:** Provides a simple, consistent output shape for downstream entity and relation extraction workflows.

## Inputs
- Document folder paths (configured externally).

## Outputs
- Array of document chunks.
- Chunk files written to disk for reuse.

## Summary
Builds a stable, reusable chunk dataset from raw documents so downstream workflows operate on consistent, persisted inputs.
