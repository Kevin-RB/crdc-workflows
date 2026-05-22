import fs from "node:fs/promises"
import path from "node:path"
import neo4j from "neo4j-driver"

const getRequiredEnv = (key) => {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

const getSchemaEnvSuffix = () => {
  const type = process.env.SCHEMA_GENERATION_TYPE;
  if (type === 'BOTTOM_UP') return '_CO';
  if (type === 'TOP_DOWN') return '_PK';
  return ''; // Fallback to current behavior (no suffix)
};

const main = async () => {
  const suffix = getSchemaEnvSuffix();
  const uri = getRequiredEnv(`NEO4J_URI${suffix}`);
  const username = getRequiredEnv(`NEO4J_USERNAME${suffix}`);
  const password = getRequiredEnv(`NEO4J_PASSWORD${suffix}`);
  const database = getRequiredEnv(`NEO4J_DATABASE${suffix}`);
  let outputFilename = "schema"

  if (suffix === '_CO') {
    outputFilename += "_bottom_up.json"
  } else if (suffix === '_PK') {
    outputFilename += "_top_down.json"
  }

  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password))
  const session = driver.session({ database })

  try {
    const result = await session.run(
      "CALL apoc.meta.schema() YIELD value RETURN value"
    )
    const schema = result.records[0]?.get("value")

    if (!schema) {
      throw new Error("Schema query returned no results")
    }

    const outputDir = path.resolve(process.cwd(), "src/docs/neo4j")
    await fs.mkdir(outputDir, { recursive: true })

    const outputPath = path.join(outputDir, outputFilename)
    await fs.writeFile(outputPath, JSON.stringify(schema, null, 2), "utf-8")

    console.log(`Schema written to ${outputPath}`)
  } finally {
    await session.close()
    await driver.close()
  }
}

main().catch((error) => {
  console.error("Failed to write Neo4j schema:", error)
  process.exitCode = 1
})
