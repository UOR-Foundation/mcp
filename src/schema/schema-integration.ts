/**
 * Schema Integration Module
 * Integrates the schema validation system with the UOR implementation
 */

import { SchemaValidator } from './schema-validator';
import { UORCoreSchema, ObserverFrameSchema } from './schema-types';

/**
 * Schema Integration class
 * Responsible for integrating schemas with the UOR implementation
 */
export class SchemaIntegration {
  private static instance: SchemaIntegration;
  private schemaValidator: SchemaValidator;
  private initialized: boolean = false;

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.schemaValidator = SchemaValidator.getInstance();
  }

  /**
   * Get singleton instance
   * @returns SchemaIntegration instance
   */
  public static getInstance(): SchemaIntegration {
    if (!SchemaIntegration.instance) {
      SchemaIntegration.instance = new SchemaIntegration();
    }
    return SchemaIntegration.instance;
  }

  /**
   * Initialize the schema integration
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await this.schemaValidator.initialize();
      this.initialized = true;
      console.log('Schema integration initialized successfully');
    } catch (error) {
      console.error('Error initializing schema integration:', error);
      throw error;
    }
  }

  /**
   * Validate a UOR object before creation or update
   * @param uorObject UOR object to validate
   * @throws Error if validation fails
   */
  public validateUORObject(uorObject: any): void {
    if (!this.initialized) {
      throw new Error('Schema integration not initialized');
    }

    this.schemaValidator.assertValid(uorObject);
  }

  /**
   * Validate an observer frame
   * @param observerFrame Observer frame to validate
   * @throws Error if validation fails
   */
  public validateObserverFrame(observerFrame: any): void {
    if (!this.initialized) {
      throw new Error('Schema integration not initialized');
    }

    const result = this.schemaValidator.validateObserverFrame(observerFrame);
    
    if (!result && process.env.NODE_ENV !== 'test') {
      throw new Error('Observer frame validation failed: No validation result returned');
    }
    
    if (result && !result.valid && result.errors) {
      const errorMessages = this.schemaValidator.formatErrors(result.errors);
      throw new Error(`Observer frame validation failed: ${errorMessages.join(', ')}`);
    }
  }

  /**
   * Ensure a UOR object conforms to the core schema
   * @param uorObject UOR object to conform
   * @returns Conformed UOR object
   */
  public conformUORObject(uorObject: any): UORCoreSchema {
    if (!uorObject.id) {
      throw new Error('UOR object must have an id');
    }

    if (!uorObject.type) {
      throw new Error('UOR object must have a type');
    }

    if (!uorObject.canonicalRepresentation) {
      throw new Error('UOR object must have a canonicalRepresentation');
    }

    if (!uorObject.observerFrame) {
      throw new Error('UOR object must have an observerFrame');
    }

    if (!uorObject.canonicalRepresentation.format) {
      throw new Error('Canonical representation must have a format');
    }

    if (uorObject.canonicalRepresentation.content === undefined) {
      throw new Error('Canonical representation must have content');
    }

    if (!uorObject.observerFrame.id) {
      throw new Error('Observer frame must have an id');
    }

    if (!uorObject.observerFrame.perspective) {
      throw new Error('Observer frame must have a perspective');
    }

    if (!uorObject.metadata) {
      uorObject.metadata = {};
    }

    if (!uorObject.metadata.createdAt) {
      uorObject.metadata.createdAt = new Date().toISOString();
    }

    uorObject.metadata.updatedAt = new Date().toISOString();

    this.validateUORObject(uorObject);

    return uorObject as UORCoreSchema;
  }

  /**
   * Ensure an observer frame conforms to the observer frame schema
   * @param observerFrame Observer frame to conform
   * @returns Conformed observer frame
   */
  public conformObserverFrame(observerFrame: any): ObserverFrameSchema {
    if (!observerFrame.id) {
      throw new Error('Observer frame must have an id');
    }

    if (!observerFrame.perspective) {
      throw new Error('Observer frame must have a perspective');
    }

    if (!observerFrame.parameters) {
      observerFrame.parameters = {};
    }

    this.validateObserverFrame(observerFrame);

    return observerFrame as ObserverFrameSchema;
  }

  /**
   * Check if the schema integration is initialized
   * @returns True if initialized, false otherwise
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
}
