import { UORObject } from '../core/uor-core';
import { GitHubClient } from '../github/github-client';
import { UORDBManager } from '../github/uordb-manager';

// Custom interface for stored UOR objects
interface StoredUORObject {
  type: string;
  data: any;
  reference: string;
}

// Client-side compatible MCP server implementation
export class MCPServer {
  private static instance: MCPServer;
  private uordbManager: UORDBManager | null = null;
  private currentUser: { username: string, token: string } | null = null;

  private constructor() {}

  public static getInstance(): MCPServer {
    if (!MCPServer.instance) {
      MCPServer.instance = new MCPServer();
    }
    return MCPServer.instance;
  }

  public setAuthentication(username: string, token: string): void {
    this.currentUser = { username, token };
    
    // Initialize GitHub client and UORdb manager
    const githubClient = new GitHubClient({ token });
    this.uordbManager = new UORDBManager(githubClient);
  }

  public clearAuthentication(): void {
    this.currentUser = null;
    this.uordbManager = null;
  }

  public isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  public getCurrentUsername(): string | null {
    return this.currentUser?.username || null;
  }

  public async initializeRepository(): Promise<void> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }

    await this.uordbManager.initialize(this.currentUser.username);
  }

  public async getRepositoryStatus(): Promise<any> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }

    try {
      return await this.uordbManager.getRepositoryStatus(this.currentUser.username);
    } catch (error) {
      // Check if repository exists before throwing error
      const exists = await this.checkRepositoryExists();
      if (!exists) {
        throw new Error('Repository does not exist. Please initialize it first.');
      }
      throw error;
    }
  }
  
  /**
   * Check if the repository exists for the current user
   * @returns Whether repository exists
   */
  public async checkRepositoryExists(): Promise<boolean> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }
    
    try {
      const accessStatus = await (this.uordbManager as any).repositoryService.checkRepositoryAccess(
        this.currentUser.username
      );
      return accessStatus.exists;
    } catch (error) {
      console.error('Error checking repository existence:', error);
      return false;
    }
  }

  public async handleRequest(method: string, params: any): Promise<any> {
    switch (method) {
      case 'uor.resolve':
        return this.resolveUOR(params.reference);
      case 'uor.create':
        return this.createUOR(params.type, params.data);
      case 'uor.update':
        return this.updateUOR(params.reference, params.data);
      case 'uor.delete':
        return this.deleteUOR(params.reference);
      case 'uordb.list':
        return this.listUORObjects(params.type);
      case 'uordb.search':
        return this.searchUORObjects(params.query);
      case 'uordb.status':
        return this.getRepositoryStatus();
      case 'uordb.initialize':
        return this.initializeRepository();
      case 'setAuthentication':
        this.setAuthentication(params.username, params.token);
        return true;
      case 'clearAuthentication':
        this.clearAuthentication();
        return true;
      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }

  private async resolveUOR(reference: string): Promise<StoredUORObject | null> {
    // Try to resolve from GitHub repository if authenticated
    if (this.uordbManager && this.currentUser) {
      // Extract type and ID from the reference
      const parts = reference.split('/');
      const type = parts[2]; // Assuming format uor://type/id
      const id = parts.slice(3).join('/');
      
      const object = await this.uordbManager.getObject(this.currentUser.username, type, id);
      
      if (object) {
        return {
          type: object.type,
          data: object,
          reference: reference
        };
      }
    }
    
    // Fallback to local storage for offline or non-GitHub authenticated mode
    const storedData = localStorage.getItem(`uor:${reference}`);
    
    if (!storedData) {
      return null;
    }

    try {
      return JSON.parse(storedData) as StoredUORObject;
    } catch (error) {
      console.error('Error parsing stored UOR:', error);
      return null;
    }
  }

  private async createUOR(type: string, data: any): Promise<string> {
    // Generate a reference 
    const reference = `uor://${type}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Create UOR object
    const uorObject = {
      id: reference,
      type: type,
      ...data
    };
    
    // Store in GitHub if authenticated
    if (this.uordbManager && this.currentUser) {
      await this.uordbManager.storeObject(this.currentUser.username, uorObject);
    } else {
      // Fallback to localStorage for offline mode
      localStorage.setItem(`uor:${reference}`, JSON.stringify({
        type,
        data: uorObject,
        reference
      }));
    }

    return reference;
  }

  private async updateUOR(reference: string, data: any): Promise<boolean> {
    if (this.uordbManager && this.currentUser) {
      // Extract type and ID from the reference
      const parts = reference.split('/');
      const type = parts[2]; // Assuming format uor://type/id
      const id = parts.slice(3).join('/');
      
      // Get existing object
      const existingObject = await this.uordbManager.getObject(this.currentUser.username, type, id);
      
      if (existingObject) {
        // Update the object
        const updatedObject = {
          ...existingObject,
          ...data,
          id: reference,
          type: type
        };
        
        await this.uordbManager.storeObject(this.currentUser.username, updatedObject);
        return true;
      }
    }
    
    // Fallback to localStorage
    const existingData = localStorage.getItem(`uor:${reference}`);
    
    if (!existingData) {
      return false;
    }

    try {
      const uorObject = JSON.parse(existingData) as StoredUORObject;
      uorObject.data = { ...uorObject.data, ...data };
      
      localStorage.setItem(`uor:${reference}`, JSON.stringify(uorObject));
      return true;
    } catch (error) {
      console.error('Error updating UOR:', error);
      return false;
    }
  }

  private async deleteUOR(reference: string): Promise<boolean> {
    if (this.uordbManager && this.currentUser) {
      // Extract type and ID from the reference
      const parts = reference.split('/');
      const type = parts[2]; // Assuming format uor://type/id
      const id = parts.slice(3).join('/');
      
      try {
        await this.uordbManager.deleteObject(this.currentUser.username, type, id);
        return true;
      } catch (error) {
        console.error('Error deleting UOR from GitHub:', error);
        // Fall back to local storage deletion if GitHub deletion fails
      }
    }
    
    // Fallback or complementary localStorage removal
    const existingData = localStorage.getItem(`uor:${reference}`);
    
    if (!existingData) {
      return false;
    }

    localStorage.removeItem(`uor:${reference}`);
    return true;
  }

  private async listUORObjects(type: string): Promise<any[]> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }

    return await this.uordbManager.listObjects(this.currentUser.username, type);
  }

  private async searchUORObjects(query: string): Promise<any[]> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }

    return await this.uordbManager.searchObjects(this.currentUser.username, query);
  }
}

export default MCPServer.getInstance();