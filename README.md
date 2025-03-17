# DesignBot MCP

[![npm version](https://img.shields.io/npm/v/@simon-archer/designbot-mcp.svg)](https://www.npmjs.com/package/@simon-archer/designbot-mcp)

A simple [MCP (Model Context Protocol)](https://github.com/modelcontextprotocol/modelcontextprotocol) server providing access to a design system assistant.

## Installation

```bash
npm install -g @simon-archer/designbot-mcp
```

## Usage

### Command Line

Run the MCP server from the command line:

```bash
# Using environment variable for API key
OPENAI_API_KEY=your_api_key designbot-mcp

# Or using command-line parameter
designbot-mcp --api-key your_api_key
```

### With Codeium Windsurf

Add this to your Windsurf config:

```json
{
  "mcpServers": {
    "designsystem": {
      "command": "npx",
      "args": ["-y", "@simon-archer/designbot-mcp"],
      "env": {
        "OPENAI_API_KEY": "your_openai_key_here"
      },
      "description": "AI assistant for Designsystemet.no design system. Use designbot-chat(message: \"your question\") to ask about components, design patterns, accessibility, implementation details, or best practices."
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
claude code -m mcp://?program=npx&args=-y,@simon-archer/designbot-mcp -s "Tell me about the Button component"
```

## Available Tool

The MCP server provides a single tool:

- `designbot-chat`: Ask questions about the design system (requires OpenAI API key)

### Example Usage

```
designbot-chat(message: "What are the main components in the design system?")
designbot-chat(message: "How do I implement the Button component?", systemPrompt: "Be very concise")
designbot-chat(message: "Tell me about accessibility in the design system")
```

## API

You can also use this package programmatically in your Node.js applications:

```javascript
import { startMcpServer } from '@simon-archer/designbot-mcp';

// Start an MCP server with the designbot-chat tool
await startMcpServer({
  openaiApiKey: process.env.OPENAI_API_KEY
});
```

## License

MIT