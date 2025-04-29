/**
 * UOR-MCP OpenAI Integration Example
 * 
 * This example demonstrates how to integrate the UOR-MCP API with OpenAI's API.
 * It shows how to use UOR objects as context for OpenAI completions and function calling.
 */

const { OpenAI } = require('openai');
const fetch = require('node-fetch');

const config = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  githubToken: process.env.GITHUB_TOKEN,
  mcpEndpoint: 'https://68113dd199a34737508b5211--uor-mcp.netlify.app/mcp'
};

const openai = new OpenAI({
  apiKey: config.openaiApiKey
});

const mcpFunctions = [
  {
    name: 'createUORObject',
    description: 'Create a new UOR object',
    parameters: {
      type: 'object',
      required: ['type', 'data'],
      properties: {
        type: {
          type: 'string',
          description: 'Type of UOR object (concept, topic, predicate, resource)',
          enum: ['concept', 'topic', 'predicate', 'resource']
        },
        data: {
          type: 'object',
          description: 'Data for the UOR object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the object'
            },
            description: {
              type: 'string',
              description: 'Description of the object'
            }
          }
        }
      }
    }
  },
  {
    name: 'getUORObject',
    description: 'Get a UOR object by reference',
    parameters: {
      type: 'object',
      required: ['reference'],
      properties: {
        reference: {
          type: 'string',
          description: 'UOR reference in the format uor://<namespace>/<type>/<id>'
        }
      }
    }
  },
  {
    name: 'searchUORObjects',
    description: 'Search for UOR objects',
    parameters: {
      type: 'object',
      required: ['query'],
      properties: {
        query: {
          type: 'string',
          description: 'Search query'
        },
        type: {
          type: 'string',
          description: 'Type of UOR objects to search for',
          enum: ['concept', 'topic', 'predicate', 'resource']
        },
        limit: {
          type: 'integer',
          description: 'Maximum number of results to return'
        }
      }
    }
  }
];

async function sendMCPRequest(method, params) {
  const request = {
    jsonrpc: '2.0',
    method,
    params,
    id: Date.now()
  };
  
  const response = await fetch(config.mcpEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.githubToken}`
    },
    body: JSON.stringify(request)
  });
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(`MCP Error: ${data.error.message}`);
  }
  
  return data.result;
}

async function initializeMCP() {
  console.log('Initializing MCP connection...');
  
  const result = await sendMCPRequest('initialize', {});
  console.log('MCP initialized with capabilities:', result.capabilities);
  return result.capabilities;
}

async function createUORObject(type, data) {
  console.log(`Creating UOR object of type '${type}'...`);
  
  const result = await sendMCPRequest('tools/call', {
    tool: 'createUOR',
    parameters: {
      type,
      data
    }
  });
  
  console.log('Created UOR object:', result);
  return result;
}

async function getUORObject(reference) {
  console.log(`Getting UOR object '${reference}'...`);
  
  const result = await sendMCPRequest('tools/call', {
    tool: 'resolveUOR',
    parameters: {
      reference
    }
  });
  
  console.log('Retrieved UOR object:', result);
  return result;
}

async function searchUORObjects(query, type, limit) {
  console.log(`Searching for UOR objects with query '${query}'...`);
  
  const result = await sendMCPRequest('tools/call', {
    tool: 'searchUOR',
    parameters: {
      query,
      type,
      limit
    }
  });
  
  console.log('Search results:', result);
  return result;
}

const functionImplementations = {
  createUORObject: async ({ type, data }) => {
    return await createUORObject(type, data);
  },
  getUORObject: async ({ reference }) => {
    return await getUORObject(reference);
  },
  searchUORObjects: async ({ query, type, limit }) => {
    return await searchUORObjects(query, type, limit);
  }
};

async function processOpenAIFunctionCalls(functionCalls) {
  const results = {};
  
  for (const [functionName, functionCall] of Object.entries(functionCalls)) {
    if (functionName === 'none') continue;
    
    try {
      const args = JSON.parse(functionCall.arguments);
      results[functionName] = await functionImplementations[functionName](args);
    } catch (error) {
      results[functionName] = { error: error.message };
    }
  }
  
  return results;
}

async function main() {
  if (!config.openaiApiKey || !config.githubToken) {
    console.error('Error: OPENAI_API_KEY and GITHUB_TOKEN environment variables must be set');
    console.log('Example usage:');
    console.log('OPENAI_API_KEY=your_api_key GITHUB_TOKEN=your_github_token node openai-integration.js');
    process.exit(1);
  }
  
  try {
    await initializeMCP();
    
    console.log('\nExample 1: Create a UOR object using OpenAI function calling');
    
    const createResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an AI assistant that helps users manage UOR objects.' },
        { role: 'user', content: 'Create a concept about artificial intelligence.' }
      ],
      functions: mcpFunctions,
      function_call: 'auto'
    });
    
    const createMessage = createResponse.choices[0].message;
    console.log('OpenAI response:', createMessage);
    
    if (createMessage.function_call) {
      const results = await processOpenAIFunctionCalls({ [createMessage.function_call.name]: createMessage.function_call });
      console.log('Function call results:', results);
    }
    
    console.log('\nExample 2: Use UOR objects as context for OpenAI completions');
    
    const searchResults = await searchUORObjects('artificial intelligence', 'concept', 3);
    
    const context = searchResults.map(obj => `
UOR Object: ${obj.reference}
Type: ${obj.type}
Name: ${obj.data.name}
Description: ${obj.data.description}
`).join('\n');
    
    const completionResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an AI assistant that helps users understand UOR objects.' },
        { role: 'user', content: `Here are some UOR objects related to artificial intelligence:\n\n${context}\n\nCan you summarize these concepts and explain how they relate to each other?` }
      ]
    });
    
    console.log('OpenAI completion:', completionResponse.choices[0].message.content);
    
    console.log('\nExamples completed successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
