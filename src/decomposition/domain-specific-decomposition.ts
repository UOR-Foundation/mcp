/**
 * Domain-Specific Decomposition Algorithm
 * Implements extensible prime decomposition for domain-specific data types
 */

import { PrimeFactor, PrimeDecomposition, CanonicalRepresentation } from '../core/uor-core';
import { BaseDecompositionAlgorithm } from './decomposition-types';

/**
 * Domain-specific decomposition configuration
 */
export interface DomainDecompositionConfig {
  /** Domain identifier */
  domain: string;

  /** Domain name */
  name: string;

  /** Domain-specific factor extractors */
  factorExtractors: {
    /** Factor name */
    name: string;

    /** Factor extraction function */
    extract: (data: any) => any;

    /** Factor importance weight (0-1) */
    weight?: number;
  }[];

  /** Domain-specific validation function */
  validate?: (data: any) => boolean;

  /** Domain-specific normalization function */
  normalize?: (data: any) => any;

  /** Domain-specific coherence calculation function */
  calculateCoherence?: (data: any) => number;
}

/**
 * Domain-specific decomposition algorithm
 * Provides extensible decomposition for specialized domains
 */
export class DomainSpecificDecompositionAlgorithm extends BaseDecompositionAlgorithm {
  /** Domain configurations */
  private static domains: Map<string, DomainDecompositionConfig> = new Map();

  /** Domain configuration for this instance */
  private domainConfig: DomainDecompositionConfig;

  /**
   * Creates a new domain-specific decomposition algorithm
   * @param domainId Domain identifier
   */
  constructor(domainId: string) {
    const config = DomainSpecificDecompositionAlgorithm.getDomainConfig(domainId);

    if (!config) {
      throw new Error(`Domain configuration not found for domain: ${domainId}`);
    }

    super(`${domainId}-decomposition`, domainId);
    this.domainConfig = config;
  }

  /**
   * Register a domain configuration
   * @param config Domain configuration
   */
  public static registerDomain(config: DomainDecompositionConfig): void {
    DomainSpecificDecompositionAlgorithm.domains.set(config.domain, config);
  }

  /**
   * Get a domain configuration
   * @param domainId Domain identifier
   * @returns Domain configuration or undefined if not found
   */
  public static getDomainConfig(domainId: string): DomainDecompositionConfig | undefined {
    return DomainSpecificDecompositionAlgorithm.domains.get(domainId);
  }

  /**
   * Get all registered domain configurations
   * @returns Map of domain configurations
   */
  public static getAllDomainConfigs(): Map<string, DomainDecompositionConfig> {
    return DomainSpecificDecompositionAlgorithm.domains;
  }

  /**
   * Decompose domain-specific data into prime factors
   * @param data Domain-specific data to decompose
   * @returns Prime decomposition of the data
   */
  decompose(data: any): PrimeDecomposition {
    if (this.domainConfig.validate && !this.domainConfig.validate(data)) {
      throw new Error(`Invalid data for domain: ${this.domainConfig.domain}`);
    }

    const factors: PrimeFactor[] = [];

    factors.push(
      this.createPrimeFactor('domain', {
        domain: this.domainConfig.domain,
        name: this.domainConfig.name,
      })
    );

    this.domainConfig.factorExtractors.forEach((extractor, index) => {
      try {
        const value = extractor.extract(data);

        if (value !== undefined && value !== null) {
          factors.push(
            this.createPrimeFactor(`${extractor.name}-${index}`, {
              name: extractor.name,
              value,
              weight: extractor.weight || 1,
            })
          );
        }
      } catch (error) {
        console.warn(`Error extracting factor ${extractor.name}:`, error);
      }
    });

    return this.createDecomposition(factors, `${this.domainConfig.domain}-factors`);
  }

  /**
   * Recompose domain-specific data from prime factors
   * @param decomposition Prime decomposition to recompose
   * @returns Recomposed domain-specific data
   */
  recompose(decomposition: PrimeDecomposition): any {
    const domainFactor = decomposition.primeFactors.find(factor => factor.id === 'domain');

    if (!domainFactor || (domainFactor.value as any).domain !== this.domainConfig.domain) {
      throw new Error(`Invalid decomposition for domain: ${this.domainConfig.domain}`);
    }

    const result: Record<string, any> = {};

    decomposition.primeFactors.forEach(factor => {
      if (
        factor.id !== 'domain' &&
        factor.value &&
        'name' in factor.value &&
        'value' in factor.value
      ) {
        const name = (factor.value as any).name;
        const value = (factor.value as any).value;

        result[name] = value;
      }
    });

    return result;
  }

  /**
   * Compute canonical representation from prime decomposition
   * @param decomposition Prime decomposition
   * @returns Canonical representation
   */
  computeCanonical(decomposition: PrimeDecomposition): CanonicalRepresentation {
    const data = this.recompose(decomposition);

    const normalized = this.domainConfig.normalize ? this.domainConfig.normalize(data) : data;

    const coherenceNorm = this.domainConfig.calculateCoherence
      ? this.domainConfig.calculateCoherence(normalized)
      : this.calculateDefaultCoherence(decomposition);

    return this.createCanonicalRepresentation(
      { normalizedData: normalized },
      `${this.domainConfig.domain}-canonical`,
      coherenceNorm
    );
  }

  /**
   * Calculate default coherence for a decomposition
   * @param decomposition Prime decomposition
   * @returns Coherence value between 0 and 1
   */
  private calculateDefaultCoherence(decomposition: PrimeDecomposition): number {
    const extractors = this.domainConfig.factorExtractors;

    const factorCount = decomposition.primeFactors.filter(
      factor => factor.id !== 'domain' && factor.value && 'value' in factor.value
    ).length;

    const completeness = extractors.length > 0 ? factorCount / extractors.length : 1;

    let weightedCoherence = 0;
    let totalWeight = 0;

    decomposition.primeFactors.forEach(factor => {
      if (factor.id !== 'domain' && factor.value && 'weight' in factor.value) {
        const weight = (factor.value as any).weight || 1;
        weightedCoherence += weight;
        totalWeight += weight;
      }
    });

    const weightedValue = totalWeight > 0 ? weightedCoherence / totalWeight : 1;

    return completeness * 0.5 + weightedValue * 0.5;
  }
}

/**
 * Register built-in domain configurations
 */
export function registerBuiltInDomains(): void {
  DomainSpecificDecompositionAlgorithm.registerDomain({
    domain: 'scientific-data',
    name: 'Scientific Data',
    factorExtractors: [
      {
        name: 'dataset',
        extract: (data: any) => data.dataset || data.data,
        weight: 0.8,
      },
      {
        name: 'units',
        extract: (data: any) => data.units || data.unitSystem,
        weight: 0.7,
      },
      {
        name: 'methodology',
        extract: (data: any) => data.methodology || data.method,
        weight: 0.6,
      },
      {
        name: 'timestamp',
        extract: (data: any) => data.timestamp || data.date || data.time,
        weight: 0.5,
      },
      {
        name: 'author',
        extract: (data: any) => data.author || data.researcher,
        weight: 0.4,
      },
      {
        name: 'institution',
        extract: (data: any) => data.institution || data.organization,
        weight: 0.3,
      },
    ],
    validate: (data: any) => {
      return data && typeof data === 'object' && (data.dataset || data.data);
    },
    normalize: (data: any) => {
      return {
        dataset: data.dataset || data.data,
        units: data.units || data.unitSystem || 'unknown',
        methodology: data.methodology || data.method || 'unknown',
        timestamp: data.timestamp || data.date || data.time || new Date().toISOString(),
        author: data.author || data.researcher || 'unknown',
        institution: data.institution || data.organization || 'unknown',
      };
    },
    calculateCoherence: (data: any) => {
      const essentialFields = ['dataset', 'units', 'methodology'];
      const presentFields = essentialFields.filter(
        field => data[field] && data[field] !== 'unknown'
      );

      return presentFields.length / essentialFields.length;
    },
  });

  DomainSpecificDecompositionAlgorithm.registerDomain({
    domain: 'financial-data',
    name: 'Financial Data',
    factorExtractors: [
      {
        name: 'amount',
        extract: (data: any) => data.amount || data.value,
        weight: 0.9,
      },
      {
        name: 'currency',
        extract: (data: any) => data.currency || data.currencyCode,
        weight: 0.8,
      },
      {
        name: 'timestamp',
        extract: (data: any) => data.timestamp || data.date,
        weight: 0.7,
      },
      {
        name: 'account',
        extract: (data: any) => data.account || data.accountId,
        weight: 0.6,
      },
      {
        name: 'category',
        extract: (data: any) => data.category || data.type,
        weight: 0.5,
      },
      {
        name: 'description',
        extract: (data: any) => data.description || data.memo,
        weight: 0.4,
      },
    ],
    validate: (data: any) => {
      return (
        data &&
        typeof data === 'object' &&
        (data.amount !== undefined || data.value !== undefined) &&
        (data.currency || data.currencyCode)
      );
    },
    normalize: (data: any) => {
      return {
        amount: data.amount || data.value || 0,
        currency: data.currency || data.currencyCode || 'USD',
        timestamp: data.timestamp || data.date || new Date().toISOString(),
        account: data.account || data.accountId || 'unknown',
        category: data.category || data.type || 'uncategorized',
        description: data.description || data.memo || '',
      };
    },
  });

  DomainSpecificDecompositionAlgorithm.registerDomain({
    domain: 'geospatial-data',
    name: 'Geospatial Data',
    factorExtractors: [
      {
        name: 'coordinates',
        extract: (data: any) =>
          data.coordinates ||
          (data.latitude && data.longitude ? [data.longitude, data.latitude] : undefined),
        weight: 0.9,
      },
      {
        name: 'type',
        extract: (data: any) => data.type || 'Point',
        weight: 0.8,
      },
      {
        name: 'altitude',
        extract: (data: any) => data.altitude || data.elevation,
        weight: 0.6,
      },
      {
        name: 'accuracy',
        extract: (data: any) => data.accuracy || data.precision,
        weight: 0.5,
      },
      {
        name: 'timestamp',
        extract: (data: any) => data.timestamp || data.time,
        weight: 0.4,
      },
      {
        name: 'properties',
        extract: (data: any) => data.properties,
        weight: 0.3,
      },
    ],
    validate: (data: any) => {
      return (
        data &&
        typeof data === 'object' &&
        (data.coordinates || (data.latitude !== undefined && data.longitude !== undefined))
      );
    },
    normalize: (data: any) => {
      const coordinates =
        data.coordinates ||
        (data.latitude !== undefined && data.longitude !== undefined
          ? [data.longitude, data.latitude]
          : [0, 0]);

      return {
        type: data.type || 'Point',
        coordinates,
        altitude: data.altitude || data.elevation,
        accuracy: data.accuracy || data.precision,
        timestamp: data.timestamp || data.time || new Date().toISOString(),
        properties: data.properties || {},
      };
    },
  });
}
