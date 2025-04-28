/**
 * GitHub Client
 * Client for interacting with GitHub API to store and retrieve UOR data
 */

/**
 * Options for the GitHub client
 */
export interface GitHubClientOptions {
  /** OAuth token for GitHub authentication */
  token?: string;
  
  /** Username of the repository owner */
  owner?: string;
  
  /** Repository name (defaults to 'uordb') */
  repo?: string;
  
  /** API URL (defaults to 'https://api.github.com') */
  apiUrl?: string;
}

/**
 * Client for interacting with GitHub API
 */
export class GitHubClient {
  private token: string | null;
  private owner: string | null;
  private repo: string;
  private apiUrl: string;
  
  /**
   * Creates a new GitHub client
   * @param options Client options
   */
  constructor(options: GitHubClientOptions = {}) {
    this.token = options.token || null;
    this.owner = options.owner || null;
    this.repo = options.repo || 'uordb';
    this.apiUrl = options.apiUrl || 'https://api.github.com';
  }
  
  /**
   * Sets the authentication token
   * @param token The OAuth token
   */
  setToken(token: string): void {
    this.token = token;
  }
  
  /**
   * Sets the repository owner
   * @param owner The owner username
   */
  setOwner(owner: string): void {
    this.owner = owner;
  }
  
  /**
   * Gets the current user information
   * @returns The user information or null if not authenticated
   */
  async getCurrentUser(): Promise<any | null> {
    if (!this.token) {
      return null;
    }
    
    try {
      const response = await this.request('/user');
      return response;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
  
  /**
   * Checks if the UOR repository exists
   * @returns Whether the repository exists
   */
  async repositoryExists(): Promise<boolean> {
    if (!this.token || !this.owner) {
      return false;
    }
    
    try {
      await this.request(`/repos/${this.owner}/${this.repo}`);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Creates the UOR repository if it doesn't exist
   * @returns Whether the operation was successful
   */
  async ensureRepositoryExists(): Promise<boolean> {
    if (!this.token || !this.owner) {
      return false;
    }
    
    // Check if repository already exists
    if (await this.repositoryExists()) {
      return true;
    }
    
    // Create the repository
    try {
      await this.request('/user/repos', {
        method: 'POST',
        body: JSON.stringify({
          name: this.repo,
          description: 'Universal Object Reference Database',
          private: false,
          auto_init: true
        })
      });
      
      // Initialize repository structure
      await this.createInitialStructure();
      
      return true;
    } catch (error) {
      console.error('Error creating repository:', error);
      return false;
    }
  }
  
  /**
   * Creates the initial repository structure
   * @returns Whether the operation was successful
   */
  private async createInitialStructure(): Promise<boolean> {
    if (!this.token || !this.owner) {
      return false;
    }
    
    try {
      // Create README.md
      await this.createOrUpdateFile(
        'README.md',
        'Universal Object Reference Database',
        'This repository is used to store Universal Object Reference (UOR) data.\n\n' +
        'It is automatically managed by the UOR MCP Server.'
      );
      
      // Create directories
      const directories = ['concepts', 'resources', 'topics', 'predicates', 'resolvers'];
      
      for (const dir of directories) {
        await this.createOrUpdateFile(
          `${dir}/.gitkeep`,
          `Initialize ${dir} directory`,
          ''
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error initializing repository structure:', error);
      return false;
    }
  }
  
  /**
   * Gets a file from the repository
   * @param path The file path
   * @returns The file content or null if not found
   */
  async getFile(path: string): Promise<any | null> {
    if (!this.token || !this.owner) {
      return null;
    }
    
    try {
      const response = await this.request(
        `/repos/${this.owner}/${this.repo}/contents/${path}`
      );
      
      // Decode content
      const content = atob(response.content);
      return { content, sha: response.sha };
    } catch (error) {
      // File not found
      return null;
    }
  }
  
  /**
   * Creates or updates a file in the repository
   * @param path The file path
   * @param message The commit message
   * @param content The file content
   * @param sha The file SHA (for updates)
   * @returns Whether the operation was successful
   */
  async createOrUpdateFile(
    path: string,
    message: string,
    content: string,
    sha?: string
  ): Promise<boolean> {
    if (!this.token || !this.owner) {
      return false;
    }
    
    try {
      const endpoint = `/repos/${this.owner}/${this.repo}/contents/${path}`;
      const body: any = {
        message,
        content: btoa(content)
      };
      
      // If SHA is provided, it's an update
      if (sha) {
        body.sha = sha;
      }
      
      await this.request(endpoint, {
        method: 'PUT',
        body: JSON.stringify(body)
      });
      
      return true;
    } catch (error) {
      console.error(`Error ${sha ? 'updating' : 'creating'} file:`, error);
      return false;
    }
  }
  
  /**
   * Deletes a file from the repository
   * @param path The file path
   * @param message The commit message
   * @param sha The file SHA
   * @returns Whether the operation was successful
   */
  async deleteFile(path: string, message: string, sha: string): Promise<boolean> {
    if (!this.token || !this.owner) {
      return false;
    }
    
    try {
      const endpoint = `/repos/${this.owner}/${this.repo}/contents/${path}`;
      await this.request(endpoint, {
        method: 'DELETE',
        body: JSON.stringify({
          message,
          sha
        })
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }
  
  /**
   * Lists files in a directory
   * @param path The directory path
   * @returns The list of files or null if not found
   */
  async listFiles(path: string): Promise<any[] | null> {
    if (!this.token || !this.owner) {
      return null;
    }
    
    try {
      const response = await this.request(
        `/repos/${this.owner}/${this.repo}/contents/${path}`
      );
      
      // Filter out directories
      return Array.isArray(response) ? response : null;
    } catch (error) {
      console.error('Error listing files:', error);
      return null;
    }
  }
  
  /**
   * Makes a request to the GitHub API
   * @param endpoint The API endpoint
   * @param options Request options
   * @returns The response data
   */
  async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    // Set up headers
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers
    } as Record<string, string>;
    
    // Add authorization if token is available
    if (this.token) {
      headers['Authorization'] = `token ${this.token}`;
    }
    
    // Make the request
    const url = `${this.apiUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    // Handle errors
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`GitHub API error: ${error.message}`);
    }
    
    // Return the response data
    return response.json();
  }
}