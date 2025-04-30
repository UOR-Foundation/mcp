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
  initialize(_config: StorageProviderConfig): Promise<boolean>;

  /**
   * Check if the provider is available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Store a UOR object
   * @param username User namespace
   * @param object UOR object to store
   */
  storeObject(_username: string, _object: UORObject): Promise<StorageResult>;

  /**
   * Retrieve a UOR object
   * @param username User namespace
   * @param type Object type
   * @param id Object ID
   */
  getObject(_username: string, _type: string, _id: string): Promise<UORObject | null>;

  /**
   * Delete a UOR object
   * @param username User namespace
   * @param type Object type
   * @param id Object ID
   */
  deleteObject(_username: string, _type: string, _id: string): Promise<StorageResult>;

  /**
   * List UOR objects of a specific type
   * @param username User namespace
   * @param type Object type
   */
  listObjects(_username: string, _type: string): Promise<UORObject[]>;

  /**
   * Store large content as chunks
   * @param username User namespace
   * @param content Content to store
   * @param metadata Content metadata
   */
  storeLargeContent(
    _username: string,
    _content: Buffer | string,
    _metadata: Record<string, any>
  ): Promise<StorageResult>;

  /**
   * Retrieve large content
   * @param username User namespace
   * @param identifier Content identifier
   */
  getLargeContent(
    _username: string,
    _identifier: string
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
  abstract initialize(_config: StorageProviderConfig): Promise<boolean>;

  /**
   * Check if the provider is available
   */
  abstract isAvailable(): Promise<boolean>;

  /**
   * Store a UOR object
   * @param username User namespace
   * @param object UOR object to store
   */
  abstract storeObject(_username: string, _object: UORObject): Promise<StorageResult>;

  /**
   * Retrieve a UOR object
   * @param username User namespace
   * @param type Object type
   * @param id Object ID
   */
  abstract getObject(_username: string, _type: string, _id: string): Promise<UORObject | null>;

  /**
   * Delete a UOR object
   * @param username User namespace
   * @param type Object type
   * @param id Object ID
   */
  abstract deleteObject(_username: string, _type: string, _id: string): Promise<StorageResult>;

  /**
   * List UOR objects of a specific type
   * @param username User namespace
   * @param type Object type
   */
  abstract listObjects(_username: string, _type: string): Promise<UORObject[]>;

  /**
   * Store large content as chunks
   * @param username User namespace
   * @param content Content to store
   * @param metadata Content metadata
   */
  abstract storeLargeContent(
    _username: string,
    _content: Buffer | string,
    _metadata: Record<string, any>
  ): Promise<StorageResult>;

  /**
   * Retrieve large content
   * @param username User namespace
   * @param identifier Content identifier
   */
  abstract getLargeContent(
    _username: string,
    _identifier: string
  ): Promise<{ content: Buffer | string; metadata: Record<string, any> } | null>;
}
