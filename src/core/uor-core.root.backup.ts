/**
 * TypeScript implementation of the UOR Core Schema
 * Based on the schema definition at /workspaces/codespaces-blank/models/schemas/core/uor-core.json
 */

/**
 * The prime factorization of an object into its irreducible components
 */
export interface PrimeFactor {
  /** Identifier for the prime factor */
  id: string;
  
  /** The value of the prime factor */
  value: object;
  
  /** The number of times this prime factor appears in the decomposition (default: 1) */
  multiplicity?: number;
  
  /** The domain this prime factor belongs to */
  domain?: string;
}

/**
 * The factorization of an object into its irreducible components
 */
export interface PrimeDecomposition {
  /** The set of prime factors in the decomposition */
  primeFactors: PrimeFactor[];
  
  /** The method used for prime decomposition */
  decompositionMethod?: string;
  
  /** Reference to proof of uniqueness for this decomposition */
  uniquenessProof?: string;
}

/**
 * The unique, basis-independent representation of an object
 */
export interface CanonicalRepresentation {
  /** The type of canonical representation */
  representationType: string;
  
  /** The value of the canonical representation */
  value: object;
  
  /** The coherence norm value for this representation */
  coherenceNorm?: number;
  
  /** Reference to proof that this representation is minimal */
  minimalityProof?: string;
}

/**
 * A perspective from which universal objects are observed
 */
export interface ObserverFrame {
  /** Identifier for the observer frame */
  id: string;
  
  /** The type of observer frame */
  type: string;
  
  /** Rules for transforming between observer frames */
  transformationRules?: object[];
  
  /** Properties that remain invariant across frame transformations */
  invariantProperties?: string[];
}

/**
 * A measure of representational integrity and consistency
 */
export interface CoherenceMeasure {
  /** The type of coherence measure */
  type: string;
  
  /** The value of the coherence measure */
  value: number;
  
  /** The normalization method used */
  normalization?: string;
  
  /** The reference frame for which this coherence is measured */
  referenceFrame?: string;
}

/**
 * A domain within which UOR principles apply
 */
export interface UORDomain {
  /** Identifier for the domain */
  id: string;
  
  /** Name of the domain */
  name: string;
  
  /** The operation used for composition within this domain */
  compositionOperation?: string;
  
  /** The set of intrinsic primes for this domain */
  intrinsicPrimes?: PrimeFactor[];
}

/**
 * Valid UOR component types
 */
export type UORType = 'UORObject' | 'PrimeDecomposition' | 'CanonicalRepresentation' | 'ObserverFrame' | 'CoherenceMeasure' | 'UORDomain';

/**
 * The base object type for all UOR entities
 */
export abstract class UORObject {
  /** Unique identifier for the UOR object */
  id: string;
  
  /** The type of UOR object */
  type: string;
  
  /** The prime decomposition representation of the object */
  primeDecomposition?: PrimeDecomposition;
  
  /** The canonical representation of the object */
  canonicalRepresentation?: CanonicalRepresentation;
  
  /** The observer reference frame for this object */
  observerFrame?: ObserverFrame;
  
  constructor(id: string, type: string) {
    this.id = id;
    this.type = type;
  }
  
  /**
   * Sets the prime decomposition of this object
   * @param decomposition The prime decomposition to set
   */
  setPrimeDecomposition(decomposition: PrimeDecomposition): void {
    this.primeDecomposition = decomposition;
  }
  
  /**
   * Sets the canonical representation of this object
   * @param representation The canonical representation to set
   */
  setCanonicalRepresentation(representation: CanonicalRepresentation): void {
    this.canonicalRepresentation = representation;
  }
  
  /**
   * Sets the observer frame for this object
   * @param frame The observer frame to set
   */
  setObserverFrame(frame: ObserverFrame): void {
    this.observerFrame = frame;
  }
  
  /**
   * Abstract method to be implemented by subclasses to compute the object's prime decomposition
   */
  abstract computePrimeDecomposition(): PrimeDecomposition;
  
  /**
   * Abstract method to be implemented by subclasses to compute the object's canonical representation
   */
  abstract computeCanonicalRepresentation(): CanonicalRepresentation;
  
  /**
   * Abstract method to be implemented by subclasses to measure the coherence of the object
   */
  abstract measureCoherence(): CoherenceMeasure;
}