# entity-extraction

## Overview

This project is a Mastra-based pipeline that turns source documents into structured entities and then builds relationships between those entities. It is designed to run through Mastra Studio and persists workflow state to disk so you can resume or rerun specific chunks without starting over.

If you need deeper details about specific agents or workflows, start here and drill down:
- Workflows:
  - [Document Chunks Workflow](src/docs/mds/workflows/document-chunks-workflow.md)
  - [Entity Extraction Workflow](src/docs/mds/workflows/entity-extraction-workflow.md)
  - [Entity Relation Extraction Workflow](src/docs/mds/workflows/entity-relation-extraction-workflow.md)
- Agents:
  - [Chat Agent](src/docs/mds/agents/chat-agent.md)
  - [Entity Extraction Agent](src/docs/mds/agents/entity-extraction-agent.md)
  - [Relation Building Agent](src/docs/mds/agents/relation-building-agent.md)
  - [Supervisor Agent](src/docs/mds/agents/supervisor-agent.md)
- Architecture note: [On Two Disjointed Graphs](src/docs/mds/on-two-disjointed-graphs.md)

## Prerequisites

- Node.js `>=22.13.0`
- `pnpm`
- A local or remote LLM provider
  - Recommended: LMStudio running a local server. Follow LMStudio's setup guide: https://lmstudio.ai/docs
  - Bring your own provider: configure your model/provider in Mastra Studio. Mastra Studio guide: https://mastra.ai/docs/studio/overview

## How To Set Up

1. Install dependencies:

```shell
pnpm install
```

2. Configure environment variables:
   - Copy `.env.example` to `.env`.
   - Fill in the required values (based on `.env.example`):
     - `OPENAI_API_KEY` (or your chosen provider key in Mastra Studio, if you are using an external inference provider)
     - `LMSTUDIO_API_KEY` (dummy value is fine for LMStudio)
     - `NEO4J_URI_CO`, `NEO4J_USERNAME_CO`, `NEO4J_PASSWORD_CO`, `NEO4J_DATABASE_CO`
     - `NEO4J_URI_PK`, `NEO4J_USERNAME_PK`, `NEO4J_PASSWORD_PK`, `NEO4J_DATABASE_PK`
     - `SCHEMA_OUTPUT_FILENAME`
     - Chunking thresholds (optional to tune):
       - `ENTITY_EXTRACTION_ENTITY_MATCH_THRESHOLD`
       - `ENTITY_EXTRACTION_WEAK_HEADING_MAX_LENGTH`
       - `ENTITY_EXTRACTION_MIN_CHUNK_SIZE_CHARS`
       - `ENTITY_EXTRACTION_MIN_CHUNK_ALPHA_WORDS`
       - `ENTITY_EXTRACTION_MIN_CHUNK_ALPHA_RATIO`
       - `ENTITY_EXTRACTION_MAX_CHUNK_SIZE_CHARS`
       - `ENTITY_EXTRACTION_CHUNK_OVERLAP_CHARS`

3. Start Mastra Studio:

```shell
pnpm run dev
```

Then open `http://localhost:4111` to run workflows and test agents.

## Setup

1. Copy `.env.example` to `.env` and fill in required values.
2. Make sure your document path is set via `ENTITY_EXTRACTION_DOC_PATH`.
3. Start Mastra Studio:

```shell
pnpm run dev
```

Then open `http://localhost:4111` to run workflows and test agents.

## Intended Workflow Order

The workflows are independent, but there is an intended order to produce the desired output. Run them in this sequence:

1. `src/mastra/workflows/document-chunks.workflow.ts`
2. `src/mastra/workflows/entity-extraction-workflow.ts`
3. `src/mastra/workflows/entity-relation-extraction-workflow.ts`

Simple workflow diagram (top to bottom order):

```
[Source Docs]
     |
     v
document-chunks.workflow
  - reads parsed documents
  - chunks content
  - writes chunk files
     |
     v
entity-extraction-workflow
  - loads chunk files
  - extracts entities
  - persists entity state
     |
     v
entity-relation-extraction-workflow
  - loads chunks + entity state
  - extracts relations
  - persists relation state
```

Notes:
- The first workflow currently expects inputs that match the OpenDataLoader parsing output. You can adapt the input steps to accept another parsing/OCR tool.
- The downstream workflows rely on files produced by the earlier steps.
- After the workflows finish, you still need to ingest the outputs into Neo4j (or another graph database). At the moment this is done with a standalone Python script that is not yet part of this repo; it will be moved here to streamline ingestion.

## Durability and Reruns

Workflows persist state to disk (see `ENTITY_EXTRACTION_STATE_RELATIVE_FILE_PATH` in `.env`). The state tracks processed chunk IDs so a rerun only processes new or unprocessed chunks.

To re-run a specific chunk, remove its `chunkId` from the persisted state file and run the workflow again. The workflow will skip IDs that remain in the processed list.

## Scripts

Common scripts from `package.json`:

- `pnpm run dev`: Start Mastra Studio (primary workflow/agent testing path)
- `pnpm run start`: Run the production server
- `pnpm run build`: Build the Mastra app
- `pnpm run neo4j:schema-bottom-up`: Generate Neo4j schema from data
- `pnpm run neo4j:schema-top-down`: Generate Neo4j schema from data
- `pnpm run neo4j:create-index`: Create Neo4j fulltext index
- `pnpm run neo4j:test-index`: Test Neo4j fulltext index

For more on Mastra Studio and provider configuration, see https://mastra.ai/docs/studio/overview
