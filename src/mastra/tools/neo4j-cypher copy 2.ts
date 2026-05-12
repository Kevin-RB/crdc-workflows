// tools/neo4jTool.ts
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import neo4j from 'neo4j-driver';

// 1. Initialize Driver
const driver = neo4j.driver(
    process.env.NEO4J_URI_PK!,
    neo4j.auth.basic(process.env.NEO4J_USERNAME_PK!, process.env.NEO4J_PASSWORD_PK!)
);
const pkResult = [
    {
        "type": "__Entity__",
        "name": null
    },
    {
        "type": "__Entity__",
        "name": null
    },
    {
        "type": "__Entity__",
        "name": null
    },
    {
        "type": "__Entity__",
        "name": null
    },
    {
        "type": "Pest",
        "name": "aphids"
    },
    {
        "type": "Chemical",
        "name": "Pirimicarb"
    },
    {
        "type": "Chemical",
        "name": "Paraffinic oil"
    },
    {
        "type": "Chemical",
        "name": "Afidopyropen"
    },
    {
        "type": "Pest",
        "name": "Cotton aphid"
    },
    {
        "type": "Chemical",
        "name": "Parafﬁnic oil"
    },
    {
        "type": "Chemical",
        "name": "Aﬁdopyropen"
    },
    {
        "type": "Chemical",
        "name": "Diafenthiuron"
    },
    {
        "type": "Chemical",
        "name": "Pymetrozine"
    },
    {
        "type": "Chemical",
        "name": "Dimpropyridaz"
    },
    {
        "type": "Chemical",
        "name": "Cyantraniliprole"
    },
    {
        "type": "Chemical",
        "name": "Spirotetramat"
    },
    {
        "type": "Chemical",
        "name": "Thiamethoxam"
    },
    {
        "type": "Chemical",
        "name": "Sulfoxaﬂor"
    },
    {
        "type": "Chemical",
        "name": "Flonicamid"
    },
    {
        "type": "Chemical",
        "name": "Emamectin benzoate/ acetamiprid"
    },
    {
        "type": "Chemical",
        "name": "Acetamiprid"
    },
    {
        "type": "Chemical",
        "name": "Clothianidin"
    },
    {
        "type": "Chemical",
        "name": "Imidacloprid"
    },
    {
        "type": "Chemical",
        "name": "Dimethoate"
    },
    {
        "type": "Chemical",
        "name": "Phorate"
    },
    {
        "type": "Pest",
        "name": "Helicoverpa"
    },
    {
        "type": "Chemical",
        "name": "Bacillus thuringiensis"
    },
    {
        "type": "Chemical",
        "name": "Helicoverpa NPV"
    },
    {
        "type": "Chemical",
        "name": "Magnet®"
    },
    {
        "type": "Chemical",
        "name": "Indoxacarb"
    },
    {
        "type": "Chemical",
        "name": "Clitoria ternatea extract"
    },
    {
        "type": "Chemical",
        "name": "Amorphous silica"
    },
    {
        "type": "Chemical",
        "name": "Chlorantraniliprole"
    },
    {
        "type": "Chemical",
        "name": "Spinetoram"
    },
    {
        "type": "Chemical",
        "name": "Abamectin"
    },
    {
        "type": "Chemical",
        "name": "Emamectin benzoate"
    },
    {
        "type": "Chemical",
        "name": "Methomyl"
    },
    {
        "type": "Chemical",
        "name": "Thiodicarb"
    },
    {
        "type": "Chemical",
        "name": "Alphacypermethrin"
    },
    {
        "type": "Chemical",
        "name": "Bifenthrin"
    },
    {
        "type": "Chemical",
        "name": "Cypermethrin"
    },
    {
        "type": "Chemical",
        "name": "Deltamethrin"
    },
    {
        "type": "Chemical",
        "name": "Esfenvalerate"
    },
    {
        "type": "Chemical",
        "name": "Gammacyhalothrin"
    },
    {
        "type": "Chemical",
        "name": "Lambdacyhalothrin"
    },
    {
        "type": "Pest",
        "name": "Solenopsis mealybug"
    },
    {
        "type": "Chemical",
        "name": "Buprofezin"
    },
    {
        "type": "Pest",
        "name": "Green mirid"
    },
    {
        "type": "Chemical",
        "name": "Fipronil"
    },
    {
        "type": "Chemical",
        "name": "Dinotefuran"
    },
    {
        "type": "Chemical",
        "name": "Gamma-cyhalothrin"
    },
    {
        "type": "Chemical",
        "name": "Lambda-cyhalothrin"
    },
    {
        "type": "Chemical",
        "name": "Alpha-cypermethrin"
    },
    {
        "type": "Pest",
        "name": "Two-spotted spider mite"
    },
    {
        "type": "Chemical",
        "name": "Etoxazole"
    },
    {
        "type": "Chemical",
        "name": "Propargite"
    },
    {
        "type": "Pest",
        "name": "Wireworm"
    },
    {
        "type": "Pest",
        "name": "Green vegetable bug"
    },
    {
        "type": "Chemical",
        "name": "Emamectin benzoate/ Acetamiprid"
    },
    {
        "type": "Pest",
        "name": "Thrips"
    },
    {
        "type": "Pest",
        "name": "Silverleaf whitefly"
    },
    {
        "type": "Chemical",
        "name": "Pyriproxyfen"
    },
    {
        "type": "Disease",
        "name": "Black root rot (BRR)"
    },
    {
        "type": "Crop",
        "name": "cotton"
    },
    {
        "type": "Disease",
        "name": "Boll rot"
    },
    {
        "type": "Disease",
        "name": "Tight lock"
    },
    {
        "type": "Disease",
        "name": "Seed rot"
    },
    {
        "type": "Disease",
        "name": "Anthracnose boll rot"
    },
    {
        "type": "Disease",
        "name": "Bacterial blight"
    },
    {
        "type": "Disease",
        "name": "Diplodia boll rot"
    },
    {
        "type": "Disease",
        "name": "Alternaria leaf spot"
    },
    {
        "type": "Disease",
        "name": "Fusarium boll rot"
    },
    {
        "type": "Disease",
        "name": "Phytophthora boll rot"
    },
    {
        "type": "Disease",
        "name": "Sclerotinia boll rot"
    },
    {
        "type": "Disease",
        "name": "Collar rot"
    },
    {
        "type": "Disease",
        "name": "Cotton bunchy top (CBT)"
    },
    {
        "type": "Disease",
        "name": "Fusarium wilt"
    },
    {
        "type": "Disease",
        "name": "Leaf spots"
    },
    {
        "type": "Disease",
        "name": "Cercospora leaf spot"
    },
    {
        "type": "Disease",
        "name": "Target spot"
    },
    {
        "type": "Disease",
        "name": "Stemphylium leaf spot"
    },
    {
        "type": "Disease",
        "name": "Ramularia leaf spot"
    },
    {
        "type": "Disease",
        "name": "Nematodes"
    },
    {
        "type": "Disease",
        "name": "Reniform nematode"
    },
    {
        "type": "Disease",
        "name": "Root-knot nematodes"
    },
    {
        "type": "Disease",
        "name": "Lesion nematode"
    },
    {
        "type": "Disease",
        "name": "Spiral nematode"
    },
    {
        "type": "Disease",
        "name": "Stubby-root nematode"
    },
    {
        "type": "Disease",
        "name": "Reoccurring wilt"
    },
    {
        "type": "Disease",
        "name": "Sclerotinia boll rot and stem blight"
    },
    {
        "type": "Disease",
        "name": "Seedling diseases"
    },
    {
        "type": "Disease",
        "name": "Verticillium wilt"
    },
    {
        "type": "Disease",
        "name": "Sudden wilt"
    },
    {
        "type": "Disease",
        "name": "Bacterial stunt"
    },
    {
        "type": "Disease",
        "name": "Charcoal rot"
    },
    {
        "type": "Chemical",
        "name": "Thidiazuron"
    },
    {
        "type": "Chemical",
        "name": "Diuron"
    },
    {
        "type": "Chemical",
        "name": "Pyraflufen-ethyl"
    },
    {
        "type": "Chemical",
        "name": "Ethephon"
    },
    {
        "type": "Chemical",
        "name": "Diquat"
    },
    {
        "type": "Chemical",
        "name": "Carfentrazone-ethyl"
    },
    {
        "type": "Chemical",
        "name": "Paraquat"
    },
    {
        "type": "Chemical",
        "name": "Sodium chlorate"
    },
    {
        "type": "Disease",
        "name": "Ramularia"
    },
    {
        "type": "Disease",
        "name": "Leaf spot diseases"
    },
    {
        "type": "Variety",
        "name": "Sicot 724XF"
    },
    {
        "type": "Trait",
        "name": "XtendFlex"
    },
    {
        "type": "Variety",
        "name": "Sicot 619B3XF"
    },
    {
        "type": "Trait",
        "name": "Bollgard 3"
    },
    {
        "type": "Variety",
        "name": "Sicot 743B3XF"
    },
    {
        "type": "Variety",
        "name": "Sicot 761B3XF"
    },
    {
        "type": "Trait",
        "name": "Cotton bunchy top resistance"
    },
    {
        "type": "Variety",
        "name": "Siokra 253B3XF"
    },
    {
        "type": "Trait",
        "name": "Okra leaf shape"
    },
    {
        "type": "Variety",
        "name": "Sicot 714B3F"
    },
    {
        "type": "Trait",
        "name": "Roundup Ready Flex"
    },
    {
        "type": "Variety",
        "name": "Sicot 746B3F"
    },
    {
        "type": "Variety",
        "name": "Sicot 748B3F"
    },
    {
        "type": "Variety",
        "name": "Sicot 606B3F"
    },
    {
        "type": "Weed",
        "name": "Fleabane"
    },
    {
        "type": "Weed",
        "name": "Feathertop Rhodes grass"
    },
    {
        "type": "Weed",
        "name": "Annual ryegrass"
    },
    {
        "type": "Chemical",
        "name": "herbicide resistance"
    },
    {
        "type": "Weed",
        "name": "Cowvine"
    },
    {
        "type": "Weed",
        "name": "Bellvine"
    },
    {
        "type": "Weed",
        "name": "Common sowthistle"
    },
    {
        "type": "Weed",
        "name": "Flaxleaf fleabane"
    },
    {
        "type": "Weed",
        "name": "Awnless barnyard grass"
    },
    {
        "type": "Weed",
        "name": "Parthenium"
    },
    {
        "type": "Weed",
        "name": "Thornapple"
    },
    {
        "type": "Weed",
        "name": "Noogoora burr"
    },
    {
        "type": "Weed",
        "name": "Bathurst burr"
    },
    {
        "type": "Weed",
        "name": "Liverseed grass"
    },
    {
        "type": "Weed",
        "name": "Barnyard grasses"
    },
    {
        "type": "Disease",
        "name": "Fusarium wilt (exotic races)"
    },
    {
        "type": "Disease",
        "name": "Bacterial blight (exotic/hypervirulent races)"
    },
    {
        "type": "Pest",
        "name": "Cotton aphid (exotic strains)"
    },
    {
        "type": "Pest",
        "name": "Cotton boll weevil"
    },
    {
        "type": "Disease",
        "name": "Cotton leaf curl disease"
    },
    {
        "type": "Pest",
        "name": "Spider mites (exotic species)"
    },
    {
        "type": "Disease",
        "name": "Verticillium wilt (defoliating strains)"
    },
    {
        "type": "Disease",
        "name": "Cotton blue disease"
    },
    {
        "type": "Pest",
        "name": "Indian green jassid"
    },
    {
        "type": "Pest",
        "name": "Tarnished plant bug"
    },
    {
        "type": "Disease",
        "name": "Texas root rot"
    },
    {
        "type": "Chemical",
        "name": "Isoxaflutole"
    },
    {
        "type": "Chemical",
        "name": "Terbuthylazine"
    },
    {
        "type": "Chemical",
        "name": "Flumioxazin"
    },
    {
        "type": "Chemical",
        "name": "Saflufenacil"
    },
    {
        "type": "Chemical",
        "name": "Trifludimoxazin"
    },
    {
        "type": "Chemical",
        "name": "Dicamba"
    },
    {
        "type": "Chemical",
        "name": "Glyphosate"
    },
    {
        "type": "Chemical",
        "name": "Glufosinate"
    },
    {
        "type": "Chemical",
        "name": "2,4-D"
    },
    {
        "type": "Chemical",
        "name": "Clopyralid"
    },
    {
        "type": "Chemical",
        "name": "glyphosate"
    },
    {
        "type": "Chemical",
        "name": "paraquat"
    },
    {
        "type": "Weed",
        "name": "Tall fleabane"
    },
    {
        "type": "Weed",
        "name": "Canadian fleabane"
    },
    {
        "type": "Weed",
        "name": "Red pigweed"
    },
    {
        "type": "Chemical",
        "name": "Fluometuron"
    },
    {
        "type": "Chemical",
        "name": "Prometryn"
    },
    {
        "type": "Chemical",
        "name": "Pendimethalin"
    },
    {
        "type": "Chemical",
        "name": "Trifluralin"
    },
    {
        "type": "Chemical",
        "name": "Aminopyralid"
    },
    {
        "type": "Chemical",
        "name": "Fluroxypyr"
    },
    {
        "type": "Weed",
        "name": "Sowthistle"
    },
    {
        "type": "Weed",
        "name": "Tridax daisy"
    },
    {
        "type": "Chemical",
        "name": "Prosulfocarb"
    },
    {
        "type": "Chemical",
        "name": "S-Metolachlor"
    },
    {
        "type": "Chemical",
        "name": "Aclonifen"
    },
    {
        "type": "Chemical",
        "name": "Pyroxasulfone"
    },
    {
        "type": "Chemical",
        "name": "Diflufenican"
    },
    {
        "type": "Chemical",
        "name": "Cinmethylin"
    },
    {
        "type": "Chemical",
        "name": "Tri-allate"
    },
    {
        "type": "Chemical",
        "name": "Clethodim"
    },
    {
        "type": "Chemical",
        "name": "Butroxydim"
    },
    {
        "type": "Chemical",
        "name": "Haloxyfop"
    },
    {
        "type": "Chemical",
        "name": "Group 1(A) herbicides"
    },
    {
        "type": "Weed",
        "name": "Windmill grass"
    },
    {
        "type": "Weed",
        "name": "Great brome"
    },
    {
        "type": "Weed",
        "name": "Red brome"
    },
    {
        "type": "Weed",
        "name": "Sweet summer grass"
    },
    {
        "type": "Weed",
        "name": "Winter grass"
    },
    {
        "type": "Weed",
        "name": "Northern barley grass"
    },
    {
        "type": "Chemical",
        "name": "diquat"
    },
    {
        "type": "Weed",
        "name": "Wild oats"
    },
    {
        "type": "Weed",
        "name": "Johnson grass"
    },
    {
        "type": "Weed",
        "name": "Wild radish"
    },
    {
        "type": "Weed",
        "name": "Prickly lettuce"
    },
    {
        "type": "Weed",
        "name": "Willow-leaved lettuce"
    },
    {
        "type": "Weed",
        "name": "Capeweed"
    },
    {
        "type": "Weed",
        "name": "Barley grass"
    },
    {
        "type": "Weed",
        "name": "Silver grass"
    },
    {
        "type": "Weed",
        "name": "Small square weed"
    },
    {
        "type": "Weed",
        "name": "Cudweed"
    },
    {
        "type": "Weed",
        "name": "Blackberry nightshade"
    },
    {
        "type": "Weed",
        "name": "Crowsfoot grass"
    }
]

export const graphMatching = createTool({
    id: 'Graph Matching query',
    description: 'Executes a read-only Cypher query against the knowledge graph to fetch data.',
    inputSchema: z.object({
        TungTungSahur: z.boolean().describe('Tung tung tung tung sahur!'),
    }),
    execute: async ({ TungTungSahur }) => {
        const session = driver.session();
        try {
            const namesToMatch = pkResult
                .filter(record => record.name !== null && record.name !== undefined)
                .map(record => record.name
                    .toLocaleLowerCase()
                    .trim()
                    .normalize("NFKD") // Cleans ligatures (ﬁ -> fi)
                    .replace(/[^\x00-\x7F]/g, "") // Removes symbols like ® or ™
                );

            // Run the query generated by the LLM
            const result = await session.run(`
    UNWIND $namesToMatch AS searchName
    MATCH (t:Term)
    // We check both the display name and the normalized name
    // Using 'starts with' or 'contains' is safer than exact match
    WHERE toLower(t.name) CONTAINS searchName 
       OR toLower(t.name_norm) CONTAINS searchName
    
    RETURN 
        t.name AS matchedName, 
        t.term_id AS librarianId,
        searchName AS originalQuery,
        labels(t) AS labels
    LIMIT 200
`, { namesToMatch });

            const graphBridge = result.records.map(row => ({
                specialistName: row.get('originalQuery'),
                librarianId: row.get('librarianElementId'),
                displayName: row.get('matchedName')
            }));

            console.log(`Successfully bridged ${graphBridge.length} entities!`);

            return result
        } catch (error) {
            if (error instanceof Error) {
                return {
                    neo4j_error: error.message
                }
            }
            return error
        } finally {
            await session.close();
        }
    },
});