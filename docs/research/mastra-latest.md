# What the latest Mastra offers: upgrade path, agent orchestration, vector search

Research for [#23](https://github.com/Kevin-RB/crdc-workflows/issues/23) (wayfinder map #20). Researched 2026-11-24.

**Gist:** Stable `@mastra/core` is now **1.85.0** (we lock 1.32.1). There is no major bump, and none of the breaking changes from 1.32 to 1.85 hit an API this repo uses. The real breaks are in Harness, AgentController, Knowledge (alpha), durable agents and the observability query APIs, none of which we touch. Our deprecations to clean up: `getStepResult` (use `getStepResultAsync`) and `DefaultExporter`/`CloudExporter` (renamed to `MastraStorageExporter`/`MastraPlatformExporter`). Our supervisor pattern (`agents: {...}` + `generate/stream`) is the officially recommended orchestration; `.network()` is deprecated. Mastra has **no Neo4j vector store** and won't add one. Mastra's `GraphRAG` builds an in-memory chunk-similarity graph per query; it is not a knowledge graph. For Neo4j-native GraphRAG, write a custom tool (or a `MastraVector` subclass) over Neo4j `CREATE VECTOR INDEX` + the Cypher `SEARCH` clause.

## Sources

- npm registry (`npm view <pkg> version`, `npm view @mastra/core time`), queried 2026-11-24.
- Upstream changelogs on `main`: `https://raw.githubusercontent.com/mastra-ai/mastra/main/<path>/CHANGELOG.md` for `packages/core`, `packages/rag`, `packages/memory`, `packages/evals`, `packages/cli`, `stores/libsql`, `stores/duckdb` and `observability/mastra`. Line references such as "core CHANGELOG 1.84.0" point to that version's section.
- Embedded docs shipped in the latest tarball: `@mastra/core@1.85.0/dist/docs/references/*.md` and `@mastra/rag@2.8.1/dist/docs/references/*.md`. These mirror `https://mastra.ai/docs/...`.
- Type declarations in `@mastra/core@1.85.0/dist/vector/vector.d.ts`.
- mastra-ai/mastra issue [#3465](https://github.com/mastra-ai/mastra/issues/3465) (Neo4j support).
- Neo4j Cypher manual, [Vector indexes](https://neo4j.com/docs/cypher-manual/current/indexes/semantic-indexes/vector-indexes/).
- Neo4j Labs, [Store Mastra threads in NAMS](https://neo4j.com/labs/agent-memory/how-to/typescript/mastra/).

Note: `node_modules` is not installed in this clone, so the versions under "Locked" come from `pnpm-lock.yaml`.

## 1. Latest versions

| Package | package.json range | Locked (pnpm-lock) | Latest stable (npm, 2026-11-24) |
|---|---|---|---|
| `@mastra/core` | ^1.32.1 | 1.32.1 (2026-05-05) | **1.85.0** (2026-11-18); `1.86.0-alpha.7` in flight |
| `@mastra/memory` | ^1.17.5 | 1.17.5 | 1.41.2 |
| `@mastra/rag` | ^2.2.1 | 2.2.1 | 2.8.1 |
| `@mastra/libsql` | ^1.10.0 | 1.10.0 | 1.31.1 |
| `@mastra/duckdb` | ^1.3.0 | 1.3.0 | 1.19.1 |
| `@mastra/evals` | ^1.2.2 | 1.2.2 | 1.10.11 |
| `@mastra/observability` | ^1.11.1 | 1.11.1 | 1.24.2 |
| `@mastra/loggers` | ^1.1.1 | 1.1.1 | 1.3.11 |
| `mastra` (CLI) | ^1.8.1 | 1.8.1 | 1.40.1 |

- Every package is still on the same major as our `^` ranges, so `pnpm update` resolves to the latest without editing `package.json`. Releases are frequent: core went 1.40.0 → 1.85.0 between 2026-06-03 and 2026-11-18 (npm `time`).
- `@mastra/core@1.85.0` still declares `engines.node >=22.13.0` and peer `zod ^3.25.0 || ^4.0.0` (tarball `package.json`), so our Node and zod 4.4.3 pins still match.
- No `@mastra/neo4j` package exists (`npm view @mastra/neo4j` returns 404).

## 2. Breaking changes and deprecations from 1.32.1 to latest, filtered to what this repo uses

What the repo uses (from `grep` of `src/`): `Agent` with `agents: {...}`, `Memory` + `LibSQLStore`, `createWorkflow`/`createStep` with `stateSchema` + `setState`, `getStepResult`, `suspend`/`resumeSchema`, agent `structuredOutput`, `MastraCompositeStore` (LibSQL default + DuckDB `observability` domain), `Observability` with `DefaultExporter`, `CloudExporter` and `SensitiveDataFilter`, prebuilt scorers from `@mastra/evals/scorers/prebuilt`, and `PinoLogger`.

No release between 1.32.1 and 1.85.0 has a "Major Changes" entry. The changelog has these "Breaking" items:

| Item | Version | Affects us? |
|---|---|---|
| `@mastra/core/harness/v1` entrypoint removed; Harness question/plan channels removed | core 1.42.0, 1.44.0 | No (we don't use Harness) |
| Harness `Session` requires `workspace` and other Harness API changes | core 1.47.0 | No |
| Agent Controller stream event shape (`message_start`/`message_update`) | core 1.68.0 | No |
| `subscribeQueuedMessages` replaced by `subscribeThreadEvents` | core 1.67.0 | No |
| Agent controller sessions addressed by session id | core 1.79.0 | No |
| Observability `querySpans()` drops `model`/`provider` filters and `cost` fields; thread-row `timeRange` contract changed | core 1.79.0, duckdb CHANGELOG | Only if we query spans programmatically. We don't; Studio does. Upgrade core and duckdb together. |
| On a plain `Agent`, `durable` now means resumable streams only, not checkpointed execution (use `createDurableAgent` for that) | core 1.83.0 ([#29503](https://github.com/mastra-ai/mastra/pull/29503)) | No (we don't set `durable`). Registered agents now get resumable streams by default, and closing an HTTP stream no longer aborts the run (core 1.84.0) |
| Knowledge (alpha) scope `$param` matching | core 1.84.0 | No |
| A tool that called `suspend()` on a version **older than 1.50.0** and is resumed after the upgrade loses its suspend payload | core 1.85.0 | **Yes, operationally.** `extract-entity.step.ts` suspends (a workflow step, not a tool). To be safe, finish or discard suspended runs in `mastra.db` before upgrading. |

These deprecations and behaviour changes touch our code:

- **`getStepResult` is deprecated** in favour of `getStepResultAsync` (core 1.82.0, [#26999](https://github.com/mastra-ai/mastra/pull/26999)). It "keeps working and will be removed in a future major". Used in `invoke-rocky-on-chunk.step.ts`.
- **`updateState`** added alongside `setState` (core 1.84.0, [#29370](https://github.com/mastra-ai/mastra/pull/29370)). It merges top-level keys and keeps changes made by parallel steps. `setState` keeps its full-replace contract. This matters for `.parallel()`/`.foreach()` steps that currently do `setState({...state, ...})`, because those can overwrite a sibling's writes.
- **Experimental `storageVersion: 2`** for workflows (core 1.83.0+). `result.steps` becomes an async function, and reading `state` throws (use `getState()`) (core 1.84.0). This is opt-in, so leave it off for now.
- **A workflow `.agent()` step with `structuredOutput.schema` now fails** (`STRUCTURED_OUTPUT_OBJECT_UNDEFINED`) when no object is produced, instead of silently succeeding (core 1.67.0). We call agents inside `createStep` with `structuredOutput` rather than through `.agent()`, but check for the same pattern. `structuredOutput.errorStrategy: 'fallback'` now sets `usedFallbackValue` (core CHANGELOG).
- **Observability exporters renamed:** `DefaultExporter` → `MastraStorageExporter` and `CloudExporter` → `MastraPlatformExporter` (observability 1.12.0, [#16223](https://github.com/mastra-ai/mastra/pull/16223)). The old names still work but are deprecated. Used in `src/mastra/index.ts`.
- **`MastraCompositeStore`:** a domain can now be disabled with `false` (core CHANGELOG, `reference-storage-composite.md`); `close()` added so `Mastra.shutdown()` closes composed adapters; init ordering fixed. These are additive.
- **Memory:** observational memory `scope: 'resource'` is deprecated (memory CHANGELOG); `messageHistory` token budget drops the default 10-message cap when `lastMessages` isn't set; and on an existing thread, input messages before the last assistant message that aren't stored are removed. That last one is a behaviour change worth checking for the supervisor's memory. The `knowledge`/`experimental_subconscious` Memory options were removed (we don't use them).
- **Evals:** no breaking items (evals CHANGELOG). zod is no longer a required peer dependency.
- **`@mastra/rag` 2.2.1 → 2.8.1:** no major items. GraphRAG validation is stricter: positive-integer `topK`, finite weights, rejection of duplicate nodes. `GraphRAG.serialize()`/`deserialize()` were added, and the graph is now rebuilt from each execution's retrieved docs so state doesn't leak across requests (rag CHANGELOG, [#30185](https://github.com/mastra-ai/mastra/pull/30185)).
- **CLI 1.8 → 1.40:** changes are mostly Studio and Factory UI; nothing in the build/dev/start commands we use is flagged as breaking (cli CHANGELOG).

**Upgrade path:** bump all `@mastra/*` packages and the `mastra` CLI together (the duckdb/core observability contract changed in lockstep), drain suspended workflow runs first, then fix the deprecations (`getStepResultAsync`, exporter names). Consider moving `setState` to `updateState` inside parallel or foreach steps.

## 3. Supervisor / sub-agent orchestration

- **Recommended pattern:** add sub-agents to the parent's `agents` property, then call `agent.stream()`/`agent.generate()`. The parent delegates using its instructions and each sub-agent's `description` (`docs-subagents.md`, "Added in `@mastra/core@1.8.0`"). The multi-agent guide maps the "Supervisor" pattern directly to this (`docs-guides-multi-agent-systems.md`). This is what `supervisor-agent.ts` already does.
- **`.network()` is deprecated**: "Agent networks are deprecated and will be removed in a future major release. Replace them with supervisor agents" (`docs-agents-networks.md`, `reference-agents-network.md`; migration guide at https://mastra.ai/reference/migrations/network-to-supervisor). Don't build on it.
- **Delegation controls** (`docs-subagents.md`), set via `delegation` in `defaultOptions` or per call:
  - `onDelegationStart` can return `proceed`, `rejectionReason`, `modifiedPrompt`, `modifiedMaxSteps` or `threadMetadata`, and can set `context.requestContext`.
  - `onDelegationComplete` can call `bail()`, return `feedback`, or return `resultText`, which replaces what the parent sees.
  - `messageFilter` limits which conversation context is forwarded.
  - Sub-agent `maxSteps` from the model is capped at the sub-agent's `defaultOptions.maxSteps`.
- **Fixes since 1.32 that matter for supervisors** (core CHANGELOG):
  - Suspended or approval-gated sub-agent tool calls carry `delegatedToolCallId`/`delegatedToolName`.
  - Sub-agents that hit a client tool now report `subAgentPendingToolCalls` instead of returning empty output.
  - Anthropic extended-thinking delegation is fixed.
  - Parallel sub-agent delegations resume in parallel.
  - A memory leak with sub-agents is fixed.
- **Other patterns** (`docs-guides-multi-agent-systems.md`): handoffs; workflows (deterministic pipelines such as our extraction); and "council" (parallel agents plus a synthesis step through workflow `.parallel()`, with no dedicated primitive).
- **New but probably not for us yet:**
  - `createDurableAgent`/`createEventedAgent` give checkpointed execution and recovery (`docs-harness-durable-agents.md`).
  - **Knowledge** (core 1.82.0, **alpha**) is a scoped page/note/link graph that agents read and write through tools (`docs-knowledge-overview.md`). It is a Mastra-managed store, not Neo4j.

**Implication for a domain-agnostic orchestrator:** keep the `agents`-based supervisor. Make the sub-agents generic by injecting the graph schema and domain vocabulary at runtime: through `requestContext` (set in `onDelegationStart`) feeding dynamic `instructions: ({ requestContext }) => ...`, instead of hard-coding the CRDC schema into the prompt as `supervisor-agent.ts` does today.

## 4. Vector search / GraphRAG, and Neo4j

**What Mastra provides** (`@mastra/rag`, `reference-rag-*.md`, `reference-tools-*.md`):

- `MDocument` chunking, `embedMany` with `ModelRouterEmbeddingModel`, `createVectorQueryTool`, `createGraphRAGTool`, rerankers, and `mastra.vectors` registration (`reference-configuration.md`).
- **Supported vector stores**, each a separate package: pg (pgvector), libsql, mongodb, pinecone, qdrant, chroma, astra, upstash, opensearch, elasticsearch, oracledb, lance, s3vectors, vectorize, couchbase, azure-ai-search, weaviate (`reference-rag-vector-databases.md` and package mentions in the docs). **Neo4j is not among them.**
- **Mastra's GraphRAG is not a knowledge-graph integration.** `createGraphRAGTool` first runs vector search, then "builds a knowledge graph from that request's chunks. The graph isn't reused across requests", linking chunks whose embedding similarity passes `threshold`, and then does a random walk (`reference-rag-graph-rag-guide.md`). It never sees our entity/relation graph, so for this project it duplicates, poorly, what Neo4j already stores.
- `createGraphRAGTool`/`createVectorQueryTool` accept a `vectorStore: MastraVector | VectorStoreResolver` directly (`reference-tools-graph-rag-tool.md`). The resolver also receives the end `user` (rag CHANGELOG 2.8.x). Any custom `MastraVector` therefore plugs straight into the stock tools.

**Neo4j status:**

- Mastra issue [#3465](https://github.com/mastra-ai/mastra/issues/3465), "Neo4j Graph Database Support", was closed 2025-07-30 with the maintainers saying: "we're not planning on adding more storage/vector packages to the monorepo … make a separate repo for this and publish that to npm yourself."
- Third-party options exist, but neither is a vector store:
  - Neo4j Labs ships `@neo4j-labs/agent-memory` with a `Neo4jMastraMemory` thread/message adapter. It is explicitly "not a Mastra `Memory` implementation and not a Mastra storage adapter" ([Neo4j Labs](https://neo4j.com/labs/agent-memory/how-to/typescript/mastra/)).
  - The Neo4j MCP server can be wired in with `@mastra/mcp`.
- **Neo4j native vectors** ([Cypher manual](https://neo4j.com/docs/cypher-manual/current/indexes/semantic-indexes/vector-indexes/)):
  - Create an index with `CREATE VECTOR INDEX name IF NOT EXISTS FOR (c:Chunk) ON c.embedding OPTIONS { indexConfig: { \`vector.dimensions\`: 1536, \`vector.similarity_function\`: 'cosine' } }`.
  - "As of Neo4j 2026.01, the preferred way of querying vector indexes is by using the Cypher `SEARCH` clause", which supports `SEARCH … WHERE` filtering on additional indexed properties.
  - `db.index.vector.queryNodes()` was deprecated in Neo4j 2026.04 but still works on older servers.
  - Relationship vector indexes are also supported.

**Two ways to use Neo4j vectors from Mastra:**

1. **Custom GraphRAG tool (recommended).** A `createTool` with a zod input such as `{ query, topK, hops }`:
   - Embed the query with `ModelRouterEmbeddingModel`.
   - Run one Cypher query: `SEARCH` (or `queryNodes`) over `Chunk.embedding` and/or `Term.embedding`, then expand `-[:MENTIONS]->(:Term)-[r]-(:Term)` for N hops and return chunks, terms and relations with scores.

   This is real GraphRAG: vector entry points plus traversal of the extracted graph, all in Neo4j, in one round trip. It reuses the existing `neo4j-driver` and the tool style in `src/mastra/tools/neo4j-cypher`.
2. **A `Neo4jVector extends MastraVector` adapter.** Implement the abstract `query`, `upsert`, `createIndex`, `listIndexes`, `describeIndex`, `deleteIndex`, `updateVector`, `deleteVector` and `deleteVectors` (`@mastra/core/dist/vector/vector.d.ts`). This buys drop-in use with `createVectorQueryTool`/`createGraphRAGTool`, `mastra.vectors`, and `Memory` semantic recall. The cost is mapping Mastra's index/metadata/filter model onto labelled nodes, and Mastra's GraphRAG would still ignore our relationships. Only worth it if we want Memory semantic recall in Neo4j too.

## Open questions for the map

- Which Neo4j version/edition do we target (Aura or self-hosted)? The `SEARCH` clause needs 2026.01+; otherwise use `db.index.vector.queryNodes`.
- Embedding model and dimension (the index dimension is fixed at creation), and whether we embed `Chunk`, `Term`, or both.
- Should Mastra memory stay in LibSQL (simplest), or do we want a Neo4j `MastraVector` for semantic recall?
