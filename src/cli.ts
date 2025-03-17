#!/usr/bin/env node
import { startMcpServer } from './server';
import fs from 'fs';
import path from 'path';
import { ToolDefinition } from './server';

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
Designsystemet MCP Server

Usage: designsystemet-mcp [options]

Options:
  --config <path>     Path to config file (optional)
  --api-key <key>     OpenAI API key (can also use OPENAI_API_KEY env var)
  --help              Show this help message

Example:
  designsystemet-mcp --api-key sk-xxx
  
  # With environment variable:
  OPENAI_API_KEY=sk-xxx designsystemet-mcp
`);
    process.exit(0);
  }
}

// Check for API key
if (!openaiApiKey) {
  console.warn('Warning: No OpenAI API key provided. Chat functionality will be disabled.');
  console.warn('To enable chat, set the OPENAI_API_KEY environment variable or use --api-key.');
}

// Load tools from config file if provided
let tools: ToolDefinition[] = [];
if (configPath) {
  try {
    const configFile = fs.readFileSync(path.resolve(configPath), 'utf8');
    const config = JSON.parse(configFile);
    
    if (config.tools && Array.isArray(config.tools)) {
      tools = config.tools;
    }
  } catch (error) {
    console.error(`Error loading config file from ${configPath}:`, error);
    process.exit(1);
  }
}

// Start the server
(async () => {
  try {
    await startMcpServer({
      tools: tools.length > 0 ? tools : undefined,
      openaiApiKey
    });
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
})();