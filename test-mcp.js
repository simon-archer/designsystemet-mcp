const fs = require('fs');
const path = require('path');

// Create a debug file
const debugFile = path.join(process.cwd(), 'designbot-direct-test.txt');
fs.writeFileSync(debugFile, `=== Direct Test Started at ${new Date().toISOString()} ===\n\n`);

// Function to log to the debug file
function logDebug(message) {
  console.log(message);
  fs.appendFileSync(debugFile, message + '\n');
}

// Function to directly test designbot.deno.dev/chat
async function testDesignbotDirect() {
  logDebug('Testing direct HTTP request to designbot.deno.dev/chat');
  
  try {
    // Test message
    const testMessage = "What is the Button component?";
    logDebug(`REQUEST: ${testMessage}`);
    
    // Create fetch request
    const response = await fetch("https://designbot.deno.dev/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: testMessage }),
    });
    
    logDebug(`RESPONSE STATUS: ${response.status} ${response.statusText}`);
    logDebug(`RESPONSE HEADERS: ${JSON.stringify(Object.fromEntries([...response.headers]))}`);
    
    // Get the response as text
    const text = await response.text();
    logDebug(`\nRAW RESPONSE: ${text}`);
    
    // Try to extract the response text
    let finalText = "";
    
    // If it looks like SSE data, try to parse it
    if (text.includes("data: {")) {
      logDebug("\nDETECTED: SSE format");
      const lines = text.split("\n");
      
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.substring(6));
            if (data.response) {
              finalText += data.response;
              logDebug(`PARSED SSE: ${data.response.substring(0, 100)}...`);
            }
          } catch (e) {
            logDebug(`ERROR PARSING SSE: ${e instanceof Error ? e.message : String(e)}`);
          }
        }
      }
    } else {
      // Try to parse as JSON
      logDebug("\nTRYING: Parse as JSON");
      try {
        const json = JSON.parse(text);
        if (json.response) {
          finalText = json.response;
          logDebug(`PARSED JSON RESPONSE: ${json.response.substring(0, 100)}...`);
        } else {
          logDebug(`JSON MISSING 'response' FIELD. Keys: ${Object.keys(json).join(', ')}`);
        }
      } catch (e) {
        // If all else fails, just return the raw text
        logDebug(`ERROR PARSING JSON: ${e instanceof Error ? e.message : String(e)}`);
        finalText = text;
        logDebug("FALLBACK: Using raw text as response");
      }
    }
    
    logDebug(`\nFINAL TEXT LENGTH: ${finalText.length} chars`);
    logDebug(`FINAL TEXT: ${finalText}`);
    
  } catch (error) {
    logDebug(`\nERROR: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof Error && error.stack) {
      logDebug(`STACK: ${error.stack}`);
    }
  }
  
  logDebug('\nTest completed. Debug file saved to: ' + debugFile);
}

// Run the test
testDesignbotDirect();