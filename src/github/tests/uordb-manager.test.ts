/**
 * UORdb Manager Tests
 * Verifies that the UORdb manager correctly handles object storage and retrieval
 */
import { GitHubClient } from '../github-client';
import { UORDBManager } from '../uordb-manager';
import { RepositoryService } from '../repository-service';

// Mock GitHub client
const mockGetFile = jest.fn();
const mockCreateOrUpdateFile = jest.fn();
const mockListFiles = jest.fn();
const mockDeleteFile = jest.fn();
const mockSetOwner = jest.fn();

// Mock GitHub client class
jest.mock('../github-client', () => {
  return {
    GitHubClient: jest.fn().mockImplementation(() => {
      return {
        getFile: mockGetFile,
        createOrUpdateFile: mockCreateOrUpdateFile,
        listFiles: mockListFiles,
        deleteFile: mockDeleteFile,
        setOwner: mockSetOwner
      };
    })
  };
});

// Mock repository service methods
jest.mock('../repository-service', () => {
  return {
    RepositoryService: jest.fn().mockImplementation(() => {
      return {
        checkRepositoryExists: jest.fn().mockResolvedValue(true),
        checkRepositoryAccess: jest.fn().mockResolvedValue({
          exists: true,
          hasWriteAccess: true,
          permissions: {
            admin: false,
            push: true,
            pull: true
          }
        }),
        createRepository: jest.fn().mockResolvedValue(true),
        verifyRepositoryAccess: jest.fn().mockResolvedValue(true),
        verifyRepositoryStructure: jest.fn().mockResolvedValue({
          isValid: true,
          missingDirectories: [],
          missingFiles: []
        }),
        getRepositoryStatus: jest.fn().mockResolvedValue({
          name: 'uordb',
          owner: 'test-user',
          creationDate: new Date(),
          lastSyncTime: new Date(),
          objectCounts: {
            concepts: 1,
            resources: 2,
            topics: 3,
            predicates: 0,
            resolvers: 0
          }
        }),
        updateLastSyncTime: jest.fn().mockResolvedValue(undefined),
        // Explicitly expose the GitHub client to UORdbManager
        githubClient: new GitHubClient()
      };
    })
  };
});

// Mock Date for consistent timestamps in tests
const originalDate = global.Date;
const mockToISOString = jest.fn().mockReturnValue('2023-01-01T00:00:00Z');

// Use a simpler Date mock approach
const mockDate = jest.fn().mockImplementation(() => {
  const date = new originalDate('2023-01-01T00:00:00Z');
  date.toISOString = mockToISOString;
  return date;
});

// Save original Date and replace with mock
global.Date = mockDate as any;

describe('UORdb Manager', () => {
  let uordbManager: UORDBManager;
  let githubClient: GitHubClient;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock implementations
    mockGetFile.mockResolvedValue(null);
    mockCreateOrUpdateFile.mockResolvedValue(true);
    mockListFiles.mockResolvedValue([]);
    mockDeleteFile.mockResolvedValue(true);
    mockSetOwner.mockImplementation(() => {});
    
    githubClient = new GitHubClient();
    uordbManager = new UORDBManager(githubClient);
  });
  
  afterAll(() => {
    // Restore the original Date
    global.Date = originalDate;
  });
  
  test('should initialize repository correctly', async () => {
    await uordbManager.initialize('test-user');
    
    // Verify repository service methods were called
    const repoService = (uordbManager as any).repositoryService;
    expect(repoService.checkRepositoryAccess).toHaveBeenCalledWith('test-user');
    expect(repoService.verifyRepositoryStructure).toHaveBeenCalledWith('test-user');
    
    // If repo doesn't exist, it should create it
    repoService.checkRepositoryAccess.mockResolvedValueOnce({
      exists: false,
      hasWriteAccess: false
    });
    await uordbManager.initialize('test-user');
    expect(repoService.createRepository).toHaveBeenCalledWith('test-user');
  });
  
  test('should reject initialization if no write access', async () => {
    const repoService = (uordbManager as any).repositoryService;
    repoService.checkRepositoryAccess.mockResolvedValueOnce({
      exists: true,
      hasWriteAccess: false,
      permissions: {
        admin: false,
        push: false,
        pull: true
      }
    });
    
    await expect(uordbManager.initialize('test-user'))
      .rejects
      .toThrow('No write access to the repository');
  });
  
  test('should store UOR objects correctly', async () => {
    // Create test object
    const testObject = {
      id: 'uor://concept/test-id',
      type: 'concept',
      name: 'Test Concept'
    };
    
    // Store the object
    await uordbManager.storeObject('test-user', testObject);
    
    // Verify the owner was set
    expect(mockSetOwner).toHaveBeenCalledWith('test-user');
    
    // Verify the file was saved
    expect(mockCreateOrUpdateFile).toHaveBeenCalledWith(
      'concepts/test-id.json',
      'Create concepts/test-id.json',
      JSON.stringify({
        id: 'uor://concept/test-id',
        type: 'concept',
        name: 'Test Concept',
        lastModified: '2023-01-01T00:00:00Z'
      }, null, 2),
      undefined
    );
  });
  
  test('should update existing UOR objects with correct SHA', async () => {
    // Set up mock for existing file
    mockGetFile.mockResolvedValueOnce({
      content: JSON.stringify({
        id: 'uor://concept/test-id',
        type: 'concept',
        name: 'Old Name'
      }),
      sha: 'existing-sha'
    });
    
    // Create test object with updates
    const testObject = {
      id: 'uor://concept/test-id',
      type: 'concept',
      name: 'Updated Name'
    };
    
    // Update the object
    await uordbManager.storeObject('test-user', testObject);
    
    // Verify the file was updated with SHA
    expect(mockCreateOrUpdateFile).toHaveBeenCalledWith(
      'concepts/test-id.json',
      'Update concepts/test-id.json',
      JSON.stringify({
        id: 'uor://concept/test-id',
        type: 'concept',
        name: 'Updated Name',
        lastModified: '2023-01-01T00:00:00Z'
      }, null, 2),
      'existing-sha'
    );
  });
  
  test('should retrieve UOR objects correctly', async () => {
    // Set up mock for existing file
    mockGetFile.mockResolvedValueOnce({
      content: JSON.stringify({
        id: 'uor://concept/test-id',
        type: 'concept',
        name: 'Test Concept'
      }),
      sha: 'test-sha'
    });
    
    // Retrieve the object
    const object = await uordbManager.getObject('test-user', 'concept', 'test-id');
    
    // Verify the correct object was returned
    expect(object).toEqual({
      id: 'uor://concept/test-id',
      type: 'concept',
      name: 'Test Concept'
    });
    
    // Verify the correct path was requested
    expect(mockGetFile).toHaveBeenCalledWith('concepts/test-id.json');
  });
  
  test('should return null for non-existent objects', async () => {
    // Mock file not found
    mockGetFile.mockResolvedValueOnce(null);
    
    // Attempt to retrieve non-existent object
    const object = await uordbManager.getObject('test-user', 'concept', 'non-existent');
    
    // Should return null
    expect(object).toBeNull();
  });
  
  test('should delete UOR objects correctly', async () => {
    // Set up mock for existing file
    mockGetFile.mockResolvedValueOnce({
      content: '{}',
      sha: 'test-sha'
    });
    
    // Delete the object
    await uordbManager.deleteObject('test-user', 'concept', 'test-id');
    
    // Verify delete was called with correct params
    expect(mockDeleteFile).toHaveBeenCalledWith(
      'concepts/test-id.json',
      'Delete concepts/test-id.json',
      'test-sha'
    );
  });
  
  test('should throw error when trying to delete non-existent object', async () => {
    // Mock file not found
    mockGetFile.mockResolvedValueOnce(null);
    
    // Attempt to delete non-existent object
    await expect(uordbManager.deleteObject('test-user', 'concept', 'non-existent'))
      .rejects
      .toThrow('Object not found');
  });
  
  test('should list objects correctly', async () => {
    // Mock directory listing
    mockListFiles.mockResolvedValueOnce([
      { type: 'file', name: 'test1.json' },
      { type: 'file', name: 'test2.json' },
      { type: 'file', name: '.gitkeep' }
    ]);
    
    // Mock file content
    mockGetFile
      .mockResolvedValueOnce({ 
        content: JSON.stringify({ id: 'test1', type: 'concept' }),
        sha: 'sha1'
      })
      .mockResolvedValueOnce({ 
        content: JSON.stringify({ id: 'test2', type: 'concept' }),
        sha: 'sha2'
      });
    
    // List objects
    const objects = await uordbManager.listObjects('test-user', 'concept');
    
    // Should return two objects (excluding .gitkeep)
    expect(objects).toHaveLength(2);
    expect(objects[0].id).toBe('test1');
    expect(objects[1].id).toBe('test2');
  });
  
  test('should handle invalid category', async () => {
    // Attempt to use invalid category
    await expect(uordbManager.listObjects('test-user', 'invalid-category'))
      .rejects
      .toThrow('Unknown UOR object type');
  });
});