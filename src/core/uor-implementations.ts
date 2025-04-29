/**
 * UOR Core Concrete Implementations
 * Provides concrete implementations of the UOR abstract classes
 */
import {
  UORObject,
  UORSchema,
  UORArtifact,
  UORResolver,
  PrimeFactor,
  PrimeDecomposition,
  CanonicalRepresentation,
  ObserverFrame,
  CoherenceMeasure,
} from './uor-core';

/**
 * Base concrete implementation of UORObject
 * Provides basic implementations of abstract methods
 */
export class BaseUORObject extends UORObject {
  /** Object data content */
  protected data: any;

  /** Domain for this object */
  protected domain: string;

  /**
   * Creates a new Base UOR Object
   * @param id Unique identifier
   * @param type Object type
   * @param data Object data
   * @param domain Domain this object belongs to
   */
  constructor(id: string, type: string, data: any, domain: string = 'generic') {
    super(id, type);
    this.data = data;
    this.domain = domain;
  }

  /**
   * Transforms this object to a different observer frame
   * @param newFrame The new observer frame to transform to
   * @returns A new UOR object in the new observer frame
   */
  transformToFrame(newFrame: ObserverFrame): UORObject {
    // Create a new object with the same content but different frame
    const transformed = new BaseUORObject(this.id, this.type, this.data, this.domain);

    // Copy the prime decomposition and canonical representation
    if (this.primeDecomposition) {
      transformed.primeDecomposition = this.primeDecomposition;
    }

    if (this.canonicalRepresentation) {
      transformed.canonicalRepresentation = this.canonicalRepresentation;
    }

    // Set the new observer frame
    transformed.observerFrame = newFrame;

    return transformed;
  }

  /**
   * Computes the prime decomposition of this object
   * This implementation uses a generic JSON decomposition approach
   */
  computePrimeDecomposition(): PrimeDecomposition {
    // For generic data, we use a JSON-based decomposition
    // In a real implementation, this would use domain-specific algorithms
    const primeFactors: PrimeFactor[] = [];

    if (typeof this.data === 'object' && this.data !== null) {
      // For objects, each key-value pair becomes a prime factor
      for (const [key, value] of Object.entries(this.data)) {
        const factor: PrimeFactor = {
          id: `${this.domain}:${typeof value}:${key}`,
          value: { key, value } as any,
          domain: this.domain,
        };
        primeFactors.push(factor);
      }
    } else {
      // For primitives, the value itself is a prime factor
      const factor: PrimeFactor = {
        id: `${this.domain}:${typeof this.data}:value`,
        value: { value: this.data } as any,
        domain: this.domain,
      };
      primeFactors.push(factor);
    }

    return {
      primeFactors,
      decompositionMethod: 'json-property-decomposition',
    };
  }

  /**
   * Computes the canonical representation of this object
   * Creates a normalized, sorted representation
   */
  computeCanonicalRepresentation(): CanonicalRepresentation {
    // For generic data, we create a normalized JSON representation
    // The normalization ensures consistent ordering and formatting
    let normalizedValue: any;

    if (typeof this.data === 'object' && this.data !== null) {
      // For objects, we sort keys and normalize nested objects
      normalizedValue = this.normalizeObject(this.data);
    } else {
      // For primitives, we use the value directly
      normalizedValue = this.data;
    }

    return {
      representationType: 'json-normalized',
      value: { data: normalizedValue } as any,
      coherenceNorm: 1.0, // Default norm for simple objects
    };
  }

  /**
   * Normalizes an object for canonical representation
   * @param obj The object to normalize
   * @returns Normalized object
   */
  private normalizeObject(obj: any): any {
    if (Array.isArray(obj)) {
      // For arrays, normalize each element
      return obj.map(item => this.normalizeObject(item));
    }

    if (typeof obj === 'object' && obj !== null) {
      // For objects, sort keys and normalize values
      const normalized: any = {};
      const sortedKeys = Object.keys(obj).sort();

      for (const key of sortedKeys) {
        normalized[key] = this.normalizeObject(obj[key]);
      }

      return normalized;
    }

    // For primitives, return as is
    return obj;
  }

  /**
   * Measures the coherence of this object's representation
   * Quantifies how well the representation maintains the object's structure
   */
  measureCoherence(): CoherenceMeasure {
    // Import coherence metrics - done inline to avoid circular dependency
    // Using dynamic import to avoid circular dependency
    const { CoherenceMetrics } = require('./uor-coherence');

    // Use the optimal coherence measure from our enhanced metrics
    return CoherenceMetrics.measureOptimalCoherence(this);
  }

  /**
   * Serializes this object to a JSON representation
   * Ensures the canonical form is preserved
   */
  serialize(): object {
    // Compute canonical representation if not already done
    if (!this.canonicalRepresentation) {
      this.canonicalRepresentation = this.computeCanonicalRepresentation();
    }

    // Serialize the object with its UOR metadata
    return {
      id: this.id,
      type: this.type,
      canonicalRepresentation: this.canonicalRepresentation,
      observerFrame: this.observerFrame,
      primeDecomposition: this.primeDecomposition,
    };
  }

  /**
   * Validates this object against its schema
   * @returns Whether the object is valid
   */
  validate(): boolean {
    // Simple validation checking required properties
    return typeof this.id === 'string' && typeof this.type === 'string' && this.data !== undefined;
  }

  /**
   * Gets the intrinsic prime factors for this object's domain
   * @returns Array of prime factors that are intrinsic to this domain
   */
  getIntrinsicPrimes(): PrimeFactor[] {
    // For the generic domain, we have no intrinsic primes
    return [];
  }
}

/**
 * Concrete implementation of UORSchema
 */
export class SimpleUORSchema extends UORSchema {
  /**
   * Transforms this schema to a different observer frame
   * @param newFrame The new observer frame to transform to
   * @returns A new UOR object in the new observer frame
   */
  transformToFrame(newFrame: ObserverFrame): UORObject {
    // Create a new schema with the same content but different frame
    const transformed = new SimpleUORSchema(this.id, this.schema);

    // Copy the prime decomposition and canonical representation
    if (this.primeDecomposition) {
      transformed.primeDecomposition = this.primeDecomposition;
    }

    if (this.canonicalRepresentation) {
      transformed.canonicalRepresentation = this.canonicalRepresentation;
    }

    // Set the new observer frame
    transformed.observerFrame = newFrame;

    return transformed;
  }

  /**
   * Computes the prime decomposition of this schema
   */
  computePrimeDecomposition(): PrimeDecomposition {
    // Convert schema to key-value pairs as prime factors
    const primeFactors: PrimeFactor[] = [];

    const addSchemaProperties = (obj: any, path: string = ''): void => {
      if (typeof obj !== 'object' || obj === null) return;

      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;

        if (key === 'properties' && typeof value === 'object') {
          // Handle schema properties specially
          for (const [propName, propDef] of Object.entries(value as Record<string, unknown>)) {
            const factor: PrimeFactor = {
              id: `schema:property:${propName}`,
              value: { property: propName, definition: propDef } as any,
              domain: 'schema',
            };
            primeFactors.push(factor);
          }
        } else if (key === 'required' && Array.isArray(value)) {
          // Handle required properties
          const factor: PrimeFactor = {
            id: `schema:required`,
            value: { required: value } as any,
            domain: 'schema',
          };
          primeFactors.push(factor);
        } else if (typeof value === 'object' && value !== null) {
          // Recurse into nested objects
          addSchemaProperties(value, currentPath);
        } else {
          // Add other properties as factors
          const factor: PrimeFactor = {
            id: `schema:${currentPath}`,
            value: { [key]: value } as any,
            domain: 'schema',
          };
          primeFactors.push(factor);
        }
      }
    };

    addSchemaProperties(this.schema);

    return {
      primeFactors,
      decompositionMethod: 'schema-property-decomposition',
    };
  }

  /**
   * Computes the canonical representation of this schema
   */
  computeCanonicalRepresentation(): CanonicalRepresentation {
    // Normalize the schema
    const normalizeSchema = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(item => normalizeSchema(item)).sort();
      }

      if (typeof obj === 'object' && obj !== null) {
        const normalized: any = {};
        const sortedKeys = Object.keys(obj).sort();

        for (const key of sortedKeys) {
          normalized[key] = normalizeSchema(obj[key]);
        }

        return normalized;
      }

      return obj;
    };

    const normalizedSchema = normalizeSchema(this.schema);

    return {
      representationType: 'json-schema-normalized',
      value: normalizedSchema as any,
      coherenceNorm: 1.0,
    };
  }

  /**
   * Measures the coherence of this schema
   */
  measureCoherence(): CoherenceMeasure {
    // For schemas, coherence is based on schema validity and completeness
    return {
      type: 'schema-validity',
      value: 1.0,
      normalization: 'unit-normalized',
    };
  }

  /**
   * Serializes this schema
   */
  serialize(): object {
    return {
      id: this.id,
      type: this.type,
      schema: this.schema,
      canonicalRepresentation:
        this.canonicalRepresentation || this.computeCanonicalRepresentation(),
    };
  }

  /**
   * Validates this schema
   */
  validate(): boolean {
    // Check if it's a valid JSON Schema (basic check)
    return (
      typeof this.schema === 'object' &&
      this.schema !== null &&
      typeof this.id === 'string' &&
      this.type === 'UORSchema'
    );
  }

  /**
   * Validates data against this schema
   * @param data The data to validate
   */
  validateData(data: object): boolean {
    // Simple validation - in production use a JSON Schema validator
    // This is a placeholder implementation
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    // Check required properties if defined in schema
    const requiredProps = (this.schema as any).required;
    if (Array.isArray(requiredProps)) {
      for (const prop of requiredProps) {
        if (!(prop in data)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Gets intrinsic prime factors for schemas
   */
  getIntrinsicPrimes(): PrimeFactor[] {
    // Schema domain has intrinsic primes for common schema elements
    return [
      {
        id: 'schema:intrinsic:type',
        value: { key: 'type', description: 'JSON Schema type property' } as any,
        domain: 'schema',
      },
      {
        id: 'schema:intrinsic:properties',
        value: { key: 'properties', description: 'JSON Schema properties container' } as any,
        domain: 'schema',
      },
      {
        id: 'schema:intrinsic:required',
        value: { key: 'required', description: 'JSON Schema required properties array' } as any,
        domain: 'schema',
      },
    ];
  }
}

/**
 * Concrete implementation of UORArtifact for text content
 */
export class TextArtifact extends UORArtifact {
  /**
   * Transforms this artifact to a different observer frame
   * @param newFrame The new observer frame to transform to
   * @returns A new UOR object in the new observer frame
   */
  transformToFrame(newFrame: ObserverFrame): UORObject {
    // Create a new artifact with the same content but different frame
    const transformed = new TextArtifact(this.id, this.mimeType, this.size);

    // Copy chunks
    transformed.chunks = [...this.chunks];

    // Copy the prime decomposition and canonical representation
    if (this.primeDecomposition) {
      transformed.primeDecomposition = this.primeDecomposition;
    }

    if (this.canonicalRepresentation) {
      transformed.canonicalRepresentation = this.canonicalRepresentation;
    }

    // Set the new observer frame
    transformed.observerFrame = newFrame;

    return transformed;
  }

  /**
   * Computes prime decomposition of a text artifact
   */
  computePrimeDecomposition(): PrimeDecomposition {
    // For text, we decompose into lines or paragraphs
    const chunks = this.assembleContent() as string;
    const lines = chunks.split('\n');

    const primeFactors: PrimeFactor[] = [];

    // Each line becomes a prime factor
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length > 0) {
        primeFactors.push({
          id: `text:line:${i}`,
          value: { lineNumber: i, content: line } as any,
          domain: 'text',
        });
      }
    }

    return {
      primeFactors,
      decompositionMethod: 'text-line-decomposition',
    };
  }

  /**
   * Computes canonical representation of a text artifact
   */
  computeCanonicalRepresentation(): CanonicalRepresentation {
    // For text, the canonical form is normalized whitespace and line endings
    const content = this.assembleContent() as string;
    const normalized = content
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      representationType: 'text-normalized',
      value: { content: normalized } as any,
      coherenceNorm: 1.0,
    };
  }

  /**
   * Measures coherence of a text artifact
   */
  measureCoherence(): CoherenceMeasure {
    // For text, coherence is based on content integrity
    return {
      type: 'content-integrity',
      value: 1.0,
      normalization: 'unit-normalized',
    };
  }

  /**
   * Serializes a text artifact
   */
  serialize(): object {
    return {
      id: this.id,
      type: this.type,
      mimeType: this.mimeType,
      size: this.size,
      chunks: this.chunks,
      canonicalRepresentation:
        this.canonicalRepresentation || this.computeCanonicalRepresentation(),
    };
  }

  /**
   * Validates a text artifact
   */
  validate(): boolean {
    return (
      typeof this.id === 'string' &&
      this.type === 'UORArtifact' &&
      this.mimeType.startsWith('text/') &&
      Array.isArray(this.chunks)
    );
  }

  /**
   * Gets intrinsic primes for text domain
   */
  getIntrinsicPrimes(): PrimeFactor[] {
    return [
      {
        id: 'text:intrinsic:paragraph',
        value: { unit: 'paragraph', description: 'A paragraph of text' } as any,
        domain: 'text',
      },
      {
        id: 'text:intrinsic:line',
        value: { unit: 'line', description: 'A line of text' } as any,
        domain: 'text',
      },
      {
        id: 'text:intrinsic:sentence',
        value: { unit: 'sentence', description: 'A sentence of text' } as any,
        domain: 'text',
      },
    ];
  }

  /**
   * Assembles text content from chunks
   */
  assembleContent(): string | Buffer {
    // Join all chunks to form the complete text
    return this.chunks.map(chunk => atob(chunk)).join('');
  }
}

/**
 * Concrete implementation of UORResolver for GitHub-based namespace resolution
 */
export class GitHubNamespaceResolver extends UORResolver {
  /** The source namespace for this resolver */
  private sourceNamespace: string;

  /**
   * Creates a GitHub namespace resolver
   * @param id Resolver identifier
   * @param sourceNamespace Source namespace (username)
   * @param targetNamespace Target namespace (username)
   */
  constructor(id: string, sourceNamespace: string, targetNamespace: string) {
    super(id, targetNamespace, 'github');
    this.sourceNamespace = sourceNamespace;
  }

  /**
   * Transforms this resolver to a different observer frame
   * @param newFrame The new observer frame to transform to
   * @returns A new UOR object in the new observer frame
   */
  transformToFrame(newFrame: ObserverFrame): UORObject {
    // Create a new resolver with the same content but different frame
    const transformed = new GitHubNamespaceResolver(
      this.id,
      this.sourceNamespace,
      this.targetNamespace
    );

    // Copy the prime decomposition and canonical representation
    if (this.primeDecomposition) {
      transformed.primeDecomposition = this.primeDecomposition;
    }

    if (this.canonicalRepresentation) {
      transformed.canonicalRepresentation = this.canonicalRepresentation;
    }

    // Set the new observer frame
    transformed.observerFrame = newFrame;

    return transformed;
  }

  /**
   * Resolves a reference from source to target namespace
   * @param reference The UOR reference to resolve
   */
  resolveReference(reference: string): string {
    // Parse the UOR reference
    // Format: uor://<namespace>/<type>/<id>
    try {
      const url = new URL(reference);
      const [, type, id] = url.pathname.split('/');

      // If already in target namespace, return as is
      if (url.hostname === this.targetNamespace) {
        return reference;
      }

      // Create new reference in target namespace
      return `uor://${this.targetNamespace}/${type}/${id}`;
    } catch (error) {
      throw new Error(`Invalid UOR reference: ${String(error)}`);
    }
  }

  /**
   * Computes the prime decomposition of this resolver
   */
  computePrimeDecomposition(): PrimeDecomposition {
    return {
      primeFactors: [
        {
          id: `resolver:source:${this.sourceNamespace}`,
          value: { namespace: this.sourceNamespace } as any,
          domain: 'resolver',
        },
        {
          id: `resolver:target:${this.targetNamespace}`,
          value: { namespace: this.targetNamespace } as any,
          domain: 'resolver',
        },
        {
          id: `resolver:method:${this.resolutionMethod}`,
          value: { method: this.resolutionMethod } as any,
          domain: 'resolver',
        },
      ],
      decompositionMethod: 'resolver-component-decomposition',
    };
  }

  /**
   * Computes the canonical representation of this resolver
   */
  computeCanonicalRepresentation(): CanonicalRepresentation {
    return {
      representationType: 'resolver-normalized',
      value: {
        source: this.sourceNamespace,
        target: this.targetNamespace,
        method: this.resolutionMethod,
      } as any,
      coherenceNorm: 1.0,
    };
  }

  /**
   * Measures coherence of this resolver
   */
  measureCoherence(): CoherenceMeasure {
    return {
      type: 'resolver-integrity',
      value: 1.0,
      normalization: 'unit-normalized',
    };
  }

  /**
   * Serializes this resolver
   */
  serialize(): object {
    return {
      id: this.id,
      type: this.type,
      sourceNamespace: this.sourceNamespace,
      targetNamespace: this.targetNamespace,
      resolutionMethod: this.resolutionMethod,
      canonicalRepresentation:
        this.canonicalRepresentation || this.computeCanonicalRepresentation(),
    };
  }

  /**
   * Validates this resolver
   */
  validate(): boolean {
    return (
      typeof this.id === 'string' &&
      this.type === 'UORResolver' &&
      typeof this.sourceNamespace === 'string' &&
      typeof this.targetNamespace === 'string' &&
      typeof this.resolutionMethod === 'string'
    );
  }

  /**
   * Gets intrinsic primes for resolver domain
   */
  getIntrinsicPrimes(): PrimeFactor[] {
    return [
      {
        id: 'resolver:intrinsic:source',
        value: { component: 'source', description: 'Source namespace' } as any,
        domain: 'resolver',
      },
      {
        id: 'resolver:intrinsic:target',
        value: { component: 'target', description: 'Target namespace' } as any,
        domain: 'resolver',
      },
      {
        id: 'resolver:intrinsic:method',
        value: { component: 'method', description: 'Resolution method' } as any,
        domain: 'resolver',
      },
    ];
  }
}
