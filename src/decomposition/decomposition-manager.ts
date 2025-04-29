/**
 * Decomposition Manager
 * Manages and provides access to all decomposition algorithms
 */

import { PrimeDecomposition, CanonicalRepresentation } from '../core/uor-core';
import { DecompositionAlgorithm, DecompositionRegistry } from './decomposition-types';
import { TextDecompositionAlgorithm } from './text-decomposition';
import { StructuredDataDecompositionAlgorithm } from './structured-data-decomposition';
import { MediaDecompositionAlgorithm } from './media-decomposition';
import { LinkedDataDecompositionAlgorithm } from './linked-data-decomposition';
import { DomainSpecificDecompositionAlgorithm, registerBuiltInDomains } from './domain-specific-decomposition';

/**
 * Decomposition manager singleton
 * Provides access to all decomposition algorithms
 */
export class DecompositionManager {
  private static instance: DecompositionManager;
  private registry: DecompositionRegistry;
  private initialized: boolean = false;
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.registry = DecompositionRegistry.getInstance();
  }
  
  /**
   * Get the singleton instance
   * @returns DecompositionManager instance
   */
  public static getInstance(): DecompositionManager {
    if (!DecompositionManager.instance) {
      DecompositionManager.instance = new DecompositionManager();
    }
    return DecompositionManager.instance;
  }
  
  /**
   * Initialize the decomposition manager
   * Registers all available decomposition algorithms
   */
  public initialize(): void {
    if (this.initialized) {
      return;
    }
    
    registerBuiltInDomains();
    
    this.registry.registerAlgorithm('text', new TextDecompositionAlgorithm());
    
    this.registry.registerAlgorithm('structured-data', new StructuredDataDecompositionAlgorithm());
    
    this.registry.registerAlgorithm('media', new MediaDecompositionAlgorithm());
    
    this.registry.registerAlgorithm('linked-data', new LinkedDataDecompositionAlgorithm());
    
    const domainConfigs = DomainSpecificDecompositionAlgorithm.getAllDomainConfigs();
    
    domainConfigs.forEach((config, domain) => {
      this.registry.registerAlgorithm(domain, new DomainSpecificDecompositionAlgorithm(domain));
    });
    
    this.initialized = true;
  }
  
  /**
   * Get a decomposition algorithm for a specific domain
   * @param domain Domain identifier
   * @returns Decomposition algorithm or undefined if not found
   */
  public getAlgorithm(domain: string): DecompositionAlgorithm | undefined {
    if (!this.initialized) {
      this.initialize();
    }
    
    return this.registry.getAlgorithm(domain);
  }
  
  /**
   * Get all registered decomposition algorithms
   * @returns Map of all registered algorithms
   */
  public getAllAlgorithms(): Map<string, DecompositionAlgorithm> {
    if (!this.initialized) {
      this.initialize();
    }
    
    return this.registry.getAllAlgorithms();
  }
  
  /**
   * Decompose data using the appropriate algorithm
   * @param data Data to decompose
   * @param domain Domain identifier (optional, will be auto-detected if not provided)
   * @returns Prime decomposition of the data
   */
  public decompose(data: any, domain?: string): PrimeDecomposition {
    if (!this.initialized) {
      this.initialize();
    }
    
    const detectedDomain = domain || this.detectDomain(data);
    
    if (!detectedDomain) {
      throw new Error('Could not detect domain for data');
    }
    
    const algorithm = this.registry.getAlgorithm(detectedDomain);
    
    if (!algorithm) {
      throw new Error(`No decomposition algorithm found for domain: ${detectedDomain}`);
    }
    
    return algorithm.decompose(data);
  }
  
  /**
   * Recompose data from a prime decomposition
   * @param decomposition Prime decomposition to recompose
   * @param domain Domain identifier
   * @returns Recomposed data
   */
  public recompose(decomposition: PrimeDecomposition, domain: string): any {
    if (!this.initialized) {
      this.initialize();
    }
    
    const algorithm = this.registry.getAlgorithm(domain);
    
    if (!algorithm) {
      throw new Error(`No decomposition algorithm found for domain: ${domain}`);
    }
    
    return algorithm.recompose(decomposition);
  }
  
  /**
   * Compute canonical representation from a prime decomposition
   * @param decomposition Prime decomposition
   * @param domain Domain identifier
   * @returns Canonical representation
   */
  public computeCanonical(decomposition: PrimeDecomposition, domain: string): CanonicalRepresentation {
    if (!this.initialized) {
      this.initialize();
    }
    
    const algorithm = this.registry.getAlgorithm(domain);
    
    if (!algorithm) {
      throw new Error(`No decomposition algorithm found for domain: ${domain}`);
    }
    
    return algorithm.computeCanonical(decomposition);
  }
  
  /**
   * Register a custom decomposition algorithm
   * @param domain Domain identifier
   * @param algorithm Decomposition algorithm
   */
  public registerAlgorithm(domain: string, algorithm: DecompositionAlgorithm): void {
    if (!this.initialized) {
      this.initialize();
    }
    
    this.registry.registerAlgorithm(domain, algorithm);
  }
  
  /**
   * Detect the domain of data
   * @param data Data to detect domain for
   * @returns Detected domain or undefined if not detected
   */
  private detectDomain(data: any): string | undefined {
    if (!data) {
      return undefined;
    }
    
    if (data.domain) {
      return data.domain;
    }
    
    if (typeof data === 'string') {
      return 'text';
    }
    
    if (Array.isArray(data)) {
      if (data.length > 0 && data[0].subject && data[0].predicate && data[0].object) {
        return 'linked-data';
      }
      
      return 'structured-data';
    }
    
    if (typeof data === 'object') {
      if (data.mimeType || data.contentReference || data.chunks) {
        return 'media';
      }
      
      if (data.nodes && data.edges) {
        return 'linked-data';
      }
      
      const domainConfigs = DomainSpecificDecompositionAlgorithm.getAllDomainConfigs();
      
      for (const [domain, config] of domainConfigs.entries()) {
        if (config.validate && config.validate(data)) {
          return domain;
        }
      }
      
      return 'structured-data';
    }
    
    return undefined;
  }
}
