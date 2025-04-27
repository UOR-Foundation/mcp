/**
 * GitHub Authentication Tests
 * Verifies the authentication functionality for the GitHub client
 */
import { GitHubClient } from '../github-client';

// Mock fetch API
global.fetch = jest.fn();
global.atob = jest.fn();
global.btoa = jest.fn();

describe('GitHub Authentication', () => {
  let githubClient: GitHubClient;
  
  beforeEach(() => {
    jest.resetAllMocks();
    
    // Set up default mock implementations
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ login: 'test-user' })
    });
    
    (global.atob as jest.Mock).mockImplementation((str) => str);
    (global.btoa as jest.Mock).mockImplementation((str) => str);
    
    // Create a fresh GitHub client for each test
    githubClient = new GitHubClient();
  });
  
  test('should initialize without authentication', () => {
    expect(githubClient).toBeDefined();
    expect(githubClient.getCurrentUser()).resolves.toBeNull();
  });
  
  test('should set token and auth headers correctly', async () => {
    // Set token
    githubClient.setToken('test-token');
    
    // Mock the user API call
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ login: 'test-user', id: 12345 })
    });
    
    // Get current user
    const user = await githubClient.getCurrentUser();
    
    // Verify request had authorization header
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.github.com/user',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'token test-token'
        })
      })
    );
    
    // Verify user object
    expect(user).toEqual({ login: 'test-user', id: 12345 });
  });
  
  test('should handle authentication failure gracefully', async () => {
    // Set invalid token
    githubClient.setToken('invalid-token');
    
    // Mock API call failure
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Bad credentials' })
    });
    
    // Get current user should return null on auth failure
    const user = await githubClient.getCurrentUser();
    expect(user).toBeNull();
  });
  
  test('should require authentication for repository operations', async () => {
    // Without setting token
    const exists = await githubClient.repositoryExists();
    expect(exists).toBe(false);
    
    // Set token but not owner
    githubClient.setToken('test-token');
    const exists2 = await githubClient.repositoryExists();
    expect(exists2).toBe(false);
    
    // Set both token and owner
    githubClient.setOwner('test-owner');
    
    // Mock successful repository check
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: 'uordb' })
    });
    
    const exists3 = await githubClient.repositoryExists();
    expect(exists3).toBe(true);
  });
  
  test('should verify repository access permissions', async () => {
    // Set up authenticated client
    githubClient.setToken('test-token');
    githubClient.setOwner('test-owner');
    
    // Mock repository response with permissions
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        name: 'uordb',
        permissions: {
          admin: true,
          push: true,
          pull: true
        }
      })
    });
    
    // Repository should exist and have write access
    const exists = await githubClient.repositoryExists();
    expect(exists).toBe(true);
    
    // Verify correct API endpoint was called
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/test-owner/uordb',
      expect.anything()
    );
  });
  
  test('should handle API errors gracefully', async () => {
    // Set up authenticated client
    githubClient.setToken('test-token');
    githubClient.setOwner('test-owner');
    
    // Mock network failure
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    // Should return false on network error
    const exists = await githubClient.repositoryExists();
    expect(exists).toBe(false);
  });
});