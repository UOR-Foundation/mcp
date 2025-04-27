/**
 * Tests for MCP JSON-RPC Handler, focusing on the JSON-RPC interface
 */
import { MCPJSONRPCHandler } from '../mcp-jsonrpc-handler';

// Mock the MCP server module for JSON-RPC handler tests
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
    MCPServer: {
      getInstance: jest.fn().mockReturnValue(mockServer)
    },
    default: mockServer
  };
});

// Get the mock server for JSON-RPC handler tests
import MCPServerMock from '../mcp-server';

// Integration tests with JSON-RPC Handler
describe('MCP JSON-RPC Handler', () => {
  let handler: MCPJSONRPCHandler;
  const mockServer = MCPServerMock as any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock implementations
    mockServer.handleRequest.mockReset();
    mockServer.isAuthenticated.mockReturnValue(true);
    mockServer.getCurrentUsername.mockReturnValue('test-user');
    
    // Create handler
    handler = new MCPJSONRPCHandler();
  });
  
  test('should handle initialize method via JSON-RPC', async () => {
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
    
    // Type assertion to ensure we have the correct response type
    const jsonResponse = response as any;
    expect(jsonResponse.error).toBeUndefined();
    expect(jsonResponse.result).toBeDefined();
    expect(jsonResponse.result.protocolVersion).toBe('2025-03-26');
    expect(jsonResponse.result.capabilities).toBeDefined();
  });
  
  test('should handle UOR operations via JSON-RPC', async () => {
    // Mock object retrieval for testing resolution
    const testObj = {
      id: 'uor://concept/test-id',
      type: 'concept',
      name: 'Test Concept'
    };
    
    // Mock MCPServer handleRequest for correct return format
    const mockResolveResult = {
      type: 'concept',
      data: testObj,
      reference: 'uor://concept/test-id'
    };
    mockServer.handleRequest.mockResolvedValueOnce(mockResolveResult);
    
    // Test UOR resolution via JSON-RPC
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'uor.resolve',
      params: {
        reference: 'uor://concept/test-id'
      }
    };
    
    const response = await handler.handleJSONRPCRequest(request);
    
    // Type assertion to ensure we have the correct response type
    const jsonResponse = response as any;
    expect(jsonResponse.error).toBeUndefined();
    expect(jsonResponse.result).toBeDefined();
    expect(jsonResponse.result.type).toBe('concept');
    expect(jsonResponse.result.data).toEqual(testObj);
    
    // Verify the mock was called correctly
    expect(mockServer.handleRequest).toHaveBeenCalledWith('uor.resolve', { 
      reference: 'uor://concept/test-id' 
    });
  });
  
  test('should handle tools/list via JSON-RPC', async () => {
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    };
    
    const response = await handler.handleJSONRPCRequest(request);
    
    // Type assertion to ensure we have the correct response type
    const jsonResponse = response as any;
    expect(jsonResponse.error).toBeUndefined();
    expect(jsonResponse.result).toBeDefined();
    expect(jsonResponse.result.tools).toBeDefined();
    expect(Array.isArray(jsonResponse.result.tools)).toBe(true);
    expect(jsonResponse.result.tools.length).toBeGreaterThan(0);
    
    // Check for expected tools
    const toolNames = jsonResponse.result.tools.map((tool: any) => tool.name);
    expect(toolNames).toContain('uor.resolve');
    expect(toolNames).toContain('uor.create');
    expect(toolNames).toContain('uor.update');
    expect(toolNames).toContain('uor.delete');
  });
  
  test('should handle resources/list via JSON-RPC', async () => {
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'resources/list',
      params: {}
    };
    
    const response = await handler.handleJSONRPCRequest(request);
    
    // Type assertion to ensure we have the correct response type
    const jsonResponse = response as any;
    expect(jsonResponse.error).toBeUndefined();
    expect(jsonResponse.result).toBeDefined();
    expect(jsonResponse.result.resources).toBeDefined();
    expect(Array.isArray(jsonResponse.result.resources)).toBe(true);
  });
  
  test('should handle tool execution via JSON-RPC', async () => {
    // Mock successful creation of UOR object
    const mockReference = 'uor://concept/test-123456';
    mockServer.handleRequest.mockResolvedValueOnce(mockReference);
    
    const createRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'uor.create',
        arguments: {
          type: 'concept',
          data: { name: 'Test Concept' }
        }
      }
    };
    
    const createResponse = await handler.handleJSONRPCRequest(createRequest);
    
    // Type assertion to ensure we have the correct response type
    const jsonResponse = createResponse as any;
    expect(jsonResponse.error).toBeUndefined();
    expect(jsonResponse.result).toBeDefined();
    expect(jsonResponse.result.content).toBeDefined();
    expect(jsonResponse.result.content.length).toBe(1);
    expect(jsonResponse.result.isError).toBe(false);
    
    // The content should include the reference to the created UOR
    const reference = jsonResponse.result.content[0].text;
    expect(reference).toContain(mockReference);
    
    // Should have called handleRequest on MCPServer
    expect(mockServer.handleRequest).toHaveBeenCalledWith(
      'uor.create', 
      { type: 'concept', data: { name: 'Test Concept' } }
    );
  });
  
  test('should handle batch requests via JSON-RPC', async () => {
    // Mock reset
    mockServer.handleRequest.mockReset();
    
    const batchRequest = [
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      },
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'resources/list',
        params: {}
      }
    ];
    
    const response = await handler.handleJSONRPCRequest(batchRequest);
    
    // Type assertion to ensure we have the correct response type
    const batchResponse = response as any[];
    expect(Array.isArray(batchResponse)).toBe(true);
    expect(batchResponse.length).toBe(2);
    
    // Check that both responses have a result object
    expect(batchResponse[0].result).toBeDefined();
    expect(batchResponse[1].result).toBeDefined();
    
    // For tools/list we expect a tools array
    expect(batchResponse[0].result.tools).toBeDefined();
    
    // For resources/list we expect a resources array
    expect(batchResponse[1].result.resources).toBeDefined();
  });
});