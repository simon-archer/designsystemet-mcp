const { startMcpServer } = require('./dist/index.js');

// Log all registered tools
(async () => {
  try {
    const server = await startMcpServer({
      openaiApiKey: 'sk-dummy-key-for-testing'
    });
    
    // Print registered tools
    console.log('Registered tools:');
    console.log(Object.keys(server._toolRegistry));
  } catch (error) {
    console.error('Error:', error);
  }
})();