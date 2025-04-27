import { GitHubClient } from './github-client';

export interface RepositoryStructure {
  directories: string[];
  files: { path: string; content: string }[];
}

export interface RepositoryStatus {
  name: string;
  creationDate: Date;
  lastSyncTime: Date;
  objectCounts: {
    concepts: number;
    resources: number;
    topics: number;
    predicates: number;
    resolvers: number;
    [key: string]: number;
  };
}

export interface DirectoryCounts {
  concepts: number;
  resources: number;
  topics: number;
  predicates: number;
  resolvers: number;
  [key: string]: number;
}

export class RepositoryService {
  private static readonly REPO_NAME = 'uordb';
  private static readonly REPO_DESCRIPTION = 'Universal Object Reference Database';
  private static readonly INITIAL_STRUCTURE: RepositoryStructure = {
    directories: [
      'concepts',
      'resources',
      'topics',
      'predicates',
      'resolvers',
    ],
    files: [
      {
        path: 'README.md',
        content: `# Universal Object Reference Database (UORDB)

This repository contains your personal Universal Object Reference Database.
It's managed by the UOR-MCP server and stores your UOR objects in a structured format.

## Structure

- \`concepts/\`: Core concept definitions using the canonical representation format
- \`resources/\`: Resource definitions and metadata
- \`topics/\`: Topic hierarchies and relationships
- \`predicates/\`: Predicate definitions for relationships between concepts
- \`resolvers/\`: Custom namespace resolvers

## Usage

This repository is designed to be accessed through the UOR-MCP server interface.
Direct modifications are not recommended unless you understand the UOR data format.
`
      },
      {
        path: 'index.json',
        content: JSON.stringify({
          name: 'uordb',
          description: 'Universal Object Reference Database',
          version: '1.0.0',
          created: new Date().toISOString(),
          lastSync: new Date().toISOString(),
          schema: {
            version: '1.0.0',
            uorCore: 'https://uor-foundation.org/schemas/core/uor-core.json',
            canonicalRepresentation: 'https://uor-foundation.org/schemas/representations/canonical-representation.json',
            coherenceMeasure: 'https://uor-foundation.org/schemas/coherence/coherence-measure.json',
            primeCoordinateSystem: 'https://uor-foundation.org/schemas/prime-coordinates/prime-coordinate-system.json',
            observerFrame: 'https://uor-foundation.org/schemas/observer-frames/observer-frame.json'
          }
        }, null, 2)
      }
    ]
  };

  constructor(private readonly githubClient: GitHubClient) {
    // Set the repository owner and repo to use
    this.githubClient.setOwner(this.getUsername());
  }

  private getUsername(): string {
    // This is a placeholder - in a real implementation, 
    // we would get the username from authentication
    return 'anonymous';
  }

  async checkRepositoryExists(username: string): Promise<boolean> {
    this.githubClient.setOwner(username);
    return await this.githubClient.repositoryExists();
  }

  async createRepository(username: string): Promise<void> {
    this.githubClient.setOwner(username);
    
    // Create the repository with initial structure
    await this.githubClient.ensureRepositoryExists();
    
    // Initialize the repository structure
    await this.initializeRepositoryStructure(username);
  }

  private async initializeRepositoryStructure(username: string): Promise<void> {
    this.githubClient.setOwner(username);
    const structure = RepositoryService.INITIAL_STRUCTURE;
    
    // Create directories with .gitkeep files
    for (const dir of structure.directories) {
      await this.githubClient.createOrUpdateFile(
        `${dir}/.gitkeep`,
        `Initialize ${dir} directory`,
        ''
      );
    }
    
    // Create initial files
    for (const file of structure.files) {
      await this.githubClient.createOrUpdateFile(
        file.path,
        `Add ${file.path}`,
        file.content
      );
    }
  }

  async verifyRepositoryAccess(username: string): Promise<boolean> {
    try {
      this.githubClient.setOwner(username);
      
      // Check if we can access the repository
      const exists = await this.githubClient.repositoryExists();
      return exists;
    } catch (err) {
      const error = err as Error;
      console.error('Error verifying repository access:', error);
      return false;
    }
  }

  async getRepositoryStatus(username: string): Promise<RepositoryStatus> {
    this.githubClient.setOwner(username);
    
    // Get repository information
    const repoResponse = await this.githubClient.getFile('index.json');
    
    if (!repoResponse) {
      throw new Error('Repository index.json not found');
    }
    
    const indexContent = JSON.parse(repoResponse.content);
    
    // Count objects in each category
    const counts = await this.countRepositoryObjects(username);
    
    return {
      name: indexContent.name || 'uordb',
      creationDate: new Date(indexContent.created),
      lastSyncTime: new Date(indexContent.lastSync),
      objectCounts: counts
    };
  }
  
  private async countRepositoryObjects(username: string): Promise<DirectoryCounts> {
    this.githubClient.setOwner(username);
    const counts: DirectoryCounts = {
      concepts: 0,
      resources: 0,
      topics: 0,
      predicates: 0,
      resolvers: 0
    };
    
    // Count files in each directory (excluding .gitkeep)
    for (const dir of Object.keys(counts)) {
      try {
        const files = await this.githubClient.listFiles(dir);
        
        if (files) {
          counts[dir] = files
            .filter(item => item.type === 'file' && item.name !== '.gitkeep')
            .length;
        }
      } catch (err) {
        const error = err as Error;
        console.error(`Error counting ${dir}:`, error);
      }
    }
    
    return counts;
  }
  
  async updateLastSyncTime(username: string): Promise<void> {
    this.githubClient.setOwner(username);
    
    // Get the current index.json
    const indexFile = await this.githubClient.getFile('index.json');
    
    if (!indexFile) {
      throw new Error('index.json not found');
    }
    
    const indexContent = JSON.parse(indexFile.content);
    
    // Update the lastSync time
    indexContent.lastSync = new Date().toISOString();
    
    // Update the file
    await this.githubClient.createOrUpdateFile(
      'index.json',
      'Update repository sync time',
      JSON.stringify(indexContent, null, 2),
      indexFile.sha
    );
  }
}