import path from "node:path"

export const requireDocumentsDir = (): string => {
  const value = process.env.DOCUMENTS_DIR
  if (!value || value.trim().length === 0) {
    throw new Error("DOCUMENTS_DIR environment variable is required for input data.")
  }

  if (!path.isAbsolute(value)) {
    throw new Error(`DOCUMENTS_DIR must be an absolute path, received: ${value}`)
  }

  return value
}

export const requireOutputRoot = (): string => {
  const value = process.env.OUTPUT_ROOT
  if (!value || value.trim().length === 0) {
    throw new Error("OUTPUT_ROOT environment variable is required for workflow outputs.")
  }

  if (!path.isAbsolute(value)) {
    throw new Error(`OUTPUT_ROOT must be an absolute path, received: ${value}`)
  }

  return value
}

export const resolveFromOutputRoot = (...segments: string[]): string =>
  path.resolve(requireOutputRoot(), ...segments)
