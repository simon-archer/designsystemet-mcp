import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as z from 'zod';

// Server options interface
export interface McpServerOptions {
  name?: string;
  version?: string;
}

/**
 * Start an MCP server with a designbot-chat tool
 */
export async function startMcpServer(options: McpServerOptions = {}) {
  // Log when server is starting
  console.log("Designbot MCP server starting...");
  
  const {
    name = "DesignBot",
    version = "0.7.1",
  } = options;

  try {
    // Create server
    const server = new McpServer({
      name,
      version
    });

    // Add chat proxy tool - cursor-specific version
    server.tool(
      "designbot-chat",
      { 
        message: z.string()
      },
      async ({ message }, extra) => {
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
        } catch (error) {
          console.error("MCP tool error:", error);
          return {
            content: [{ 
              type: "text", 
              text: `Error: ${error instanceof Error ? error.message : String(error)}` 
            }],
            isError: true
          };
        }
      }
    );

    // Add help resource
    server.resource(
      "help",
      "designsystem://help",
      async (uri) => ({
        contents: [{
          uri: uri.href,
          text: `DesignBot MCP Server

Available Tools:
- designbot-chat: Forward a chat message to designbot.deno.dev/chat

To get started, try using the designbot-chat tool:
\`\`\`
designbot-chat(message: "Tell me about the Button component")
\`\`\`
`
        }]
      })
    );

    // Start the server
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    return server;
  } catch (error) {
    console.error("MCP Server error:", error);
    throw error;
  }
}

/**
 * Wait for and extract the complete response
 */
async function getCompletedResponse(response: Response): Promise<string> {
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
      if (!chunk.trim()) continue;
      
      try {
        // Try to parse the chunk as JSON
        let parsedData: any;
        
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
          } else if (parsedData.role === "assistant" && parsedData.content) {
            // This is a partial message, but might be the most complete one
            content = parsedData.content;
          } else if (parsedData.response) {
            // Legacy format
            content = parsedData.response;
          }
          
          // Keep the longest/most complete response
          if (content.length > bestMatch.length) {
            bestMatch = content;
          }
        }
      } catch (e) {
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
  } catch (error) {
    return `Error processing response: ${error instanceof Error ? error.message : String(error)}`;
  }
}