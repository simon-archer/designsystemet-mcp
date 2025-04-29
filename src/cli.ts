#!/usr/bin/env node
import process from 'node:process';
import { startMcpServer } from './server.ts';

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

// Start the MCP server
startMcpServer();

console.log("DesignBot MCP Server started.");