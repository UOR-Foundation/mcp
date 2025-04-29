/**
 * UOR Core Abstract Classes
 * Implements the fundamental UOR framework components as abstract TypeScript classes
 */

/**
 * Represents a prime factor in a decomposition
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
 * Represents the factorization of an object into irreducible components
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
 * Represents a canonical, basis-independent representation of an object
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
 * Represents a perspective from which universal objects are observed
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
 * Represents a measure of representational integrity and consistency
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
 * Represents a domain within which UOR principles apply
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
export type UORType =
  | 'UORObject'
  | 'PrimeDecomposition'
  | 'CanonicalRepresentation'
  | 'ObserverFrame'
  | 'CoherenceMeasure'
  | 'UORDomain';

/**
 * The abstract base object for all UOR entities
 * This implements the trilateral coherence relationship between
 * object, representation, and observer
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

  /**
   * Creates a new UOR object
   * @param id Unique identifier for the object
   * @param type The type of UOR object
   */
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
   * Transforms this object to a different observer frame
   * @param newFrame The new observer frame to transform to
   * @returns A new UOR object in the new observer frame
   */
  abstract transformToFrame(newFrame: ObserverFrame): UORObject;

  /**
   * Computes the prime decomposition of this object
   * This is a central operation in UOR, factorizing the object
   * into irreducible components
   */
  abstract computePrimeDecomposition(): PrimeDecomposition;

  /**
   * Computes the canonical representation of this object
   * This creates a unique, basis-independent representation
   */
  abstract computeCanonicalRepresentation(): CanonicalRepresentation;

  /**
   * Measures the coherence of this object's representation
   * This quantifies the representational integrity
   */
  abstract measureCoherence(): CoherenceMeasure;

  /**
   * Serializes this object to a JSON representation
   * This ensures the canonical form is preserved
   */
  abstract serialize(): object;

  /**
   * Validates this object against its schema
   * @returns Whether the object is valid
   */
  abstract validate(): boolean;

  /**
   * Gets the intrinsic prime factors for this object's domain
   * @returns Array of prime factors that are intrinsic to this domain
   */
  abstract getIntrinsicPrimes(): PrimeFactor[];
}

/**
 * Represents a schema in the UOR framework
 * All schemas in UOR are themselves UOR objects
 */
export abstract class UORSchema extends UORObject {
  /** The JSON Schema definition */
  schema: object;

  /**
   * Creates a new UOR schema
   * @param id Schema identifier
   * @param schema JSON Schema definition
   */
  constructor(id: string, schema: object) {
    super(id, 'UORSchema');
    this.schema = schema;
  }

  /**
   * Validates a data object against this schema
   * @param data The data to validate
   * @returns Whether the data is valid according to this schema
   */
  abstract validateData(data: object): boolean;
}

/**
 * Represents a storage artifact in the UOR framework
 * Used for large content with chunked, multi-base representation
 */
export abstract class UORArtifact extends UORObject {
  /** Content chunks */
  chunks: string[];

  /** MIME type of the content */
  mimeType: string;

  /** Total size in bytes */
  size: number;

  /**
   * Creates a new UOR artifact
   * @param id Artifact identifier
   * @param mimeType MIME type of the content
   * @param size Total size in bytes
   */
  constructor(id: string, mimeType: string, size: number) {
    super(id, 'UORArtifact');
    this.chunks = [];
    this.mimeType = mimeType;
    this.size = size;
  }

  /**
   * Adds a content chunk to this artifact
   * @param chunk Base64-encoded content chunk
   */
  addChunk(chunk: string): void {
    this.chunks.push(chunk);
  }

  /**
   * Gets all content chunks
   * @returns Array of content chunks
   */
  getChunks(): string[] {
    return this.chunks;
  }

  /**
   * Assembles the complete content from chunks
   * @returns The complete content as a string or Buffer
   */
  abstract assembleContent(): string | Buffer;
}

/**
 * Represents a namespace resolver in the UOR framework
 * Used to map between different namespaces
 */
export abstract class UORResolver extends UORObject {
  /** Target namespace */
  targetNamespace: string;

  /** Resolution method */
  resolutionMethod: string;

  /**
   * Creates a new UOR resolver
   * @param id Resolver identifier
   * @param targetNamespace Target namespace
   * @param resolutionMethod Resolution method
   */
  constructor(id: string, targetNamespace: string, resolutionMethod: string) {
    super(id, 'UORResolver');
    this.targetNamespace = targetNamespace;
    this.resolutionMethod = resolutionMethod;
  }

  /**
   * Resolves a UOR object reference to another namespace
   * @param reference The reference to resolve
   * @returns The resolved reference in the target namespace
   */
  abstract resolveReference(reference: string): string;
}
