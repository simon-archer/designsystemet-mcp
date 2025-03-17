import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import OpenAI from 'openai';

// Tool definition interface
export interface ToolDefinition {
  function: {
    name: string;
    description: string;
    parameters: any;
    parse?: (args: string) => any;
    function: (args: any) => Promise<any> | any;
  };
  metadata?: {
    name: string;
    description: string;
    ui?: {
      icon: string;
      label: string;
      bgColor: string;
      borderColor: string;
    };
  };
}

// Simple tool examples to get started
export const simpleTools: ToolDefinition[] = [
  {
    function: {
      name: "echo",
      description: "Echo back a message",
      parameters: {
        type: "object",
        properties: {
          message: {
            type: "string",
            description: "The message to echo back"
          }
        },
        required: ["message"]
      },
      function: async ({ message }: { message: string }) => message
    }
  },
];

export interface McpServerOptions {
  name?: string;
  version?: string;
  tools?: ToolDefinition[];
  openaiApiKey?: string;
}

export async function startMcpServer(options: McpServerOptions = {}) {
  const {
    name = "DesignsystemetMCP",
    version = "0.1.0",
    tools = simpleTools,
    openaiApiKey
  } = options;

  // Create server
  const server = new McpServer({
    name,
    version
  });

  // Initialize OpenAI if API key is provided
  let openaiClient: OpenAI | undefined;
  if (openaiApiKey) {
    openaiClient = new OpenAI({
      apiKey: openaiApiKey,
    });
  }

  // Register tools
  tools.forEach(tool => {
    try {
      // Extract schema definition and convert to Zod schema
      const schemaProperties = tool.function.parameters.properties || {};
      const schemaRequired: string[] = tool.function.parameters.required || [];
      
      // Create a Zod schema from the OpenAI tool schema
      const zodSchema: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(schemaProperties)) {
        const isRequired = schemaRequired.includes(key);
        const propertyValue = value as { type?: string; items?: any };
        
        // Map JSON Schema types to Zod schema
        if (propertyValue.type === "string") {
          zodSchema[key] = isRequired ? z.string() : z.string().optional();
        } else if (propertyValue.type === "number") {
          zodSchema[key] = isRequired ? z.number() : z.number().optional();
        } else if (propertyValue.type === "boolean") {
          zodSchema[key] = isRequired ? z.boolean() : z.boolean().optional();
        } else if (propertyValue.type === "array") {
          zodSchema[key] = isRequired ? z.array(z.any()) : z.array(z.any()).optional();
        } else {
          // Default to allowing any for unknown types
          zodSchema[key] = isRequired ? z.any() : z.any().optional();
        }
      }
      
      // Register the tool with MCP
      server.tool(
        tool.function.name,
        zodSchema,
        async (args: any) => {
          try {
            // Execute the tool function
            const result = await tool.function.function(args);
            
            return {
              content: [{ 
                type: "text", 
                text: typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result) 
              }]
            };
          } catch (error: any) {
            console.error(`Error executing tool ${tool.function.name}:`, error);
            return {
              content: [{ 
                type: "text", 
                text: `Error: ${error.message}` 
              }],
              isError: true
            };
          }
        }
      );
      
      console.log(`Registered tool: ${tool.function.name}`);
    } catch (error) {
      console.error(`Failed to register tool ${tool.function.name}:`, error);
    }
  });

  // Add a simple chat completion tool if OpenAI is available
  if (openaiClient) {
    server.tool(
      "chat",
      { 
        message: z.string(),
        systemPrompt: z.string().optional()
      },
      async ({ message, systemPrompt }: { message: string, systemPrompt?: string }) => {
        try {
          // Build messages array
          const messages = [];
          
          // Add system prompt if provided
          if (systemPrompt) {
            messages.push({
              role: "system" as const,
              content: systemPrompt
            });
          } else {
            // Default system prompt
            messages.push({
              role: "system" as const,
              content: `
              You are a helpful and knowledgeable worker for designsystemet.no. Your role is to help users by providing short and concise answers with links and examples where needed. Always refer to official documentation and the codebase when addressing questions about components, and never make assumptions about the user's intent—always consult the available tools for precise information.
              `
            });
          }
          
          // Add user message
          messages.push({
            role: "user" as const,
            content: message
          });
          
          // Call OpenAI API
          const response = await openaiClient.chat.completions.create({
            model: 'gpt-4o',
            messages,
            temperature: 0.7,
            max_tokens: 2000
          });
          
          // Extract and return the response text
          const responseText = response.choices[0]?.message?.content || "No response generated";
          
          return {
            content: [{ type: "text", text: responseText }]
          };
        } catch (error: any) {
          console.error(`Error in chat completion:`, error);
          return {
            content: [{ 
              type: "text", 
              text: `Error: ${error.message}` 
            }],
            isError: true
          };
        }
      }
    );
    
    console.log("Registered chat tool");
  }

  // Add a help resource
  server.resource(
    "help",
    "designsystem://help",
    async (uri: URL) => ({
      contents: [{
        uri: uri.href,
        text: `Designsystemet MCP Server

Available Tools:
${tools.map(t => `- ${t.function.name}: ${t.function.description}`).join('\n')}
${openaiClient ? '- chat: Send a chat message using OpenAI\n' : ''}
To get started, try one of the available tools.
`
      }]
    })
  );

  // Start the server
  console.log("Starting MCP server...");
  const transport = new StdioServerTransport();

  try {
    await server.connect(transport);
    console.log("MCP server running and ready for requests");
    return server;
  } catch (error) {
    console.error("Failed to start MCP server:", error);
    throw error;
  }
}