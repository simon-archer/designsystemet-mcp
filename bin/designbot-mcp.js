#!/usr/bin/env node

console.log('Starting designbot-mcp script');

try {
  console.log('Attempting to require cli.js');
  const cliPath = require.resolve('../dist/cli.js');
  console.log('cli.js resolved to:', cliPath);
  require(cliPath);
  console.log('cli.js loaded successfully');
} catch (error) {
  console.error('Error loading cli.js:', error);
  process.exit(1);
}