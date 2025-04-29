/**
 * Schema Types Module
 * Defines TypeScript interfaces for UOR schemas
 */

import { JSONSchema7 } from 'json-schema';

/**
 * Schema source information
 */
export interface SchemaSource {
  /** Schema file path */
  path: string;
  /** Schema ID */
  id: string;
  /** Schema title */
  title: string;
  /** Schema description */
  description?: string;
}

/**
 * Loaded schema information
 */
export interface LoadedSchema {
  /** Schema source information */
  source: SchemaSource;
  /** Parsed JSON schema */
  schema: JSONSchema7;
  /** Compiled validator function */
  validate: SchemaValidator;
}

/**
 * Schema validation result
 */
export interface ValidationResult {
  /** Whether the validation passed */
  valid: boolean;
  /** Validation errors if any */
  errors?: ValidationError[];
}

/**
 * Schema validation error
 */
export interface ValidationError {
  /** Error message */
  message: string;
  /** JSON path to the error */
  path?: string;
  /** Error keyword */
  keyword?: string;
  /** Error schema path */
  schemaPath?: string;
  /** Error instance path */
  instancePath?: string;
}

/**
 * Schema validator function
 */
export type SchemaValidator = (data: any) => ValidationResult;

/**
 * UOR Core Schema TypeScript Interface
 * Generated from uor-core.schema.json
 */
export interface UORCoreSchema {
  id: string;
  type: 'concept' | 'resource' | 'topic' | 'predicate' | 'resolver' | 'media';
  name?: string;
  description?: string;
  canonicalRepresentation: {
    format: 'json' | 'text' | 'binary' | 'reference';
    content: any;
    encoding?: 'base64' | 'hex' | 'utf8';
  };
  primeDecomposition?: Array<{
    factor: string;
    multiplicity: number;
  }>;
  observerFrame: {
    id: string;
    perspective: 'objective' | 'subjective' | 'intersubjective';
    parameters?: Record<string, any>;
  };
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
    version?: string;
    tags?: string[];
  };
}

/**
 * Observer Frame Schema TypeScript Interface
 * Generated from observer-frame.schema.json
 */
export interface ObserverFrameSchema {
  id: string;
  name?: string;
  description?: string;
  perspective: 'objective' | 'subjective' | 'intersubjective';
  parameters: {
    referenceSystem?: 'absolute' | 'relative' | 'contextual';
    dimensionality?: number;
    resolution?: {
      spatial?: number;
      temporal?: number;
      conceptual?: number;
    };
    contextFactors?: Array<{
      name: string;
      value: any;
      weight?: number;
    }>;
  };
  transformations?: Array<{
    targetFrame: string;
    transformationType: 'linear' | 'nonlinear' | 'contextual' | 'identity';
    transformationParameters?: Record<string, any>;
    invariants?: string[];
  }>;
  coherenceMeasures?: {
    internalCoherence?: number;
    externalCoherence?: Record<string, number>;
  };
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
    version?: string;
  };
}

/**
 * UOR Axioms Schema TypeScript Interface
 * Generated from uor-axioms.schema.json
 */
export interface UORAxiomsSchema {
  axioms: Array<{
    id: string;
    name: string;
    statement: string;
    category:
      | 'trilateral-coherence'
      | 'unique-factorization'
      | 'canonical-representation'
      | 'coherence-measure';
    description?: string;
    implications?: string[];
    examples?: Array<{
      description: string;
      example: any;
    }>;
  }>;
  trilateralCoherence: {
    objects: {
      uniqueIdentity: true;
      consistentType: true;
    };
    representations: {
      canonicalForm: true;
      transformability: true;
    };
    observerFrames: {
      uniquePerspective: true;
      frameTransformations: true;
    };
  };
  uniqueFactorization: {
    existence: true;
    uniqueness: true;
  };
  canonicalRepresentation: {
    existence: true;
    uniqueness: true;
    consistency: true;
  };
  coherenceMeasure: {
    existence: true;
    nonNegativity: true;
    identity: true;
    symmetry: true;
    triangleInequality: true;
  };
}
