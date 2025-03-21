// Import our module
const { startMcpServer } = require('./dist/server');

console.log('Module loaded successfully');

// Start the server for a quick test
(async () => {
  try {
    console.log('Starting server...');
    const server = await startMcpServer({
      name: "TestServer",
      version: "1.0.0"
    });
    console.log('Server started successfully');
  } catch (error) {
    console.error('Failed to start server:', error);
  }
})();