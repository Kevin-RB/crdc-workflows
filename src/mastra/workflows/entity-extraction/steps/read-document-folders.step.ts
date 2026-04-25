import { documentFolderArraySchema } from "@/mastra/workflows/entity-extraction/schemas"
import { createStep } from "@mastra/core/workflows"
import fs from "node:fs/promises"
import path from "node:path"
import z from "zod"

const TARGET_DOCUMENTS_DIR = path.resolve(process.cwd(), "../../docs/odl")

export const readDocumentFoldersStep = createStep({
  id: "read-document-folders",
  description: "Reads hardcoded document folders for entity extraction.",
  inputSchema: z.object({}),
  outputSchema: documentFolderArraySchema,
  execute: async () => {
    console.log(`[read-document-folders] Target directory: ${TARGET_DOCUMENTS_DIR}`)

    const folders = await fs.readdir(TARGET_DOCUMENTS_DIR, { withFileTypes: true })

    const folderPaths = folders
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => path.join(TARGET_DOCUMENTS_DIR, dirent.name))

    if (folderPaths.length === 0) {
      console.warn(`[read-document-folders] No folders found in '${TARGET_DOCUMENTS_DIR}'.`)
      return []
    }

    const result: Array<{ documentName: string; documentFilePaths: string[] }> = []

    for (const folderPath of folderPaths) {
      const filesInFolder = await fs.readdir(folderPath, { withFileTypes: true })
      const filePaths = filesInFolder
        .filter((dirent) => dirent.isFile() && dirent.name.endsWith(".json"))
        .map((dirent) => path.join(folderPath, dirent.name))

      if (filePaths.length === 0) {
        continue
      }

      result.push({
        documentName: path.basename(folderPath),
        documentFilePaths: filePaths,
      })
    }

    return result
  },
})
