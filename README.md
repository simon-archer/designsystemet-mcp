# Designsystemet MCP Server

[![npm version](https://img.shields.io/npm/v/@simon-archer/designsystemet-mcp.svg)](https://www.npmjs.com/package/@simon-archer/designsystemet-mcp)

An [MCP (Model Context Protocol)](https://github.com/modelcontextprotocol/modelcontextprotocol) server for the Designsystemet.no tools.

## Installation

```bash
npm install -g @simon-archer/designsystemet-mcp
```

## Usage

### Command Line

Run the MCP server from the command line:

```bash
# Using environment variable for API key
OPENAI_API_KEY=your_api_key designsystemet-mcp

# Or using command-line parameter
designsystemet-mcp --api-key your_api_key
```

### With Codeium Windsurf

Add this to your Windsurf config:

```json
{
  "mcpServers": {
    "designsystem": {
      "command": "npx",
      "args": ["-y", "@simon-archer/designsystemet-mcp"],
      "env": {
        "OPENAI_API_KEY": "your_openai_key_here"
      }
    }
  }
}
```

Then use it with Windsurf:

```bash
windsurf chat -m designsystem "Tell me about the Button component"
```

### With Claude Code

```bash
claude code -m mcp://?program=npx&args=-y,@simon-archer/designsystemet-mcp -s "Tell me about the Button component"
```

## Available Tools

The MCP server includes the following tools:

- `echo`: Echo back a message
- `chat`: Send a chat message to the OpenAI API (requires API key)

## API

You can also use this package programmatically in your Node.js applications:

```javascript
import { startMcpServer } from '@simon-archer/designsystemet-mcp';

// Start an MCP server with default tools
await startMcpServer({
  openaiApiKey: process.env.OPENAI_API_KEY
});

// Or with custom tools
await startMcpServer({
  tools: [
    {
      function: {
        name: "hello",
        description: "Say hello",
        parameters: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name to greet"
            }
          },
          required: ["name"]
        },
        function: async ({ name }) => `Hello, ${name}!`
      }
    }
  ],
  openaiApiKey: process.env.OPENAI_API_KEY
});
```

## License

MIT