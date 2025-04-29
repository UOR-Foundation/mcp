/**
 * Schema Loader Tests
 * Tests for the schema loading functionality
 */

import * as fs from 'fs';
import * as path from 'path';
import { JSONSchema7 } from 'json-schema';
import { SchemaLoader } from '../schema-loader';

jest.mock('fs');
jest.mock('path');

describe('SchemaLoader', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockPath = path as jest.Mocked<typeof path>;
  
  const sampleSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: 'https://uor-foundation.org/schemas/test-schema.json',
    title: 'Test Schema',
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' }
    },
    required: ['id']
  };

  beforeEach(() => {
    jest.resetAllMocks();
    
    mockPath.resolve.mockReturnValue('/mock/path/models/schemas');
    
    mockFs.existsSync.mockReturnValue(true);
    
    mockFs.readdirSync.mockReturnValue(['test-schema.schema.json'] as unknown as fs.Dirent[]);
    
    mockPath.join.mockReturnValue('/mock/path/models/schemas/test-schema.schema.json');
    
    mockFs.readFileSync.mockReturnValue(JSON.stringify(sampleSchema) as unknown as Buffer);
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = SchemaLoader.getInstance();
      const instance2 = SchemaLoader.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    it('should load schemas from the schemas directory', async () => {
      const schemaLoader = SchemaLoader.getInstance();
      await schemaLoader.initialize();
      
      expect(mockFs.existsSync).toHaveBeenCalled();
      expect(mockFs.readdirSync).toHaveBeenCalled();
      expect(mockFs.readFileSync).toHaveBeenCalled();
    });

    it('should throw an error if schemas directory does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const schemaLoader = SchemaLoader.getInstance();
      
      await expect(schemaLoader.initialize()).rejects.toThrow('Schemas directory not found');
    });

    it('should throw an error if no schema files are found', async () => {
      mockFs.readdirSync.mockReturnValue([]);
      
      const schemaLoader = SchemaLoader.getInstance();
      
      await expect(schemaLoader.initialize()).rejects.toThrow('No schema files found');
    });
  });

  describe('getSchema', () => {
    it('should return a loaded schema by ID', async () => {
      const schemaLoader = SchemaLoader.getInstance();
      await schemaLoader.initialize();
      
      const schema = schemaLoader.getSchema('https://uor-foundation.org/schemas/test-schema.json');
      
      expect(schema).toBeDefined();
      expect(schema?.schema.$id).toBe('https://uor-foundation.org/schemas/test-schema.json');
    });

    it('should return undefined for a non-existent schema ID', async () => {
      const schemaLoader = SchemaLoader.getInstance();
      await schemaLoader.initialize();
      
      const schema = schemaLoader.getSchema('non-existent-schema');
      
      expect(schema).toBeUndefined();
    });
  });

  describe('getAllSchemas', () => {
    it('should return all loaded schemas', async () => {
      const schemaLoader = SchemaLoader.getInstance();
      await schemaLoader.initialize();
      
      const schemas = schemaLoader.getAllSchemas();
      
      expect(schemas.size).toBe(1);
      expect(schemas.has('https://uor-foundation.org/schemas/test-schema.json')).toBe(true);
    });
  });

  describe('validate', () => {
    it('should validate data against a schema', async () => {
      const schemaLoader = SchemaLoader.getInstance();
      await schemaLoader.initialize();
      
      const result = schemaLoader.validate(
        'https://uor-foundation.org/schemas/test-schema.json',
        { id: 'test-id', name: 'Test Name' }
      );
      
      expect(result.valid).toBe(true);
    });

    it('should return validation errors for invalid data', async () => {
      const schemaLoader = SchemaLoader.getInstance();
      await schemaLoader.initialize();
      
      const result = schemaLoader.validate(
        'https://uor-foundation.org/schemas/test-schema.json',
        { name: 'Test Name' } // Missing required 'id' field
      );
      
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it('should throw an error for a non-existent schema ID', async () => {
      const schemaLoader = SchemaLoader.getInstance();
      await schemaLoader.initialize();
      
      expect(() => {
        schemaLoader.validate('non-existent-schema', {});
      }).toThrow('Schema not found');
    });
  });

  describe('reloadSchema', () => {
    it('should reload a schema from file', async () => {
      const schemaLoader = SchemaLoader.getInstance();
      await schemaLoader.initialize();
      
      await schemaLoader.reloadSchema('https://uor-foundation.org/schemas/test-schema.json');
      
      expect(mockFs.readFileSync).toHaveBeenCalledTimes(2);
    });

    it('should throw an error for a non-existent schema ID', async () => {
      const schemaLoader = SchemaLoader.getInstance();
      await schemaLoader.initialize();
      
      await expect(schemaLoader.reloadSchema('non-existent-schema')).rejects.toThrow('Schema not found');
    });
  });

  describe('reloadAllSchemas', () => {
    it('should reload all schemas from file', async () => {
      const schemaLoader = SchemaLoader.getInstance();
      await schemaLoader.initialize();
      
      await schemaLoader.reloadAllSchemas();
      
      expect(mockFs.readFileSync).toHaveBeenCalledTimes(2);
    });
  });
});
