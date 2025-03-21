import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
export interface McpServerOptions {
    name?: string;
    version?: string;
}
/**
 * Start an MCP server with a designbot-chat tool
 */
export declare function startMcpServer(options?: McpServerOptions): Promise<McpServer>;
