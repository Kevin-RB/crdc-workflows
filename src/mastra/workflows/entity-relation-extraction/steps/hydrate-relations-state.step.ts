import { createStep } from "@mastra/core/workflows"
import {
  entityRelationExtractionWorkflowStateSchema,
  initializePersistedEntityRelationsState,
  loadPersistedEntityRelationsState,
} from "@/mastra/workflows/entity-relation-extraction/helpers/persisted-relations"
import { access } from "node:fs/promises"
import path from "node:path"
import z from "zod"

const RELATIONS_OUTPUT_PATH = path.resolve(
  process.cwd(),
  "../../docs/entity-extraction/relations.json",
)

const hydrateRelationsStateSchema = entityRelationExtractionWorkflowStateSchema

export const hydrateRelationsStateStep = createStep({
  id: "hydrate-relations-state",
  inputSchema: z.object({}).optional().default({}),
  outputSchema: z.object({}),
  stateSchema: hydrateRelationsStateSchema,
  description: "Loads relations state from persisted file or creates new if not exists.",
  execute: async ({ setState }) => {
    console.log(
      `[${hydrateRelationsStateStep.id}] - Loading relations state from persisted state file '${RELATIONS_OUTPUT_PATH}'.`,
    )

    try {
      await access(RELATIONS_OUTPUT_PATH)
      const persistedState = await loadPersistedEntityRelationsState()
      await setState({
        processedChunkIds: persistedState.processedChunkIds,
        relations: persistedState.relations,
      })
      console.log(
        `[${hydrateRelationsStateStep.id}] - Loaded existing state. Processed chunk IDs: ${persistedState.processedChunkIds.length}, Relations: ${persistedState.relations.length}.`,
      )
    } catch (error) {
      const err = error as NodeJS.ErrnoException
      if (err.code === "ENOENT") {
        const initialState = await initializePersistedEntityRelationsState()
        await setState({
          processedChunkIds: initialState.processedChunkIds,
          relations: initialState.relations,
        })
        console.log(
          `[${hydrateRelationsStateStep.id}] - Persisted state file did not exist. Created new file at '${RELATIONS_OUTPUT_PATH}'.`,
        )
      } else {
        throw error
      }
    }

    return {}
  },
})
