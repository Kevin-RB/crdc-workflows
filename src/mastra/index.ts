
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { DuckDBStore } from "@mastra/duckdb";
import { MastraCompositeStore } from '@mastra/core/storage';
import { Observability, DefaultExporter, CloudExporter, SensitiveDataFilter } from '@mastra/observability';
import { toolCallAppropriatenessScorer, completenessScorer, translationScorer } from './scorers/weather-scorer';
import { entityExtractionWorkflow } from '@/mastra/workflows/entity-extraction-workflow';
import { entityExtractionAgent } from '@/mastra/agents/entity-extraction/entity-extraction-agent';
import { chatAgent } from '@/mastra/agents/chat-agent/chat-agent';
import { entityRelationExtractionWorkflow } from '@/mastra/workflows/entity-relation-extraction-workflow';
import { relationBuildingAgent } from '@/mastra/agents/relation-building/relation-building-agent';
import { documentChunksWorkflow } from '@/mastra/workflows/document-chunks.workflow';
import { supervisorAgent } from '@/mastra/agents/chat-agent/supervisor-agent';

export const mastra = new Mastra({
  workflows: { entityExtractionWorkflow, entityRelationExtractionWorkflow, documentChunksWorkflow },
  agents: { entityExtractionAgent, chatAgent, relationBuildingAgent, supervisorAgent },
  scorers: { toolCallAppropriatenessScorer, completenessScorer, translationScorer },
  storage: new MastraCompositeStore({
    id: 'composite-storage',
    default: new LibSQLStore({
      id: "mastra-storage",
      url: "file:./mastra.db",
    }),
    domains: {
      observability: await new DuckDBStore().getStore('observability'),
    }
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mastra',
        exporters: [
          new DefaultExporter(), // Persists traces to storage for Mastra Studio
          new CloudExporter(), // Sends traces to Mastra Cloud (if MASTRA_CLOUD_ACCESS_TOKEN is set)
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(), // Redacts sensitive data like passwords, tokens, keys
        ],
      },
    },
  }),
});
