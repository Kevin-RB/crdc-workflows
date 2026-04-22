import { openDataLoaderJsonSchema } from "@/interface/document"
import { ENTITY_EXTRACTION_DOC_PATH_ENV } from "@/mastra/workflows/entity-extraction/constants"
import { readWorkspaceRelativeJson } from "@/mastra/workflows/entity-extraction/helpers/read-workspace-relative-json"
import { chunkSourceModeSchema } from "@/mastra/workflows/entity-extraction/schemas"
import { createStep } from "@mastra/core/workflows"
import z from "zod"

export const loadDocumentFromFileStep = createStep({
  id: "load-document-from-file",
  inputSchema: chunkSourceModeSchema,
  outputSchema: openDataLoaderJsonSchema,
  execute: async () => {
    const configuredPath = process.env[ENTITY_EXTRACTION_DOC_PATH_ENV]
    console.log(`Loading document from file. Configured path: '${configuredPath}'`)

    if (!configuredPath) {
      throw new Error(
        `Environment variable ${ENTITY_EXTRACTION_DOC_PATH_ENV} is not set.`,
      )
    }

    const parsed = await readWorkspaceRelativeJson({
      configuredPath,
      envVarName: ENTITY_EXTRACTION_DOC_PATH_ENV,
      dataLabel: "document",
    })

    const validated = openDataLoaderJsonSchema.safeParse(parsed)
    if (!validated.success) {
      const maxIssuesToShow = 12
      const totalIssues = validated.error.issues.length
      const displayedIssues = validated.error.issues.slice(0, maxIssuesToShow)

      const issueSummary = displayedIssues
        .map((issue, index) => {
          const pathLabel = issue.path.length > 0 ? issue.path.join(".") : "<root>"
          const received = "input" in issue ? `, received ${JSON.stringify(issue.input)}` : ""
          const expected = "expected" in issue ? `expected ${String(issue.expected)}, ` : ""
          return `${index + 1}. ${pathLabel}: ${expected}${issue.message}${received}`
        })
        .join("\n")

      const remaining =
        totalIssues > maxIssuesToShow
          ? `\n... and ${totalIssues - maxIssuesToShow} more validation issue(s).`
          : ""

      const pretty = z.prettifyError(validated.error)

      throw new Error(
        [
          `Document validation failed for '${configuredPath}' (${totalIssues} issue(s)).`,
          issueSummary,
          remaining,
          "",
          "Pretty Zod diagnostics:",
          pretty,
        ].join("\n"),
        { cause: validated.error },
      )
    }

    return validated.data
  },
})
