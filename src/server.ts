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
    version = "0.1.0",
  } = options;

  try {
    // Create server
    const server = new McpServer({
      name,
      version
    });

    // Add chat proxy tool
    server.tool(
      "designbot-chat",
      { 
        message: z.string()
      },
      async ({ message }) => {
        try {
          // Forward the message to designbot.deno.dev/chat
          const response = await fetch("https://designbot.deno.dev/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ message }),
          });

          // Get the response as text
          const text = await response.text();
          
          // Try to extract the response text
          let finalText = "";
          
          // If it looks like SSE data, try to parse it
          if (text.includes("data: {")) {
            console.log("Detected SSE response format");
            const lines = text.split("\n");
            
            // First, try finding the complete assistant message (non-partial)
            const finalMessagePattern = /"role":"assistant","content":"([^"]*)","refusal":null,"parsed":null,"isPartial":false/;
            const match = text.match(finalMessagePattern);
            
            if (match && match[1]) {
              // Found the final message, unescape special characters
              finalText = match[1].replace(/\\n/g, '\n')
                                .replace(/\\"/g, '"')
                                .replace(/\\\\/g, '\\');
              console.log("Found final message in SSE stream");
            } else {
              // If no final message found, try to collect all assistant content chunks
              console.log("No final message found, trying to collect chunks...");
              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  try {
                    const data = JSON.parse(line.substring(6));
                    if (data.role === 'assistant' && data.content) {
                      finalText += data.content;
                      console.log("Added assistant content chunk");
                    } else if (data.response) {
                      finalText += data.response;
                      console.log("Added response chunk");
                    }
                  } catch (e) {
                    // Ignore parsing errors
                    console.log("Error parsing SSE chunk:", e);
                  }
                }
              }
            }
          } else {
            // Try to parse as JSON
            try {
              const json = JSON.parse(text);
              if (json.response) {
                finalText = json.response;
              }
            } catch (e) {
              // If all else fails, just return the raw text
              finalText = text;
            }
          }
          
          // If we don't have a response, add a fallback message
          if (!finalText) {
            console.log("No text extracted from response, using fallback message");
            finalText = "I couldn't get information about that from the design system. Please check the documentation or try a different query.";
          } else {
            console.log(`Extracted ${finalText.length} chars of response text`);
          }
          
          return {
            content: [{ type: "text", text: finalText }]
          };
        } catch (error) {
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