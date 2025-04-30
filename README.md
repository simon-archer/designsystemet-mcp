# DesignBot MCP

[![npm version](https://img.shields.io/npm/v/@simon-archer/designbot-mcp.svg)](https://www.npmjs.com/package/@simon-archer/designbot-mcp)

A lightweight [MCP (Model Context Protocol)](https://docs.anthropic.com/en/docs/agents-and-tools/mcp) server that forwards messages to the designbot.deno.dev/chat endpoint. This allows you to access the Designsystemet assistant through any MCP-compatible client like Windsurf, Cursor or Claude Code.

To pin to a specific MCP version, install with a version suffix (e.g., `@simon-archer/designbot-mcp@latest`; ).

## Usage

### With Windsurf or Cursor

Add this to your `mcp_config.json` file:

```json
{
  "mcpServers": {
    "Designbot": {
      "command": "npx",
      "args": [
        "@simon-archer/designbot-mcp@latest"
      ]
    }
  }
}
```

Then use it with Windsurf or Cursor (sometimes invocations requires custom prompting):

```bash
Ask the designbot how to use the Button from the design system
```

### With VSCode

To use the DesignBot MCP server with VSCode, you'll typically need an extension that supports the Model Context Protocol (MCP). Configure the MCP server in your VSCode settings (`.vscode/settings.json` or user settings).

Here's an example configuration, though the specific setting key (e.g., `mcp.servers`) might vary depending on the extension you use:

```json
{
    "chat.mcp.discovery.enabled": true,
    "mcp": {
        
        "inputs": [],
        "servers": {
            "Designbot": {
            "command": "npx",
            "args": [
                "@simon-archer/designbot-mcp@latest"
            ]
            }
        }
    }
}   
```

Once configured, you should be able to interact with the Designbot through your MCP-compatible VSCode extension, similar to the Windsurf/Cursor example:

```bash
Ask the designbot how to use the Accordion component
```

## Available Tool

The MCP server provides a single tool:

- `Ask-designbot`: Forwards messages to the configured `/chat` endpoint at `https://designbot.deno.dev/`. Supports sub-queries:
  - **getComponentDoc**: Component docs and usage examples
  - **getComponentCode**: React/HTML code snippets
  - **getCssCode**: CSS-only implementations
  - **getStarted**: Onboarding and setup guides
  - **getChangelog**: Version history
  - **getBasics**: Core design concepts
  - **getGoodPractice**: Implementation best practices
  - **getUxPatterns**: Common UX patterns
  - **getDesignModification**: Design tokens (colors, typography, spacing)

You can pin to a specific MCP version by specifying `@simon-archer/designbot-mcp@<version>` in your `mcp_config.json` (defaults to `latest`).


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