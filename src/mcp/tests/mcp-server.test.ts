/**
 * MCP Server Tests
 * Verifies that the MCP server correctly interfaces with UORdb
 */
import { MCPServer } from '../mcp-server';

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