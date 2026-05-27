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
  if (!path.isAbsolute(configuredPath)) {
    throw new Error(
      `Workspace-relative paths are no longer supported for ${dataLabel}. Provide an absolute path via ${envVarName}.`,
    )
  }

  try {
    const raw = await readFile(configuredPath, "utf-8")
    return JSON.parse(raw)
  } catch (error) {
    throw new Error(`Failed to read ${dataLabel} at '${configuredPath}'.`, { cause: error })
  }
}
