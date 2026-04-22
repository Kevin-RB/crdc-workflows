import {
  getPersistedEntityExtractionStatePath,
  parsePersistedEntityExtractionState,
  readPersistedEntityExtractionStateRaw,
} from "@/mastra/workflows/entity-extraction/helpers/persisted-state"
import { chunkSourceModeSchema, entityExtractionWorkflowStateSchema } from "@/mastra/workflows/entity-extraction/schemas"
import { createStep } from "@mastra/core/workflows"
import { ZodError, z } from "zod"

const hydrateKnownTypesStateSchema = entityExtractionWorkflowStateSchema.pick({ knownTypes: true })

const hydrateKnownTypesSuspendSchema = z.object({
  reason: z.enum(["read_error", "parse_error", "schema_mismatch"]),
  message: z.string().trim().min(1),
  filePath: z.string().trim().min(1),
})

const hydrateKnownTypesResumeSchema = z.object({
  action: z.enum(["continue_empty", "abort_run"]),
})

export const hydrateKnownTypesFromFileStep = createStep({
  id: "hydrate-known-types-from-file",
  inputSchema: chunkSourceModeSchema,
  outputSchema: chunkSourceModeSchema,
  stateSchema: hydrateKnownTypesStateSchema,
  suspendSchema: hydrateKnownTypesSuspendSchema,
  resumeSchema: hydrateKnownTypesResumeSchema,
  description: "Loads global knownTypes from persisted workflow state.",
  execute: async ({ inputData, resumeData, setState, suspend, suspendData }) => {
    const suspendReason = suspendData?.reason
    const suspendMessage = suspendData?.message

    if (resumeData?.action === "abort_run") {
      throw new Error(`Workflow aborted by user: Reason - ${suspendReason}, Message - ${suspendMessage}`)
    }

    if (resumeData?.action === "continue_empty") {
      console.warn(`Continuing workflow with empty knownTypes after persisted-state error: ${suspendReason}`)
      await setState({ knownTypes: [] })
      return inputData
    }

    const persistedPath = await getPersistedEntityExtractionStatePath()

    let raw: unknown
    try {
      raw = await readPersistedEntityExtractionStateRaw()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const err = error as NodeJS.ErrnoException

      if (err?.code === "ENOENT") {
        return suspend({
          reason: "read_error",
          message: `File not found: ${persistedPath}`,
          filePath: persistedPath,
        },
      {
        resumeLabel: "persisted-known-types-file-not-found",
      })
      }

      return suspend(
        {
          reason: "read_error",
          message,
          filePath: persistedPath,
        },
        {
          resumeLabel: "persisted-known-types-read-error",
        },
      )
    }

    let json: unknown
    try {
      json = JSON.parse(raw as string)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return suspend(
        {
          reason: "parse_error",
          message,
          filePath: persistedPath,
        },
        {
          resumeLabel: "persisted-known-types-parse-error",
        },
      )
    }

    try {
      const parsed = parsePersistedEntityExtractionState(json)
      await setState({ knownTypes: parsed.knownTypes })
      return inputData
    } catch (error) {
      if (error instanceof ZodError) {
        return suspend(
          {
            reason: "schema_mismatch",
            message: error.message,
            filePath: persistedPath,
          },
          {
            resumeLabel: "persisted-known-types-schema-mismatch",
          },
        )
      }

      const message = error instanceof Error ? error.message : String(error)
      return suspend(
        {
          reason: "parse_error",
          message,
          filePath: persistedPath,
        },
        {
          resumeLabel: "persisted-known-types-parse-error",
        },
      )
    }
  },
})
