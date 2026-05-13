import neo4j from 'neo4j-driver';

export type Neo4jDbId = 'agent-a' | 'agent-b';

const DB_CONFIG: Record<Neo4jDbId, { uri: string; username: string; password: string }> = {
  'agent-a': {
    uri: process.env.NEO4J_URI_CO!,
    username: process.env.NEO4J_USERNAME_CO!,
    password: process.env.NEO4J_PASSWORD_CO!,
  },
  'agent-b': {
    uri: process.env.NEO4J_URI_PK!,
    username: process.env.NEO4J_USERNAME_PK!,
    password: process.env.NEO4J_PASSWORD_PK!,
  },
};

const driverCache = new Map<Neo4jDbId, ReturnType<typeof neo4j.driver>>();

export function getDriver(dbId: Neo4jDbId) {
  if (!driverCache.has(dbId)) {
    const config = DB_CONFIG[dbId];
    driverCache.set(dbId, neo4j.driver(config.uri, neo4j.auth.basic(config.username, config.password)));
  }

  return driverCache.get(dbId)!;
}
