/**
 * Schema Validator Module
 * Provides validation functionality for UOR objects against JSON schemas
 */

import { ValidationError, ValidationResult } from './schema-types';
import { SchemaLoader } from './schema-loader';

/**
 * Schema Validator class
 * Responsible for validating UOR objects against schemas
 */
export class SchemaValidator {
  private static instance: SchemaValidator;
  private schemaLoader: SchemaLoader;
  private initialized = false;

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.schemaLoader = SchemaLoader.getInstance();
  }

  /**
   * Get singleton instance
   * @returns SchemaValidator instance
   */
  public static getInstance(): SchemaValidator {
    if (!SchemaValidator.instance) {
      SchemaValidator.instance = new SchemaValidator();
    }
    return SchemaValidator.instance;
  }

  /**
   * Initialize the schema validator
   * @throws Error if initialization fails
   */
  public async initialize(): Promise<void> {
    try {
      await this.schemaLoader.initialize();
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing schema validator:', error);
      this.initialized = false;
      throw error;
    }
  }

  /**
   * Check if the validator is initialized
   * @returns True if initialized, false otherwise
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Validate a UOR object against the core schema
   * @param uorObject UOR object to validate
   * @returns Validation result
   */
  public validateUORObject(uorObject: any): ValidationResult {
    if (!this.initialized) {
      return {
        valid: false,
        errors: [
          {
            message: 'Schema validator not initialized',
            path: '',
            keyword: 'initialization',
            schemaPath: '',
            instancePath: '',
          },
        ],
      };
    }

    if (!uorObject || typeof uorObject !== 'object') {
      return {
        valid: false,
        errors: [
          {
            message: 'UOR object must be an object',
            path: '',
            keyword: 'type',
            schemaPath: '#/type',
            instancePath: '',
          },
        ],
      };
    }

    return this.schemaLoader.validate(
      'https://uor-foundation.org/schemas/uor-core.schema.json',
      uorObject
    );
  }

  /**
   * Validate an observer frame against the observer frame schema
   * @param observerFrame Observer frame to validate
   * @returns Validation result
   */
  public validateObserverFrame(observerFrame: any): ValidationResult {
    if (!this.initialized) {
      return {
        valid: false,
        errors: [
          {
            message: 'Schema validator not initialized',
            path: '',
            keyword: 'initialization',
            schemaPath: '',
            instancePath: '',
          },
        ],
      };
    }

    if (!observerFrame || typeof observerFrame !== 'object') {
      return {
        valid: false,
        errors: [
          {
            message: 'Observer frame must be an object',
            path: '',
            keyword: 'type',
            schemaPath: '#/type',
            instancePath: '',
          },
        ],
      };
    }

    return this.schemaLoader.validate(
      'https://uor-foundation.org/schemas/observer-frame.schema.json',
      observerFrame
    );
  }

  /**
   * Validate UOR axioms against the axioms schema
   * @param axioms UOR axioms to validate
   * @returns Validation result
   */
  public validateAxioms(axioms: any): ValidationResult {
    if (!this.initialized) {
      return {
        valid: false,
        errors: [
          {
            message: 'Schema validator not initialized',
            path: '',
            keyword: 'initialization',
            schemaPath: '',
            instancePath: '',
          },
        ],
      };
    }

    return this.schemaLoader.validate(
      'https://uor-foundation.org/schemas/uor-axioms.schema.json',
      axioms
    );
  }

  /**
   * Validate a UOR object against a specific schema
   * @param schemaId Schema ID
   * @param data Data to validate
   * @returns Validation result
   */
  public validate(schemaId: string, data: any): ValidationResult {
    if (!this.initialized) {
      return {
        valid: false,
        errors: [
          {
            message: 'Schema validator not initialized',
            path: '',
            keyword: 'initialization',
            schemaPath: '',
            instancePath: '',
          },
        ],
      };
    }

    return this.schemaLoader.validate(schemaId, data);
  }

  /**
   * Format validation errors for display
   * @param errors Validation errors
   * @returns Formatted error messages
   */
  public formatErrors(errors: ValidationError[]): string[] {
    if (!errors || !Array.isArray(errors)) {
      return ['Unknown validation error'];
    }

    return errors.map(error => {
      const path = error.path || '';
      return `${error.message} at ${path}`;
    });
  }

  /**
   * Check if a UOR object is valid
   * @param uorObject UOR object to validate
   * @returns True if valid, false otherwise
   * @throws Error with validation errors if invalid
   */
  public assertValid(uorObject: any): boolean {
    const result = this.validateUORObject(uorObject);
    
    if (!result) {
      throw new Error('UOR object validation failed: No validation result returned');
    }
    
    if (result.valid === false && result.errors) {
      const errorMessages = this.formatErrors(result.errors);
      throw new Error(`UOR object validation failed: ${errorMessages.join(', ')}`);
    }
    
    return true;
  }
}
