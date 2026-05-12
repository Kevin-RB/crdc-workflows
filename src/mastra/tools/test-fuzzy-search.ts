import neo4j from 'neo4j-driver';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// 1. Initialize Driver
const driver = neo4j.driver(
    process.env.NEO4J_URI!,
    neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!)
);
// 2. Define the Tool (exactly as it will sit in your Agent)
export const searchGraphTerms = createTool({
  id: 'Search Graph Terms',
  description: 'Use this FIRST to find the exact formal name of a Term in the database.',
  inputSchema: z.object({
    searchTerm: z.string(),
  }),
  execute: async ({ searchTerm }) => {
    const session = driver.session();
    try {
      // The '~' adds the "fuzziness" to handle typos
      const query = `
        CALL db.index.fulltext.queryNodes("term_search", $searchTerm + "~") 
        YIELD node, score 
        RETURN node.name AS ExactName, node.aliases AS Aliases, score
        LIMIT 5
      `;
      const result = await session.run(query, { searchTerm });
      return result.records.map(record => ({
        name: record.get('ExactName'),
        aliases: record.get('Aliases') || [],
        score: record.get('score')
      }));
    } catch (error) {
        if (error instanceof Error) {
            return {
                system_instruction: "The Cypher query failed. Read the error below, correct your Cypher syntax, and call this tool again.",
                neo4j_error: error.message
            }
        } else {
            return { error: 'An unknown error occurred while executing the Cypher query.' }
        }
    } finally {
      await session.close();
    }
  },
});

// // 3. Run the Tests!
// async function runTests() {
//   console.log("Testing Fuzzy Search Tool...\n");

//   // Test A: A partial word / plural mismatch
//   console.log("Searching for: 'aphid' (Notice missing 's')");
//   const resultA = await searchGraphTerms.execute({ context: { searchTerm: "aphid" } });
//   console.log(JSON.stringify(resultA, null, 2));
//   console.log("\n-------------------\n");

//   // Test B: A bad typo
//   console.log("Searching for: 'cottn' (Notice missing 'o')");
//   const resultB = await searchGraphTerms.execute({ context: { searchTerm: "cottn" } });
//   console.log(JSON.stringify(resultB, null, 2));
  
//   await driver.close();
// }

// runTests();