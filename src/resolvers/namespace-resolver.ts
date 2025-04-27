/**
 * UOR Namespace Resolver
 * Resolves UOR references across different namespaces
 */
import { UORResolver } from '../core/uor-core';
import { GitHubNamespaceResolver } from '../core/uor-implementations';

/**
 * Resolves UOR references across different namespaces
 */
export class NamespaceResolver {
  private resolvers: Map<string, UORResolver> = new Map();
  private defaultNamespace: string;
  
  /**
   * Creates a new namespace resolver
   * @param defaultNamespace The default namespace to use
   */
  constructor(defaultNamespace: string = 'default') {
    this.defaultNamespace = defaultNamespace;
  }
  
  /**
   * Adds a resolver for a namespace
   * @param resolver The UOR resolver to add
   */
  addResolver(resolver: UORResolver): void {
    this.resolvers.set(resolver.targetNamespace, resolver);
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
}