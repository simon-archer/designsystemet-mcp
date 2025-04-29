"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startMcpServer = startMcpServer;
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const z = __importStar(require("zod"));
const node_process_1 = __importDefault(require("node:process"));
/**
 * Start an MCP server with a designbot-chat tool
 */
async function startMcpServer(options = {}) {
    // Log when server is starting
    console.log("Designbot MCP server starting...");
    const { name = "DesignBot", version = "0.7.1", } = options;
    try {
        // Create server
        const server = new mcp_js_1.McpServer({
            name,
            version
        });
        // Add chat proxy tool - cursor-specific version
        server.tool("Ask-designbot", `Asks questions to the Designsystemet AI assistant (Designbot). Supports sub-queries for specific functions:
  • getComponentDoc (component docs and usage examples)
  • getComponentCode (React/HTML code examples)
  • getCssCode (CSS-only implementations)
  • getStarted (onboarding and setup guides)
  • getChangelog (version history)
  • getBasics (core design concepts)
  • getGoodPractice (implementation best practices)
  • getUxPatterns (common UX patterns)
  • getDesignModification (design tokens: colors, typography, spacing)
  You can also ask about accessibility, theming, and design guidelines.`, {
            parameters: z.object({
                message: z.string().describe("The question to ask Designbot about Designsystemet."),
            }),
        }, async ({ parameters: { message } }, extra) => {
            try {
                // Create an abort controller for the fetch request
                const controller = new AbortController();
                // Listen for abort from MCP and propagate to fetch
                if (extra && extra.signal) {
                    extra.signal.addEventListener('abort', () => {
                        controller.abort();
                    });
                }
                // Forward the message to designbot.deno.dev/chat
                const response = await fetch("https://designbot.deno.dev/chat", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ message }),
                    signal: controller.signal
                });
                // Check for valid response
                if (!response.ok) {
                    throw new Error(`API responded with status ${response.status}: ${response.statusText}`);
                }
                // Extract the final text from the response
                const finalText = await getCompletedResponse(response);
                // Return as simple text - no streaming at all
                return {
                    content: [{
                            type: "text",
                            text: finalText
                        }]
                };
            }
            catch (error) {
                console.error("MCP tool error:", error);
                return {
                    content: [{
                            type: "text",
                            text: `Error: ${error instanceof Error ? error.message : String(error)}`
                        }],
                    isError: true
                };
            }
        });
        // Add help resource
        server.resource("help", "designsystem://help", (uri) => ({
            contents: [{
                    uri: uri.href,
                    text: `DesignBot MCP Server

Available Tools:
- Ask-designbot: Asks questions to the Designsystemet AI assistant (Designbot). You can ask about components, their usage, accessibility, get code examples (React, HTML), CSS styles, or discuss design guidelines and tokens.

To get started, try using the Ask-designbot tool:
\`\`\`
Ask-designbot(message: "Tell me about the Button component")
\`\`\`
`
                }]
        }));
        // Start the server
        const transport = new stdio_js_1.StdioServerTransport();
        await server.connect(transport);
        console.log(`MCP Server ${name} v${version} started`);
        console.log(`Process ID: ${node_process_1.default.pid}`);
        return server;
    }
    catch (error) {
        console.error("MCP Server error:", error);
        throw error;
    }
}
/**
 * Wait for and extract the complete response
 */
async function getCompletedResponse(response) {
    // Get the response text as a string
    const text = await response.text();
    try {
        // Try to directly parse as JSON first
        if (!text.includes("data: ")) {
            const data = JSON.parse(text);
            if (data.response) {
                return data.response;
            }
        }
        // If it's streaming data, get the last complete chunk with the most content
        let bestMatch = "";
        const chunks = text.split("data: ");
        for (const chunk of chunks) {
            if (!chunk.trim())
                continue;
            try {
                // Try to parse the chunk as JSON
                let parsedData;
                // Some chunks might have trailing newlines
                const trimmedChunk = chunk.trim();
                // Only process valid JSON chunks
                if (trimmedChunk.startsWith("{") && trimmedChunk.endsWith("}")) {
                    parsedData = JSON.parse(trimmedChunk);
                    // Look for the complete response in various formats
                    let content = "";
                    if (parsedData.role === "assistant" && !parsedData.isPartial && parsedData.content) {
                        // This is a complete message
                        content = parsedData.content;
                    }
                    else if (parsedData.role === "assistant" && parsedData.content) {
                        // This is a partial message, but might be the most complete one
                        content = parsedData.content;
                    }
                    else if (parsedData.response) {
                        // Legacy format
                        content = parsedData.response;
                    }
                    // Keep the longest/most complete response
                    if (content.length > bestMatch.length) {
                        bestMatch = content;
                    }
                }
            }
            catch (e) {
                // Ignore parsing errors for individual chunks
            }
        }
        // If we found any valid content, return it
        if (bestMatch) {
            // Unescape any special characters from the JSON
            return bestMatch
                .replace(/\\n/g, '\n')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\');
        }
        // If all else fails, return an error message
        return "Could not extract response from the design system. Please try again.";
    }
    catch (error) {
        return `Error processing response: ${error instanceof Error ? error.message : String(error)}`;
    }
}
// Start the server
(async () => {
    try {
        await startMcpServer();
    }
    catch (e) {
        console.error("Failed to start MCP server:", e);
        node_process_1.default.exit(1);
    }
})();
