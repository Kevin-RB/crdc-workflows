import crypto from "node:crypto"

export const normaliseText = (value?: string | null): string => {
  if (!value) {
    return ""
  }

  return value.trim().toLowerCase().split(/\s+/).join(" ")
}

export const stableHash = (value: string): string =>
  crypto.createHash("sha256").update(value, "utf-8").digest("hex")

export const makeTermId = (name: string): string => stableHash(normaliseText(name))

export const coerceList = (value: unknown): string[] => {
  if (value === null || value === undefined) {
    return []
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter((item) => item.length > 0)
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return [value.trim()]
  }

  return []
}

export const normaliseRelationType = (value?: string | null): string => {
  if (!value) {
    return "RELATED_TO"
  }

  const cleaned = value
    .trim()
    .toUpperCase()
    .split("")
    .map((char) => (/[A-Z0-9]/.test(char) ? char : "_"))
    .join("")
    .split("_")
    .filter((part) => part.length > 0)
    .join("_")

  if (!cleaned) {
    return "RELATED_TO"
  }

  if (/^\d/.test(cleaned)) {
    return `REL_${cleaned}`
  }

  return cleaned
}
