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
    console.log("Connecting to Neo4j to create index...")

    const query = `
      CREATE FULLTEXT INDEX term_search IF NOT EXISTS
      FOR (n:Term)
      ON EACH [n.name, n.aliases]
    `

    await session.run(query)

    console.log("Success: 'term_search' full-text index has been created.")
    console.log("Database is ready for fuzzy search.")
  } finally {
    await session.close()
    await driver.close()
  }
}

main().catch((error) => {
  console.error("Error creating index:", error)
  process.exitCode = 1
})
