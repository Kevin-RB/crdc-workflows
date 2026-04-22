import type { Chunk } from "@/interface/chunk"
import type { OpenDataLoaderJson } from "@/interface/document"
import { MDocument } from "@mastra/rag"
import { randomUUID } from "node:crypto"


const DEFAULT_WEAK_HEADING_MAX_LENGTH = 3
const DEFAULT_MIN_CHUNK_SIZE_CHARS = 450
const DEFAULT_MIN_CHUNK_ALPHA_WORDS = 10
const DEFAULT_MIN_CHUNK_ALPHA_RATIO = 0.35
const DEFAULT_MAX_CHUNK_SIZE_CHARS = 3500
const DEFAULT_CHUNK_OVERLAP_CHARS = 300
const RECURSIVE_CHUNK_SEPARATORS = ["\n\n", "\n", " ", ""] as const
const ENTITY_EXTRACTION_DOCUMENT_TITLE = process.env.ENTITY_EXTRACTION_DOCUMENT_TITLE

const parseEnvInt = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

const parseEnvFloat = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback
  }

  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

const WEAK_HEADING_MAX_LENGTH = parseEnvInt(
  process.env.ENTITY_EXTRACTION_WEAK_HEADING_MAX_LENGTH,
  DEFAULT_WEAK_HEADING_MAX_LENGTH,
)
const MIN_CHUNK_SIZE_CHARS = parseEnvInt(
  process.env.ENTITY_EXTRACTION_MIN_CHUNK_SIZE_CHARS,
  DEFAULT_MIN_CHUNK_SIZE_CHARS,
)
const MIN_CHUNK_ALPHA_WORDS = parseEnvInt(
  process.env.ENTITY_EXTRACTION_MIN_CHUNK_ALPHA_WORDS,
  DEFAULT_MIN_CHUNK_ALPHA_WORDS,
)
const MIN_CHUNK_ALPHA_RATIO = parseEnvFloat(
  process.env.ENTITY_EXTRACTION_MIN_CHUNK_ALPHA_RATIO,
  DEFAULT_MIN_CHUNK_ALPHA_RATIO,
)
const MAX_CHUNK_SIZE_CHARS = parseEnvInt(
  process.env.ENTITY_EXTRACTION_MAX_CHUNK_SIZE_CHARS,
  DEFAULT_MAX_CHUNK_SIZE_CHARS,
)
const CHUNK_OVERLAP_CHARS = parseEnvInt(
  process.env.ENTITY_EXTRACTION_CHUNK_OVERLAP_CHARS,
  DEFAULT_CHUNK_OVERLAP_CHARS,
)

const isWeakHeading = (value: string): boolean => value.trim().length <= WEAK_HEADING_MAX_LENGTH

const normalizeText = (value: string): string => {
  return value
    .replace(/([A-Z])\n([a-z])/g, "$1$2")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

const hasEnoughInformation = (value: string): boolean => {
  const text = value.trim()
  if (!text) {
    return false
  }

  const alphaWords = (text.match(/[A-Za-z]{2,}/g) ?? []).length
  const nonWhitespaceChars = text.replace(/\s+/g, "")
  const alphaChars = (text.match(/[A-Za-z]/g) ?? []).length
  const alphaRatio = nonWhitespaceChars.length === 0 ? 0 : alphaChars / nonWhitespaceChars.length

  if (alphaRatio < MIN_CHUNK_ALPHA_RATIO) {
    return false
  }

  return text.length >= MIN_CHUNK_SIZE_CHARS || alphaWords >= MIN_CHUNK_ALPHA_WORDS
}

const splitOversizedContent = async (content: string): Promise<string[]> => {
  if (content.length <= MAX_CHUNK_SIZE_CHARS) {
    return [content]
  }

  const maxSize = Math.max(1, MAX_CHUNK_SIZE_CHARS)
  const overlap = Math.min(Math.max(0, CHUNK_OVERLAP_CHARS), Math.max(0, maxSize - 1))

  const doc = MDocument.fromText(content)
  const subChunks = await doc.chunk({
    strategy: "recursive",
    maxSize,
    overlap,
    separators: [...RECURSIVE_CHUNK_SEPARATORS],
  })

  const normalizedSubChunks = subChunks
    .map((chunk) => normalizeText(chunk.text))
    .filter((chunkText) => chunkText.length > 0)

  return normalizedSubChunks.length > 0 ? normalizedSubChunks : [content]
}

export const chunkBySection = async (doc: OpenDataLoaderJson): Promise<Chunk[]> => {
  if (!ENTITY_EXTRACTION_DOCUMENT_TITLE) {
    throw new Error("Environment variable 'ENTITY_EXTRACTION_DOCUMENT_TITLE' is not set")
  }

  const chunks: Chunk[] = []
  const source = doc["file name"] ?? null

  console.log(`Chunking document by section. Source: '${source}', Total elements: ${doc.kids.length}`)

  let currentHeading: string | null = null
  let currentContent: string[] = []
  let currentStartPage: number | null = null

  const appendToBuffer = (content: string, page: number): void => {
    const trimmed = content.trim()
    if (!trimmed) {
      return
    }

    if (currentStartPage === null) {
      currentStartPage = page
    }

    currentContent.push(trimmed)
  }

  const flush = async (): Promise<void> => {
    const content = normalizeText(currentContent.join("\n"))
    if (!hasEnoughInformation(content)) {
      currentContent = []
      currentStartPage = null
      return
    }

    const sectionParts = await splitOversizedContent(content)

    sectionParts.forEach((partContent) => {
      chunks.push({
        documentId: ENTITY_EXTRACTION_DOCUMENT_TITLE,
        chapterId: doc["file name"],
        chunkId: randomUUID(),
        content: partContent,
        metadata: {
          heading: currentHeading,
          page: currentStartPage,
          source,
        },
      })
    })

    currentContent = []
    currentStartPage = null
  }

  for (const element of doc.kids) {
    if (element.type === "heading") {
      const headingContent = element.content.trim()
      if (!headingContent) {
        continue
      }

      if (!isWeakHeading(headingContent) && currentContent.join("\n").trim().length >= MIN_CHUNK_SIZE_CHARS) {
        await flush()
      }

      if (!isWeakHeading(headingContent)) {
        currentHeading = headingContent
      }

      appendToBuffer(headingContent, element["page number"])
      continue
    }

    if (element.type === "paragraph") {
      appendToBuffer(element.content, element["page number"])
      continue
    }

    if (element.type === "list") {
      const listContent = element["list items"]
        .map((item) => item.content.trim())
        .filter(Boolean)
        .join("\n")

      appendToBuffer(listContent, element["page number"])
    }
  }

  await flush()

  return chunks
}
