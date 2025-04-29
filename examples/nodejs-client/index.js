/**
 * UOR-MCP Node.js Client Example
 * 
 * This example demonstrates how to use the UOR-MCP API with Node.js.
 * It shows how to authenticate with GitHub, initialize the MCP connection,
 * and perform basic UOR operations.
 */

const fetch = require('node-fetch');
const open = require('open');
const express = require('express');
const { URLSearchParams } = require('url');

const config = {
  githubClientId: process.env.GITHUB_CLIENT_ID,
  tokenExchangeProxy: process.env.TOKEN_EXCHANGE_PROXY,
  mcpEndpoint: 'https://68113dd199a34737508b5211--uor-mcp.netlify.app/mcp',
  redirectUri: 'http://localhost:3000/callback',
  port: 3000
};

const app = express();
let accessToken = null;

async function startAuthFlow() {
  console.log('Starting GitHub OAuth flow...');
  
  const state = Math.random().toString(36).substring(2);
  
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${config.githubClientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&state=${state}&scope=repo`;
  await open(authUrl);
  
  return new Promise((resolve) => {
    app.get('/callback', async (req, res) => {
      const { code, state: returnedState } = req.query;
      
      if (returnedState !== state) {
        res.status(400).send('Invalid state parameter');
        return;
      }
      
      try {
        const tokenResponse = await fetch(`${config.tokenExchangeProxy}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            code,
            client_id: config.githubClientId,
            redirect_uri: config.redirectUri,
          }),
        });
        
        const tokenData = await tokenResponse.json();
        accessToken = tokenData.access_token;
        
        res.send('Authentication successful! You can close this window.');
        resolve(accessToken);
      } catch (error) {
        console.error('Error exchanging code for token:', error);
        res.status(500).send('Authentication failed');
      }
    });
  });
}

async function initializeMCP() {
  console.log('Initializing MCP connection...');
  
  const request = {
    jsonrpc: '2.0',
    method: 'initialize',
    params: {},
    id: 1
  };
  
  const response = await fetch(config.mcpEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(request)
  });
  
  const data = await response.json();
  console.log('MCP initialized with capabilities:', data.result.capabilities);
  return data.result.capabilities;
}

async function listTools() {
  console.log('Listing available tools...');
  
  const request = {
    jsonrpc: '2.0',
    method: 'tools/list',
    params: {},
    id: 2
  };
  
  const response = await fetch(config.mcpEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(request)
  });
  
  const data = await response.json();
  console.log('Available tools:', data.result.tools);
  return data.result.tools;
}

async function createUORObject(type, data) {
  console.log(`Creating UOR object of type '${type}'...`);
  
  const request = {
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      tool: 'createUOR',
      parameters: {
        type,
        data
      }
    },
    id: 3
  };
  
  const response = await fetch(config.mcpEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(request)
  });
  
  const responseData = await response.json();
  console.log('Created UOR object:', responseData.result);
  return responseData.result;
}

async function main() {
  const server = app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
  });
  
  try {
    await startAuthFlow();
    
    const capabilities = await initializeMCP();
    
    const tools = await listTools();
    
    const uorObject = await createUORObject('concept', {
      name: 'Example Concept',
      description: 'This is an example concept created with the Node.js client'
    });
    
    console.log('Example completed successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    server.close();
  }
}

if (!config.githubClientId || !config.tokenExchangeProxy) {
  console.error('Error: GITHUB_CLIENT_ID and TOKEN_EXCHANGE_PROXY environment variables must be set');
  console.log('Example usage:');
  console.log('GITHUB_CLIENT_ID=your_client_id TOKEN_EXCHANGE_PROXY=your_proxy_url node index.js');
  process.exit(1);
}

main();
