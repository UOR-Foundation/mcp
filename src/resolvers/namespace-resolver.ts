/**
 * UOR Namespace Resolver
 * Resolves UOR references across different namespaces
 */
import { UORResolver } from '../core/uor-core';
import { GitHubNamespaceResolver } from '../core/uor-implementations';
import type { GitHubClient } from '../github/github-client';

/**
 * Maximum depth for transitive resolution to prevent circular references
 */
const MAX_RESOLUTION_DEPTH = 5;

/**
 * Cache expiration time in milliseconds (10 minutes)
 */
const CACHE_EXPIRATION_MS = 10 * 60 * 1000;

/**
 * Interface for resolver record
 */
export interface ResolverRecord {
  id: string;
  sourceNamespace: string;
  targetNamespace: string;
  resolutionMethod: string;
  dateCreated: string;
  description?: string;
}

/**
 * Interface for resolution path for diagnostics
 */
export interface ResolutionPath {
  steps: Array<{
    from: string;
    to: string;
    via: string;
    timestamp: string;
  }>;
  resolved: boolean;
  depth: number;
}

/**
 * Interface for cached resolution
 */
interface CachedResolution {
  resolvedReference: string | null;
  timestamp: number;
  path: ResolutionPath;
}

/**
 * Resolves UOR references across different namespaces
 */
export class NamespaceResolver {
  private resolvers: Map<string, UORResolver> = new Map();
  private resolverRecords: Map<string, ResolverRecord[]> = new Map();
  private defaultNamespace: string;
  private githubClient?: GitHubClient;

  // Resolution cache for performance
  private resolutionCache: Map<string, CachedResolution> = new Map();

  /**
   * Creates a new namespace resolver
   * @param defaultNamespace The default namespace to use
   * @param githubClient Optional GitHub client for resolver storage
   */
  constructor(defaultNamespace: string = 'default', githubClient?: GitHubClient) {
    this.defaultNamespace = defaultNamespace;
    this.githubClient = githubClient;
  }

  /**
   * Adds a resolver for a namespace
   * @param resolver The UOR resolver to add
   */
  addResolver(resolver: UORResolver): void {
    this.resolvers.set(resolver.targetNamespace, resolver);

    // Invalidate cache for this namespace
    this.invalidateCacheForNamespace(resolver.targetNamespace);
  }

  /**
   * Resolves a UOR reference
   * @param reference The UOR reference to resolve
   * @returns The resolved reference
   */
  resolveReference(reference: string): string {
    // If the reference is already a fully-qualified UOR reference, use it
    if (reference.startsWith('uor://')) {
      // Extract the namespace from the reference
      try {
        const url = new URL(reference);
        const namespace = url.hostname;

        // If we have a resolver for this namespace, use it
        const resolver = this.resolvers.get(namespace);
        if (resolver) {
          return resolver.resolveReference(reference);
        }

        // Otherwise, just return the original reference
        return reference;
      } catch (error) {
        throw new Error(`Invalid UOR reference: ${String(error)}`);
      }
    }

    // If it's a relative reference, use the default namespace
    return `uor://${this.defaultNamespace}/${reference}`;
  }

  /**
   * Resolves a reference across namespaces, with caching and cycle detection
   * @param reference The reference to resolve
   * @param options Optional resolution options
   * @returns The resolved reference and resolution path
   */
  async resolveAcrossNamespaces(
    reference: string,
    options: {
      maxDepth?: number;
      startingPath?: ResolutionPath;
      bypassCache?: boolean;
    } = {}
  ): Promise<{
    resolvedReference: string | null;
    path: ResolutionPath;
  }> {
    const maxDepth = options.maxDepth || MAX_RESOLUTION_DEPTH;
    const bypassCache = options.bypassCache || false;

    // Initialize or use provided resolution path
    const path: ResolutionPath = options.startingPath || {
      steps: [],
      resolved: false,
      depth: 0,
    };

    // Check cache first if not bypassing
    if (!bypassCache) {
      const cached = this.getCachedResolution(reference);
      if (cached) {
        return {
          resolvedReference: cached.resolvedReference,
          path: cached.path,
        };
      }
    }

    // Parse the reference
    try {
      const url = new URL(reference);
      const namespace = url.hostname;
      const pathParts = url.pathname.split('/');
      const type = pathParts[1];
      const id = pathParts.slice(2).join('/');

      // Check if we've exceeded max depth
      if (path.depth >= maxDepth) {
        return {
          resolvedReference: null,
          path: {
            ...path,
            resolved: false,
          },
        };
      }

      // Try direct resolution first
      const directResolution = await this.tryDirectResolution(namespace, type, id);
      if (directResolution) {
        // If this is a direct resolution, we're done
        const resolvedPath = {
          ...path,
          resolved: true,
        };

        // Cache the result
        this.cacheResolution(reference, reference, resolvedPath);

        return {
          resolvedReference: reference,
          path: resolvedPath,
        };
      }

      // Load resolver records for this namespace
      const resolvers = await this.getResolverRecords(namespace);

      // If we have resolvers for this namespace, try to resolve transitively
      for (const resolver of resolvers) {
        // Skip if this would create a cycle
        if (path.steps.some(step => step.to === resolver.targetNamespace)) {
          continue;
        }

        // Add this step to the path
        const newPath: ResolutionPath = {
          steps: [
            ...path.steps,
            {
              from: namespace,
              to: resolver.targetNamespace,
              via: resolver.id,
              timestamp: new Date().toISOString(),
            },
          ],
          resolved: false,
          depth: path.depth + 1,
        };

        // Create the new reference in the target namespace
        const targetReference = `uor://${resolver.targetNamespace}/${type}/${id}`;

        // Check if we can resolve in the target namespace
        const targetResolution = await this.tryDirectResolution(resolver.targetNamespace, type, id);
        if (targetResolution) {
          // If we found the resource in the target namespace, we're done
          const resolvedPath = {
            ...newPath,
            resolved: true,
          };

          // Cache the result for the original reference
          this.cacheResolution(reference, targetReference, resolvedPath);

          return {
            resolvedReference: targetReference,
            path: resolvedPath,
          };
        }

        // If not found directly, recursively continue resolution from the target namespace
        const result = await this.resolveAcrossNamespaces(targetReference, {
          maxDepth,
          startingPath: newPath,
          bypassCache: bypassCache,
        });

        // If resolved, return the result
        if (result.path.resolved) {
          // Cache the resolution result for the original reference
          this.cacheResolution(reference, result.resolvedReference, result.path);

          return result;
        }
      }

      // If we get here, we couldn't resolve the reference
      return {
        resolvedReference: null,
        path: {
          ...path,
          resolved: false,
        },
      };
    } catch (error) {
      console.error(`Error in resolveAcrossNamespaces: ${reference}`, error);
      return {
        resolvedReference: null,
        path: {
          ...path,
          resolved: false,
        },
      };
    }
  }

  /**
   * Try to directly resolve a reference in a namespace
   * @param namespace The namespace to check
   * @param type The object type
   * @param id The object ID
   * @returns True if the object exists in this namespace
   */
  private async tryDirectResolution(namespace: string, type: string, id: string): Promise<boolean> {
    if (!this.githubClient) {
      // Without GitHub client, we can't verify existence
      return false;
    }

    try {
      // Set the owner to the namespace we're checking
      this.githubClient.setOwner(namespace);

      // Try to get the file from GitHub - construct path based on type and id
      // Convert type to plural form (e.g., 'concept' -> 'concepts')
      const typePlural = `${type}s`;
      const path = `${typePlural}/${id}.json`;
      const file = await this.githubClient.getFile(path);

      // Return true if the file exists
      return !!file;
    } catch (_error) {
      // If any error occurs, assume the file doesn't exist
      return false;
    }
  }

  /**
   * Creates a new resolver record
   * @param sourceNamespace Source namespace
   * @param targetNamespace Target namespace
   * @param description Optional description
   * @returns The created resolver record
   */
  async createResolverRecord(
    sourceNamespace: string,
    targetNamespace: string,
    description?: string
  ): Promise<ResolverRecord> {
    if (!this.githubClient) {
      throw new Error('GitHub client required to create resolver records');
    }

    // Create resolver ID - must be unique
    const timestamp = new Date().getTime();
    const id = `resolver-${targetNamespace.toLowerCase().replace(/[^a-z0-9]/g, '')}-${timestamp}`;

    // Create resolver record
    const resolver: ResolverRecord = {
      id: `urn:uor:resolver:${id}`,
      sourceNamespace,
      targetNamespace,
      resolutionMethod: 'github',
      dateCreated: new Date().toISOString(),
      description,
    };

    // Save resolver to GitHub
    this.githubClient.setOwner(sourceNamespace);
    await this.githubClient.createOrUpdateFile(
      `resolvers/${id}.json`,
      `Create resolver for ${targetNamespace}`,
      JSON.stringify(resolver, null, 2)
    );

    // Update local cache
    const resolvers = this.resolverRecords.get(sourceNamespace) || [];
    resolvers.push(resolver);
    this.resolverRecords.set(sourceNamespace, resolvers);

    // Create and add the actual resolver
    const uorResolver = new GitHubNamespaceResolver(resolver.id, sourceNamespace, targetNamespace);
    this.addResolver(uorResolver);

    return resolver;
  }

  /**
   * Gets all resolver records for a namespace
   * @param namespace The namespace to get resolvers for
   * @returns Array of resolver records
   */
  async getResolverRecords(namespace: string): Promise<ResolverRecord[]> {
    // Check memory cache first
    if (this.resolverRecords.has(namespace)) {
      return this.resolverRecords.get(namespace) || [];
    }

    if (!this.githubClient) {
      return [];
    }

    try {
      // Load resolvers from GitHub
      this.githubClient.setOwner(namespace);
      const files = await this.githubClient.listFiles('resolvers');

      if (!files) {
        return [];
      }

      const resolvers: ResolverRecord[] = [];

      // Load each resolver file
      for (const file of files) {
        if (file.type === 'file' && file.name.endsWith('.json')) {
          const fileData = await this.githubClient.getFile(`resolvers/${file.name}`);

          if (fileData) {
            try {
              const resolver = JSON.parse(fileData.content) as ResolverRecord;
              resolvers.push(resolver);

              // Create and add the actual resolver
              const uorResolver = new GitHubNamespaceResolver(
                resolver.id,
                resolver.sourceNamespace,
                resolver.targetNamespace
              );
              this.addResolver(uorResolver);
            } catch (error) {
              console.error(`Error parsing resolver ${file.name}:`, error);
            }
          }
        }
      }

      // Cache the resolvers
      this.resolverRecords.set(namespace, resolvers);

      return resolvers;
    } catch (error) {
      console.error(`Failed to load resolvers for ${namespace}:`, error);
      return [];
    }
  }

  /**
   * Sets the default namespace
   * @param namespace The default namespace to use
   */
  setDefaultNamespace(namespace: string): void {
    this.defaultNamespace = namespace;
  }

  /**
   * Gets the default namespace
   * @returns The default namespace
   */
  getDefaultNamespace(): string {
    return this.defaultNamespace;
  }

  /**
   * Creates a GitHub namespace resolver
   * @param sourceNamespace The source namespace
   * @param targetNamespace The target namespace
   * @returns The created resolver
   */
  createGitHubResolver(sourceNamespace: string, targetNamespace: string): UORResolver {
    const resolver = new GitHubNamespaceResolver(
      `resolver-${sourceNamespace}-to-${targetNamespace}`,
      sourceNamespace,
      targetNamespace
    );

    this.addResolver(resolver);
    return resolver;
  }

  /**
   * Gets all resolvers
   * @returns Map of resolvers by namespace
   */
  getResolvers(): Map<string, UORResolver> {
    return this.resolvers;
  }

  /**
   * Cache a resolution result
   * @param reference The original reference
   * @param resolvedReference The resolved reference
   * @param path The resolution path
   */
  private cacheResolution(
    reference: string,
    resolvedReference: string | null,
    path: ResolutionPath
  ): void {
    this.resolutionCache.set(reference, {
      resolvedReference,
      timestamp: new Date().getTime(),
      path,
    });
  }

  /**
   * Get a cached resolution if valid
   * @param reference The reference to look up
   * @returns The cached resolution or null if not found or expired
   */
  private getCachedResolution(reference: string): CachedResolution | null {
    const cached = this.resolutionCache.get(reference);

    if (!cached) {
      return null;
    }

    // Check if cache has expired
    const now = new Date().getTime();
    if (now - cached.timestamp > CACHE_EXPIRATION_MS) {
      this.resolutionCache.delete(reference);
      return null;
    }

    return cached;
  }

  /**
   * Invalidate cache for a specific namespace
   * @param namespace The namespace to invalidate
   */
  private invalidateCacheForNamespace(namespace: string): void {
    // Create a new Map to avoid modification during iteration
    const keysToDelete: string[] = [];

    // Find all keys that need to be deleted
    for (const [reference, cached] of this.resolutionCache.entries()) {
      if (
        reference.includes(namespace) ||
        cached.resolvedReference?.includes(namespace) ||
        cached.path.steps.some(step => step.from === namespace || step.to === namespace)
      ) {
        keysToDelete.push(reference);
      }
    }

    // Delete the keys
    for (const key of keysToDelete) {
      this.resolutionCache.delete(key);
    }
  }

  /**
   * Clear the entire resolution cache
   */
  clearCache(): void {
    this.resolutionCache.clear();
  }
}
