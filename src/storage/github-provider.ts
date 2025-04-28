/**
 * GitHub Storage Provider Implementation
 * Implements storage provider interface using GitHub
 */

import { BaseStorageProvider, StorageProviderConfig, StorageResult } from './storage-provider';
import { UORObject } from '../github/uordb-manager';
import { GitHubClient } from '../github/github-client';
import { RepositoryService } from '../github/repository-service';

/**
 * GitHub storage provider implementation
 */
export class GitHubStorageProvider extends BaseStorageProvider {
  private githubClient: GitHubClient;
  private repositoryService: RepositoryService;
  
  constructor() {
    super();
    this.githubClient = new GitHubClient();
    this.repositoryService = new RepositoryService(this.githubClient);
  }
  
  /**
   * Initialize the GitHub storage provider
   * @param config Provider configuration
   */
  async initialize(config: StorageProviderConfig): Promise<boolean> {
    if (config.type !== 'github') {
      throw new Error('Invalid provider type for GitHubStorageProvider');
    }
    
    this.config = config;
    
    if (config.authentication) {
      const { type, credentials } = config.authentication;
      
      if (type === 'token' && credentials.token) {
        this.githubClient.setToken(credentials.token);
        return true;
      } else {
        throw new Error('Invalid authentication type or missing credentials');
      }
    }
    
    return true;
  }
  
  /**
   * Check if the GitHub provider is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const user = await this.githubClient.getCurrentUser();
      return !!user;
    } catch (error) {
      console.error('GitHub provider is not available:', error);
      return false;
    }
  }
  
  /**
   * Store a UOR object in GitHub
   * @param username User namespace
   * @param object UOR object to store
   */
  async storeObject(username: string, object: UORObject): Promise<StorageResult> {
    try {
      if (!object.id || !object.type) {
        throw new Error('UOR object must have id and type properties');
      }
      
      const category = this.getCategoryPath(object.type);
      const filename = this.getObjectFilename(object.id);
      const path = `${category}/${filename}`;
      
      const existingFile = await this.fetchFile(username, path);
      
      const formattedObject = {
        ...object,
        lastModified: new Date().toISOString()
      };
      
      const content = JSON.stringify(formattedObject, null, 2);
      
      const success = await this.saveFile(username, path, content, existingFile?.sha);
      
      if (success) {
        await this.repositoryService.updateLastSyncTime(username);
        
        return {
          success: true,
          identifier: path
        };
      } else {
        return {
          success: false,
          error: 'Failed to store object in GitHub'
        };
      }
    } catch (error) {
      const err = error as Error;
      console.error('Error storing UOR object in GitHub:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }
  
  /**
   * Retrieve a UOR object from GitHub
   * @param username User namespace
   * @param type Object type
   * @param id Object ID
   */
  async getObject(username: string, type: string, id: string): Promise<UORObject | null> {
    try {
      const category = this.getCategoryPath(type);
      const filename = this.getObjectFilename(id);
      const path = `${category}/${filename}`;
      
      const file = await this.fetchFile(username, path);
      
      if (!file) {
        return null;
      }
      
      return JSON.parse(file.content) as UORObject;
    } catch (error) {
      console.error('Error getting UOR object from GitHub:', error);
      return null;
    }
  }
  
  /**
   * Delete a UOR object from GitHub
   * @param username User namespace
   * @param type Object type
   * @param id Object ID
   */
  async deleteObject(username: string, type: string, id: string): Promise<StorageResult> {
    try {
      const category = this.getCategoryPath(type);
      const filename = this.getObjectFilename(id);
      const path = `${category}/${filename}`;
      
      const file = await this.fetchFile(username, path);
      
      if (!file) {
        return {
          success: false,
          error: 'Object not found'
        };
      }
      
      this.githubClient.setOwner(username);
      await this.githubClient.deleteFile(path, `Delete ${path}`, file.sha);
      
      await this.repositoryService.updateLastSyncTime(username);
      
      return {
        success: true
      };
    } catch (error) {
      const err = error as Error;
      console.error('Error deleting UOR object from GitHub:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }
  
  /**
   * List UOR objects of a specific type from GitHub
   * @param username User namespace
   * @param type Object type
   */
  async listObjects(username: string, type: string): Promise<UORObject[]> {
    try {
      const category = this.getCategoryPath(type);
      
      this.githubClient.setOwner(username);
      const files = await this.githubClient.listFiles(category);
      
      if (!files) {
        return [];
      }
      
      const jsonFiles = files.filter(file => 
        file.type === 'file' && file.name !== '.gitkeep' && file.name.endsWith('.json')
      );
      
      const objects: UORObject[] = [];
      
      for (const file of jsonFiles) {
        const fileData = await this.githubClient.getFile(`${category}/${file.name}`);
        if (fileData) {
          try {
            const content = JSON.parse(fileData.content);
            objects.push(content);
          } catch (parseErr) {
            console.error(`Error parsing ${file.name}:`, parseErr);
          }
        }
      }
      
      return objects;
    } catch (error) {
      console.error(`Error listing UOR objects of type ${type} from GitHub:`, error);
      return [];
    }
  }
  
  /**
   * Store large content in GitHub
   * @param username User namespace
   * @param content Content to store
   * @param metadata Content metadata
   */
  async storeLargeContent(
    username: string, 
    content: Buffer | string, 
    metadata: Record<string, any>
  ): Promise<StorageResult> {
    try {
      const contentStr = content instanceof Buffer ? content.toString('base64') : content;
      const contentType = content instanceof Buffer ? 'binary' : 'text';
      
      const filename = `${metadata.id || Date.now()}.${metadata.extension || 'dat'}`;
      const path = `artifacts/${filename}`;
      
      this.githubClient.setOwner(username);
      const success = await this.githubClient.createOrUpdateFile(
        path,
        `Store artifact ${filename}`,
        contentStr,
        undefined
      );
      
      if (!success) {
        return {
          success: false,
          error: 'Failed to store large content in GitHub'
        };
      }
      
      const metadataPath = `artifacts/${filename}.meta.json`;
      const metadataContent = JSON.stringify({
        ...metadata,
        contentType,
        path,
        createdAt: new Date().toISOString()
      }, null, 2);
      
      await this.githubClient.createOrUpdateFile(
        metadataPath,
        `Store artifact metadata for ${filename}`,
        metadataContent
      );
      
      return {
        success: true,
        identifier: path
      };
    } catch (error) {
      const err = error as Error;
      console.error('Error storing large content in GitHub:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }
  
  /**
   * Retrieve large content from GitHub
   * @param username User namespace
   * @param identifier Content identifier
   */
  async getLargeContent(
    username: string, 
    identifier: string
  ): Promise<{content: Buffer | string, metadata: Record<string, any>} | null> {
    try {
      this.githubClient.setOwner(username);
      const file = await this.githubClient.getFile(identifier);
      
      if (!file) {
        return null;
      }
      
      const metadataPath = `${identifier}.meta.json`;
      const metadataFile = await this.githubClient.getFile(metadataPath);
      
      if (!metadataFile) {
        return null;
      }
      
      const metadata = JSON.parse(metadataFile.content);
      
      const content = metadata.contentType === 'binary' 
        ? Buffer.from(file.content, 'base64')
        : file.content;
      
      return {
        content,
        metadata
      };
    } catch (error) {
      console.error('Error retrieving large content from GitHub:', error);
      return null;
    }
  }
  
  /**
   * Get the category path for a UOR object type
   * @param type Object type
   */
  private getCategoryPath(type: string): string {
    switch (type.toLowerCase()) {
      case 'concept':
        return 'concepts';
      case 'resource':
        return 'resources';
      case 'topic':
        return 'topics';
      case 'predicate':
        return 'predicates';
      case 'resolver':
        return 'resolvers';
      case 'event':
        return 'events';
      case 'channel':
        return 'channels';
      case 'subscription':
        return 'subscriptions';
      default:
        throw new Error(`Unknown UOR object type: ${type}`);
    }
  }
  
  /**
   * Get the filename for a UOR object
   * @param id Object ID
   */
  private getObjectFilename(id: string): string {
    const cleanId = id.split('/').pop() || id;
    return `${cleanId}.json`;
  }
  
  /**
   * Fetch a file from GitHub
   * @param username User namespace
   * @param path File path
   */
  private async fetchFile(username: string, path: string): Promise<{content: string, sha: string} | null> {
    try {
      this.githubClient.setOwner(username);
      return await this.githubClient.getFile(path);
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Save a file to GitHub
   * @param username User namespace
   * @param path File path
   * @param content File content
   * @param sha File SHA (for updates)
   */
  private async saveFile(username: string, path: string, content: string, sha?: string): Promise<boolean> {
    try {
      this.githubClient.setOwner(username);
      
      const message = sha ? `Update ${path}` : `Create ${path}`;
      return await this.githubClient.createOrUpdateFile(path, message, content, sha);
    } catch (error) {
      console.error('Error saving file to GitHub:', error);
      throw error;
    }
  }
}
