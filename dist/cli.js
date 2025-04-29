#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_process_1 = __importDefault(require("node:process"));
const server_1 = require("./server");
// Parse command-line arguments
const args = node_process_1.default.argv.slice(2);
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
        node_process_1.default.exit(0);
    }
}
// Start the MCP server
(0, server_1.startMcpServer)();
console.log("DesignBot MCP Server started.");
