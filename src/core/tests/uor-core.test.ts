/**
 * UOR Core Implementation Tests
 * Tests the core UOR abstractions to verify they meet the requirements
 */
import {
  UORObject,
  PrimeFactor,
  PrimeDecomposition,
  CanonicalRepresentation,
  ObserverFrame,
  CoherenceMeasure
} from '../uor-core';
import {
  BaseUORObject,
  SimpleUORSchema,
  TextArtifact,
  GitHubNamespaceResolver
} from '../uor-implementations';
import { UORFactory } from '../uor-factory';
import { UORReferenceUtil } from '../uor-reference';

/**
 * Tests for Prime Decomposition Implementation
 * Verifies that objects are decomposable into unique prime factors
 */
describe('Prime Decomposition', () => {
  test('Objects should be decomposable into prime factors', () => {
    // Create a test object
    const testObject = UORFactory.createObject(
      'test',
      { name: 'Test Object', value: 42 },
      'test-namespace'
    );
    
    // Verify it has a prime decomposition
    expect(testObject.primeDecomposition).toBeDefined();
    expect(testObject.primeDecomposition?.primeFactors.length).toBeGreaterThan(0);
    
    // Verify factors have required properties
    testObject.primeDecomposition?.primeFactors.forEach(factor => {
      expect(factor.id).toBeDefined();
      expect(factor.value).toBeDefined();
    });
  });
  
  test('Factorization should be unique for identical objects', () => {
    // Create two identical objects
    const obj1 = UORFactory.createObject(
      'test',
      { a: 1, b: 2 },
      'test-namespace'
    );
    
    const obj2 = UORFactory.createObject(
      'test',
      { a: 1, b: 2 },
      'test-namespace'
    );
    
    // Different objects but identical content should have same factor structure
    const factors1 = obj1.primeDecomposition?.primeFactors.map(f => f.id).sort();
    const factors2 = obj2.primeDecomposition?.primeFactors.map(f => f.id).sort();
    
    expect(factors1).toEqual(factors2);
  });
  
  test('Factorization should be stored in canonical form', () => {
    // Create a test object
    const testObject = UORFactory.createObject(
      'test',
      { z: 3, a: 1, b: 2 }, // Keys intentionally out of order
      'test-namespace'
    );
    
    // Serialize and deserialize to verify canonical form is preserved
    const serialized = JSON.stringify(testObject.serialize());
    const deserialized = UORFactory.fromSerialized(JSON.parse(serialized));
    
    // Compare prime decompositions
    const original = testObject.primeDecomposition?.primeFactors.map(f => f.id).sort();
    const restored = deserialized.primeDecomposition?.primeFactors.map(f => f.id).sort();
    
    expect(original).toEqual(restored);
  });
});

/**
 * Tests for Canonical Representation Implementation
 * Verifies that objects have unique, observer-invariant representations
 */
describe('Canonical Representation', () => {
  test('Objects should have a unique canonical representation', () => {
    // Create two objects with same data but different IDs
    const obj1 = UORFactory.createObject(
      'test',
      { name: 'Test', value: 123 },
      'namespace1'
    );
    
    const obj2 = UORFactory.createObject(
      'test',
      { name: 'Test', value: 123 },
      'namespace2'
    );
    
    // The canonical representations should match despite different IDs
    expect(obj1.canonicalRepresentation?.value).toEqual(obj2.canonicalRepresentation?.value);
  });
  
  test('Representation should be observer-invariant', () => {
    // Create an object
    const obj = UORFactory.createObject(
      'test',
      { name: 'Test', value: 123 },
      'test-namespace'
    );
    
    // Create a different observer frame
    const newFrame: ObserverFrame = {
      id: 'different-frame',
      type: 'TestFrame',
      invariantProperties: ['id', 'type']
    };
    
    // Transform object to new frame
    const transformed = obj.transformToFrame(newFrame);
    
    // Canonical representation should be the same
    expect(transformed.canonicalRepresentation?.value).toEqual(obj.canonicalRepresentation?.value);
  });
  
  test('Object with out-of-order properties should have same representation', () => {
    // Create two objects with same data but different property order
    const obj1 = UORFactory.createObject(
      'test',
      { a: 1, b: 2, c: 3 },
      'test-namespace'
    );
    
    const obj2 = UORFactory.createObject(
      'test',
      { c: 3, a: 1, b: 2 },
      'test-namespace'
    );
    
    // The canonical representations should match despite different order
    expect(obj1.canonicalRepresentation?.value).toEqual(obj2.canonicalRepresentation?.value);
  });
});

/**
 * Tests for Observer Frame Implementation
 * Verifies that frames define perspectives and transformation properties
 */
describe('Observer Frame', () => {
  test('Frames should define perspectives for viewing objects', () => {
    // Create a custom observer frame
    const customFrame: ObserverFrame = {
      id: 'custom-frame',
      type: 'CustomFrame',
      invariantProperties: ['id', 'type'],
      transformationRules: []
    };
    
    // Create an object with this frame
    const obj = UORFactory.createObject(
      'test',
      { name: 'Test' },
      'test-namespace'
    );
    obj.setObserverFrame(customFrame);
    
    // Frame should be correctly applied
    expect(obj.observerFrame).toEqual(customFrame);
  });
  
  test('Transformations between frames should preserve essential properties', () => {
    // Create an object
    const obj = UORFactory.createObject(
      'test',
      { name: 'Test', value: 123 },
      'test-namespace'
    );
    
    // Get the original ID and type
    const originalId = obj.id;
    const originalType = obj.type;
    
    // Create a different observer frame
    const newFrame: ObserverFrame = {
      id: 'different-frame',
      type: 'TestFrame',
      invariantProperties: ['id', 'type']
    };
    
    // Transform object to new frame
    const transformed = obj.transformToFrame(newFrame);
    
    // Essential properties should be preserved
    expect(transformed.id).toEqual(originalId);
    expect(transformed.type).toEqual(originalType);
  });
  
  test('Invariant properties should remain unchanged across transformations', () => {
    // Create a test object
    const obj = UORFactory.createObject(
      'test',
      { name: 'Test', value: 123 },
      'test-namespace'
    );
    
    // Compute canonical representation and prime decomposition
    const canonicalRep = obj.computeCanonicalRepresentation();
    const primeDecomp = obj.computePrimeDecomposition();
    
    // Create a new frame with canonical representation as invariant
    const newFrame: ObserverFrame = {
      id: 'invariant-frame',
      type: 'TestFrame',
      invariantProperties: ['canonicalRepresentation']
    };
    
    // Transform to new frame
    const transformed = obj.transformToFrame(newFrame);
    
    // Canonical representation should be unchanged
    expect(transformed.canonicalRepresentation).toEqual(canonicalRep);
  });
});

/**
 * Tests for Coherence Measure Implementation
 * Verifies that coherence between object, representation, and observer is quantifiable
 */
describe('Coherence Measure', () => {
  test('Coherence should be quantifiable', () => {
    // Create a test object
    const obj = UORFactory.createObject(
      'test',
      { name: 'Test', value: 123 },
      'test-namespace'
    );
    
    // Measure coherence
    const coherence = obj.measureCoherence();
    
    // Coherence should have the expected properties
    expect(coherence.type).toBeDefined();
    expect(coherence.value).toBeGreaterThan(0);
    expect(coherence.value).toBeLessThanOrEqual(1); // Normalized to [0,1]
  });
  
  test('System should optimize for maximum coherence', () => {
    // Create two objects, one with simple structure and one complex
    const simpleObj = UORFactory.createObject(
      'test',
      { value: 123 },
      'test-namespace'
    );
    
    const complexObj = UORFactory.createObject(
      'test',
      { 
        name: 'Complex',
        values: [1, 2, 3, 4, 5],
        properties: {
          a: 1,
          b: 2,
          c: { nested: true, value: 42 }
        }
      },
      'test-namespace'
    );
    
    // Measure coherence for both
    const simpleCoherence = simpleObj.measureCoherence();
    const complexCoherence = complexObj.measureCoherence();
    
    // Simple should have higher coherence (assuming our implementation favors simplicity)
    // If the implementation does not, this test will need adjustment
    expect(simpleCoherence.value).toBeGreaterThanOrEqual(complexCoherence.value);
  });
  
  test('Coherence should be verifiable during operations', () => {
    // Create a test object
    const obj = UORFactory.createObject(
      'test',
      { name: 'Test' },
      'test-namespace'
    );
    
    // Get initial coherence
    const initialCoherence = obj.measureCoherence();
    
    // Serialize and deserialize (an operation)
    const serialized = obj.serialize();
    const deserialized = UORFactory.fromSerialized(serialized);
    
    // Verify coherence after operation
    const finalCoherence = deserialized.measureCoherence();
    
    // Coherence should be preserved or improved
    expect(finalCoherence.value).toBeGreaterThanOrEqual(initialCoherence.value - 0.001); // Allow small floating point differences
  });
});

/**
 * Integration Tests
 * Verifies that all components work together
 */
describe('UOR Core Integration', () => {
  test('Full UOR object lifecycle', () => {
    // 1. Create an object
    const obj = UORFactory.createObject(
      'test',
      { name: 'Integration Test', value: 42 },
      'test-namespace'
    );
    
    // 2. Verify it has all core components
    expect(obj.id).toBeDefined();
    expect(obj.type).toBe('test');
    expect(obj.primeDecomposition).toBeDefined();
    expect(obj.canonicalRepresentation).toBeDefined();
    expect(obj.observerFrame).toBeDefined();
    
    // 3. Create a UOR reference
    const reference = UORReferenceUtil.create(
      'test-namespace',
      'test',
      obj.id.split(':')[2] // Extract ID component
    );
    expect(UORReferenceUtil.isValid(reference)).toBe(true);
    
    // 4. Serialize object
    const serialized = obj.serialize();
    
    // 5. Deserialize to new object
    const restored = UORFactory.fromSerialized(serialized);
    
    // 6. Verify restoration preserved all components
    expect(restored.id).toBe(obj.id);
    expect(restored.type).toBe(obj.type);
    expect(restored.primeDecomposition?.primeFactors.length)
      .toBe(obj.primeDecomposition?.primeFactors.length);
    expect(restored.canonicalRepresentation?.value)
      .toEqual(obj.canonicalRepresentation?.value);
    
    // 7. Transform to new frame
    const newFrame: ObserverFrame = {
      id: 'new-frame',
      type: 'TestFrame',
      invariantProperties: ['id', 'type']
    };
    const transformed = restored.transformToFrame(newFrame);
    
    // 8. Verify transformation preserved canonical form
    expect(transformed.canonicalRepresentation?.value)
      .toEqual(obj.canonicalRepresentation?.value);
    
    // 9. Measure coherence
    const coherence = transformed.measureCoherence();
    expect(coherence.value).toBeGreaterThan(0);
    
    // 10. Validate object
    expect(transformed.validate()).toBe(true);
  });
  
  test('Different UOR implementations maintain common behavior', () => {
    // Create different types of UOR objects
    const baseObj = UORFactory.createObject(
      'base',
      { value: 'base object' },
      'test-namespace'
    );
    
    const schemaObj = UORFactory.createObject(
      'schema',
      { 
        type: 'object',
        properties: {
          name: { type: 'string' },
          value: { type: 'number' }
        }
      },
      'test-namespace'
    );
    
    const textObj = UORFactory.createObject(
      'text',
      'This is a text content for testing',
      'test-namespace'
    );
    
    const resolverObj = UORFactory.createObject(
      'resolver',
      { targetNamespace: 'target-namespace' },
      'test-namespace'
    );
    
    // All should support common UOR operations
    const objects = [baseObj, schemaObj, textObj, resolverObj];
    
    objects.forEach(obj => {
      // Should have prime decomposition
      expect(obj.primeDecomposition).toBeDefined();
      expect(obj.primeDecomposition?.primeFactors.length).toBeGreaterThan(0);
      
      // Should have canonical representation
      expect(obj.canonicalRepresentation).toBeDefined();
      
      // Should be serializable
      const serialized = obj.serialize();
      expect(serialized).toBeDefined();
      
      // Should be transformable
      const newFrame: ObserverFrame = {
        id: 'new-frame',
        type: 'TestFrame',
        invariantProperties: ['id', 'type']
      };
      const transformed = obj.transformToFrame(newFrame);
      expect(transformed.observerFrame?.id).toBe('new-frame');
      
      // Should measure coherence
      const coherence = obj.measureCoherence();
      expect(coherence.value).toBeGreaterThan(0);
      
      // Should validate
      expect(obj.validate()).toBe(true);
    });
  });
});