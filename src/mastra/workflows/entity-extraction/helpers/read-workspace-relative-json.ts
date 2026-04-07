import { resolveWorkspaceRoot } from "@/mastra/workflows/lib/workspace-functions"
import { readFile } from "node:fs/promises"
import path from "node:path"

type ReadWorkspaceRelativeJsonArgs = {
  configuredPath: string
  envVarName: string
  dataLabel: string
}

export const readWorkspaceRelativeJson = async ({
  configuredPath,
  envVarName,
  dataLabel,
}: ReadWorkspaceRelativeJsonArgs): Promise<unknown> => {
  if (path.isAbsolute(configuredPath)) {
    throw new Error(`${envVarName} must be workspace-relative, received absolute path: ${configuredPath}`)
  }

  const workspaceRoot = await resolveWorkspaceRoot()
  const resolvedPath = path.resolve(workspaceRoot, configuredPath)

  let raw: string
  try {
    raw = await readFile(resolvedPath, "utf-8")
  } catch (error) {
    throw new Error(
      `Failed to read ${dataLabel} at '${configuredPath}' (resolved: '${resolvedPath}'). Ensure the file exists relative to workspace root '${workspaceRoot}'.`,
      { cause: error },
    )
  }

  try {
    return JSON.parse(raw)
  } catch (error) {
    throw new Error(`Invalid JSON in ${dataLabel} file '${configuredPath}'.`, { cause: error })
  }
}
