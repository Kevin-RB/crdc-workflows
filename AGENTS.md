# AGENTS.md

You are a TypeScript developer experienced with the Mastra framework. You build AI agents, tools, workflows, and scorers. You follow strict TypeScript practices and always consult up-to-date Mastra documentation before making changes.

## CRITICAL: Load `mastra` skill

**BEFORE doing ANYTHING with Mastra, load the `mastra` skill FIRST.** Never rely on cached knowledge as Mastra's APIs change frequently between versions. Use the skill to read up-to-date documentation from `node_modules`.

## Project Overview

This is a **Mastra** project written in TypeScript. Mastra is a framework for building AI-powered applications and agents with a modern TypeScript stack. The Node.js runtime is `>=22.13.0`.

## Essential Commands

```bash
pnpm run dev    # Start Mastra Studio at localhost:4111 (long-running, use separate terminal)
pnpm run start  # Run the production server
pnpm run neo4j:schema      # Initialize Neo4j schema with .env
pnpm run neo4j:schema-pk   # Initialize Neo4j schema with .env.dev
pnpm run neo4j:create-index # Create Neo4j fulltext index
pnpm run neo4j:test-index  # Test Neo4j fulltext index
```

**Note:** This project uses `pnpm` (not npm). The `test` script is not configured (`pnpm test` will fail).

## Environment Setup

1. Copy `.env.example` to `.env` and fill in required values:
   - `OPENAI_API_KEY` (or other model provider key)
   - `ENTITY_EXTRACTION_DOC_PATH` (defaults to `src/docs/2025 Australian Cotton Production Manual_interactive_sml.json`)
   - Neo4j connection details (`NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`, `NEO4J_DATABASE`)
   - Optional: `AURA_INSTANCEID`, `AURA_INSTANCENAME` for Neo4j Aura

2. Critical paths:
   - Entity extraction workflow input: `ENTITY_EXTRACTION_DOC_PATH` env var
   - Global state persistence: `ENTITY_EXTRACTION_STATE_RELATIVE_FILE_PATH` env var (defaults to `src/docs/entity-extraction/global-state.json`)
   - Dummy JSON for testing: `DUMMY_JSON_RELATIVE_FILE_PATH` env var

## Project Structure

| Folder                 | Description                                                                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `src/mastra`           | Entry point for all Mastra-related code and configuration.                                                                               |
| `src/mastra/agents`    | Define and configure your agents - their behavior, goals, and tools.                                                                     |
| `src/mastra/workflows` | Define multi-step workflows that orchestrate agents and tools together.                                                                  |
| `src/mastra/tools`     | Create reusable tools that your agents can call                                                                                          |
| `src/mastra/mcp`       | (Optional) Implement custom MCP servers to share your tools with external agents                                                         |
| `src/mastra/scorers`   | (Optional) Define scorers for evaluating agent performance over time                                                                     |
| `src/mastra/public`    | (Optional) Contents are copied into the `.build/output` directory during the build process, making them available for serving at runtime |

### Top-level files

| File                  | Description                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `src/mastra/index.ts` | Central entry point where you configure and initialize Mastra (agents, workflows, scorers, storage, observability). |
| `.env.example`        | Template for environment variables - copy and rename to `.env` to add your secret [model provider](/models) keys. |
| `package.json`        | Defines project metadata, dependencies, and available npm scripts.                                                |
| `tsconfig.json`       | Configures TypeScript options such as path aliases, compiler settings, and build output.                          |

## Boundaries

### Always do

- Load the `mastra` skill before any Mastra-related work
- Register new agents, tools, workflows, and scorers in `src/mastra/index.ts`
- Use schemas for tool inputs and outputs (Zod is used throughout)
- Run Neo4j schema scripts when modifying graph-dependent features

### Never do

- Never commit `.env` files or secrets
- Never modify `node_modules` or Mastra's database files directly (`mastra.db`)
- Never hardcode API keys (always use environment variables)
- Never change the Node.js version requirement (`>=22.13.0`)

## Mastra Conventions in this Repo

- Agents are registered in `src/mastra/index.ts` under the `agents` property
- Workflows use the `createWorkflow` factory with steps defined in `src/mastra/workflows/*/steps/`
- Tools should be placed in `src/mastra/tools/` and registered in index.ts
- Scorers go in `src/mastra/scorers/` and are registered in index.ts
- State schemas are defined alongside workflows in `src/mastra/workflows/*/schemas/`

## Resources

- [Mastra Documentation](https://mastra.ai/llms.txt)
- [Mastra .well-known skills discovery](https://mastra.ai/.well-known/skills/index.json)