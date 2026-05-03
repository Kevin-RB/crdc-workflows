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

const getNeo4jUri = () => {
  const directUri = process.env.NEO4J_URI
  if (directUri) {
    return directUri
  }

  const instanceId = process.env.AURA_INSTANCEID
  if (instanceId) {
    return `neo4j+s://${instanceId}.databases.neo4j.io`
  }

  const instanceName = process.env.AURA_INSTANCENAME
  if (instanceName) {
    return `neo4j+s://${instanceName}.databases.neo4j.io`
  }

  throw new Error("Missing NEO4J_URI or Aura instance details")
}

const main = async () => {
  const uri = getNeo4jUri()
  const username = getRequiredEnv("NEO4J_USERNAME")
  const password = getRequiredEnv("NEO4J_PASSWORD")
  const database = getRequiredEnv("NEO4J_DATABASE")

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

    const outputPath = path.join(outputDir, "schema.json")
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
