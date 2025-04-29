/**
 * Schema Validator Tests
 * Tests for the schema validation functionality
 */

import { SchemaValidator } from '../schema-validator';
import { SchemaLoader } from '../schema-loader';
import { ValidationResult } from '../schema-types';

jest.mock('../schema-loader');

describe('SchemaValidator', () => {
  const validResult: ValidationResult = { valid: true };
  const invalidResult: ValidationResult = { 
    valid: false, 
    errors: [{ 
      message: 'Test error', 
      path: '/test', 
      keyword: 'required', 
      schemaPath: '#/required', 
      instancePath: '/test' 
    }] 
  };

  const validUORObject = {
    id: 'test-id',
    type: 'concept',
    canonicalRepresentation: {
      format: 'json',
      content: { test: 'data' }
    },
    observerFrame: {
      id: 'test-frame',
      perspective: 'objective'
    }
  };

  const validObserverFrame = {
    id: 'test-frame',
    perspective: 'objective',
    parameters: {}
  };

  beforeEach(() => {
    jest.resetAllMocks();
    
    const mockInitialize = jest.fn().mockResolvedValue(undefined);
    const mockValidate = jest.fn().mockImplementation((schemaId, data) => {
      if (schemaId === 'https://uor-foundation.org/schemas/uor-core.schema.json') {
        if (data && data.id && data.type && data.canonicalRepresentation && data.observerFrame) {
          return validResult;
        }
      } else if (schemaId === 'https://uor-foundation.org/schemas/observer-frame.schema.json') {
        if (data && data.id && data.perspective) {
          return validResult;
        }
      } else if (schemaId === 'https://uor-foundation.org/schemas/uor-axioms.schema.json') {
        if (data && data.axioms) {
          return validResult;
        }
      }
      return invalidResult;
    });
    
    const mockSchemaLoader = {
      initialize: mockInitialize,
      validate: mockValidate,
      isInitialized: jest.fn().mockReturnValue(true)
    };
    
    (SchemaLoader.getInstance as jest.Mock).mockReturnValue(mockSchemaLoader);
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = SchemaValidator.getInstance();
      const instance2 = SchemaValidator.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    it('should initialize the schema loader', async () => {
      const schemaValidator = SchemaValidator.getInstance();
      await schemaValidator.initialize();
      
      expect(SchemaLoader.getInstance().initialize).toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      const mockSchemaLoader = SchemaLoader.getInstance();
      (mockSchemaLoader.initialize as jest.Mock).mockRejectedValue(new Error('Test error'));
      
      const schemaValidator = SchemaValidator.getInstance();
      
      await expect(schemaValidator.initialize()).rejects.toThrow('Test error');
    });
  });

  describe('validateUORObject', () => {
    it('should validate a UOR object against the core schema', async () => {
      const schemaValidator = SchemaValidator.getInstance();
      await schemaValidator.initialize();
      
      const result = schemaValidator.validateUORObject(validUORObject);
      
      expect(result.valid).toBe(true);
      expect(SchemaLoader.getInstance().validate).toHaveBeenCalledWith(
        'https://uor-foundation.org/schemas/uor-core.schema.json',
        validUORObject
      );
    });

    it('should return validation errors for invalid UOR objects', async () => {
      const schemaValidator = SchemaValidator.getInstance();
      await schemaValidator.initialize();
      
      const invalidUORObject = { ...validUORObject, id: undefined };
      const result = schemaValidator.validateUORObject(invalidUORObject);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });
  });

  describe('validateObserverFrame', () => {
    it('should validate an observer frame against the observer frame schema', async () => {
      const schemaValidator = SchemaValidator.getInstance();
      await schemaValidator.initialize();
      
      const result = schemaValidator.validateObserverFrame(validObserverFrame);
      
      expect(result.valid).toBe(true);
      expect(SchemaLoader.getInstance().validate).toHaveBeenCalledWith(
        'https://uor-foundation.org/schemas/observer-frame.schema.json',
        validObserverFrame
      );
    });

    it('should return validation errors for invalid observer frames', async () => {
      const schemaValidator = SchemaValidator.getInstance();
      await schemaValidator.initialize();
      
      const invalidObserverFrame = { ...validObserverFrame, perspective: undefined };
      const result = schemaValidator.validateObserverFrame(invalidObserverFrame);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });
  });

  describe('formatErrors', () => {
    it('should format validation errors for display', async () => {
      const schemaValidator = SchemaValidator.getInstance();
      await schemaValidator.initialize();
      
      const errors = [
        { message: 'Error 1', path: '/path1' },
        { message: 'Error 2', path: '/path2' }
      ];
      
      const formattedErrors = schemaValidator.formatErrors(errors);
      
      expect(formattedErrors).toEqual(['Error 1 at /path1', 'Error 2 at /path2']);
    });

    it('should handle errors without paths', async () => {
      const schemaValidator = SchemaValidator.getInstance();
      await schemaValidator.initialize();
      
      const errors = [
        { message: 'Error 1' },
        { message: 'Error 2' }
      ];
      
      const formattedErrors = schemaValidator.formatErrors(errors);
      
      expect(formattedErrors).toEqual(['Error 1 at ', 'Error 2 at ']);
    });
  });

  describe('assertValid', () => {
    it('should return true for valid UOR objects', async () => {
      const schemaValidator = SchemaValidator.getInstance();
      await schemaValidator.initialize();
      
      const result = schemaValidator.assertValid(validUORObject);
      
      expect(result).toBe(true);
    });

    it('should throw an error for invalid UOR objects', async () => {
      const schemaValidator = SchemaValidator.getInstance();
      await schemaValidator.initialize();
      
      const invalidUORObject = { ...validUORObject, id: undefined };
      
      expect(() => {
        schemaValidator.assertValid(invalidUORObject);
      }).toThrow('UOR object validation failed');
    });
  });
});
