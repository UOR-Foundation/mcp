/**
 * Mock implementation of SchemaValidator for testing
 */

import { ValidationResult } from '../../schema-types';

export class SchemaValidator {
  private static instance: SchemaValidator;
  private initialized = false;

  private constructor() {}

  public static getInstance(): SchemaValidator {
    if (!SchemaValidator.instance) {
      SchemaValidator.instance = new SchemaValidator();
    }
    return SchemaValidator.instance;
  }

  public async initialize(): Promise<void> {
    this.initialized = true;
    return Promise.resolve();
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public validateUORObject(uorObject: any): ValidationResult {
    return { valid: true };
  }

  public validateObserverFrame(observerFrame: any): ValidationResult {
    return { valid: true };
  }

  public validateAxioms(axioms: any): ValidationResult {
    return { valid: true };
  }

  public validate(schemaId: string, data: any): ValidationResult {
    return { valid: true };
  }

  public formatErrors(errors: any[]): string[] {
    return errors.map(error => `${error.message} at ${error.path || ''}`);
  }

  public assertValid(uorObject: any): boolean {
    return true;
  }
}
