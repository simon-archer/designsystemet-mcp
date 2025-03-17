import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Server options interface
export interface McpServerOptions {
  name?: string;
  version?: string;
  openaiApiKey?: string;
  registryPath?: string;
}

// Try to dynamically import the registry
let registryTools: any[] = [];

// Helper function to safely load registry tools
async function loadRegistryTools(registryPath?: string) {
  try {
    // If registry path is not provided, try standard locations
    if (!registryPath) {
      // Check common locations
      const possiblePaths = [
        // Relative to the current project
        path.resolve(process.cwd(), '../services/tools/registry.ts'),
        path.resolve(process.cwd(), '../services/tools/registry.js'),
        path.resolve(process.cwd(), 'services/tools/registry.ts'),
        path.resolve(process.cwd(), 'services/tools/registry.js'),
        
        // Absolute paths for common locations
        '/Users/simon/Documents/GitHub/starterkit/services/tools/registry.ts'
      ];
      
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          registryPath = p;
          break;
        }
      }
    }
    
    if (registryPath && fs.existsSync(registryPath)) {
      console.log(`Found registry at ${registryPath}`);
      
      // For TypeScript files, we can't directly import them in Node.js
      // Instead, we'll read the file content to extract tool information
      const content = fs.readFileSync(registryPath, 'utf8');
      
      // Extract tool names and descriptions using regex
      const toolRegex = /export const (\w+)Tool.*?description: "(.*?)"/gs;
      const toolsInfo = [];
      let match;
      
      while ((match = toolRegex.exec(content)) !== null) {
        const [_, name, description] = match;
        toolsInfo.push({ name: `${name}Tool`, description });
      }
      
      if (toolsInfo.length > 0) {
        console.log(`Found ${toolsInfo.length} tools in registry`);
        return toolsInfo;
      }
      
      // If regex fails, try to find the tools array directly
      const toolsArrayMatch = /export const tools = \[([\s\S]*?)\];/g.exec(content);
      if (toolsArrayMatch && toolsArrayMatch[1]) {
        const toolNames = toolsArrayMatch[1].match(/(\w+)Tool/g);
        if (toolNames) {
          console.log(`Found tools array with ${toolNames.length} tools`);
          return toolNames.map(name => ({ name, description: "A design system tool" }));
        }
      }
    }
    
    console.log("Could not load registry tools, using default information");
    return [
      { name: "componentDocTool", description: "Get documentation for a specific design system component" },
      { name: "componentCodeTool", description: "Get code examples for a specific design system component" },
      { name: "getStartedTool", description: "Get getting started information for the design system" },
      { name: "changeLogTool", description: "Get change log information for design system components" },
      { name: "cssOnlyTool", description: "Get CSS-only implementation details for components" },
      { name: "migrationGuideTool", description: "Get migration guides for components" },
      { name: "writeFileTool", description: "Write content to a file" },
      { name: "readFileTool", description: "Read content from a file" },
      { name: "webSearchTool", description: "Search the web for design system related information" },
      { name: "blogTool", description: "Get blog posts from the design system" },
      { name: "basicsTool", description: "Get basic information about the design system" },
      { name: "goodPracticeTool", description: "Get good practice guidelines from the design system" },
      { name: "uxPatternsTool", description: "Get UX pattern information from the design system" },
      { name: "designChangesTool", description: "Get information about design changes in the system" },
      { name: "timeTool", description: "Get current time information" },
      { name: "weatherTool", description: "Get weather information for a specific location" }
    ];
  } catch (err) {
    console.error("Error loading registry tools:", err);
    return [];
  }
}

/**
 * Start an MCP server with a designbot-chat tool
 */
export async function startMcpServer(options: McpServerOptions = {}) {
  const {
    name = "DesignBot",
    version = "0.1.0",
    openaiApiKey,
    registryPath
  } = options;

  // Load registry tools information
  const tools = await loadRegistryTools(registryPath);
  console.log(`Loaded ${tools.length} tools from registry`);

  // Create server
  const server = new McpServer({
    name,
    version
  });

  // Initialize OpenAI - required for the service to function
  let openaiClient: OpenAI | undefined;
  if (openaiApiKey) {
    openaiClient = new OpenAI({
      apiKey: openaiApiKey,
    });
  } else {
    console.warn("No OpenAI API key provided. Chat functionality will be disabled.");
  }

  // Generate tools info for the system prompt
  const toolsInfo = tools.map(tool => `- ${tool.name}: ${tool.description}`).join('\n');

  // Add the designbot-chat tool if OpenAI client is available
  if (openaiClient) {
    server.tool(
      "designbot-chat",
      { 
        message: z.string(),
        systemPrompt: z.string().optional()
      },
      async ({ message, systemPrompt }: { message: string, systemPrompt?: string }) => {
        try {
          // Build messages array
          const messages = [];
          
          // Add system prompt if provided, otherwise use default with tools info
          if (systemPrompt) {
            messages.push({
              role: "system" as const,
              content: systemPrompt
            });
          } else {
            // Default system prompt with tools info
            messages.push({
              role: "system" as const,
              content: `
              You are a helpful assistant for designers and developers using the designsystemet.no design system.
              
              Your role is to help users by providing clear, accurate answers about design system components, guidelines, and best practices.
              Be concise but thorough, and include links to relevant documentation when appropriate.
              When discussing components, explain their purpose, usage guidelines, and provide code examples if relevant.
              
              Always strive to give actionable advice and practical solutions. If you don't know something specific about the design system, 
              be honest about it and suggest where the user might find that information.
              
              The design system is a comprehensive resource for creating consistent, accessible, and user-friendly digital experiences.
              
              The design system includes the following tools in its registry:
              ${toolsInfo}
              
              When users ask about these tools or functionality, you can tell them about these capabilities of the design system.
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
            model: 'gpt-4o', // Use latest GPT-4o model
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
    
    console.log("Registered designbot-chat tool");
  }

  // Add a help resource
  server.resource(
    "help",
    "designsystem://help",
    async (uri: URL) => ({
      contents: [{
        uri: uri.href,
        text: `DesignBot MCP Server

${openaiClient ? 'Tool: designbot-chat\n\nUse the designbot-chat tool to ask questions about the design system.\n\nExample:\ndesignbot-chat(message: "What is the Button component used for?")\n\nThe chat assistant has knowledge of these design system tools:\n' + toolsInfo : 'No tools available. Please provide an OpenAI API key to enable the designbot-chat tool.'}
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