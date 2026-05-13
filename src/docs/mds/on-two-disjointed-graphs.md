

# Technical Report: Architectural Strategies for Orchestrating Disjointed Knowledge Graphs

## 1. Abstract

This report addresses the challenge of integrating two distinct knowledge graphs (KGs) derived from the same core corpus of Cotton Research and Development Corporation (CRDC) knowledge. One graph follows a **Top-Down** approach, synthesizing expert-level biological rules from over 20 documents. The other utilizes a **Bottom-Up** pipeline, extracting granular semantic relationships and textual citations from a single, detailed production manual. The primary objective was to determine if these graphs should be physically merged or architecturally bridged. While a Federated Agent (Supervisor) pattern was selected to maintain schema integrity, further analysis reveals that making this system reliable in production will require robust entity resolution, provenance tracking, and hybrid retrieval methods.

---

## 2. The Main Problem and Discussion Points

The core conflict resides in the different "lenses" through which each graph views the domain.

* **The Intent Gap:** The Top-Down graph serves as a **Specialist**, focusing on the logical "rules" of cotton farming, such as pest thresholds and chemical interactions.
* **The Context Gap:** The Bottom-Up graph serves as a **Granular Explorer**, mapping the linguistic associations and specific textual mentions (chunks) of terms within documents.
* **The Alignment Challenge:** We discussed how to join these disparate datasets when they reside in separate Neo4j instances and use different naming conventions, property keys, and levels of abstraction.

---

## 3. State of the System: Disjointed Schemas

The system currently exists in two isolated Neo4j Aura instances with distinct structural shapes:

### Top-Down Graph (The Specialist)

* **Structure**: Highly specific labels like `:Pest`, `:Chemical`, `:Weed`, and `:Threshold`.
* **Logic**: Rigid domain relationships such as `CONTROLLED_BY`, `AFFECTS`, and `HAS_THRESHOLD`.
* **Breadth**: Synthesized intelligence across more than 20 core documents.

### Bottom-Up Graph (The Granular Explorer)

* **Structure**: Generic `:Term` nodes linked to raw `:Chunk` and `:Document` nodes.
* **Logic**: Open Information Extraction (OpenIE) relationships like `ASSOCIATED_WITH`, `PRODUCES`, and `CAUSES`.
* **Depth**: Exhaustive detail on entities (e.g., people, specific programs like "myBMP") and their linguistic context within a single manual.

---

## 4. The Case Against Merging

Merging these two graphs into a single database is **not recommended** for the following reasons:

1. **Schema Entropy**: Combining strict domain rules with noisy, extracted semantic associations creates a "Franken-graph" that is difficult to maintain.
2. **Agent Confusion**: LLM agents struggle to generate accurate Cypher queries when presented with overlapping labels and high relationship density. An agent might hallucinate a path between a biological rule and a linguistic association that does not exist in reality.
3. **Data Dilution**: The "clean" expert-level data in the Top-Down graph would be polluted by the redundant or sometimes incorrect entities found in the unverified Bottom-Up extraction.
4. **Redundancy**: Many entities exist in both graphs under different names or with different properties, making forced physical merging highly error-prone.

---

## 5. Discussed Strategies: Pros and Cons

| Strategy | Pros | Cons |
| --- | --- | --- |
| **Hard Merge** | Single point of entry for queries. | Massive schema noise; high risk of agent hallucination; complex migration. |
| **Soft Bridge (SAME_AS)** | Links entities without breaking schemas. | Requires constant maintenance of a mapping table; difficult across Aura instances. |
| **Federated Agents** | Maintains schema purity; hyper-focused agents; high accuracy. | High orchestration overhead; latency issues; requires complex routing. |

---

## 6. Methods Tried: Successes and Failures

We attempted a **Programmatic Bridge** using TypeScript to match names across instances:

* **Successes**: We successfully extracted specialized names (Pests, Chemicals) from the Top-Down instance. We verified that the Bottom-Up instance contained the relevant properties (`name_norm`, `aliases`) to support matching.
* **Failures**: Initial attempts returned zero records due to string mismatches. Specific issues included PDF ligatures (e.g., "ﬁ" vs "fi"), pluralization differences ("aphid" vs "aphids"), and missing unindexed property warnings.

---

## 7. Proposed Solution: Federated Agents & Supervisor Pattern

The immediate chosen solution is to implement a **Federated Agent (Supervisor) Pattern** to orchestrate the disjointed graphs as a unified system.

* **Broad Generalist Agent (Top-Down)**: Handles high-level agronomic rules and industry-wide facts.
* **Granular Explorer Agent (Bottom-Up)**: Performs deep dives into specific document text, relationship discovery.
* **Supervisor Orchestrator**: Acts as a "Traffic Cop," evaluating the user's intent to route queries to the appropriate agent. It uses a **Cascading Fallback** loop (if the Generalist returns no data, it pivots to the Explorer) and a **Self-Healing Loop** (allowing agents a 4-attempt retry limit to correct Cypher syntax errors).

---

## 8. Critical Considerations and Future Improvements

While the Supervisor pattern successfully bypasses the dangers of a hard physical merge, relying purely on multi-agent orchestration introduces significant operational vulnerabilities. To mature this system for production, the following pipeline improvements must be implemented:

### A. Managing Orchestration Overhead

Framing the Supervisor as a simple "Traffic Cop" heavily understates the engineering burden. Routing queries, classifying intent, reconciling results, and mitigating latency are highly complex tasks. The system will require robust telemetry, structured retry logic, and human-in-the-loop (HITL) workflows for low-confidence merges to ensure stability and control operational costs.

### B. Hybrid Retrieval (GraphRAG) Implementation

Rather than relying on pure agent-to-database orchestration—which requires expensive round-trips—the architecture should evolve toward a **GraphRAG approach**. By leveraging vector search alongside graph traversal and targeted Cypher, the Supervisor can inject specific, relevant subgraphs directly into the LLM's context window. This reduces reliance on the agents generating perfect Cypher queries from scratch every time.

### C. Robust Entity Resolution Pipeline

The programmatic failures involving ligatures and pluralization highlighted a critical flaw: the lack of a standardized normalization pipeline. To bridge these graphs reliably, we must implement:

* Unicode normalization.
* Stemming and lemmatization.
* Canonical IDs for shared concepts.
* Embedding-based fuzzy matching.

---
### Why it Makes Sense:

This approach preserves the **integrity of the individual graphs** while allowing the LLM to act as a "Fuzzy Matcher" at the orchestration layer. It eliminates the need for a rigid, brittle mapping table and allows the system to scale as more documents are added to the Bottom-Up pipeline without compromising the biological logic of the Top-Down graph.