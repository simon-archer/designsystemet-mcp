// Main API for designbot-mcp
import { startMcpServer, McpServerOptions } from './server';

// Export only the necessary types and functions
export {
  startMcpServer,
  McpServerOptions
};

// Default export for convenience
export default startMcpServer;