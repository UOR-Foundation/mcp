/**
 * IPFS Storage Provider Implementation
 * Implements storage provider interface using IPFS
 */

import { create, IPFSHTTPClient } from 'ipfs-http-client';
import { BaseStorageProvider, StorageProviderConfig, StorageResult } from './storage-provider';
import { UORObject } from '../core/uor-core';
import { GitHubStorageProvider } from './github-provider';

const DEFAULT_CHUNK_SIZE = 1024 * 1024;

/**
 * IPFS storage provider implementation
 */
export class IPFSStorageProvider extends BaseStorageProvider {
  private ipfsClient: IPFSHTTPClient | null = null;
  private githubProvider: GitHubStorageProvider | null = null;
  private chunkSize: number = DEFAULT_CHUNK_SIZE;

  constructor() {
    super();
    this.githubProvider = new GitHubStorageProvider();
  }

  /**
   * Initialize the IPFS storage provider
   * @param config Provider configuration
   */
  async initialize(config: StorageProviderConfig): Promise<boolean> {
    if (config.type !== 'ipfs') {
      throw new Error('Invalid provider type for IPFSStorageProvider');
    }

    this.config = config;

    try {
      const endpoint = config.endpoint || 'http://localhost:5001';

      if (config.authentication) {
        const { type, credentials } = config.authentication;

        if (type === 'basic' && credentials.username && credentials.password) {
          const auth =
            'Basic ' +
            Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
          this.ipfsClient = create({
            url: endpoint,
            headers: {
              authorization: auth,
            },
          });
        } else {
          throw new Error('Invalid authentication type or missing credentials');
        }
      } else {
        this.ipfsClient = create({ url: endpoint });
      }

      if (this.githubProvider) {
        await this.githubProvider.initialize({
          type: 'github',
          authentication: config.authentication,
        });
      }

      if (config.options?.chunkSize) {
        this.chunkSize = config.options.chunkSize;
      }

      await this.isAvailable();

      return true;
    } catch (error) {
      console.error('Error initializing IPFS provider:', error);
      return false;
    }
  }

  /**
   * Check if the IPFS provider is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      if (!this.ipfsClient) {
        return false;
      }

      const nodeInfo = await this.ipfsClient.id();
      return !!nodeInfo.id;
    } catch (error) {
      console.error('IPFS provider is not available:', error);
      return false;
    }
  }

  /**
   * Store a UOR object in IPFS
   * @param username User namespace
   * @param object UOR object to store
   */
  async storeObject(username: string, object: UORObject): Promise<StorageResult> {
    try {
      if (!this.ipfsClient) {
        return this.fallbackToGitHub('storeObject', username, object);
      }

      if (!object.id || !object.type) {
        throw new Error('UOR object must have id and type properties');
      }

      const formattedObject = {
        ...object,
        lastModified: new Date().toISOString(),
      };

      const content = JSON.stringify(formattedObject, null, 2);

      const result = await this.ipfsClient.add(content, {
        pin: true,
      });

      await this.storeCIDReference(username, object.type, object.id, result.cid.toString());

      return {
        success: true,
        identifier: result.cid.toString(),
      };
    } catch (error) {
      console.error('Error storing UOR object in IPFS:', error);
      return this.fallbackToGitHub('storeObject', username, object);
    }
  }

  /**
   * Retrieve a UOR object from IPFS
   * @param username User namespace
   * @param type Object type
   * @param id Object ID
   */
  async getObject(username: string, type: string, id: string): Promise<UORObject | null> {
    try {
      if (!this.ipfsClient) {
        return this.fallbackToGitHub('getObject', username, type, id);
      }

      const cid = await this.getCIDReference(username, type, id);

      if (!cid) {
        return this.fallbackToGitHub('getObject', username, type, id);
      }

      const chunks: Uint8Array[] = [];
      for await (const chunk of this.ipfsClient.cat(cid)) {
        chunks.push(chunk);
      }

      const content = Buffer.concat(chunks).toString();
      return JSON.parse(content) as UORObject;
    } catch (error) {
      console.error('Error getting UOR object from IPFS:', error);
      return this.fallbackToGitHub('getObject', username, type, id);
    }
  }

  /**
   * Delete a UOR object from IPFS
   * @param username User namespace
   * @param type Object type
   * @param id Object ID
   */
  async deleteObject(username: string, type: string, id: string): Promise<StorageResult> {
    try {
      if (!this.ipfsClient) {
        return this.fallbackToGitHub('deleteObject', username, type, id);
      }

      const cid = await this.getCIDReference(username, type, id);

      if (!cid) {
        return {
          success: false,
          error: 'Object not found',
        };
      }

      await this.ipfsClient.pin.rm(cid);

      await this.deleteCIDReference(username, type, id);

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting UOR object from IPFS:', error);
      return this.fallbackToGitHub('deleteObject', username, type, id);
    }
  }

  /**
   * List UOR objects of a specific type from IPFS
   * @param username User namespace
   * @param type Object type
   */
  async listObjects(username: string, type: string): Promise<UORObject[]> {
    try {
      return this.fallbackToGitHub('listObjects', username, type);
    } catch (error) {
      console.error(`Error listing UOR objects of type ${type} from IPFS:`, error);
      return [];
    }
  }

  /**
   * Store large content in IPFS
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
      if (!this.ipfsClient) {
        return this.fallbackToGitHub('storeLargeContent', username, content, metadata);
      }

      const contentBuffer = typeof content === 'string' ? Buffer.from(content) : content;

      if (contentBuffer.length > this.chunkSize) {
        return this.storeChunkedContent(username, contentBuffer, metadata);
      }

      const result = await this.ipfsClient.add(contentBuffer, {
        pin: true,
      });

      const metadataWithCID = {
        ...metadata,
        cid: result.cid.toString(),
        size: contentBuffer.length,
        chunked: false,
        createdAt: new Date().toISOString(),
      };

      const artifactId = metadata.id || Date.now().toString();
      await this.storeMetadataReference(username, artifactId, metadataWithCID);

      return {
        success: true,
        identifier: result.cid.toString(),
      };
    } catch (error) {
      console.error('Error storing large content in IPFS:', error);
      return this.fallbackToGitHub('storeLargeContent', username, content, metadata);
    }
  }

  /**
   * Retrieve large content from IPFS
   * @param username User namespace
   * @param identifier Content identifier
   */
  async getLargeContent(
    username: string,
    identifier: string
  ): Promise<{ content: Buffer | string; metadata: Record<string, any> } | null> {
    try {
      if (!this.ipfsClient) {
        return this.fallbackToGitHub('getLargeContent', username, identifier);
      }

      const metadata = await this.getMetadataReference(username, identifier);

      if (!metadata) {
        return this.fallbackToGitHub('getLargeContent', username, identifier);
      }

      if (metadata.chunked) {
        return this.getChunkedContent(username, metadata);
      }

      const chunks: Uint8Array[] = [];
      for await (const chunk of this.ipfsClient.cat(metadata.cid)) {
        chunks.push(chunk);
      }

      const content = Buffer.concat(chunks);

      return {
        content,
        metadata,
      };
    } catch (error) {
      console.error('Error retrieving large content from IPFS:', error);
      return this.fallbackToGitHub('getLargeContent', username, identifier);
    }
  }

  /**
   * Store chunked content in IPFS
   * @param username User namespace
   * @param content Content to store
   * @param metadata Content metadata
   */
  private async storeChunkedContent(
    username: string,
    content: Buffer,
    metadata: Record<string, any>
  ): Promise<StorageResult> {
    try {
      if (!this.ipfsClient) {
        return this.fallbackToGitHub('storeLargeContent', username, content, metadata);
      }

      const chunks: Buffer[] = [];
      for (let i = 0; i < content.length; i += this.chunkSize) {
        chunks.push(content.slice(i, i + this.chunkSize));
      }

      const chunkCIDs: string[] = [];
      for (let i = 0; i < chunks.length; i++) {
        const result = await this.ipfsClient.add(chunks[i], {
          pin: true,
        });
        chunkCIDs.push(result.cid.toString());
      }

      const files = chunkCIDs.map((cid, index) => ({
        path: `chunk-${index}`,
        content: { '/': cid },
      }));

      const dirResult = await this.ipfsClient.dag.put({ files });
      const dirCID = dirResult.toString();

      const metadataWithCIDs = {
        ...metadata,
        cid: dirCID,
        chunkCIDs,
        size: content.length,
        chunked: true,
        chunkSize: this.chunkSize,
        chunkCount: chunks.length,
        createdAt: new Date().toISOString(),
      };

      const artifactId = metadata.id || Date.now().toString();
      await this.storeMetadataReference(username, artifactId, metadataWithCIDs);

      return {
        success: true,
        identifier: dirCID,
      };
    } catch (error) {
      console.error('Error storing chunked content in IPFS:', error);
      return this.fallbackToGitHub('storeLargeContent', username, content, metadata);
    }
  }

  /**
   * Retrieve chunked content from IPFS
   * @param username User namespace
   * @param metadata Content metadata
   */
  private async getChunkedContent(
    username: string,
    metadata: Record<string, any>
  ): Promise<{ content: Buffer; metadata: Record<string, any> } | null> {
    try {
      if (!this.ipfsClient || !metadata.chunked || !metadata.chunkCIDs) {
        return null;
      }

      const chunkBuffers: Buffer[] = [];
      for (const chunkCID of metadata.chunkCIDs) {
        const chunks: Uint8Array[] = [];
        for await (const chunk of this.ipfsClient.cat(chunkCID)) {
          chunks.push(chunk);
        }
        chunkBuffers.push(Buffer.concat(chunks));
      }

      const content = Buffer.concat(chunkBuffers);

      return {
        content,
        metadata,
      };
    } catch (error) {
      console.error('Error retrieving chunked content from IPFS:', error);
      return null;
    }
  }

  /**
   * Store CID reference in GitHub
   * @param username User namespace
   * @param type Object type
   * @param id Object ID
   * @param cid IPFS CID
   */
  private async storeCIDReference(
    username: string,
    type: string,
    id: string,
    cid: string
  ): Promise<boolean> {
    try {
      if (!this.githubProvider) {
        return false;
      }

      const reference = {
        type,
        id,
        cid,
        provider: 'ipfs',
        createdAt: new Date().toISOString(),
      };

      const result = await this.githubProvider.storeObject(username, {
        type: 'ipfs_reference',
        id: `${type}_${id}`,
        reference,
      } as any);

      return result.success;
    } catch (error) {
      console.error('Error storing CID reference in GitHub:', error);
      return false;
    }
  }

  /**
   * Get CID reference from GitHub
   * @param username User namespace
   * @param type Object type
   * @param id Object ID
   */
  private async getCIDReference(
    username: string,
    type: string,
    id: string
  ): Promise<string | null> {
    try {
      if (!this.githubProvider) {
        return null;
      }

      const reference = await this.githubProvider.getObject(
        username,
        'ipfs_reference',
        `${type}_${id}`
      );

      if (
        !reference ||
        !reference.hasOwnProperty('reference') ||
        !(reference as any).reference?.cid
      ) {
        return null;
      }

      return (reference as any).reference.cid;
    } catch (error) {
      console.error('Error getting CID reference from GitHub:', error);
      return null;
    }
  }

  /**
   * Delete CID reference from GitHub
   * @param username User namespace
   * @param type Object type
   * @param id Object ID
   */
  private async deleteCIDReference(username: string, type: string, id: string): Promise<boolean> {
    try {
      if (!this.githubProvider) {
        return false;
      }

      const result = await this.githubProvider.deleteObject(
        username,
        'ipfs_reference',
        `${type}_${id}`
      );

      return result.success;
    } catch (error) {
      console.error('Error deleting CID reference from GitHub:', error);
      return false;
    }
  }

  /**
   * Store metadata reference in GitHub
   * @param username User namespace
   * @param artifactId Artifact ID
   * @param metadata Metadata
   */
  private async storeMetadataReference(
    username: string,
    artifactId: string,
    metadata: Record<string, any>
  ): Promise<boolean> {
    try {
      if (!this.githubProvider) {
        return false;
      }

      const reference = {
        id: artifactId,
        metadata,
        provider: 'ipfs',
        createdAt: new Date().toISOString(),
      };

      const result = await this.githubProvider.storeObject(username, {
        type: 'ipfs_metadata',
        id: artifactId,
        reference,
      } as any);

      return result.success;
    } catch (error) {
      console.error('Error storing metadata reference in GitHub:', error);
      return false;
    }
  }

  /**
   * Get metadata reference from GitHub
   * @param username User namespace
   * @param artifactId Artifact ID
   */
  private async getMetadataReference(
    username: string,
    artifactId: string
  ): Promise<Record<string, any> | null> {
    try {
      if (!this.githubProvider) {
        return null;
      }

      const reference = await this.githubProvider.getObject(username, 'ipfs_metadata', artifactId);

      if (
        !reference ||
        !reference.hasOwnProperty('reference') ||
        !(reference as any).reference?.metadata
      ) {
        return null;
      }

      return (reference as any).reference.metadata;
    } catch (error) {
      console.error('Error getting metadata reference from GitHub:', error);
      return null;
    }
  }

  /**
   * Fallback to GitHub storage provider
   * @param method Method name
   * @param args Method arguments
   */
  private async fallbackToGitHub(method: string, ...args: any[]): Promise<any> {
    console.log(`Falling back to GitHub storage for ${method}`);

    if (!this.githubProvider) {
      return method === 'storeObject' || method === 'deleteObject' || method === 'storeLargeContent'
        ? { success: false, error: 'GitHub fallback provider not available' }
        : null;
    }

    return (this.githubProvider as any)[method](...args);
  }
}
