/**
 * UOR Core Decomposition Integration
 * Integrates decomposition algorithms with UOR core objects
 */

import { UORObject, PrimeDecomposition, CanonicalRepresentation } from './uor-core';
import { DecompositionManager } from '../decomposition/decomposition-manager';

/**
 * Initialize decomposition algorithms for UOR objects
 * This function extends UOR objects with decomposition capabilities
 */
export function initializeDecompositionForUORObjects(): void {
  const decompositionManager = DecompositionManager.getInstance();
  decompositionManager.initialize();

  const originalComputePrimeDecomposition = UORObject.prototype.computePrimeDecomposition;
  const originalComputeCanonicalRepresentation = UORObject.prototype.computeCanonicalRepresentation;

  UORObject.prototype.computePrimeDecomposition = function (): PrimeDecomposition {
    if (
      this.constructor.prototype.hasOwnProperty('computePrimeDecomposition') &&
      this.constructor.prototype.computePrimeDecomposition !==
        UORObject.prototype.computePrimeDecomposition
    ) {
      return originalComputePrimeDecomposition.call(this);
    }

    let domain: string;

    switch (this.type.toLowerCase()) {
      case 'concept':
      case 'resource':
      case 'topic':
      case 'predicate':
        domain = 'structured-data';
        break;
      case 'media':
        domain = 'media';
        break;
      case 'message':
      case 'thread':
        domain = 'text';
        break;
      case 'event':
      case 'channel':
      case 'subscription':
        domain = 'structured-data';
        break;
      case 'identity':
      case 'profile':
        domain = 'structured-data';
        break;
      default:
        try {
          return decompositionManager.decompose(this.serialize());
        } catch (error) {
          console.warn(`Could not determine domain for object type: ${this.type}`);

          return {
            primeFactors: [],
            decompositionMethod: 'fallback',
          };
        }
    }

    try {
      return decompositionManager.decompose(this.serialize(), domain);
    } catch (error) {
      console.warn(`Error decomposing object of type ${this.type}:`, error);

      return {
        primeFactors: [],
        decompositionMethod: 'fallback',
      };
    }
  };

  UORObject.prototype.computeCanonicalRepresentation = function (): CanonicalRepresentation {
    if (
      this.constructor.prototype.hasOwnProperty('computeCanonicalRepresentation') &&
      this.constructor.prototype.computeCanonicalRepresentation !==
        UORObject.prototype.computeCanonicalRepresentation
    ) {
      return originalComputeCanonicalRepresentation.call(this);
    }

    const decomposition = this.computePrimeDecomposition();

    let domain: string;

    switch (this.type.toLowerCase()) {
      case 'concept':
      case 'resource':
      case 'topic':
      case 'predicate':
        domain = 'structured-data';
        break;
      case 'media':
        domain = 'media';
        break;
      case 'message':
      case 'thread':
        domain = 'text';
        break;
      case 'event':
      case 'channel':
      case 'subscription':
        domain = 'structured-data';
        break;
      case 'identity':
      case 'profile':
        domain = 'structured-data';
        break;
      default:
        return {
          representationType: 'basic',
          value: this.serialize(),
        };
    }

    try {
      return decompositionManager.computeCanonical(decomposition, domain);
    } catch (error) {
      console.warn(
        `Error computing canonical representation for object of type ${this.type}:`,
        error
      );

      return {
        representationType: 'basic',
        value: this.serialize(),
      };
    }
  };
}
