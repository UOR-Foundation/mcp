import { JSONRPCRequest, JSONRPCResponse, JSONRPCError, JSONRPCErrorCode, JSONRPCBatchRequest, JSONRPCBatchResponse, MCPServerCapabilities } from './mcp-jsonrpc';
import MCPServer from './mcp-server';

/**
 * Handler for JSON-RPC 2.0 requests implementing the MCP Protocol
 */
export class MCPJSONRPCHandler {
  private mcpServer: MCPServer;

  constructor() {
    this.mcpServer = MCPServer.getInstance();
  }

  /**
   * Process a JSON-RPC request and return a response
   * @param jsonRequest The JSON-RPC request object or string
   * @returns A JSON-RPC response
   */
  public async handleJSONRPCRequest(jsonRequest: string | object): Promise<any> {
    let request: any;
    
    try {
      // Parse the request if it's a string
      if (typeof jsonRequest === 'string') {
        request = JSON.parse(jsonRequest);
      } else {
        request = jsonRequest;
      }
      
      // Handle batch requests
      if (Array.isArray(request)) {
        return this.handleBatchRequest(request);
      }
      
      // Validate that this is a valid JSON-RPC 2.0 request
      if (!this.isValidJSONRPCRequest(request)) {
        return this.createErrorResponse(null, JSONRPCErrorCode.InvalidRequest, 'Invalid JSON-RPC request');
      }
      
      return await this.processSingleRequest(request);
      
    } catch (error) {
      // Handle parsing errors
      if (error instanceof SyntaxError) {
        return this.createErrorResponse(null, JSONRPCErrorCode.ParseError, 'Parse error');
      }
      
      // Handle any other errors
      return this.createErrorResponse(
        request?.id || null, 
        JSONRPCErrorCode.InternalError, 
        `Internal error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Process a batch of JSON-RPC requests
   * @param requests Array of JSON-RPC requests
   * @returns Array of JSON-RPC responses
   */
  private async handleBatchRequest(requests: JSONRPCBatchRequest): Promise<JSONRPCBatchResponse> {
    if (!Array.isArray(requests) || requests.length === 0) {
      return [this.createErrorResponse(null, JSONRPCErrorCode.InvalidRequest, 'Invalid batch request')];
    }

    const responses: any[] = [];
    
    // Process each request in the batch
    for (const request of requests) {
      if (!this.isValidJSONRPCRequest(request)) {
        responses.push(this.createErrorResponse(
          request.id || null, 
          JSONRPCErrorCode.InvalidRequest, 
          'Invalid JSON-RPC request'
        ));
        continue;
      }
      
      responses.push(await this.processSingleRequest(request));
    }
    
    return responses;
  }

  /**
   * Process a single JSON-RPC request
   * @param request The JSON-RPC request
   * @returns A JSON-RPC response
   */
  private async processSingleRequest(request: JSONRPCRequest): Promise<JSONRPCResponse | JSONRPCError> {
    const { id, method, params } = request;
    
    try {
      // Handle MCP Protocol methods
      let result;
      
      switch (method) {
        case 'initialize':
          result = await this.handleInitialize(params);
          break;
        case 'tools/list':
          result = await this.handleListTools(params);
          break;
        case 'resources/list':
          result = await this.handleListResources(params);
          break;
        case 'ping':
          result = {}; // Empty response for ping
          break;
        case 'tools/call':
          result = await this.handleToolCall(params);
          break;
        default:
          // Forward to the existing MCP server for backward compatibility
          try {
            result = await this.mcpServer.handleRequest(method, params);
          } catch (error) {
            return this.createErrorResponse(
              id,
              JSONRPCErrorCode.MethodNotFound,
              `Method not found: ${method}`
            );
          }
      }
      
      return this.createSuccessResponse(id, result);
      
    } catch (error) {
      // If the error is already a JSONRPCError, return it directly
      if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
        return this.createErrorResponse(id, error.code as number, error.message as string, error.data);
      }
      
      // Otherwise, create a new internal error
      return this.createErrorResponse(
        id,
        JSONRPCErrorCode.InternalError,
        `Error processing request: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Handle the initialize method to establish protocol capabilities
   * @param params The initialize parameters
   * @returns The server capabilities
   */
  private async handleInitialize(params: any): Promise<any> {
    // Validate protocol version compatibility
    const clientVersion = params.protocolVersion;
    const supportedVersions = ['2025-03-26'];
    
    if (!supportedVersions.includes(clientVersion)) {
      throw {
        code: JSONRPCErrorCode.InvalidRequest,
        message: `Unsupported protocol version: ${clientVersion}. Supported versions: ${supportedVersions.join(', ')}`
      };
    }
    
    // Define server capabilities
    const capabilities: MCPServerCapabilities = {
      protocol: {
        version: '2025-03-26',
        supportedVersions: ['2025-03-26']
      },
      uor: {
        version: '1.0',
        features: ['trilateral-coherence', 'github-storage'],
        supportedNamespaces: ['uor']
      },
      extensions: [],
      authentication: {
        methods: ['github-token'],
        scopes: ['uordb']
      }
    };
    
    // Return initialize result
    return {
      serverInfo: {
        name: 'UOR-MCP Server',
        version: '1.0.0'
      },
      protocolVersion: '2025-03-26',
      capabilities: {
        tools: {
          listChanged: true
        },
        resources: {
          listChanged: true
        }
      },
      instructions: `
This MCP server implements the Universal Object Reference (UOR) Framework.
UOR enables trilateral coherence between objects, representations, and observer frames.
Available tools allow you to create, read, update, and delete UOR objects.
Resources are available using the uor:// scheme.
      `.trim()
    };
  }

  /**
   * Handle the tools/list method to return available tools
   * @param params The params (may include pagination cursor)
   * @returns The list of available tools
   */
  private async handleListTools(params: any): Promise<any> {
    // Implement pagination in the future if needed
    const cursor = params?.cursor;
    
    // Define UOR tools
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
    
    // In a real implementation, handle cursor-based pagination
    return {
      tools,
      nextCursor: null // No more pages
    };
  }

  /**
   * Handle the resources/list method to return available resources
   * @param params The params (may include pagination cursor)
   * @returns The list of available resources
   */
  private async handleListResources(params: any): Promise<any> {
    // Check if user is authenticated for personalized resources
    const isAuthenticated = this.mcpServer.isAuthenticated();
    const username = this.mcpServer.getCurrentUsername();
    
    // Define basic resource types
    const resources = [
      {
        name: 'UOR Object',
        description: 'A Universal Object Reference (UOR) object',
        uri: 'uor://object/{id}',
        mimeType: 'application/json'
      },
      {
        name: 'UOR Type Collection',
        description: 'A collection of UOR objects of a specific type',
        uri: 'uor://collection/{type}',
        mimeType: 'application/json'
      }
    ];
    
    // Add user-specific resources if authenticated
    if (isAuthenticated && username) {
      resources.push({
        name: 'User Repository',
        description: `GitHub repository for user ${username}`,
        uri: `uor://repository/${username}`,
        mimeType: 'application/json'
      });
    }
    
    return {
      resources,
      nextCursor: null // No more pages
    };
  }

  /**
   * Handle tool calls by forwarding to the appropriate method
   * @param params Tool call parameters
   * @returns Tool execution result
   */
  private async handleToolCall(params: any): Promise<any> {
    const { name, arguments: args } = params;
    
    if (!name) {
      throw {
        code: JSONRPCErrorCode.InvalidParams,
        message: 'Tool name is required'
      };
    }
    
    try {
      // Execute the tool by forwarding to the MCP server
      const result = await this.mcpServer.handleRequest(name, args);
      
      // Format the result according to MCP protocol
      return {
        content: [
          {
            type: 'text',
            text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
          }
        ],
        isError: false
      };
      
    } catch (error) {
      // Return error in the tool result format
      return {
        content: [
          {
            type: 'text',
            text: `Error executing tool ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ],
        isError: true
      };
    }
  }

  /**
   * Check if a request is a valid JSON-RPC 2.0 request
   * @param request The request to validate
   * @returns True if the request is valid
   */
  private isValidJSONRPCRequest(request: any): boolean {
    return (
      request &&
      typeof request === 'object' &&
      request.jsonrpc === '2.0' &&
      typeof request.method === 'string' &&
      (request.id === null || typeof request.id === 'string' || typeof request.id === 'number') &&
      (request.params === undefined || typeof request.params === 'object')
    );
  }

  /**
   * Create a success response
   * @param id The request ID
   * @param result The result data
   * @returns A JSON-RPC success response
   */
  private createSuccessResponse(id: string | number | null, result: any): JSONRPCResponse {
    return {
      jsonrpc: '2.0',
      id,
      result: result || {}
    };
  }

  /**
   * Create an error response
   * @param id The request ID
   * @param code The error code
   * @param message The error message
   * @param data Additional error data
   * @returns A JSON-RPC error response
   */
  private createErrorResponse(
    id: string | number | null,
    code: number,
    message: string,
    data?: any
  ): JSONRPCError {
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

export default new MCPJSONRPCHandler();