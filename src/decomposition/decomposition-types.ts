/**
 * Prime Decomposition Algorithms Type Definitions
 * Defines types for decomposition algorithms in the UOR system
 */

import { PrimeFactor, PrimeDecomposition, CanonicalRepresentation } from '../core/uor-core';

/**
 * Decomposition algorithm interface
 * All decomposition algorithms must implement this interface
 */
export interface DecompositionAlgorithm {
  /**
   * Decompose data into prime factors
   * @param data Data to decompose
   * @returns Prime decomposition of the data
   */
  decompose(data: any): PrimeDecomposition;

  /**
   * Recompose data from prime factors
   * @param decomposition Prime decomposition to recompose
   * @returns Recomposed data
   */
  recompose(decomposition: PrimeDecomposition): any;

  /**
   * Compute canonical representation from prime decomposition
   * @param decomposition Prime decomposition
   * @returns Canonical representation
   */
  computeCanonical(decomposition: PrimeDecomposition): CanonicalRepresentation;

  /**
   * Get the domain of this decomposition algorithm
   * @returns Domain identifier
   */
  getDomain(): string;
}

/**
 * Base decomposition algorithm abstract class
 * Provides common functionality for all decomposition algorithms
 */
export abstract class BaseDecompositionAlgorithm implements DecompositionAlgorithm {
  /** Algorithm identifier */
  protected id: string;

  /** Algorithm domain */
  protected domain: string;

  /**
   * Creates a new decomposition algorithm
   * @param id Algorithm identifier
   * @param domain Algorithm domain
   */
  constructor(id: string, domain: string) {
    this.id = id;
    this.domain = domain;
  }

  /**
   * Decompose data into prime factors
   * @param data Data to decompose
   * @returns Prime decomposition of the data
   */
  abstract decompose(data: any): PrimeDecomposition;

  /**
   * Recompose data from prime factors
   * @param decomposition Prime decomposition to recompose
   * @returns Recomposed data
   */
  abstract recompose(decomposition: PrimeDecomposition): any;

  /**
   * Compute canonical representation from prime decomposition
   * @param decomposition Prime decomposition
   * @returns Canonical representation
   */
  abstract computeCanonical(decomposition: PrimeDecomposition): CanonicalRepresentation;

  /**
   * Get the domain of this decomposition algorithm
   * @returns Domain identifier
   */
  getDomain(): string {
    return this.domain;
  }

  /**
   * Create a prime factor
   * @param id Factor identifier
   * @param value Factor value
   * @param multiplicity Factor multiplicity
   * @returns Prime factor
   */
  protected createPrimeFactor(id: string, value: any, multiplicity: number = 1): PrimeFactor {
    return {
      id,
      value,
      multiplicity,
      domain: this.domain,
    };
  }

  /**
   * Create a prime decomposition
   * @param factors Prime factors
   * @param method Decomposition method
   * @returns Prime decomposition
   */
  protected createDecomposition(factors: PrimeFactor[], method?: string): PrimeDecomposition {
    return {
      primeFactors: factors,
      decompositionMethod: method || this.id,
    };
  }

  /**
   * Create a canonical representation
   * @param value Canonical value
   * @param type Representation type
   * @param coherenceNorm Coherence norm value
   * @returns Canonical representation
   */
  protected createCanonicalRepresentation(
    value: any,
    type: string,
    coherenceNorm?: number
  ): CanonicalRepresentation {
    return {
      representationType: type,
      value,
      coherenceNorm,
    };
  }
}

/**
 * Decomposition algorithm registry
 * Manages all available decomposition algorithms
 */
export class DecompositionRegistry {
  private static instance: DecompositionRegistry;
  private algorithms: Map<string, DecompositionAlgorithm> = new Map();

  private constructor() {}

  /**
   * Get the singleton instance
   * @returns DecompositionRegistry instance
   */
  public static getInstance(): DecompositionRegistry {
    if (!DecompositionRegistry.instance) {
      DecompositionRegistry.instance = new DecompositionRegistry();
    }
    return DecompositionRegistry.instance;
  }

  /**
   * Register a decomposition algorithm
   * @param domain Algorithm domain
   * @param algorithm Decomposition algorithm
   */
  public registerAlgorithm(domain: string, algorithm: DecompositionAlgorithm): void {
    this.algorithms.set(domain, algorithm);
  }

  /**
   * Get a decomposition algorithm for a domain
   * @param domain Algorithm domain
   * @returns Decomposition algorithm or undefined if not found
   */
  public getAlgorithm(domain: string): DecompositionAlgorithm | undefined {
    return this.algorithms.get(domain);
  }

  /**
   * Get all registered algorithms
   * @returns Map of all registered algorithms
   */
  public getAllAlgorithms(): Map<string, DecompositionAlgorithm> {
    return this.algorithms;
  }
}
