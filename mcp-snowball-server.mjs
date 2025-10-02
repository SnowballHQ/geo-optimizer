#!/usr/bin/env node

/**
 * Snowball MCP Server
 * Custom MCP server for Snowball project backend testing and MongoDB access
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import { MongoClient } from 'mongodb';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://abhishek:RLlOzwwUkzpDaBMd@cluster0.9pmn7wd.mongodb.net/snowball_fin?retryWrites=true&w=majority&appName=Cluster0';

class SnowballMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'snowball-backend',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.mongoClient = null;
    this.setupHandlers();
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.cleanup();
      process.exit(0);
    });
  }

  async cleanup() {
    if (this.mongoClient) {
      await this.mongoClient.close();
    }
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'test_backend_api',
          description: 'Test Snowball backend API endpoints',
          inputSchema: {
            type: 'object',
            properties: {
              method: {
                type: 'string',
                enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
                description: 'HTTP method',
              },
              endpoint: {
                type: 'string',
                description: 'API endpoint path (e.g., /api/v1/brand/123/blogs)',
              },
              data: {
                type: 'object',
                description: 'Request body data (for POST/PUT/PATCH)',
              },
              token: {
                type: 'string',
                description: 'JWT authentication token (optional)',
              },
            },
            required: ['method', 'endpoint'],
          },
        },
        {
          name: 'query_mongodb',
          description: 'Query Snowball MongoDB database',
          inputSchema: {
            type: 'object',
            properties: {
              collection: {
                type: 'string',
                enum: ['brands', 'users', 'onboardingprogresses', 'blogscores', 'aicompetitormentions', 'brandcategories'],
                description: 'Collection name to query',
              },
              operation: {
                type: 'string',
                enum: ['find', 'findOne', 'count', 'aggregate'],
                description: 'MongoDB operation',
              },
              query: {
                type: 'object',
                description: 'MongoDB query filter',
              },
              limit: {
                type: 'number',
                description: 'Limit results (default: 10)',
              },
            },
            required: ['collection', 'operation'],
          },
        },
        {
          name: 'check_api_keys',
          description: 'Check if required API keys are configured in backend',
          inputSchema: {
            type: 'object',
            properties: {
              keys: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of API key names to check (e.g., OPENAI_API_KEY, PERPLEXITY_API_KEY)',
              },
            },
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'test_backend_api':
            return await this.testBackendAPI(args);

          case 'query_mongodb':
            return await this.queryMongoDB(args);

          case 'check_api_keys':
            return await this.checkAPIKeys(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error.message}\n${error.stack}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async testBackendAPI(args) {
    const { method, endpoint, data, token } = args;

    try {
      const headers = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await axios({
        method: method.toLowerCase(),
        url: `${BACKEND_URL}${endpoint}`,
        data,
        headers,
        timeout: 30000,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                status: response.status,
                statusText: response.statusText,
                data: response.data,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }

  async queryMongoDB(args) {
    const { collection, operation, query = {}, limit = 10 } = args;

    try {
      if (!this.mongoClient) {
        this.mongoClient = new MongoClient(MONGO_URI);
        await this.mongoClient.connect();
      }

      const db = this.mongoClient.db();
      const col = db.collection(collection);

      let result;
      switch (operation) {
        case 'find':
          result = await col.find(query).limit(limit).toArray();
          break;

        case 'findOne':
          result = await col.findOne(query);
          break;

        case 'count':
          result = await col.countDocuments(query);
          break;

        case 'aggregate':
          result = await col.aggregate(query).toArray();
          break;

        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                collection,
                operation,
                query,
                resultCount: Array.isArray(result) ? result.length : 1,
                result,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `MongoDB Error: ${error.message}\n${error.stack}`,
          },
        ],
        isError: true,
      };
    }
  }

  async checkAPIKeys(args) {
    const { keys = ['OPENAI_API_KEY', 'PERPLEXITY_API_KEY', 'MONGO_URI'] } = args;

    const results = {};
    for (const key of keys) {
      const value = process.env[key];
      results[key] = {
        exists: !!value,
        length: value ? value.length : 0,
        prefix: value ? value.substring(0, 10) + '...' : null,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              message: 'API Key Check Results',
              keys: results,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Snowball MCP Server running on stdio');
  }
}

// Start the server
const server = new SnowballMCPServer();
server.run().catch(console.error);
