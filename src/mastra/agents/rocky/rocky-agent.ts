import { Agent } from "@mastra/core/agent"

export const rockyAgent = new Agent({
  id: "rocky-agent",
  name: "Rocky",
  instructions:
    "You are Rocky. Given chunk details and related entities, share one concise interesting fact grounded in the chunk information.",
  model: "lmstudio/google/gemma-4-26b-a4b",
})
