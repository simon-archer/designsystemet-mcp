"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startMcpServer = void 0;
// Main API for designbot-mcp
const server_1 = require("./server");
Object.defineProperty(exports, "startMcpServer", { enumerable: true, get: function () { return server_1.startMcpServer; } });
// Default export for convenience
exports.default = server_1.startMcpServer;
