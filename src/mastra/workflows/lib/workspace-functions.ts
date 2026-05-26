import path from "node:path"


export const CHUNKED_OUTPUT_DIR = "src/docs/chunked"

export const requireProjectRoot = (): string => {
  const root = process.env.PROJECT_ROOT
  if (!root || root.trim().length === 0) {
    throw new Error("PROJECT_ROOT environment variable is required to resolve workspace paths.")
  }

  return root
}

export const resolveWorkspaceRoot = async (): Promise<string> => requireProjectRoot()

export const resolveFromProjectRoot = (...segments: string[]): string =>
  path.resolve(requireProjectRoot(), ...segments)
