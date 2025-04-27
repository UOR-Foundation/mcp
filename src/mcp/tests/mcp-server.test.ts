/**
 * MCP Server Tests
 * Verifies that the MCP server correctly interfaces with UORdb
 */
import { MCPServer } from '../mcp-server';
import { MCPJSONRPCHandler } from '../mcp-jsonrpc-handler';

// Mock UORDBManager
const mockInitialize = jest.fn();
const mockGetRepositoryStatus = jest.fn();
const mockStoreObject = jest.fn();
const mockGetObject = jest.fn();
const mockDeleteObject = jest.fn();
const mockListObjects = jest.fn();
const mockSearchObjects = jest.fn();

jest.mock('../../github/uordb-manager', () => {
  return {
    UORDBManager: jest.fn().mockImplementation(() => {
      return {
        initialize: mockInitialize,
        getRepositoryStatus: mockGetRepositoryStatus,
        storeObject: mockStoreObject,
        getObject: mockGetObject,
        deleteObject: mockDeleteObject,
        listObjects: mockListObjects,
        searchObjects: mockSearchObjects
      };
    })
  };
});

// Mock GitHub client
jest.mock('../../github/github-client', () => {
  return {
    GitHubClient: jest.fn().mockImplementation(() => {
      return {
        setToken: jest.fn(),
        setOwner: jest.fn()
      };
    })
  };
});

describe('MCP Server', () => {
  let mcpServer: MCPServer;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset singleton instance for each test
    (MCPServer as any).instance = null;
    
    // Set up default mock implementations
    mockInitialize.mockResolvedValue(undefined);
    mockGetRepositoryStatus.mockResolvedValue({
      name: 'uordb',
      creationDate: new Date(),
      lastSyncTime: new Date(),
      objectCounts: {
        concepts: 1,
        resources: 2,
        topics: 0,
        predicates: 0,
        resolvers: 0
      }
    });
    mockStoreObject.mockResolvedValue(undefined);
    mockGetObject.mockResolvedValue(null);
    mockDeleteObject.mockResolvedValue(undefined);
    mockListObjects.mockResolvedValue([]);
    mockSearchObjects.mockResolvedValue([]);
    
    // Get instance
    mcpServer = MCPServer.getInstance();
  });
  
  test('should be a singleton', () => {
    const instance1 = MCPServer.getInstance();
    const instance2 = MCPServer.getInstance();
    
    expect(instance1).toBe(instance2);
  });
  
  test('should handle authentication', () => {
    // Before authentication
    expect(mcpServer.isAuthenticated()).toBe(false);
    expect(mcpServer.getCurrentUsername()).toBeNull();
    
    // Set authentication
    mcpServer.setAuthentication('test-user', 'test-token');
    
    // After authentication
    expect(mcpServer.isAuthenticated()).toBe(true);
    expect(mcpServer.getCurrentUsername()).toBe('test-user');
  });
  
  test('should clear authentication', () => {
    // Set authentication
    mcpServer.setAuthentication('test-user', 'test-token');
    expect(mcpServer.isAuthenticated()).toBe(true);
    
    // Clear authentication
    mcpServer.clearAuthentication();
    expect(mcpServer.isAuthenticated()).toBe(false);
    expect(mcpServer.getCurrentUsername()).toBeNull();
  });
  
  test('should require authentication for repository operations', async () => {
    // Without authentication
    await expect(mcpServer.initializeRepository())
      .rejects
      .toThrow('Not authenticated');
    
    await expect(mcpServer.getRepositoryStatus())
      .rejects
      .toThrow('Not authenticated');
  });
  
  test('should initialize repository', async () => {
    // Set authentication
    mcpServer.setAuthentication('test-user', 'test-token');
    
    // Initialize repository
    await mcpServer.initializeRepository();
    
    // Should call UORDBManager.initialize
    expect(mockInitialize).toHaveBeenCalledWith('test-user');
  });
  
  test('should get repository status', async () => {
    // Set authentication
    mcpServer.setAuthentication('test-user', 'test-token');
    
    // Get status
    const status = await mcpServer.getRepositoryStatus();
    
    // Should call UORDBManager.getRepositoryStatus
    expect(mockGetRepositoryStatus).toHaveBeenCalledWith('test-user');
    expect(status).toEqual({
      name: 'uordb',
      creationDate: expect.any(Date),
      lastSyncTime: expect.any(Date),
      objectCounts: {
        concepts: 1,
        resources: 2,
        topics: 0,
        predicates: 0,
        resolvers: 0
      }
    });
  });
  
  test('should handle UOR creation', async () => {
    // Set authentication
    mcpServer.setAuthentication('test-user', 'test-token');
    
    // Create UOR
    const reference = await mcpServer.handleRequest('uor.create', {
      type: 'concept',
      data: { name: 'Test Concept' }
    });
    
    // Should start with correct prefix
    expect(reference).toMatch(/^uor:\/\/concept\//);
    
    // Should call UORDBManager.storeObject
    expect(mockStoreObject).toHaveBeenCalledWith(
      'test-user',
      expect.objectContaining({
        type: 'concept',
        name: 'Test Concept'
      })
    );
  });
  
  test('should handle UOR resolution', async () => {
    // Set authentication
    mcpServer.setAuthentication('test-user', 'test-token');
    
    // Mock object retrieval
    const testObj = {
      id: 'uor://concept/test-id',
      type: 'concept',
      name: 'Test Concept'
    };
    mockGetObject.mockResolvedValueOnce(testObj);
    
    // Resolve UOR
    const result = await mcpServer.handleRequest('uor.resolve', {
      reference: 'uor://concept/test-id'
    });
    
    // Should return object with correct structure
    expect(result).toEqual({
      type: 'concept',
      data: testObj,
      reference: 'uor://concept/test-id'
    });
    
    // Should call UORDBManager.getObject
    expect(mockGetObject).toHaveBeenCalledWith('test-user', 'concept', 'test-id');
  });
  
  test('should handle UOR updates', async () => {
    // Set authentication
    mcpServer.setAuthentication('test-user', 'test-token');
    
    // Mock existing object
    const existingObj = {
      id: 'uor://concept/test-id',
      type: 'concept',
      name: 'Old Name'
    };
    mockGetObject.mockResolvedValueOnce(existingObj);
    
    // Update UOR
    const success = await mcpServer.handleRequest('uor.update', {
      reference: 'uor://concept/test-id',
      data: { name: 'New Name' }
    });
    
    // Should return true for success
    expect(success).toBe(true);
    
    // Should call UORDBManager.storeObject with updated object
    expect(mockStoreObject).toHaveBeenCalledWith(
      'test-user',
      expect.objectContaining({
        id: 'uor://concept/test-id',
        type: 'concept',
        name: 'New Name'
      })
    );
  });
  
  test('should handle UOR deletion', async () => {
    // Set authentication
    mcpServer.setAuthentication('test-user', 'test-token');
    
    // Delete UOR
    const success = await mcpServer.handleRequest('uor.delete', {
      reference: 'uor://concept/test-id'
    });
    
    // Should return true for success
    expect(success).toBe(true);
    
    // Should call UORDBManager.deleteObject
    expect(mockDeleteObject).toHaveBeenCalledWith('test-user', 'concept', 'test-id');
  });
  
  test('should handle UOR listing', async () => {
    // Set authentication
    mcpServer.setAuthentication('test-user', 'test-token');
    
    // Mock list objects response
    const objects = [
      { id: 'concept-1', type: 'concept', name: 'Concept 1' },
      { id: 'concept-2', type: 'concept', name: 'Concept 2' }
    ];
    mockListObjects.mockResolvedValueOnce(objects);
    
    // List objects
    const result = await mcpServer.handleRequest('uordb.list', {
      type: 'concept'
    });
    
    // Should return array of objects
    expect(result).toEqual(objects);
    
    // Should call UORDBManager.listObjects
    expect(mockListObjects).toHaveBeenCalledWith('test-user', 'concept');
  });
  
  test('should handle UOR search', async () => {
    // Set authentication
    mcpServer.setAuthentication('test-user', 'test-token');
    
    // Mock search objects response
    const objects = [
      { id: 'concept-1', type: 'concept', name: 'Search Result 1' },
      { id: 'resource-1', type: 'resource', name: 'Search Result 2' }
    ];
    mockSearchObjects.mockResolvedValueOnce(objects);
    
    // Search objects
    const result = await mcpServer.handleRequest('uordb.search', {
      query: 'search'
    });
    
    // Should return array of objects
    expect(result).toEqual(objects);
    
    // Should call UORDBManager.searchObjects
    expect(mockSearchObjects).toHaveBeenCalledWith('test-user', 'search');
  });
  
  test('should reject unknown methods', async () => {
    await expect(mcpServer.handleRequest('unknown.method', {}))
      .rejects
      .toThrow('Unknown method: unknown.method');
  });
  
  test('should fallback to localStorage for offline use', async () => {
    // Mock localStorage
    const mockLocalStorage: Record<string, string> = {};
    
    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: jest.fn((key) => mockLocalStorage[key] || null),
        setItem: jest.fn((key, value) => { mockLocalStorage[key] = value; }),
        removeItem: jest.fn((key) => { delete mockLocalStorage[key]; })
      },
      writable: true
    });
    
    // Without authentication (offline mode)
    // Create an object
    const reference = await mcpServer.handleRequest('uor.create', {
      type: 'concept',
      data: { name: 'Offline Concept' }
    });
    
    // Should store in localStorage
    expect(localStorage.setItem).toHaveBeenCalled();
    
    // Should be able to resolve from localStorage
    const result = await mcpServer.handleRequest('uor.resolve', {
      reference: reference
    });
    
    expect(result).toBeDefined();
    expect(result?.data.name).toBe('Offline Concept');
  });
});

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
}, { virtual: true });

// Get the mock server for JSON-RPC handler tests
import MCPServerMock from '../mcp-server';

// Integration tests with JSON-RPC Handler
describe('MCP Server with JSON-RPC Handler', () => {
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