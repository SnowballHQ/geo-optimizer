#!/usr/bin/env node

/**
 * Test script for Snowball MCP Server
 * Run this to verify the MCP server is working before configuring Claude Code
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing Snowball MCP Server...\n');

// Start the MCP server
const mcpServer = spawn('node', [join(__dirname, 'mcp-snowball-server.js')], {
  env: {
    ...process.env,
    BACKEND_URL: 'http://localhost:5000',
  },
  stdio: ['pipe', 'pipe', 'inherit'],
});

// Send test requests
setTimeout(() => {
  console.log('📋 Sending ListTools request...');

  const listToolsRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {},
  };

  mcpServer.stdin.write(JSON.stringify(listToolsRequest) + '\n');
}, 1000);

// Handle responses
mcpServer.stdout.on('data', (data) => {
  try {
    const responses = data.toString().split('\n').filter(Boolean);
    responses.forEach((line) => {
      const response = JSON.parse(line);
      console.log('\n✅ Response received:');
      console.log(JSON.stringify(response, null, 2));

      if (response.result?.tools) {
        console.log(`\n🎉 MCP Server is working! Found ${response.result.tools.length} tools:`);
        response.result.tools.forEach((tool) => {
          console.log(`   - ${tool.name}: ${tool.description}`);
        });

        console.log('\n✅ MCP Server test passed!');
        console.log('Next step: Configure Claude Code (see MCP-SETUP.md)');
        process.exit(0);
      }
    });
  } catch (err) {
    console.error('Error parsing response:', err.message);
  }
});

setTimeout(() => {
  console.log('\n⏱️  Test timeout - MCP server may not be responding');
  process.exit(1);
}, 5000);
