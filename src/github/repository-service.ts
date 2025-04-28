import { GitHubClient } from './github-client';

export interface RepositoryStructure {
  directories: string[];
  files: { path: string; content: string }[];
}

export interface RepositoryStatus {
  name: string;
  owner: string;
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

export interface RepositoryAccessStatus {
  exists: boolean;
  hasWriteAccess: boolean;
  permissions?: {
    admin: boolean;
    push: boolean;
    pull: boolean;
  };
  error?: string;
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
    // githubClient owner will be set per-operation
  }

  async checkRepositoryExists(username: string): Promise<boolean> {
    this.githubClient.setOwner(username);
    return await this.githubClient.repositoryExists();
  }
  
  /**
   * Check if the repository exists and verify access permissions
   * @param username Repository owner username
   * @returns Repository access status
   */
  async checkRepositoryAccess(username: string): Promise<RepositoryAccessStatus> {
    this.githubClient.setOwner(username);
    
    try {
      // First check if the repository exists
      const exists = await this.githubClient.repositoryExists();
      
      if (!exists) {
        return {
          exists: false,
          hasWriteAccess: false
        };
      }
      
      // Get repository permissions
      const repoDetails = await this.githubClient.request(
        `/repos/${username}/${RepositoryService.REPO_NAME}`
      );
      
      // Extract permission information
      const permissions = repoDetails.permissions || {
        admin: false,
        push: false,
        pull: true
      };
      
      return {
        exists: true,
        hasWriteAccess: permissions.push || permissions.admin,
        permissions
      };
    } catch (error) {
      console.error('Error checking repository access:', error);
      return {
        exists: false,
        hasWriteAccess: false,
        error: error instanceof Error ? error.message : 'Unknown error checking repository'
      };
    }
  }

  async createRepository(username: string): Promise<boolean> {
    this.githubClient.setOwner(username);
    
    try {
      // Check if repository already exists
      const exists = await this.githubClient.repositoryExists();
      
      if (exists) {
        // Repository exists, verify structure
        const structureVerification = await this.verifyRepositoryStructure(username);
        
        if (!structureVerification.isValid) {
          console.log('Repository exists but structure is invalid, repairing...');
          // Repair missing directories and files
          await this.repairRepositoryStructure(
            username, 
            structureVerification.missingDirectories, 
            structureVerification.missingFiles
          );
        }
        
        return true;
      }
      
      // Create the repository with initial structure
      const repoCreated = await this.githubClient.ensureRepositoryExists();
      
      if (!repoCreated) {
        console.error('Failed to create repository');
        return false;
      }
      
      // Initialize the repository structure
      await this.initializeRepositoryStructure(username);
      return true;
    } catch (error) {
      console.error('Error creating repository:', error);
      return false;
    }
  }
  
  /**
   * Repair repository structure by adding missing directories and files
   * @param username Repository owner username
   * @param missingDirectories List of missing directories
   * @param missingFiles List of missing files
   */
  private async repairRepositoryStructure(
    username: string,
    missingDirectories: string[],
    missingFiles: string[]
  ): Promise<void> {
    this.githubClient.setOwner(username);
    
    // Create missing directories
    for (const dir of missingDirectories) {
      await this.githubClient.createOrUpdateFile(
        `${dir}/.gitkeep`,
        `Initialize ${dir} directory`,
        ''
      );
    }
    
    // Create missing files
    const structure = RepositoryService.INITIAL_STRUCTURE;
    for (const filePath of missingFiles) {
      const fileConfig = structure.files.find(f => f.path === filePath);
      if (fileConfig) {
        await this.githubClient.createOrUpdateFile(
          fileConfig.path,
          `Add ${fileConfig.path}`,
          fileConfig.content
        );
      }
    }
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
      const accessStatus = await this.checkRepositoryAccess(username);
      return accessStatus.exists && accessStatus.hasWriteAccess;
    } catch (err) {
      const error = err as Error;
      console.error('Error verifying repository access:', error);
      return false;
    }
  }
  
  /**
   * Check if the repository structure is valid
   * @param username Repository owner username
   * @returns Object with validation results
   */
  async verifyRepositoryStructure(username: string): Promise<{
    isValid: boolean;
    missingDirectories: string[];
    missingFiles: string[];
  }> {
    this.githubClient.setOwner(username);
    
    const expectedStructure = RepositoryService.INITIAL_STRUCTURE;
    const missingDirectories: string[] = [];
    const missingFiles: string[] = [];
    
    // Check directories
    for (const dir of expectedStructure.directories) {
      try {
        const files = await this.githubClient.listFiles(dir);
        if (!files) {
          missingDirectories.push(dir);
        }
      } catch (error) {
        // Directory does not exist or not accessible
        missingDirectories.push(dir);
      }
    }
    
    // Check required files
    for (const file of expectedStructure.files) {
      try {
        const fileContent = await this.githubClient.getFile(file.path);
        if (!fileContent) {
          missingFiles.push(file.path);
        }
      } catch (error) {
        // File does not exist or not accessible
        missingFiles.push(file.path);
      }
    }
    
    return {
      isValid: missingDirectories.length === 0 && missingFiles.length === 0,
      missingDirectories,
      missingFiles
    };
  }

  async getRepositoryStatus(username: string): Promise<RepositoryStatus> {
    this.githubClient.setOwner(username);
    
    try {
      // Get repository information
      const repoResponse = await this.githubClient.getFile('index.json');
      
      if (!repoResponse) {
        throw new Error('Repository index.json not found');
      }
      
      const indexContent = JSON.parse(repoResponse.content);
      
      // Get more detailed repository information from GitHub API
      const repoDetails = await this.githubClient.request(
        `/repos/${username}/${RepositoryService.REPO_NAME}`
      );
      
      // Count objects in each category
      const counts = await this.countRepositoryObjects(username);
      
      return {
        name: indexContent.name || 'uordb',
        owner: username,
        creationDate: new Date(indexContent.created || repoDetails.created_at),
        lastSyncTime: new Date(indexContent.lastSync || Date.now()),
        objectCounts: counts
      };
    } catch (error) {
      console.error('Error getting repository status:', error);
      
      // If index.json not found but repository exists, create a minimal default status
      const exists = await this.githubClient.repositoryExists();
      
      if (exists) {
        // Get repository details from GitHub API
        try {
          const repoDetails = await this.githubClient.request(
            `/repos/${username}/${RepositoryService.REPO_NAME}`
          );
          
          // Create a default status
          const counts = await this.countRepositoryObjects(username);
          
          return {
            name: RepositoryService.REPO_NAME,
            owner: username,
            creationDate: new Date(repoDetails.created_at),
            lastSyncTime: new Date(),
            objectCounts: counts
          };
        } catch (apiError) {
          console.error('Failed to get repository details from API:', apiError);
          throw new Error('Repository exists but status information is unavailable');
        }
      }
      
      throw new Error('Repository not found or not accessible');
    }
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