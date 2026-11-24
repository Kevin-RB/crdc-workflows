# Knowledge Graph Pipeline

A domain-agnostic pipeline that turns a coherent collection of documents into a knowledge graph and answers questions over it through an orchestrator agent.

## Language

**Domain Profile**:
The configuration describing one subject the pipeline is pointed at: what the documents are about, the seed entity types, and the relation vocabulary. Exactly one is active at a time.
_Avoid_: Domain config, ontology, schema, collection
