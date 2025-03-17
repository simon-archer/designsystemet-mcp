#!/usr/bin/env node
import { startMcpServer } from './server';
import fs from 'fs';
import path from 'path';

// Parse command-line arguments
const args = process.argv.slice(2);
let configPath: string | undefined;
let openaiApiKey: string | undefined;

// Extract API key from environment or argument
openaiApiKey = process.env.OPENAI_API_KEY;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--config' && i + 1 < args.length) {
    configPath = args[i + 1];
    i++;
  } else if (args[i] === '--api-key' && i + 1 < args.length) {
    openaiApiKey = args[i + 1];
    i++;
  } else if (args[i] === '--help') {
    console.log(`
DesignBot MCP Server

Usage: designbot-mcp [options]

Options:
  --api-key <key>     OpenAI API key (can also use OPENAI_API_KEY env var)
  --help              Show this help message
  
Features:
  - designbot-chat: Ask questions about the design system (requires OpenAI API key)

Example:
  designbot-mcp --api-key sk-xxx
  
  # With environment variable:
  OPENAI_API_KEY=sk-xxx designbot-mcp
`);
    process.exit(0);
  }
}

// Check for API key
if (!openaiApiKey) {
  console.warn('Warning: No OpenAI API key provided. Chat functionality will be disabled.');
  console.warn('To enable chat, set the OPENAI_API_KEY environment variable or use --api-key.');
}

// Start the server
(async () => {
  try {
    await startMcpServer({
      openaiApiKey
    });
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
})();