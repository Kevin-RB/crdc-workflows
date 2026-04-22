import { ENTITY_EXTRACTION_PROMPT } from "@/mastra/agents/entity-extraction/prompts"
import {Agent} from "@mastra/core/agent"

export const entityExtractionAgent = new Agent({
    id: "entity-extraction-agent",
    name: "Entity Extraction Agent",
    instructions: ENTITY_EXTRACTION_PROMPT,
    model:'lmstudio/google/gemma-4-e4b'
})