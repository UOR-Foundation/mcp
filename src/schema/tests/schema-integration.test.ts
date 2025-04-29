/**
 * Schema Integration Tests
 * Tests for the schema integration functionality
 */

import { SchemaIntegration } from '../schema-integration';
import { SchemaValidator } from '../schema-validator';
import { UORCoreSchema, ObserverFrameSchema } from '../schema-types';

jest.mock('../schema-validator');

const mockValidateObserverFrame = jest.fn().mockReturnValue({ valid: true });
const mockAssertValid = jest.fn().mockReturnValue(true);
const mockInitialize = jest.fn().mockResolvedValue(undefined);
const mockFormatErrors = jest.fn().mockReturnValue(['Test error']);
const mockIsInitialized = jest.fn().mockReturnValue(true);

const mockSchemaValidatorInstance = {
  initialize: mockInitialize,
  validateUORObject: jest.fn().mockReturnValue({ valid: true }),
  validateObserverFrame: mockValidateObserverFrame,
  assertValid: mockAssertValid,
  formatErrors: mockFormatErrors,
  isInitialized: mockIsInitialized
};

describe('SchemaIntegration', () => {
  const validUORObject: Partial<UORCoreSchema> = {
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

  const validObserverFrame: Partial<ObserverFrameSchema> = {
    id: 'test-frame',
    perspective: 'objective',
    parameters: {}
  };

  beforeEach(() => {
    jest.resetAllMocks();
    
    (SchemaValidator.getInstance as jest.Mock).mockReturnValue(mockSchemaValidatorInstance);
    
    mockInitialize.mockClear().mockResolvedValue(undefined);
    mockValidateObserverFrame.mockClear().mockReturnValue({ valid: true });
    mockAssertValid.mockClear().mockReturnValue(true);
    mockFormatErrors.mockClear().mockReturnValue(['Test error']);
    mockIsInitialized.mockClear().mockReturnValue(true);
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = SchemaIntegration.getInstance();
      const instance2 = SchemaIntegration.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    it('should initialize the schema validator', async () => {
      const schemaIntegration = SchemaIntegration.getInstance();
      await schemaIntegration.initialize();
      
      expect(SchemaValidator.getInstance().initialize).toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      mockInitialize.mockRejectedValueOnce(new Error('Test error'));
      
      const schemaIntegration = SchemaIntegration.getInstance();
      
      (schemaIntegration as any).initialized = false;
      
      await expect(schemaIntegration.initialize()).rejects.toThrow('Test error');
    });

    it('should not initialize twice', async () => {
      mockInitialize.mockClear();
      
      const schemaIntegration = SchemaIntegration.getInstance();
      
      (schemaIntegration as any).initialized = false;
      
      await schemaIntegration.initialize();
      
      expect(mockInitialize).toHaveBeenCalledTimes(1);
      
      await schemaIntegration.initialize();
      
      expect(mockInitialize).toHaveBeenCalledTimes(1);
    });
  });

  describe('validateUORObject', () => {
    it('should validate a UOR object', async () => {
      const schemaIntegration = SchemaIntegration.getInstance();
      await schemaIntegration.initialize();
      
      schemaIntegration.validateUORObject(validUORObject);
      
      expect(SchemaValidator.getInstance().assertValid).toHaveBeenCalledWith(validUORObject);
    });

    it('should throw an error if not initialized', async () => {
      const schemaIntegration = SchemaIntegration.getInstance();
      
      (schemaIntegration as any).initialized = false;
      
      expect(() => {
        schemaIntegration.validateUORObject(validUORObject);
      }).toThrow('Schema integration not initialized');
    });
  });

  describe('validateObserverFrame', () => {
    it('should validate an observer frame', async () => {
      const schemaIntegration = SchemaIntegration.getInstance();
      await schemaIntegration.initialize();
      
      schemaIntegration.validateObserverFrame(validObserverFrame);
      
      expect(SchemaValidator.getInstance().validateObserverFrame).toHaveBeenCalledWith(validObserverFrame);
    });

    it('should throw an error if validation fails', async () => {
      const schemaIntegration = SchemaIntegration.getInstance();
      await schemaIntegration.initialize();
      
      const mockSchemaValidator = SchemaValidator.getInstance();
      (mockSchemaValidator.validateObserverFrame as jest.Mock).mockReturnValue({
        valid: false,
        errors: [{ message: 'Test error', path: '/test' }]
      });
      
      expect(() => {
        schemaIntegration.validateObserverFrame(validObserverFrame);
      }).toThrow('Observer frame validation failed');
    });

    it('should throw an error if not initialized', async () => {
      const schemaIntegration = SchemaIntegration.getInstance();
      
      (schemaIntegration as any).initialized = false;
      
      expect(() => {
        schemaIntegration.validateObserverFrame(validObserverFrame);
      }).toThrow('Schema integration not initialized');
    });
  });

  describe('conformUORObject', () => {
    it('should conform a UOR object to the core schema', async () => {
      const schemaIntegration = SchemaIntegration.getInstance();
      await schemaIntegration.initialize();
      
      const result = schemaIntegration.conformUORObject(validUORObject);
      
      expect(result).toEqual(expect.objectContaining({
        id: 'test-id',
        type: 'concept'
      }));
      expect(SchemaValidator.getInstance().assertValid).toHaveBeenCalled();
    });

    it('should throw an error if required fields are missing', async () => {
      const schemaIntegration = SchemaIntegration.getInstance();
      await schemaIntegration.initialize();
      
      expect(() => {
        schemaIntegration.conformUORObject({ id: 'test-id' });
      }).toThrow('UOR object must have a type');
    });

    it('should add metadata if missing', async () => {
      const schemaIntegration = SchemaIntegration.getInstance();
      await schemaIntegration.initialize();
      
      const result = schemaIntegration.conformUORObject(validUORObject);
      
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.createdAt).toBeDefined();
      expect(result.metadata?.updatedAt).toBeDefined();
    });
  });

  describe('conformObserverFrame', () => {
    it('should conform an observer frame to the observer frame schema', async () => {
      const schemaIntegration = SchemaIntegration.getInstance();
      await schemaIntegration.initialize();
      
      const result = schemaIntegration.conformObserverFrame(validObserverFrame);
      
      expect(result).toEqual(expect.objectContaining({
        id: 'test-frame',
        perspective: 'objective'
      }));
      expect(SchemaValidator.getInstance().validateObserverFrame).toHaveBeenCalled();
    });

    it('should throw an error if required fields are missing', async () => {
      const schemaIntegration = SchemaIntegration.getInstance();
      await schemaIntegration.initialize();
      
      expect(() => {
        schemaIntegration.conformObserverFrame({ id: 'test-frame' });
      }).toThrow('Observer frame must have a perspective');
    });

    it('should add parameters if missing', async () => {
      const schemaIntegration = SchemaIntegration.getInstance();
      await schemaIntegration.initialize();
      
      const result = schemaIntegration.conformObserverFrame({
        id: 'test-frame',
        perspective: 'objective'
      });
      
      expect(result.parameters).toBeDefined();
    });
  });

  describe('isInitialized', () => {
    it('should return true if initialized', async () => {
      const schemaIntegration = SchemaIntegration.getInstance();
      await schemaIntegration.initialize();
      
      expect(schemaIntegration.isInitialized()).toBe(true);
    });

    it('should return false if not initialized', async () => {
      const schemaIntegration = SchemaIntegration.getInstance();
      
      (schemaIntegration as any).initialized = false;
      
      expect(schemaIntegration.isInitialized()).toBe(false);
    });
  });
});
