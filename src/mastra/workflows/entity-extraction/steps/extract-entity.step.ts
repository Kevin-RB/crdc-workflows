import { chunkSchema } from "@/interface/chunk"
import { buildEntityExtractionUserPrompt } from "@/mastra/agents/entity-extraction/prompts"
import {
  chunkExtractionOutputSchema,
  type CandidateEntity,
} from "@/mastra/agents/entity-extraction/schema"
import { writePersistedEntityExtractionState } from "@/mastra/workflows/entity-extraction/helpers/persisted-state"
import { entityExtractionWorkflowStateSchema } from "@/mastra/workflows/entity-extraction/schemas"
import { createStep } from "@mastra/core/workflows"
import z from "zod"

const DEFAULT_ENTITY_MATCH_THRESHOLD = 0.88

const parseThreshold = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback
  }

  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : fallback
}

const ENTITY_MATCH_THRESHOLD = parseThreshold(
  process.env.ENTITY_EXTRACTION_ENTITY_MATCH_THRESHOLD,
  DEFAULT_ENTITY_MATCH_THRESHOLD,
)
const UNKNOWN_TYPE_FUZZY_MIN = Math.max(ENTITY_MATCH_THRESHOLD, 0.94)

const normalizeEntityText = (value: string): string => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
}

const normalizeAliasKey = (value: string): string => normalizeEntityText(value)

const isLikelyUrlOrDomain = (value: string): boolean => {
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) {
    return false
  }

  if (trimmed.includes("@")) {
    return true
  }

  if (/^https?:\/\//.test(trimmed) || /^www\./.test(trimmed)) {
    return true
  }

  return /^(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/.*)?$/.test(trimmed)
}

const uniqueNonEmpty = (values: string[]): string[] => {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

const sanitizeAliases = (aliases: string[], canonicalName: string): string[] => {
  const canonicalKey = normalizeAliasKey(canonicalName)
  const aliasByKey = new Map<string, string>()

  for (const rawAlias of aliases) {
    const alias = rawAlias.trim()
    if (!alias || isLikelyUrlOrDomain(alias)) {
      continue
    }

    const key = normalizeAliasKey(alias)
    if (!key || key === canonicalKey || aliasByKey.has(key)) {
      continue
    }

    aliasByKey.set(key, alias)
  }

  return Array.from(aliasByKey.values())
}

const canonicalNamePriority = (value: string): number => {
  const trimmed = value.trim()
  if (!trimmed || isLikelyUrlOrDomain(trimmed)) {
    return -1
  }

  const hasWhitespace = /\s/.test(trimmed)
  const hasDigits = /\d/.test(trimmed)
  const upperCount = (trimmed.match(/[A-Z]/g) ?? []).length
  const lowerCount = (trimmed.match(/[a-z]/g) ?? []).length
  const tokenCount = normalizeEntityText(trimmed).split(" ").filter(Boolean).length

  if (hasWhitespace && lowerCount > 0) {
    return 5
  }

  if (tokenCount > 1) {
    return 4
  }

  if (lowerCount > 0 && !hasDigits) {
    return 3
  }

  if (lowerCount > 0 && hasDigits) {
    return 2
  }

  if (upperCount > 0 && hasDigits) {
    return 1
  }

  return 0
}

const pickCanonicalName = (values: string[], fallback: string): string => {
  const cleaned = uniqueNonEmpty(values)
  const dedupedByKey = new Map<string, string>()

  for (const value of cleaned) {
    if (isLikelyUrlOrDomain(value)) {
      continue
    }

    const key = normalizeAliasKey(value)
    if (!key) {
      continue
    }

    if (!dedupedByKey.has(key)) {
      dedupedByKey.set(key, value)
    }
  }

  const candidates = Array.from(dedupedByKey.values())
  if (candidates.length === 0) {
    return fallback.trim() || fallback
  }

  let best = candidates[0]
  let bestScore = canonicalNamePriority(best)

  for (const candidate of candidates.slice(1)) {
    const score = canonicalNamePriority(candidate)
    if (score > bestScore) {
      best = candidate
      bestScore = score
      continue
    }

    if (score === bestScore) {
      const bestLength = normalizeEntityText(best).length
      const candidateLength = normalizeEntityText(candidate).length
      if (candidateLength > bestLength) {
        best = candidate
        bestScore = score
      }
    }
  }

  return best
}

const sanitizeEntity = (entity: CandidateEntity): CandidateEntity => {
  const rawName = entity.name.trim()
  const canonicalName = pickCanonicalName([rawName, ...entity.aliases], rawName)

  return {
    ...entity,
    name: canonicalName,
    chunkIds: uniqueNonEmpty(entity.chunkIds),
    aliases: sanitizeAliases(entity.aliases, canonicalName),
  }
}

const levenshteinDistance = (a: string, b: string): number => {
  if (a === b) {
    return 0
  }

  if (a.length === 0) {
    return b.length
  }

  if (b.length === 0) {
    return a.length
  }

  const rows = a.length + 1
  const cols = b.length + 1
  const matrix: number[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0))

  for (let i = 0; i < rows; i += 1) {
    matrix[i][0] = i
  }

  for (let j = 0; j < cols; j += 1) {
    matrix[0][j] = j
  }

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + substitutionCost,
      )
    }
  }

  return matrix[a.length][b.length]
}

const levenshteinRatio = (a: string, b: string): number => {
  if (!a && !b) {
    return 1
  }

  const maxLength = Math.max(a.length, b.length)
  if (maxLength === 0) {
    return 1
  }

  const distance = levenshteinDistance(a, b)
  return 1 - distance / maxLength
}

const tokenJaccard = (a: string, b: string): number => {
  const aTokens = new Set(a.split(" ").map((token) => token.trim()).filter(Boolean))
  const bTokens = new Set(b.split(" ").map((token) => token.trim()).filter(Boolean))

  if (aTokens.size === 0 && bTokens.size === 0) {
    return 1
  }

  const intersectionCount = Array.from(aTokens).filter((token) => bTokens.has(token)).length
  const unionCount = new Set([...Array.from(aTokens), ...Array.from(bTokens)]).size
  return unionCount === 0 ? 0 : intersectionCount / unionCount
}

const entitySimilarity = (a: string, b: string): number => {
  const left = normalizeEntityText(a)
  const right = normalizeEntityText(b)

  if (!left || !right) {
    return 0
  }

  const editScore = levenshteinRatio(left, right)
  const tokenScore = tokenJaccard(left, right)

  return editScore * 0.6 + tokenScore * 0.4
}

const isSameType = (left: string, right: string): boolean => {
  return normalizeEntityText(left) === normalizeEntityText(right)
}

const isUnknownType = (value: string): boolean => {
  return normalizeEntityText(value) === "unknown"
}

const canBridgeUnknownType = (left: string, right: string): boolean => {
  return (isUnknownType(left) && !isUnknownType(right)) || (!isUnknownType(left) && isUnknownType(right))
}

const resolveMergedType = (existingType: string, incomingType: string): string => {
  if (isUnknownType(existingType) && !isUnknownType(incomingType)) {
    return incomingType
  }

  return existingType
}

const findEntityMatchIndex = (
  existingEntities: CandidateEntity[],
  incomingEntity: CandidateEntity,
): number => {
  const incomingType = incomingEntity.type
  const incomingValueSet = new Set(
    [incomingEntity.name, ...incomingEntity.aliases]
      .map(normalizeAliasKey)
      .filter(Boolean),
  )

  const exactMatchIndex = existingEntities.findIndex((existingEntity) => {
    const sameType = isSameType(existingEntity.type, incomingType)
    const unknownBridge = canBridgeUnknownType(existingEntity.type, incomingType)
    if (!sameType && !unknownBridge) {
      return false
    }

    const existingValues = [existingEntity.name, ...existingEntity.aliases].map(normalizeAliasKey)
    return existingValues.some((value) => incomingValueSet.has(value))
  })

  if (exactMatchIndex >= 0) {
    return exactMatchIndex
  }

  let bestIndex = -1
  let bestScore = 0

  const incomingValues = [incomingEntity.name, ...incomingEntity.aliases]

  existingEntities.forEach((existingEntity, index) => {
    const sameType = isSameType(existingEntity.type, incomingType)
    const unknownBridge = canBridgeUnknownType(existingEntity.type, incomingType)
    if (!sameType && !unknownBridge) {
      return
    }

    const existingValues = [existingEntity.name, ...existingEntity.aliases]

    for (const incomingValue of incomingValues) {
      for (const existingValue of existingValues) {
        const score = entitySimilarity(incomingValue, existingValue)
        const threshold = sameType ? ENTITY_MATCH_THRESHOLD : UNKNOWN_TYPE_FUZZY_MIN
        if (score >= threshold && score > bestScore) {
          bestScore = score
          bestIndex = index
        }
      }
    }
  })

  return bestIndex
}

const extractEntityStateSchema = entityExtractionWorkflowStateSchema.pick({
  knownTypes: true,
  rawCandidateEntities: true,
  processedChunkIds: true,
})

const extractEntitySuspendSchema = z.object({
  chunkInfo: z.object({
    documentId: z.string(),
    chapterId: z.string(),
    chunkId: z.string(),
  }),
  message: z.string(),
  errorType: z.string().optional(),
})

const extractEntityResumeSchema = z.object({
  action: z.literal("retry"),
})

export const extractEntityAgentStep = createStep({
  id: "extract-entity-agent",
  inputSchema: chunkSchema,
  outputSchema: chunkExtractionOutputSchema,
  stateSchema: extractEntityStateSchema,
  suspendSchema: extractEntitySuspendSchema,
  resumeSchema: extractEntityResumeSchema,
  description: "Step that uses an agent to extract candidate entities from a chunk of text.",
  retries: 1,
  execute: async ({ inputData, state, setState, mastra, suspend, resumeData }) => {
    const extractionAgent = mastra.getAgent("entityExtractionAgent")

    const knownTypes = state.knownTypes ?? []
    const rawCandidateEntities = state.rawCandidateEntities ?? []
    const processedChunkIds = state.processedChunkIds ?? []

    const persistEntities = async (entities: CandidateEntity[]): Promise<CandidateEntity[]> => {
      const knownTypeSet = new Set(knownTypes.map((value) => normalizeEntityText(value)))
      const newTypes = entities
        .map((entity) => entity.type)
        .filter((type) => !knownTypeSet.has(normalizeEntityText(type)))

      const mergedEntities = rawCandidateEntities.map(sanitizeEntity)

      for (const entity of entities) {
        const sanitizedIncomingEntity = sanitizeEntity(entity)
        const matchIndex = findEntityMatchIndex(mergedEntities, sanitizedIncomingEntity)

        if (matchIndex < 0) {
          mergedEntities.push(sanitizedIncomingEntity)
          continue
        }

        const existingEntity = mergedEntities[matchIndex]
        const canonicalName = pickCanonicalName(
          [
            existingEntity.name,
            sanitizedIncomingEntity.name,
            ...existingEntity.aliases,
            ...sanitizedIncomingEntity.aliases,
          ],
          existingEntity.name,
        )

        mergedEntities[matchIndex] = {
          ...existingEntity,
          name: canonicalName,
          type: resolveMergedType(existingEntity.type, entity.type),
          aliases: sanitizeAliases(
            [
              existingEntity.name,
              sanitizedIncomingEntity.name,
              ...existingEntity.aliases,
              ...sanitizedIncomingEntity.aliases,
            ],
            canonicalName,
          ),
          chunkIds: uniqueNonEmpty([...existingEntity.chunkIds, ...sanitizedIncomingEntity.chunkIds]),
          confidence: Math.max(existingEntity.confidence, sanitizedIncomingEntity.confidence),
        }
      }

      const nextState = {
        knownTypes: Array.from(new Set([...knownTypes, ...newTypes])),
        rawCandidateEntities: mergedEntities,
        processedChunkIds: Array.from(new Set([...processedChunkIds, inputData.chunkId])),
      }

      await setState(nextState)

      await writePersistedEntityExtractionState(nextState)

      return entities
    }

    if (resumeData && resumeData.action !== "retry") {
      throw new Error("Unsupported resume action for extract-entity-agent step.")
    }

    const prompt = buildEntityExtractionUserPrompt({
      chunkText: inputData.content,
      knownTypes,
    })

    const response = await extractionAgent.generate(
      [{ role: "user", content: prompt }],
      {
        structuredOutput: {
          schema: chunkExtractionOutputSchema,
          errorStrategy: "warn"
        },
      },
    )

    const parsed = chunkExtractionOutputSchema.safeParse(response.object)

    if (!parsed.success) {
      console.error(z.prettifyError(parsed.error))
      return suspend(
        {
          chunkInfo: {
            documentId: inputData.documentId,
            chapterId: inputData.chapterId,
            chunkId: inputData.chunkId,
          },
          message: z.prettifyError(parsed.error),
        },
        {
          resumeLabel: `chunk:${inputData.chunkId}`,
        },
      )
    }

    const candidateEntities: CandidateEntity[] = parsed.data.map((entity) =>
      sanitizeEntity({
        chunkIds: [inputData.chunkId],
        name: entity.name.trim(),
        type: entity.type.trim(),
        confidence: entity.confidence,
        aliases: entity.aliases.map((alias) => alias.trim()).filter(Boolean),
      }),
    )

    return persistEntities(candidateEntities)
  },
})
