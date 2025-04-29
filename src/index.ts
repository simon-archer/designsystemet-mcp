// Main API for designbot-mcp
import { startMcpServer } from './server';

// Export only the necessary types and functions
export { startMcpServer };
export type { McpServerOptions } from './server';

// Default export for convenience
export default startMcpServer;