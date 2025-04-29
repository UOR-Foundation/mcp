/**
 * Schema Loader Module
 * Loads and parses JSON schemas from the models/schemas directory
 * Supports both Node.js and browser environments
 */

import { JSONSchema7 } from 'json-schema';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { LoadedSchema, SchemaSource, SchemaValidator, ValidationResult } from './schema-types';

import coreSchema from '../../models/schemas/uor-core.schema.json';
import axiomsSchema from '../../models/schemas/uor-axioms.schema.json';
import observerFrameSchema from '../../models/schemas/observer-frame.schema.json';

const isNode =
  typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

/**
 * Schema Loader class
 * Responsible for loading and parsing JSON schemas
 */
export class SchemaLoader {
  private static instance: SchemaLoader;
  private schemas: Map<string, LoadedSchema> = new Map();
  private ajv: Ajv;
  private schemasDir: string;
  private defaultSchemas: Record<string, JSONSchema7> = {
    'https://uor-foundation.org/schemas/uor-core.schema.json': coreSchema as JSONSchema7,
    'https://uor-foundation.org/schemas/uor-axioms.schema.json': axiomsSchema as JSONSchema7,
    'https://uor-foundation.org/schemas/observer-frame.schema.json':
      observerFrameSchema as JSONSchema7,
  };

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      $data: true,
      strict: false,
    });

    addFormats(this.ajv);

    this.schemasDir = isNode
      ? require('path').resolve(process.cwd(), 'models', 'schemas')
      : '/models/schemas';
  }

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
   * Loads all schemas from the models/schemas directory or uses pre-bundled schemas in browser
   */
  public async initialize(): Promise<void> {
    try {
      this.schemas.clear();
      this.ajv = new Ajv({
        allErrors: true,
        verbose: true,
        $data: true,
        strict: false,
      });

      addFormats(this.ajv);

      if (isNode) {
        await this.initializeNode();
      } else {
        await this.initializeBrowser();
      }

      console.log(`Loaded ${this.schemas.size} schemas successfully`);
    } catch (error) {
      console.error('Error initializing schema loader:', error);
      throw error;
    }
  }

  /**
   * Initialize in Node.js environment
   */
  private async initializeNode(): Promise<void> {
    const fs = require('fs');
    const path = require('path');

    if (!fs.existsSync(this.schemasDir)) {
      throw new Error(`Schemas directory not found: ${this.schemasDir}`);
    }

    const schemaFiles = fs
      .readdirSync(this.schemasDir)
      .filter((file: string) => file.endsWith('.schema.json'));

    if (schemaFiles.length === 0) {
      throw new Error('No schema files found in schemas directory');
    }

    for (const file of schemaFiles) {
      await this.loadSchemaNode(file);
    }
  }

  /**
   * Initialize in browser environment
   */
  private async initializeBrowser(): Promise<void> {
    for (const [schemaId, schema] of Object.entries(this.defaultSchemas)) {
      await this.loadSchemaBrowser(schemaId, schema);
    }
  }

  /**
   * Load a schema from file in Node.js environment
   * @param fileName Schema file name
   */
  private async loadSchemaNode(fileName: string): Promise<void> {
    try {
      const fs = require('fs');
      const path = require('path');

      const filePath = path.join(this.schemasDir, fileName);
      const schemaContent = fs.readFileSync(filePath, 'utf8');
      const schema = JSON.parse(schemaContent) as JSONSchema7;

      if (!schema.$id) {
        throw new Error(`Schema ${fileName} is missing $id property`);
      }

      const schemaId = schema.$id;
      const schemaSource: SchemaSource = {
        path: filePath,
        id: schemaId,
        title: schema.title || fileName,
        description: schema.description,
      };

      const validate = this.compileValidator(schema);

      const loadedSchema: LoadedSchema = {
        source: schemaSource,
        schema,
        validate,
      };

      this.schemas.set(schemaId, loadedSchema);
      console.log(`Loaded schema: ${schemaId}`);
    } catch (error) {
      console.error(`Error loading schema ${fileName}:`, error);
      throw error;
    }
  }

  /**
   * Load a pre-bundled schema in browser environment
   * @param schemaId Schema ID
   * @param schema Schema object
   */
  private async loadSchemaBrowser(schemaId: string, schema: JSONSchema7): Promise<void> {
    try {
      if (!schema.$id) {
        throw new Error(`Schema is missing $id property`);
      }

      const schemaSource: SchemaSource = {
        path: `${this.schemasDir}/${schemaId.split('/').pop()}`,
        id: schemaId,
        title: schema.title || schemaId.split('/').pop() || '',
        description: schema.description,
      };

      const validate = this.compileValidator(schema);

      const loadedSchema: LoadedSchema = {
        source: schemaSource,
        schema,
        validate,
      };

      this.schemas.set(schemaId, loadedSchema);
      console.log(`Loaded schema: ${schemaId}`);
    } catch (error) {
      console.error(`Error loading schema ${schemaId}:`, error);
      throw error;
    }
  }

  /**
   * Compile a validator function for a schema
   * @param schema JSON schema
   * @returns Validator function
   */
  private compileValidator(schema: JSONSchema7): SchemaValidator {
    try {
      const ajvValidate = this.ajv.compile(schema);

      const validator: SchemaValidator = (data: any): ValidationResult => {
        const valid = ajvValidate(data);

        if (valid) {
          return { valid: true };
        } else {
          return {
            valid: false,
            errors: ajvValidate.errors?.map(err => ({
              message: err.message || 'Unknown error',
              path: err.instancePath,
              keyword: err.keyword,
              schemaPath: err.schemaPath,
              instancePath: err.instancePath,
            })),
          };
        }
      };

      return validator;
    } catch (error) {
      console.error('Error compiling validator:', error);
      throw error;
    }
  }

  /**
   * Get a loaded schema by ID
   * @param schemaId Schema ID
   * @returns Loaded schema or undefined if not found
   */
  public getSchema(schemaId: string): LoadedSchema | undefined {
    return this.schemas.get(schemaId);
  }

  /**
   * Get all loaded schemas
   * @returns Map of loaded schemas
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
      throw new Error(`Schema not found: ${schemaId}`);
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
      throw new Error(`Schema not found: ${schemaId}`);
    }

    if (isNode) {
      const path = require('path');
      const fileName = path.basename(schema.source.path);
      await this.loadSchemaNode(fileName);
    } else {
      const defaultSchema = this.defaultSchemas[schemaId];
      if (defaultSchema) {
        await this.loadSchemaBrowser(schemaId, defaultSchema);
      } else {
        throw new Error(`Schema not found in browser environment: ${schemaId}`);
      }
    }
  }

  /**
   * Reload all schemas
   */
  public async reloadAllSchemas(): Promise<void> {
    this.schemas.clear();
    await this.initialize();
  }
}
