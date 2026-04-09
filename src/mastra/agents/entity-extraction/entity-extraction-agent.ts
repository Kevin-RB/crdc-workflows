import { ENTITY_EXTRACTION_PROMPT } from "@/mastra/agents/entity-extraction/prompts"
import {Agent} from "@mastra/core/agent"

export const entityExtractionAgent = new Agent({
    id: "entity-extraction-agent",
    name: "Entity Extraction Agent",
    instructions: ENTITY_EXTRACTION_PROMPT,
    model:{
        id: 'lmstudio/nvidia/nemotron-3-nano-4b',
        url: 'http://127.0.0.1:1234/v1'
    }
})