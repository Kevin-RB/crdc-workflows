import { fileURLToPath } from "node:url"
import { access } from "node:fs/promises"
import path from "node:path"


export const DEFAULT_DOC_PATH = "src/docs/odl/2025 Australian Cotton Production Manual_interactive_sml.json"

const PACKAGE_JSON = "package.json"
export const CHUNKED_OUTPUT_DIR = "src/docs/chunked"

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

export const resolveWorkspaceRoot = async (): Promise<string> => {
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