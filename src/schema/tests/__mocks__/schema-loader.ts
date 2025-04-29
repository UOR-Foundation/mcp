/**
 * Mock Schema Loader
 * For testing purposes
 */

import { LoadedSchema, SchemaSource, ValidationResult } from '../../schema-types';
import { JSONSchema7 } from 'json-schema';

/**
 * Mock Schema Loader class
 */
export class SchemaLoader {
  private static instance: SchemaLoader;
  private schemas: Map<string, LoadedSchema> = new Map();
  private initialized: boolean = false;

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}

  /**
   * Get singleton instance
   * @returns SchemaLoader instance
   */
  public static getInstance(): SchemaLoader {
    if (!SchemaLoader.instance) {
      SchemaLoader.instance = new SchemaLoader();
    }
    return SchemaLoader.instance;
  }

  /**
   * Initialize the schema loader
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.initialized = true;

    this.addMockSchema(
      'https://uor-foundation.org/schemas/uor-core.schema.json',
      'UOR Core Schema'
    );
    this.addMockSchema(
      'https://uor-foundation.org/schemas/observer-frame.schema.json',
      'Observer Frame Schema'
    );
    this.addMockSchema(
      'https://uor-foundation.org/schemas/uor-axioms.schema.json',
      'UOR Axioms Schema'
    );
  }

  /**
   * Add a mock schema
   * @param id Schema ID
   * @param title Schema title
   */
  private addMockSchema(id: string, title: string): void {
    const source: SchemaSource = {
      path: `/mock/path/${id.split('/').pop()}`,
      id,
      title,
      description: `Mock schema for ${title}`,
    };

    const schema: JSONSchema7 = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $id: id,
      title,
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
      required: ['id'],
    };

    const validate = (data: any): ValidationResult => {
      if (data && data.id) {
        return { valid: true };
      }
      return {
        valid: false,
        errors: [{ message: 'Missing required property: id', path: '/id' }],
      };
    };

    this.schemas.set(id, { source, schema, validate });
  }

  /**
   * Get a schema by ID
   * @param id Schema ID
   * @returns Schema or undefined if not found
   */
  public getSchema(id: string): LoadedSchema | undefined {
    return this.schemas.get(id);
  }

  /**
   * Get all schemas
   * @returns Map of schemas
   */
  public getAllSchemas(): Map<string, LoadedSchema> {
    return this.schemas;
  }

  /**
   * Validate data against a schema
   * @param schemaId Schema ID
   * @param data Data to validate
   * @returns Validation result
   */
  public validate(schemaId: string, data: any): ValidationResult {
    const schema = this.getSchema(schemaId);
    if (!schema) {
      throw new Error('Schema not found');
    }
    return schema.validate(data);
  }

  /**
   * Reload a schema from file
   * @param schemaId Schema ID
   */
  public async reloadSchema(schemaId: string): Promise<void> {
    const schema = this.getSchema(schemaId);
    if (!schema) {
      throw new Error('Schema not found');
    }
  }

  /**
   * Reload all schemas from file
   */
  public async reloadAllSchemas(): Promise<void> {}
}
