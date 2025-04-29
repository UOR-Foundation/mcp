/**
 * MCP Protocol Handler
 * Client-side implementation of MCP protocol for GitHub Pages
 * Implements the Model Context Protocol 2025-03-26 specification
 */

class MCPHandler {
  constructor() {
    this.objectStore = {}; // In-memory object store (for client-side only)
    this.nextRequestId = 1;
    this.initialized = false;
  }

  /**
   * Handles an MCP request
   * @param {Object} request - The JSON-RPC 2.0 request
   * @returns {Object} The JSON-RPC 2.0 response
   */
  async handleRequest(request) {
    // Validate request format
    if (!request.jsonrpc || request.jsonrpc !== '2.0') {
      return this.createErrorResponse(
        request.id || null,
        -32600,
        'Invalid Request',
        'The JSON sent is not a valid JSON-RPC 2.0 request'
      );
    }

    try {
      // Handle batch requests
      if (Array.isArray(request)) {
        return this.handleBatchRequest(request);
      }

      // Handle different method types
      switch (request.method) {
        case 'initialize':
          return this.handleInitialize(request);
        
        case 'notifications/initialized':
          // Handle client notification
          console.log('Client initialized notification received');
          return null; // No response for notifications
          
        case 'ping':
          return this.createSuccessResponse(request.id, {});
          
        case 'tools/list':
          return this.handleToolsList(request);
        
        case 'resources/list':
          return this.handleResourcesList(request);
          
        case 'tools/call':
          return await this.handleToolCall(request);
        
        // Direct MCP server methods
        case 'uor.resolve':
        case 'uor.create':
        case 'uor.update':
        case 'uor.delete':
        case 'uordb.list':
        case 'uordb.search':
        case 'uordb.status':
        case 'uordb.initialize':
          return await this.handleMCPMethod(request);
          
        default:
          return this.createErrorResponse(
            request.id,
            -32601,
            'Method not found',
            `The method ${request.method} is not supported`
          );
      }
    } catch (error) {
      console.error('Error handling MCP request:', error);
      
      return this.createErrorResponse(
        request.id || null,
        -32603,
        'Internal error',
        error.message
      );
    }
  }

  /**
   * Handle batch requests
   * @param {Array} requests Array of JSON-RPC requests 
   * @returns {Array} Array of JSON-RPC responses
   */
  async handleBatchRequest(requests) {
    if (!Array.isArray(requests) || requests.length === 0) {
      return this.createErrorResponse(null, -32600, 'Invalid batch request');
    }

    const responses = [];
    
    // Process each request in the batch
    for (const request of requests) {
      // Skip notifications (no response expected)
      if (!request.id) {
        continue;
      }
      
      // Process the request
      const response = await this.handleRequest(request);
      if (response) {
        responses.push(response);
      }
    }
    
    return responses;
  }

  /**
   * Handles the initialize method
   * @param {Object} request - The initialize request
   * @returns {Object} The initialize response
   */
  handleInitialize(request) {
    this.initialized = true;
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        protocolVersion: '2025-03-26',
        serverInfo: {
          name: 'uor-mcp-server',
          version: '1.0.0'
        },
        capabilities: {
          resources: {
            listChanged: true,
            subscribe: true
          },
          tools: {
            listChanged: true
          },
          prompts: {
            listChanged: false
          }
        },
        instructions: 'This MCP server implements the UOR Framework with GitHub-based storage. You can access UOR objects through resources and manipulate them using tools. The server maintains trilateral coherence between objects, representations, and observer frames.'
      }
    };
  }

  /**
   * Handles the tools/list method
   * @param {Object} request - The tools/list request
   * @returns {Object} The tools/list response
   */
  handleToolsList(request) {
    // Get auth context from local storage
    const token = localStorage.getItem('github-token');
    const isAuthenticated = !!token;
    
    const tools = [
      {
        name: 'uor.resolve',
        description: 'Resolves a UOR reference to retrieve the referenced object',
        inputSchema: {
          type: 'object',
          properties: {
            reference: {
              type: 'string',
              description: 'The UOR reference to resolve (format: uor://type/id)'
            }
          },
          required: ['reference']
        },
        annotations: {
          readOnlyHint: true,
          title: 'Resolve UOR Reference'
        }
      },
      {
        name: 'uor.create',
        description: 'Creates a new UOR object and returns its reference',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              description: 'The type of UOR object to create'
            },
            data: {
              type: 'object',
              description: 'The data to store in the UOR object'
            }
          },
          required: ['type', 'data']
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          title: 'Create UOR Object'
        }
      },
      {
        name: 'uor.update',
        description: 'Updates an existing UOR object',
        inputSchema: {
          type: 'object',
          properties: {
            reference: {
              type: 'string',
              description: 'The UOR reference to update (format: uor://type/id)'
            },
            data: {
              type: 'object',
              description: 'The data to update in the UOR object'
            }
          },
          required: ['reference', 'data']
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          title: 'Update UOR Object'
        }
      },
      {
        name: 'uor.delete',
        description: 'Deletes a UOR object',
        inputSchema: {
          type: 'object',
          properties: {
            reference: {
              type: 'string',
              description: 'The UOR reference to delete (format: uor://type/id)'
            }
          },
          required: ['reference']
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: true,
          idempotentHint: true,
          title: 'Delete UOR Object'
        }
      },
      {
        name: 'uordb.search',
        description: 'Searches UOR objects by a query string',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query'
            }
          },
          required: ['query']
        },
        annotations: {
          readOnlyHint: true,
          title: 'Search UOR Objects'
        }
      }
    ];
    
    // Add authentication-required tools if authenticated
    if (isAuthenticated) {
      tools.push(
        {
          name: 'uordb.list',
          description: 'Lists UOR objects of a specific type',
          inputSchema: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                description: 'The type of UOR objects to list'
              }
            },
            required: ['type']
          },
          annotations: {
            readOnlyHint: true,
            title: 'List UOR Objects'
          }
        },
        {
          name: 'uordb.status',
          description: 'Gets the status of the UOR repository',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          },
          annotations: {
            readOnlyHint: true,
            title: 'Get Repository Status'
          }
        },
        {
          name: 'uordb.initialize',
          description: 'Initializes the UOR repository',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          },
          annotations: {
            readOnlyHint: false,
            title: 'Initialize Repository'
          }
        }
      );
    }
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        tools,
        nextCursor: null // No pagination for now
      }
    };
  }

  /**
   * Handles the resources/list method
   * @param {Object} request - The resources/list request
   * @returns {Object} The resources/list response
   */
  handleResourcesList(request) {
    // Get user context from authService
    let user = { login: 'anonymous' };
    
    if (window.authService && window.authService.isAuthenticated()) {
      const authUser = window.authService.getUser();
      if (authUser && authUser.login) {
        user = authUser;
      }
    }
    
    const resources = [
      {
        uri: `uor://${user.login}/concepts`,
        name: 'UOR Concepts',
        description: 'Collection of UOR concepts',
        mimeType: 'application/json',
        annotations: {
          priority: 0.8,
          audience: ['user', 'assistant']
        }
      },
      {
        uri: `uor://${user.login}/resources`,
        name: 'UOR Resources',
        description: 'Collection of UOR information resources',
        mimeType: 'application/json',
        annotations: {
          priority: 0.8,
          audience: ['user', 'assistant']
        }
      },
      {
        uri: `uor://${user.login}/topics`,
        name: 'UOR Topics',
        description: 'Collection of UOR topics',
        mimeType: 'application/json',
        annotations: {
          priority: 0.7,
          audience: ['user', 'assistant']
        }
      },
      {
        uri: `uor://${user.login}/predicates`,
        name: 'UOR Predicates',
        description: 'Collection of UOR fact predicates',
        mimeType: 'application/json',
        annotations: {
          priority: 0.6,
          audience: ['user', 'assistant']
        }
      }
    ];
    
    // Add repository resource for authenticated users
    if (window.authService && window.authService.isAuthenticated() && user.login !== 'anonymous') {
      resources.push({
        uri: `uor://${user.login}/repository`,
        name: 'UOR Repository',
        description: 'GitHub repository for UOR objects',
        mimeType: 'application/json',
        annotations: {
          priority: 0.9,
          audience: ['user', 'assistant']
        }
      });
    }
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        resources,
        nextCursor: null // No pagination for now
      }
    };
  }

  /**
   * Handles MCP server methods directly
   * @param {Object} request - The MCP method request
   * @returns {Object} The method response
   */
  async handleMCPMethod(request) {
    try {
      // Validate authentication for certain methods
      const authRequiredMethods = [
        'uor.create', 'uor.update', 'uor.delete',
        'uordb.list', 'uordb.status', 'uordb.initialize'
      ];
      
      if (authRequiredMethods.includes(request.method)) {
        if (!window.authService || !window.authService.isAuthenticated()) {
          return this.createErrorResponse(
            request.id,
            -32000, // Authentication Required error code
            'Authentication required',
            'This operation requires GitHub authentication'
          );
        }
      }
      
      // Call the corresponding MCP server method
      const result = await window.mcpClient.sendRequest(request.method, request.params);
      
      return {
        jsonrpc: '2.0',
        id: request.id,
        result
      };
    } catch (error) {
      console.error(`Error handling MCP method ${request.method}:`, error);
      
      return this.createErrorResponse(
        request.id,
        -32603,
        'Method execution error',
        error.message
      );
    }
  }

  /**
   * Handles tool calls using the tools/call method
   * @param {Object} request - The tools/call request
   * @returns {Object} The tools/call response
   */
  async handleToolCall(request) {
    const { name, arguments: args } = request.params;
    
    if (!name) {
      return this.createErrorResponse(
        request.id,
        -32602,
        'Invalid params',
        'Tool name is required'
      );
    }
    
    try {
      // Execute the tool by forwarding to the MCP client
      const result = await window.mcpClient.sendRequest(name, args);
      
      // Format the result according to MCP protocol
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
            }
          ],
          isError: false
        }
      };
    } catch (error) {
      console.error(`Error executing tool ${name}:`, error);
      
      // Return error in the tool result format (not as a JSON-RPC error)
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          content: [
            {
              type: 'text',
              text: `Error executing tool ${name}: ${error.message}`
            }
          ],
          isError: true
        }
      };
    }
  }

  /**
   * Creates a success response
   * @param {string|number} id - The request ID
   * @param {any} result - The result data
   * @returns {Object} The success response
   */
  createSuccessResponse(id, result) {
    return {
      jsonrpc: '2.0',
      id,
      result: result || {}
    };
  }

  /**
   * Creates an error response
   * @param {string|number} id - The request ID
   * @param {number} code - The error code
   * @param {string} message - The error message
   * @param {string} data - Additional error data
   * @returns {Object} The error response
   */
  createErrorResponse(id, code, message, data) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message,
        data
      }
    };
  }
}

// Initialize MCP handler as global object
window.mcpHandler = new MCPHandler();