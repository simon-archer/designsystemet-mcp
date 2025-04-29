// Main API for designbot-mcp
import { startMcpServer } from './server.ts';

// Export only the necessary types and functions
export { startMcpServer };
export type { McpServerOptions } from './server.ts';

// Default export for convenience
export default startMcpServer;