/**
 * Mock implementation of UORDBManager for tests
 */

class MockUORDBManager {
  private repositories: Map<string, any> = new Map();
  private objects: Map<string, Map<string, any>> = new Map();

  constructor() {
    // Initialize empty data structures
    this.repositories = new Map();
    this.objects = new Map();
  }

  // Initialize a repository for a user
  async initialize(username: string): Promise<void> {
    this.repositories.set(username, {
      name: 'uordb',
      creationDate: new Date(),
      lastSyncTime: new Date(),
      objectCounts: {
        concepts: 0,
        resources: 0,
        topics: 0,
        predicates: 0,
        resolvers: 0
      }
    });
    
    // Initialize object collections
    if (!this.objects.has(username)) {
      this.objects.set(username, new Map());
    }
  }

  // Get repository status
  async getRepositoryStatus(username: string): Promise<any> {
    const repo = this.repositories.get(username);
    if (!repo) {
      throw new Error('Repository not found');
    }
    return { ...repo };
  }

  // Store an object
  async storeObject(username: string, object: any): Promise<void> {
    if (!this.objects.has(username)) {
      this.objects.set(username, new Map());
    }
    
    const userObjects = this.objects.get(username)!;
    userObjects.set(object.id, { ...object });
    
    // Update object counts
    const repo = this.repositories.get(username);
    if (repo) {
      const type = object.type.toLowerCase() + 's'; // pluralize
      if (repo.objectCounts[type] !== undefined) {
        repo.objectCounts[type]++;
      }
      repo.lastSyncTime = new Date();
    }
  }

  // Get an object
  async getObject(username: string, type: string, id: string): Promise<any | null> {
    if (!this.objects.has(username)) {
      return null;
    }
    
    const userObjects = this.objects.get(username)!;
    const objectId = `uor://${type}/${id}`;
    
    return userObjects.get(objectId) || null;
  }

  // Delete an object
  async deleteObject(username: string, type: string, id: string): Promise<void> {
    if (!this.objects.has(username)) {
      return;
    }
    
    const userObjects = this.objects.get(username)!;
    const objectId = `uor://${type}/${id}`;
    
    if (userObjects.has(objectId)) {
      userObjects.delete(objectId);
      
      // Update object counts
      const repo = this.repositories.get(username);
      if (repo) {
        const typePlural = type.toLowerCase() + 's'; // pluralize
        if (repo.objectCounts[typePlural] !== undefined && repo.objectCounts[typePlural] > 0) {
          repo.objectCounts[typePlural]--;
        }
        repo.lastSyncTime = new Date();
      }
    }
  }

  // List objects of a type
  async listObjects(username: string, type: string): Promise<any[]> {
    if (!this.objects.has(username)) {
      return [];
    }
    
    const userObjects = this.objects.get(username)!;
    const typedObjects: any[] = [];
    
    for (const [_, object] of userObjects.entries()) {
      if (object.type === type) {
        typedObjects.push({ ...object });
      }
    }
    
    return typedObjects;
  }

  // Search for objects
  async searchObjects(username: string, query: string): Promise<any[]> {
    if (!this.objects.has(username)) {
      return [];
    }
    
    const userObjects = this.objects.get(username)!;
    const results: any[] = [];
    const lowerQuery = query.toLowerCase();
    
    for (const [_, object] of userObjects.entries()) {
      // Simple search implementation - checks if any string property contains the query
      let matches = false;
      for (const key in object) {
        if (typeof object[key] === 'string' && object[key].toLowerCase().includes(lowerQuery)) {
          matches = true;
          break;
        }
      }
      
      if (matches) {
        results.push({ ...object });
      }
    }
    
    return results;
  }
}

// Create a singleton instance
const mockManager = new MockUORDBManager();

// Export the mock class
export const UORDBManager = jest.fn().mockImplementation(() => {
  return mockManager;
});