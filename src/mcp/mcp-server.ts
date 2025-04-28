import { UORObject } from '../core/uor-core';
import { GitHubClient } from '../github/github-client';
import { UORDBManager } from '../github/uordb-manager';
import { StorageProvider, StorageProviderConfig } from '../storage/storage-provider';
import { GitHubStorageProvider } from '../storage/github-provider';
import { IPFSStorageProvider } from '../storage/ipfs-provider';

// Custom interface for stored UOR objects
interface StoredUORObject {
  type: string;
  data: any;
  reference: string;
}

/**
 * Storage configuration for the MCP server
 */
interface StorageConfig {
  preferredProvider: 'github' | 'ipfs';
  ipfsConfig?: StorageProviderConfig;
  githubConfig?: StorageProviderConfig;
}

// Client-side compatible MCP server implementation
export class MCPServer {
  private static instance: MCPServer;
  private uordbManager: UORDBManager | null = null;
  private currentUser: { username: string, token: string } | null = null;
  private githubProvider: GitHubStorageProvider | null = null;
  private ipfsProvider: IPFSStorageProvider | null = null;
  private preferredProvider: 'github' | 'ipfs' = 'github';

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
    
    // Initialize GitHub storage provider
    this.githubProvider = new GitHubStorageProvider();
    this.githubProvider.initialize({
      type: 'github',
      authentication: {
        type: 'token',
        credentials: { token }
      }
    });
    
    // Initialize IPFS provider if configured
    this.initializeIPFSProvider();
  }
  
  /**
   * Configure storage providers
   * @param config Storage configuration
   */
  public configureStorage(config: StorageConfig): void {
    this.preferredProvider = config.preferredProvider;
    
    if (config.ipfsConfig && this.currentUser) {
      this.initializeIPFSProvider(config.ipfsConfig);
    }
  }
  
  /**
   * Initialize IPFS provider with optional configuration
   * @param config IPFS provider configuration
   */
  private async initializeIPFSProvider(config?: StorageProviderConfig): Promise<void> {
    if (!this.currentUser) {
      return;
    }
    
    try {
      this.ipfsProvider = new IPFSStorageProvider();
      
      const ipfsConfig = config || {
        type: 'ipfs',
        endpoint: 'https://ipfs.infura.io:5001',
        options: {
          timeout: 10000
        }
      };
      
      await this.ipfsProvider.initialize(ipfsConfig);
      
      // Check if IPFS is available
      const available = await this.ipfsProvider.isAvailable();
      if (!available) {
        console.warn('IPFS provider is not available. Falling back to GitHub provider.');
        this.preferredProvider = 'github';
      }
    } catch (error) {
      console.error('Failed to initialize IPFS provider:', error);
      this.ipfsProvider = null;
      this.preferredProvider = 'github';
    }
  }

  public clearAuthentication(): void {
    this.currentUser = null;
    this.uordbManager = null;
    this.githubProvider = null;
    this.ipfsProvider = null;
    this.preferredProvider = 'github';
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
      case 'storage.configure':
        return this.configureStorage(params.config);
      case 'storage.getPreferred':
        return { provider: this.preferredProvider };
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
    if (!this.currentUser) {
      // Fallback to local storage for offline mode
      return this.resolveFromLocalStorage(reference);
    }
    
    // Extract type and ID from the reference
    const parts = reference.split('/');
    const type = parts[2]; // Assuming format uor://type/id
    const id = parts.slice(3).join('/');
    
    // Try to resolve using the preferred provider
    if (this.preferredProvider === 'ipfs' && this.ipfsProvider) {
      try {
        const object = await this.ipfsProvider.getObject(this.currentUser.username, type, id);
        
        if (object) {
          return {
            type: object.type,
            data: object,
            reference: reference
          };
        }
      } catch (error) {
        console.warn(`IPFS provider failed to resolve ${reference}, falling back to GitHub:`, error);
        // Fall back to GitHub provider
      }
    }
    
    if (this.githubProvider) {
      try {
        const object = await this.githubProvider.getObject(this.currentUser.username, type, id);
        
        if (object) {
          return {
            type: object.type,
            data: object,
            reference: reference
          };
        }
      } catch (error) {
        console.error(`GitHub provider failed to resolve ${reference}:`, error);
      }
    }
    
    // Fallback to UORDBManager for backward compatibility
    if (this.uordbManager) {
      const object = await this.uordbManager.getObject(this.currentUser.username, type, id);
      
      if (object) {
        return {
          type: object.type,
          data: object,
          reference: reference
        };
      }
    }
    
    // Fallback to local storage as last resort
    return this.resolveFromLocalStorage(reference);
  }
  
  /**
   * Resolve UOR from local storage
   * @param reference UOR reference
   */
  private resolveFromLocalStorage(reference: string): StoredUORObject | null {
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
    
    if (!this.currentUser) {
      // Fallback to localStorage for offline mode
      localStorage.setItem(`uor:${reference}`, JSON.stringify({
        type,
        data: uorObject,
        reference
      }));
      return reference;
    }
    
    // Store using the preferred provider
    let stored = false;
    
    if (this.preferredProvider === 'ipfs' && this.ipfsProvider) {
      try {
        const result = await this.ipfsProvider.storeObject(this.currentUser.username, uorObject);
        stored = result.success;
        
        if (!stored) {
          console.warn(`IPFS provider failed to store ${reference}, falling back to GitHub:`, result.error);
        }
      } catch (error) {
        console.warn(`IPFS provider failed to store ${reference}, falling back to GitHub:`, error);
      }
    }
    
    if (!stored && this.githubProvider) {
      try {
        const result = await this.githubProvider.storeObject(this.currentUser.username, uorObject);
        stored = result.success;
        
        if (!stored) {
          console.error(`GitHub provider failed to store ${reference}:`, result.error);
        }
      } catch (error) {
        console.error(`GitHub provider failed to store ${reference}:`, error);
      }
    }
    
    // Fallback to UORDBManager for backward compatibility
    if (!stored && this.uordbManager) {
      await this.uordbManager.storeObject(this.currentUser.username, uorObject);
    }

    return reference;
  }

  private async updateUOR(reference: string, data: any): Promise<boolean> {
    if (!this.currentUser) {
      // Fallback to localStorage for offline mode
      return this.updateInLocalStorage(reference, data);
    }
    
    // Extract type and ID from the reference
    const parts = reference.split('/');
    const type = parts[2]; // Assuming format uor://type/id
    const id = parts.slice(3).join('/');
    
    // Get existing object using resolveUOR (which already handles provider fallback)
    const existingObject = await this.resolveUOR(reference);
    
    if (!existingObject) {
      return false;
    }
    
    // Update the object
    const updatedObject = {
      ...existingObject.data,
      ...data,
      id: reference,
      type: type
    };
    
    // Update using the preferred provider
    let updated = false;
    
    if (this.preferredProvider === 'ipfs' && this.ipfsProvider) {
      try {
        const result = await this.ipfsProvider.storeObject(this.currentUser.username, updatedObject);
        updated = result.success;
        
        if (!updated) {
          console.warn(`IPFS provider failed to update ${reference}, falling back to GitHub:`, result.error);
        }
      } catch (error) {
        console.warn(`IPFS provider failed to update ${reference}, falling back to GitHub:`, error);
      }
    }
    
    if (!updated && this.githubProvider) {
      try {
        const result = await this.githubProvider.storeObject(this.currentUser.username, updatedObject);
        updated = result.success;
        
        if (!updated) {
          console.error(`GitHub provider failed to update ${reference}:`, result.error);
        }
      } catch (error) {
        console.error(`GitHub provider failed to update ${reference}:`, error);
      }
    }
    
    // Fallback to UORDBManager for backward compatibility
    if (!updated && this.uordbManager) {
      await this.uordbManager.storeObject(this.currentUser.username, updatedObject);
      updated = true;
    }
    
    return updated;
  }
  
  /**
   * Update UOR in local storage
   * @param reference UOR reference
   * @param data Updated data
   */
  private updateInLocalStorage(reference: string, data: any): boolean {
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
      console.error('Error updating UOR in localStorage:', error);
      return false;
    }
  }

  private async deleteUOR(reference: string): Promise<boolean> {
    if (!this.currentUser) {
      // Fallback to localStorage for offline mode
      return this.deleteFromLocalStorage(reference);
    }
    
    // Extract type and ID from the reference
    const parts = reference.split('/');
    const type = parts[2]; // Assuming format uor://type/id
    const id = parts.slice(3).join('/');
    
    // Delete using the preferred provider
    let deleted = false;
    
    if (this.preferredProvider === 'ipfs' && this.ipfsProvider) {
      try {
        const result = await this.ipfsProvider.deleteObject(this.currentUser.username, type, id);
        deleted = result.success;
        
        if (!deleted) {
          console.warn(`IPFS provider failed to delete ${reference}, falling back to GitHub:`, result.error);
        }
      } catch (error) {
        console.warn(`IPFS provider failed to delete ${reference}, falling back to GitHub:`, error);
      }
    }
    
    if (!deleted && this.githubProvider) {
      try {
        const result = await this.githubProvider.deleteObject(this.currentUser.username, type, id);
        deleted = result.success;
        
        if (!deleted) {
          console.error(`GitHub provider failed to delete ${reference}:`, result.error);
        }
      } catch (error) {
        console.error(`GitHub provider failed to delete ${reference}:`, error);
      }
    }
    
    // Fallback to UORDBManager for backward compatibility
    if (!deleted && this.uordbManager) {
      try {
        await this.uordbManager.deleteObject(this.currentUser.username, type, id);
        deleted = true;
      } catch (error) {
        console.error(`UORDBManager failed to delete ${reference}:`, error);
      }
    }
    
    this.deleteFromLocalStorage(reference);
    
    return deleted;
  }
  
  /**
   * Delete UOR from local storage
   * @param reference UOR reference
   */
  private deleteFromLocalStorage(reference: string): boolean {
    const existingData = localStorage.getItem(`uor:${reference}`);
    
    if (!existingData) {
      return false;
    }

    localStorage.removeItem(`uor:${reference}`);
    return true;
  }

  private async listUORObjects(type: string): Promise<any[]> {
    if (!this.currentUser) {
      throw new Error('Not authenticated');
    }
    
    // List objects using the preferred provider
    if (this.preferredProvider === 'ipfs' && this.ipfsProvider) {
      try {
        const objects = await this.ipfsProvider.listObjects(this.currentUser.username, type);
        if (objects && objects.length > 0) {
          return objects;
        }
      } catch (error) {
        console.warn(`IPFS provider failed to list objects of type ${type}, falling back to GitHub:`, error);
      }
    }
    
    if (this.githubProvider) {
      try {
        const objects = await this.githubProvider.listObjects(this.currentUser.username, type);
        if (objects && objects.length > 0) {
          return objects;
        }
      } catch (error) {
        console.error(`GitHub provider failed to list objects of type ${type}:`, error);
      }
    }
    
    // Fallback to UORDBManager for backward compatibility
    if (this.uordbManager) {
      return await this.uordbManager.listObjects(this.currentUser.username, type);
    }
    
    return [];
  }

  private async searchUORObjects(query: string): Promise<any[]> {
    if (!this.currentUser) {
      throw new Error('Not authenticated');
    }
    
    // Future enhancement: implement search in storage providers
    if (this.uordbManager) {
      return await this.uordbManager.searchObjects(this.currentUser.username, query);
    }
    
    return [];
  }
}

export default MCPServer.getInstance();
