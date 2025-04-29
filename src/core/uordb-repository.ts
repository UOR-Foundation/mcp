import { UORObject } from './uor-core';
import { UORDBManager } from '../github/uordb-manager';
import mcpServer from '../mcp/mcp-server';

/**
 * UORdb Repository implementation.
 * Manages UOR objects stored in GitHub repositories.
 */
export class UORdbRepository {
  private uordbManager: UORDBManager | null = null;
  private username: string | null = null;

  constructor() {}

  /**
   * Initialize the repository for a user
   * @param username GitHub username
   */
  public async initialize(username: string): Promise<void> {
    this.username = username;

    if (!mcpServer.isAuthenticated()) {
      throw new Error('MCP Server must be authenticated before initializing UORdb Repository');
    }

    try {
      await mcpServer.initializeRepository();
    } catch (err) {
      const error = err as Error;
      console.error('Failed to initialize UORdb repository:', error);
      throw new Error(`Repository initialization failed: ${error.message}`);
    }
  }

  /**
   * Get repository status
   * @returns Repository status information
   */
  public async getStatus(): Promise<any> {
    if (!this.username) {
      throw new Error('Repository not initialized');
    }

    try {
      return await mcpServer.getRepositoryStatus();
    } catch (err) {
      const error = err as Error;
      console.error('Failed to get repository status:', error);
      throw new Error(`Failed to get repository status: ${error.message}`);
    }
  }

  /**
   * Store a UOR object in the repository
   * @param object UOR object to store
   */
  public async storeObject(object: UORObject): Promise<string> {
    if (!this.username) {
      throw new Error('Repository not initialized');
    }

    try {
      return await mcpServer.handleRequest('uor.create', {
        type: object.type,
        data: object,
      });
    } catch (err) {
      const error = err as Error;
      console.error('Failed to store UOR object:', error);
      throw new Error(`Failed to store UOR object: ${error.message}`);
    }
  }

  /**
   * Retrieve a UOR object from the repository
   * @param type Object type
   * @param id Object ID
   */
  public async getObject(type: string, id: string): Promise<UORObject | null> {
    if (!this.username) {
      throw new Error('Repository not initialized');
    }

    try {
      const reference = `uor://${type}/${id}`;
      const result = await mcpServer.handleRequest('uor.resolve', {
        reference,
      });

      if (result) {
        return result.data as any as UORObject;
      }
      return null;
    } catch (err) {
      const error = err as Error;
      console.error('Failed to get UOR object:', error);
      return null;
    }
  }

  /**
   * Update a UOR object in the repository
   * @param reference Object reference
   * @param data Updated object data
   */
  public async updateObject(reference: string, data: any): Promise<boolean> {
    if (!this.username) {
      throw new Error('Repository not initialized');
    }

    try {
      return await mcpServer.handleRequest('uor.update', {
        reference,
        data,
      });
    } catch (err) {
      const error = err as Error;
      console.error('Failed to update UOR object:', error);
      throw new Error(`Failed to update UOR object: ${error.message}`);
    }
  }

  /**
   * Delete a UOR object from the repository
   * @param reference Object reference
   */
  public async deleteObject(reference: string): Promise<boolean> {
    if (!this.username) {
      throw new Error('Repository not initialized');
    }

    try {
      return await mcpServer.handleRequest('uor.delete', {
        reference,
      });
    } catch (err) {
      const error = err as Error;
      console.error('Failed to delete UOR object:', error);
      throw new Error(`Failed to delete UOR object: ${error.message}`);
    }
  }

  /**
   * List UOR objects of a specific type
   * @param type Object type
   */
  public async listObjects(type: string): Promise<any[]> {
    if (!this.username) {
      throw new Error('Repository not initialized');
    }

    try {
      return await mcpServer.handleRequest('uordb.list', { type });
    } catch (err) {
      const error = err as Error;
      console.error(`Failed to list UOR objects of type ${type}:`, error);
      throw new Error(`Failed to list UOR objects: ${error.message}`);
    }
  }

  /**
   * Search for UOR objects
   * @param query Search query
   */
  public async searchObjects(query: string): Promise<any[]> {
    if (!this.username) {
      throw new Error('Repository not initialized');
    }

    try {
      return await mcpServer.handleRequest('uordb.search', { query });
    } catch (err) {
      const error = err as Error;
      console.error('Failed to search UOR objects:', error);
      throw new Error(`Failed to search UOR objects: ${error.message}`);
    }
  }
}
