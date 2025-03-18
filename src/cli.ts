#!/usr/bin/env node
import { startMcpServer } from './server';

// Parse command-line arguments
const args = process.argv.slice(2);

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--help') {
    console.log(`
DesignBot MCP Server

Usage: designbot-mcp [options]

Options:
  --help              Show this help message
  
Features:
  - designbot: Ask questions about the design system

Example:
  designbot-mcp
`);
    process.exit(0);
  }
}

// Start the server
(async () => {
  try {
    await startMcpServer({
    });
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
})();