import { MCPJSONRPCHandler } from '../mcp-jsonrpc-handler';
import { JSONRPCErrorCode } from '../mcp-jsonrpc';

// Mock the server module
jest.mock('../mcp-server', () => {
  const mockServer = {
    handleRequest: jest.fn(),
    isAuthenticated: jest.fn(),
    getCurrentUsername: jest.fn(),
    setAuthentication: jest.fn(),
    clearAuthentication: jest.fn()
  };
  
  return {
    __esModule: true,
    default: mockServer
  };
});

// Get the mock server
import MCPServer from '../mcp-server';
const mockServer = MCPServer as any;

describe('MCPJSONRPCHandler', () => {
  let handler: MCPJSONRPCHandler;
  
  beforeEach(() => {
    // Reset mock implementations
    mockServer.handleRequest.mockReset();
    mockServer.isAuthenticated.mockReset();
    mockServer.getCurrentUsername.mockReset();
    
    // Create a new handler
    handler = new MCPJSONRPCHandler();
  });
  
  describe('JSON-RPC request validation', () => {
    it('should reject invalid JSON-RPC requests', async () => {
      // Test invalid JSON string specifically
      const response = await handler.handleJSONRPCRequest('invalid-json');
      const responseObj = response as any;
      expect(responseObj.error).toBeDefined();
      expect(responseObj.error.code).toBe(JSONRPCErrorCode.ParseError);
      
      // Test other invalid request formats
      const invalidObjects = [
        { jsonrpc: '1.0', id: 1, method: 'test' }, // Wrong version
        { jsonrpc: '2.0', id: 1 } // Missing method
      ];
      
      for (const request of invalidObjects) {
        const resp = await handler.handleJSONRPCRequest(request);
        const respObj = resp as any;
        expect(respObj.error).toBeDefined();
        expect(respObj.error.code).toBe(JSONRPCErrorCode.InvalidRequest);
      }
      
      // Empty object gets special handling
      const emptyResponse = await handler.handleJSONRPCRequest({});
      const emptyResponseObj = emptyResponse as any;
      expect(emptyResponseObj.error).toBeDefined();
      expect(emptyResponseObj.error.code).toBe(JSONRPCErrorCode.ParseError);
    });
    
    it('should accept valid JSON-RPC requests', async () => {
      mockServer.handleRequest.mockResolvedValue({ result: 'success' });
      
      const validRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'uor.resolve',
        params: { reference: 'uor://concept/123' }
      };
      
      const response = await handler.handleJSONRPCRequest(validRequest);
      const responseObj = response as any;
      expect(responseObj.error).toBeUndefined();
      expect(responseObj.result).toBeDefined();
    });
  });
  
  describe('Initialization', () => {
    it('should handle initialize method', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          clientInfo: {
            name: 'test-client',
            version: '1.0.0'
          },
          protocolVersion: '2025-03-26',
          capabilities: {}
        }
      };
      
      const response = await handler.handleJSONRPCRequest(request);
      
      const responseObj = response as any;
      expect(responseObj.error).toBeUndefined();
      expect(responseObj.result).toBeDefined();
      expect(responseObj.result.protocolVersion).toBe('2025-03-26');
      expect(responseObj.result.serverInfo).toBeDefined();
      expect(responseObj.result.capabilities).toBeDefined();
    });
    
    it('should reject initialize with unsupported protocol version', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          clientInfo: {
            name: 'test-client',
            version: '1.0.0'
          },
          protocolVersion: 'unsupported-version',
          capabilities: {}
        }
      };
      
      const response = await handler.handleJSONRPCRequest(request);
      
      const responseObj = response as any;
      expect(responseObj.error).toBeDefined();
      expect(responseObj.error.code).toBe(JSONRPCErrorCode.InvalidRequest);
      expect(responseObj.error.message).toContain('Unsupported protocol version');
    });
  });
  
  describe('Tools List', () => {
    it('should handle tools/list method', async () => {
      mockServer.isAuthenticated.mockReturnValue(true);
      
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      };
      
      const response = await handler.handleJSONRPCRequest(request);
      
      const responseObj = response as any;
      expect(responseObj.error).toBeUndefined();
      expect(responseObj.result).toBeDefined();
      expect(responseObj.result.tools).toBeDefined();
      expect(Array.isArray(responseObj.result.tools)).toBe(true);
      expect(responseObj.result.tools.length).toBeGreaterThan(0);
    });
  });
  
  describe('Resources List', () => {
    it('should handle resources/list method', async () => {
      mockServer.isAuthenticated.mockReturnValue(true);
      mockServer.getCurrentUsername.mockReturnValue('testuser');
      
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'resources/list',
        params: {}
      };
      
      const response = await handler.handleJSONRPCRequest(request);
      
      const responseObj = response as any;
      expect(responseObj.error).toBeUndefined();
      expect(responseObj.result).toBeDefined();
      expect(responseObj.result.resources).toBeDefined();
      expect(Array.isArray(responseObj.result.resources)).toBe(true);
      expect(responseObj.result.resources.length).toBeGreaterThan(0);
    });
  });
  
  describe('Tool Call', () => {
    it('should handle tools/call method', async () => {
      mockServer.handleRequest.mockResolvedValue('Tool result');
      
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'uor.resolve',
          arguments: { reference: 'uor://concept/123' }
        }
      };
      
      const response = await handler.handleJSONRPCRequest(request);
      
      const responseObj = response as any;
      expect(responseObj.error).toBeUndefined();
      expect(responseObj.result).toBeDefined();
      expect(responseObj.result.content).toBeDefined();
      expect(responseObj.result.content.length).toBe(1);
      expect(responseObj.result.content[0].type).toBe('text');
    });
    
    it('should handle tool call errors properly', async () => {
      mockServer.handleRequest.mockRejectedValue(new Error('Tool execution failed'));
      
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'uor.resolve',
          arguments: { reference: 'invalid-reference' }
        }
      };
      
      const response = await handler.handleJSONRPCRequest(request);
      
      const responseObj = response as any;
      expect(responseObj.error).toBeUndefined(); // Not a protocol error
      expect(responseObj.result).toBeDefined();
      expect(responseObj.result.isError).toBe(true);
      expect(responseObj.result.content[0].text).toContain('Error executing tool');
    });
  });
  
  describe('Batch Requests', () => {
    it('should handle batch requests', async () => {
      mockServer.handleRequest.mockResolvedValue('Success');
      
      const batchRequest = [
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'uor.resolve',
          params: { reference: 'uor://concept/123' }
        },
        {
          jsonrpc: '2.0',
          id: 2,
          method: 'uor.resolve',
          params: { reference: 'uor://concept/456' }
        }
      ];
      
      const response = await handler.handleJSONRPCRequest(batchRequest);
      
      const responseArray = response as any[];
      expect(Array.isArray(responseArray)).toBe(true);
      expect(responseArray.length).toBe(2);
      expect(responseArray[0].id).toBe(1);
      expect(responseArray[1].id).toBe(2);
    });
    
    it('should reject empty batch requests', async () => {
      const response = await handler.handleJSONRPCRequest([]) as any;
      
      // Response should be an array with one error response
      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBe(1);
      expect(response[0].error).toBeDefined();
      expect(response[0].error.code).toBe(JSONRPCErrorCode.InvalidRequest);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle method not found', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'non_existent_method',
        params: {}
      };
      
      mockServer.handleRequest.mockImplementation(() => {
        throw new Error('Unknown method');
      });
      
      const response = await handler.handleJSONRPCRequest(request);
      
      const responseObj = response as any;
      expect(responseObj.error).toBeDefined();
      expect(responseObj.error.code).toBe(JSONRPCErrorCode.MethodNotFound);
    });
    
    it('should handle internal errors', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'uor.resolve',
        params: { reference: 'uor://concept/123' }
      };
      
      // Force handling as an unknown method
      mockServer.handleRequest.mockImplementation(() => {
        throw new Error('Internal server error');
      });
      
      // Override the method to be a different value that will trigger internal error path
      const internalRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'uor.internalError',
        params: { reference: 'uor://concept/123' }
      };
      
      const response = await handler.handleJSONRPCRequest(internalRequest);
      
      const responseObj = response as any;
      expect(responseObj.error).toBeDefined();
      expect(responseObj.error.code).toBe(JSONRPCErrorCode.InternalError);
    });
  });
  
  describe('Other MCP Methods', () => {
    it('should forward MCP server methods', async () => {
      mockServer.handleRequest.mockResolvedValue('Success');
      
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'uor.resolve',
        params: { reference: 'uor://concept/123' }
      };
      
      await handler.handleJSONRPCRequest(request);
      
      expect(mockServer.handleRequest).toHaveBeenCalledWith('uor.resolve', { reference: 'uor://concept/123' });
    });
  });
});