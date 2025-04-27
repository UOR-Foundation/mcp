/**
 * Repository Service Tests
 * Verifies that the repository service correctly manages repository lifecycle
 */
import { RepositoryService, RepositoryStatus } from '../repository-service';
import { GitHubClient } from '../github-client';

// Mock GitHub client
const mockRepositoryExists = jest.fn();
const mockEnsureRepositoryExists = jest.fn();
const mockGetFile = jest.fn();
const mockCreateOrUpdateFile = jest.fn();
const mockListFiles = jest.fn();
const mockSetOwner = jest.fn();

jest.mock('../github-client', () => {
  return {
    GitHubClient: jest.fn().mockImplementation(() => {
      return {
        repositoryExists: mockRepositoryExists,
        ensureRepositoryExists: mockEnsureRepositoryExists,
        getFile: mockGetFile,
        createOrUpdateFile: mockCreateOrUpdateFile,
        listFiles: mockListFiles,
        setOwner: mockSetOwner
      };
    })
  };
});

describe('Repository Service', () => {
  let repositoryService: RepositoryService;
  let githubClient: GitHubClient;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock implementations
    mockRepositoryExists.mockResolvedValue(false);
    mockEnsureRepositoryExists.mockResolvedValue(true);
    mockGetFile.mockResolvedValue(null);
    mockCreateOrUpdateFile.mockResolvedValue(true);
    mockListFiles.mockResolvedValue([]);
    mockSetOwner.mockImplementation(() => {});
    
    githubClient = new GitHubClient();
    repositoryService = new RepositoryService(githubClient);
  });
  
  test('should check if repository exists', async () => {
    mockRepositoryExists.mockResolvedValueOnce(true);
    
    const exists = await repositoryService.checkRepositoryExists('test-user');
    
    expect(mockSetOwner).toHaveBeenCalledWith('test-user');
    expect(mockRepositoryExists).toHaveBeenCalled();
    expect(exists).toBe(true);
  });
  
  test('should create repository with initial structure', async () => {
    mockEnsureRepositoryExists.mockResolvedValueOnce(true);
    
    await repositoryService.createRepository('test-user');
    
    // Should set the owner
    expect(mockSetOwner).toHaveBeenCalledWith('test-user');
    
    // Should ensure repository exists
    expect(mockEnsureRepositoryExists).toHaveBeenCalled();
    
    // Should create all required directories with .gitkeep
    ['concepts', 'resources', 'topics', 'predicates', 'resolvers'].forEach(dir => {
      expect(mockCreateOrUpdateFile).toHaveBeenCalledWith(
        `${dir}/.gitkeep`,
        `Initialize ${dir} directory`,
        ''
      );
    });
    
    // Should create README.md
    const calls = mockCreateOrUpdateFile.mock.calls;
    
    // Check that there's a call that creates README.md
    const readmeCall = calls.some(call => call[0] === 'README.md' && call[1] === 'Add README.md');
    expect(readmeCall).toBe(true);
    
    // Check that there's a call that creates index.json
    const indexCall = calls.some(call => call[0] === 'index.json' && call[1] === 'Add index.json');
    expect(indexCall).toBe(true);
  });
  
  test('should verify repository access', async () => {
    mockRepositoryExists.mockResolvedValueOnce(true);
    
    const hasAccess = await repositoryService.verifyRepositoryAccess('test-user');
    
    expect(mockSetOwner).toHaveBeenCalledWith('test-user');
    expect(mockRepositoryExists).toHaveBeenCalled();
    expect(hasAccess).toBe(true);
  });
  
  test('should handle access verification errors', async () => {
    mockRepositoryExists.mockRejectedValueOnce(new Error('Permission denied'));
    
    const hasAccess = await repositoryService.verifyRepositoryAccess('test-user');
    
    expect(hasAccess).toBe(false);
  });
  
  test('should get repository status', async () => {
    const testDate = new Date('2023-01-01T00:00:00Z');
    
    // Mock index.json response
    mockGetFile.mockResolvedValueOnce({
      content: JSON.stringify({
        name: 'uordb',
        description: 'Test Repository',
        created: testDate.toISOString(),
        lastSync: testDate.toISOString()
      }),
      sha: 'index-sha'
    });
    
    // Mock directory counts
    // We'll use .mockImplementation to handle multiple calls with different paths
    mockListFiles.mockImplementation((path) => {
      if (path === 'concepts') {
        return Promise.resolve([
          { type: 'file', name: 'concept1.json' },
          { type: 'file', name: 'concept2.json' },
          { type: 'file', name: '.gitkeep' }
        ]);
      } else if (path === 'resources') {
        return Promise.resolve([
          { type: 'file', name: 'resource1.json' },
          { type: 'file', name: '.gitkeep' }
        ]);
      } else {
        return Promise.resolve([{ type: 'file', name: '.gitkeep' }]);
      }
    });
    
    const status = await repositoryService.getRepositoryStatus('test-user');
    
    expect(status).toEqual({
      name: 'uordb',
      creationDate: testDate,
      lastSyncTime: testDate,
      objectCounts: {
        concepts: 2,
        resources: 1,
        topics: 0,
        predicates: 0,
        resolvers: 0
      }
    });
  });
  
  test('should update last sync time', async () => {
    // Mock index.json response
    mockGetFile.mockResolvedValueOnce({
      content: JSON.stringify({
        name: 'uordb',
        description: 'Test Repository',
        created: '2023-01-01T00:00:00Z',
        lastSync: '2023-01-01T00:00:00Z'
      }),
      sha: 'index-sha'
    });
    
    await repositoryService.updateLastSyncTime('test-user');
    
    // Should update index.json with new lastSync time
    expect(mockCreateOrUpdateFile).toHaveBeenCalledWith(
      'index.json',
      'Update repository sync time',
      expect.any(String),
      'index-sha'
    );
  });
  
  test('should throw error if index.json not found', async () => {
    mockGetFile.mockResolvedValueOnce(null);
    
    await expect(repositoryService.getRepositoryStatus('test-user'))
      .rejects
      .toThrow('Repository index.json not found');
  });
});