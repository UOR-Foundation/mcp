/**
 * Storage Provider Interface
 * Defines the interface for storage providers in the UOR system
 */

import { UORObject } from '../github/uordb-manager';

/**
 * Storage provider configuration
 */
export interface StorageProviderConfig {
  type: string;
  endpoint?: string;
  authentication?: {
    type: string;
    credentials: Record<string, string>;
  };
  options?: Record<string, any>;
}

/**
 * Storage operation result
 */
export interface StorageResult {
  success: boolean;
  identifier?: string; // CID for IPFS, path for GitHub
  error?: string;
}

/**
 * Storage provider interface
 */
export interface StorageProvider {
  /**
   * Initialize the storage provider
   * @param config Provider configuration
   */
  initialize(config: StorageProviderConfig): Promise<boolean>;

  /**
   * Check if the provider is available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Store a UOR object
   * @param username User namespace
   * @param object UOR object to store
   */
  storeObject(username: string, object: UORObject): Promise<StorageResult>;

  /**
   * Retrieve a UOR object
   * @param username User namespace
   * @param type Object type
   * @param id Object ID
   */
  getObject(username: string, type: string, id: string): Promise<UORObject | null>;

  /**
   * Delete a UOR object
   * @param username User namespace
   * @param type Object type
   * @param id Object ID
   */
  deleteObject(username: string, type: string, id: string): Promise<StorageResult>;

  /**
   * List UOR objects of a specific type
   * @param username User namespace
   * @param type Object type
   */
  listObjects(username: string, type: string): Promise<UORObject[]>;

  /**
   * Store large content as chunks
   * @param username User namespace
   * @param content Content to store
   * @param metadata Content metadata
   */
  storeLargeContent(
    username: string,
    content: Buffer | string,
    metadata: Record<string, any>
  ): Promise<StorageResult>;

  /**
   * Retrieve large content
   * @param username User namespace
   * @param identifier Content identifier
   */
  getLargeContent(
    username: string,
    identifier: string
  ): Promise<{ content: Buffer | string; metadata: Record<string, any> } | null>;
}

/**
 * Abstract base class for storage providers
 */
export abstract class BaseStorageProvider implements StorageProvider {
  protected config: StorageProviderConfig | null = null;

  /**
   * Initialize the storage provider
   * @param config Provider configuration
   */
  abstract initialize(config: StorageProviderConfig): Promise<boolean>;

  /**
   * Check if the provider is available
   */
  abstract isAvailable(): Promise<boolean>;

  /**
   * Store a UOR object
   * @param username User namespace
   * @param object UOR object to store
   */
  abstract storeObject(username: string, object: UORObject): Promise<StorageResult>;

  /**
   * Retrieve a UOR object
   * @param username User namespace
   * @param type Object type
   * @param id Object ID
   */
  abstract getObject(username: string, type: string, id: string): Promise<UORObject | null>;

  /**
   * Delete a UOR object
   * @param username User namespace
   * @param type Object type
   * @param id Object ID
   */
  abstract deleteObject(username: string, type: string, id: string): Promise<StorageResult>;

  /**
   * List UOR objects of a specific type
   * @param username User namespace
   * @param type Object type
   */
  abstract listObjects(username: string, type: string): Promise<UORObject[]>;

  /**
   * Store large content as chunks
   * @param username User namespace
   * @param content Content to store
   * @param metadata Content metadata
   */
  abstract storeLargeContent(
    username: string,
    content: Buffer | string,
    metadata: Record<string, any>
  ): Promise<StorageResult>;

  /**
   * Retrieve large content
   * @param username User namespace
   * @param identifier Content identifier
   */
  abstract getLargeContent(
    username: string,
    identifier: string
  ): Promise<{ content: Buffer | string; metadata: Record<string, any> } | null>;
}
