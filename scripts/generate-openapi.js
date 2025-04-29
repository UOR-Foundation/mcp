/**
 * OpenAPI Specification Generator for UOR-MCP
 * 
 * This script generates an OpenAPI specification for the UOR-MCP API.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const openapi = {
  openapi: '3.0.0',
  info: {
    title: 'UOR Model Context Protocol API',
    description: 'API for the Universal Object Reference (UOR) Model Context Protocol',
    version: '0.1.0',
    contact: {
      name: 'UOR Foundation',
      url: 'https://uor.foundation',
      email: 'hi@uor.foundation'
    },
    license: {
      name: 'Apache 2.0',
      url: 'https://www.apache.org/licenses/LICENSE-2.0.html'
    }
  },
  servers: [
    {
      url: 'https://UOR-Foundation.github.io/mcp',
      description: 'GitHub Pages deployment'
    }
  ],
  tags: [
    {
      name: 'UOR',
      description: 'Universal Object Reference operations'
    },
    {
      name: 'MCP',
      description: 'Model Context Protocol operations'
    }
  ],
  paths: {
    '/mcp': {
      post: {
        summary: 'MCP JSON-RPC endpoint',
        description: 'Main endpoint for MCP JSON-RPC requests',
        tags: ['MCP'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/JSONRPCRequest'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/JSONRPCResponse'
                }
              }
            }
          },
          '400': {
            description: 'Invalid request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/JSONRPCError'
                }
              }
            }
          }
        }
      }
    },
    '/auth/callback': {
      get: {
        summary: 'OAuth callback',
        description: 'Callback endpoint for GitHub OAuth authentication',
        tags: ['MCP'],
        parameters: [
          {
            name: 'code',
            in: 'query',
            description: 'OAuth authorization code',
            required: true,
            schema: {
              type: 'string'
            }
          },
          {
            name: 'state',
            in: 'query',
            description: 'OAuth state parameter',
            required: true,
            schema: {
              type: 'string'
            }
          }
        ],
        responses: {
          '302': {
            description: 'Redirect to application with token',
            headers: {
              Location: {
                schema: {
                  type: 'string'
                },
                description: 'Redirect URL with token'
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      JSONRPCRequest: {
        type: 'object',
        required: ['jsonrpc', 'method', 'id'],
        properties: {
          jsonrpc: {
            type: 'string',
            enum: ['2.0'],
            description: 'JSON-RPC version'
          },
          method: {
            type: 'string',
            description: 'Method name'
          },
          params: {
            type: 'object',
            description: 'Method parameters'
          },
          id: {
            type: ['string', 'number'],
            description: 'Request identifier'
          }
        }
      },
      JSONRPCResponse: {
        type: 'object',
        required: ['jsonrpc', 'id'],
        properties: {
          jsonrpc: {
            type: 'string',
            enum: ['2.0'],
            description: 'JSON-RPC version'
          },
          result: {
            type: 'object',
            description: 'Result object'
          },
          error: {
            $ref: '#/components/schemas/JSONRPCError'
          },
          id: {
            type: ['string', 'number', 'null'],
            description: 'Request identifier'
          }
        }
      },
      JSONRPCError: {
        type: 'object',
        required: ['code', 'message'],
        properties: {
          code: {
            type: 'integer',
            description: 'Error code'
          },
          message: {
            type: 'string',
            description: 'Error message'
          },
          data: {
            type: 'object',
            description: 'Additional error data'
          }
        }
      },
      UORReference: {
        type: 'string',
        description: 'Universal Object Reference',
        pattern: '^uor://[^/]+/[^/]+/[^/]+$'
      }
    }
  }
};

try {
  const outputDir = path.join(__dirname, '..');
  
  const yamlOutput = yaml.dump(openapi, { lineWidth: -1 });
  fs.writeFileSync(path.join(outputDir, 'openapi.yaml'), yamlOutput);
  console.log('Generated openapi.yaml');
  
  const jsonOutput = JSON.stringify(openapi);
  fs.writeFileSync(path.join(outputDir, 'openapi.min.json'), jsonOutput);
  console.log('Generated openapi.min.json');
} catch (error) {
  console.error('Error generating OpenAPI specification:', error);
  process.exit(1);
}
