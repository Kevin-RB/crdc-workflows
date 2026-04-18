import {Agent} from "@mastra/core/agent"

export const chattyAgent = new Agent({
    id: "chatty-agent",
    name: "Chatty Agent",
    instructions: 'You are a chatty agent, be nice to the user',
    model:'lmstudio/google/gemma-4-e4b'
})