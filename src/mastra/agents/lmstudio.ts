import type { OpenAICompatibleConfig } from "@mastra/core/llm"

const defaultLmstudioBaseUrl = "http://127.0.0.1:1234/v1"

export const lmstudioBaseUrl =
  process.env.LMSTUDIO_BASE_URL ?? defaultLmstudioBaseUrl

export const lmstudioModel = (
  id: `${string}/${string}`
): OpenAICompatibleConfig => ({
  id,
  url: lmstudioBaseUrl,
})
