import { chunkSchema } from "@/interface/chunk"
import { openDataLoaderJsonSchema } from "@/interface/document"
import { chunkBySection } from "@/mastra/workflows/lib/chunking-function"
import { createStep, createWorkflow } from "@mastra/core/workflows"
import { access, mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import z from "zod"

const DEFAULT_DOC_PATH = "src/docs/odl/2025 Australian Cotton Production Manual_interactive_sml.json"

const PACKAGE_JSON = "package.json"
const CHUNKED_OUTPUT_DIR = "src/docs/chunked"

const findWorkspaceRoot = async (startDir: string): Promise<string | null> => {
  let current = path.resolve(startDir)

  while (true) {
    try {
      await access(path.join(current, PACKAGE_JSON))
      return current
    } catch {
      const parent = path.dirname(current)
      if (parent === current) {
        return null
      }
      current = parent
    }
  }
}

const resolveWorkspaceRoot = async (): Promise<string> => {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url))
  const searchStarts = [process.cwd(), moduleDir]

  for (const start of searchStarts) {
    const root = await findWorkspaceRoot(start)
    if (root) {
      return root
    }
  }

  throw new Error("Unable to locate workspace root (package.json not found).")
}

const LoadDocumentFromFile = createStep({
  id: "Load document from file",
  inputSchema: z.object({}),
  outputSchema: openDataLoaderJsonSchema,
  execute: async () => {
    const configuredPath = process.env.ENTITY_EXTRACTION_DOC_PATH ?? DEFAULT_DOC_PATH

    if (path.isAbsolute(configuredPath)) {
      throw new Error(
        `ENTITY_EXTRACTION_DOC_PATH must be workspace-relative, received absolute path: ${configuredPath}`,
      )
    }

    const workspaceRoot = await resolveWorkspaceRoot()
    const resolvedPath = path.resolve(workspaceRoot, configuredPath)

    let raw: string
    try {
      raw = await readFile(resolvedPath, "utf-8")
    } catch (error) {
      throw new Error(
        `Failed to read document at '${configuredPath}' (resolved: '${resolvedPath}'). Ensure the file exists relative to workspace root '${workspaceRoot}'.`,
        { cause: error },
      )
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch (error) {
      throw new Error(`Invalid JSON in document file '${configuredPath}'.`, { cause: error })
    }

    return openDataLoaderJsonSchema.parse(parsed)
  },
})

const Chunking = createStep({
  id: 'Chunk document',
  inputSchema: openDataLoaderJsonSchema,
  outputSchema: z.array(chunkSchema),
  execute: async ({ inputData }) => {
    return chunkBySection(inputData)
  },
})

const WriteChunksToFile = createStep({
  id: "Write chunks to file",
  inputSchema: z.array(chunkSchema),
  outputSchema: z.array(chunkSchema),
  execute: async ({ inputData }) => {
    const configuredPath = process.env.ENTITY_EXTRACTION_DOC_PATH ?? DEFAULT_DOC_PATH
    const workspaceRoot = await resolveWorkspaceRoot()

    const outputDir = path.resolve(workspaceRoot, CHUNKED_OUTPUT_DIR)
    await mkdir(outputDir, { recursive: true })

    const inputBaseName = path.basename(configuredPath, path.extname(configuredPath))
    const outputFileName = `${inputBaseName}.chunked.json`
    const outputPath = path.join(outputDir, outputFileName)

    await writeFile(outputPath, JSON.stringify(inputData, null, 2), "utf-8")

    return inputData
  },
})


export const entityExtractionWorkflow = createWorkflow({
  id: 'entity-extraction-workflow',
  description: 'A workflow that extracts entities from a document',
  options:{
    validateInputs: true,
  },
  inputSchema: z.object({}),
  outputSchema: z.array(chunkSchema),
})
.then(LoadDocumentFromFile)
.then(Chunking)
.then(WriteChunksToFile)
.commit()
