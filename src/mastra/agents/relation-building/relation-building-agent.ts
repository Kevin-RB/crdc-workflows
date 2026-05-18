import { Agent } from "@mastra/core/agent"

export const relationBuildingAgent = new Agent({
  id: "relation-building-agent",
  name: "Relation Building Agent",
  instructions:
    "You are the Relation Building Agent. Given chunk details and related entities, share one concise interesting fact grounded in the chunk information.",
  model: "lmstudio/google/gemma-4-26b-a4b",
})
