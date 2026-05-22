import neo4j from "neo4j-driver"

const getRequiredEnv = (key: string) => {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

const main = async () => {
  const uri = getRequiredEnv("NEO4J_URI")
  const username = getRequiredEnv("NEO4J_USERNAME")
  const password = getRequiredEnv("NEO4J_PASSWORD")
  const database = getRequiredEnv("NEO4J_DATABASE")

  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password))
  const session = driver.session({ database })

  try {
    const result = await session.run("SHOW FULLTEXT INDEXES")
    const rows = result.records.map((record) => record.toObject())
    const termIndex = rows.find((row) => row.name === "term_search")

    if (!termIndex) {
      throw new Error("Full-text index 'term_search' was not found.")
    }

    console.log("Full-text index found:")
    console.log(JSON.stringify(termIndex, null, 2))
  } finally {
    await session.close()
    await driver.close()
  }
}

main().catch((error) => {
  console.error("Index verification failed:", error)
  process.exitCode = 1
})
