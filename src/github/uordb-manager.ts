import { GitHubClient } from './github-client';
import { RepositoryService } from './repository-service';

export interface UORObject {
  id: string;
  type: string;
  canonicalRepresentation?: {
    representationType: string;
    value: any;
    coherenceNorm?: number;
  };
  primeDecomposition?: {
    primeFactors: Array<{
      id: string;
      value: any;
      multiplicity?: number;
      domain?: string;
    }>;
    decompositionMethod?: string;
  };
  observerFrame?: {
    id: string;
    type: string;
    transformationRules?: any[];
    invariantProperties?: string[];
  };
  [key: string]: any;
}

export class UORDBManager {
  private readonly repositoryService: RepositoryService;

  constructor(githubClient: GitHubClient) {
    this.repositoryService = new RepositoryService(githubClient);
  }

  async initialize(username: string): Promise<void> {
    const exists = await this.repositoryService.checkRepositoryExists(username);
    
    if (!exists) {
      await this.repositoryService.createRepository(username);
    }
    
    const hasAccess = await this.repositoryService.verifyRepositoryAccess(username);
    if (!hasAccess) {
      throw new Error('No write access to the repository. Please check your GitHub permissions.');
    }
  }

  async getRepositoryStatus(username: string) {
    return this.repositoryService.getRepositoryStatus(username);
  }

  async syncRepositoryTime(username: string) {
    await this.repositoryService.updateLastSyncTime(username);
  }

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
      default:
        throw new Error(`Unknown UOR object type: ${type}`);
    }
  }

  private getObjectFilename(id: string): string {
    // Remove any namespace prefix and convert to filename-friendly format
    const cleanId = id.split('/').pop() || id;
    return `${cleanId}.json`;
  }

  async storeObject(username: string, object: UORObject): Promise<void> {
    // Validate object has required fields
    if (!object.id || !object.type) {
      throw new Error('UOR object must have id and type properties');
    }

    const category = this.getCategoryPath(object.type);
    const filename = this.getObjectFilename(object.id);
    const path = `${category}/${filename}`;

    try {
      // Check if the file already exists
      const existingFile = await this.fetchFile(username, path);
      
      // Format the object for storage
      const formattedObject = {
        ...object,
        lastModified: new Date().toISOString()
      };
      
      // Create or update the file
      const content = JSON.stringify(formattedObject, null, 2);
      
      await this.saveFile(username, path, content, existingFile?.sha);

      // Update the last sync time
      await this.syncRepositoryTime(username);
    } catch (err) {
      const error = err as Error;
      console.error('Error storing UOR object:', error);
      throw new Error(`Failed to store UOR object: ${error.message}`);
    }
  }

  private async fetchFile(username: string, path: string): Promise<{content: string, sha: string} | null> {
    try {
      const client = this.getGitHubClient();
      client.setOwner(username);
      return await client.getFile(path);
    } catch (err) {
      // File not found, return null
      return null;
    }
  }

  private async saveFile(username: string, path: string, content: string, sha?: string): Promise<boolean> {
    try {
      const client = this.getGitHubClient();
      client.setOwner(username);
      
      const message = sha ? `Update ${path}` : `Create ${path}`;
      return await client.createOrUpdateFile(path, message, content, sha);
    } catch (err) {
      const error = err as Error;
      console.error('Error saving file:', error);
      throw error;
    }
  }

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
    } catch (err) {
      const error = err as Error;
      console.error('Error getting UOR object:', error);
      return null;
    }
  }

  async deleteObject(username: string, type: string, id: string): Promise<void> {
    try {
      const category = this.getCategoryPath(type);
      const filename = this.getObjectFilename(id);
      const path = `${category}/${filename}`;

      // Get the file's SHA
      const file = await this.fetchFile(username, path);
      
      if (!file) {
        throw new Error('Object not found');
      }

      // Delete the file
      const client = this.getGitHubClient();
      client.setOwner(username);
      await client.deleteFile(path, `Delete ${path}`, file.sha);

      // Update the last sync time
      await this.syncRepositoryTime(username);
    } catch (err) {
      const error = err as Error;
      console.error('Error deleting UOR object:', error);
      throw new Error(`Failed to delete UOR object: ${error.message}`);
    }
  }

  async listObjects(username: string, type: string): Promise<UORObject[]> {
    try {
      const category = this.getCategoryPath(type);
      
      // Get the list of files in the category directory
      const client = this.getGitHubClient();
      client.setOwner(username);
      const files = await client.listFiles(category);
      
      if (!files) {
        return [];
      }

      // Filter out .gitkeep and any other non-JSON files
      const jsonFiles = files.filter(file => 
        file.type === 'file' && file.name !== '.gitkeep' && file.name.endsWith('.json')
      );

      // Fetch the content of each file
      const objects: UORObject[] = [];
      
      for (const file of jsonFiles) {
        const fileData = await client.getFile(`${category}/${file.name}`);
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
    } catch (err) {
      const error = err as Error;
      console.error(`Error listing UOR objects of type ${type}:`, error);
      if (error.message.includes('Not Found')) {
        return [];
      }
      throw new Error(`Failed to list UOR objects: ${error.message}`);
    }
  }

  async searchObjects(username: string, query: string): Promise<UORObject[]> {
    try {
      // Get objects from all categories
      const categories = ['concept', 'resource', 'topic', 'predicate', 'resolver'];
      
      const allObjects: UORObject[] = [];
      for (const category of categories) {
        try {
          const objects = await this.listObjects(username, category);
          allObjects.push(...objects);
        } catch (categoryErr) {
          // Continue with other categories if one fails
          console.error(`Error fetching ${category} objects:`, categoryErr);
        }
      }
      
      // Simple implementation: search in stringified objects
      // A more advanced implementation would use GitHub's code search API
      const lowerQuery = query.toLowerCase();
      return allObjects.filter(obj => {
        const objString = JSON.stringify(obj).toLowerCase();
        return objString.includes(lowerQuery);
      });
    } catch (err) {
      const error = err as Error;
      console.error('Error searching UOR objects:', error);
      throw new Error(`Failed to search UOR objects: ${error.message}`);
    }
  }

  private getGitHubClient(): GitHubClient {
    return (this.repositoryService as any).githubClient as GitHubClient;
  }
}