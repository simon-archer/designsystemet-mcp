# DesignBot MCP

[![npm version](https://img.shields.io/npm/v/@simon-archer/designbot-mcp.svg)](https://www.npmjs.com/package/@simon-archer/designbot-mcp)

A lightweight [MCP (Model Context Protocol)](https://docs.anthropic.com/en/docs/agents-and-tools/mcp) server that forwards messages to the designbot.deno.dev/chat endpoint. This allows you to access the Designsystemet assistant through any MCP-compatible client like Windsurf, Cursor or Claude Code.

## Usage

### With Windsurf or Cursor

Add this to your `mcp_config.json` file:

```json
{
  "mcpServers": {
    "Designbot": {
      "command": "npx",
      "args": [
        "-y",
        "@simon-archer/designbot-mcp"
      ]
    }
  }
}
```

Then use it with Windsurf or Cursor (sometimes invocations requires custom prompting):

```bash
Ask the designbot how to use the Button from the design system
```

## Available Tool

The MCP server provides a single tool:

- `designbot-chat`: Forwards messages to the designbot.deno.dev/chat endpoint

This tool is a wrapper to get access to the [Designbot](https://designbot.deno.dev/), inside your IDE.

### Example Usage

```
"What are the main components in the design system? Ask Designbot"
"How do I implement the Button component? Ask Designbot"
"Tell me about accessibility in the design system, Ask Designbot"
```

## API

You can also use this package programmatically in your Node.js applications:

```javascript
import { startMcpServer } from '@simon-archer/designbot-mcp';

// Start an MCP server
await startMcpServer({
  name: "DesignBot", // Optional
  version: "1.0.0"   // Optional
});
```

## How It Works

This MCP server:

1. Receives messages through the MCP protocol
2. Forwards them to the designbot.deno.dev/chat endpoint
3. Processes the server-sent events (SSE) response
4. Returns the formatted response back to the MCP client

## License

MIT