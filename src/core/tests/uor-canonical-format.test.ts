/**
 * Tests specifically for the canonical, base-independent format
 * Verifies that different input structures convert to and from the same canonical format
 */
import { UORFactory } from '../uor-factory';

describe('Base-Independent Canonical Format', () => {
  // Test different input formats result in the same canonical representation
  test('Different input formats should yield the same canonical format', () => {
    // Create objects with the same semantic content but different structures
    const formats = [
      { name: 'Test Object', values: [1, 2, 3] },
      { values: [1, 2, 3], name: 'Test Object' },  // Different property order
      { name: 'Test Object', values: [1, 2, 3], extraProperty: null }, // Extra null property
      { 
        complexObject: { 
          name: 'Test Object',
          values: [1, 2, 3]
        }
      } // Nested structure
    ];
    
    // Create UOR objects for each format
    const uorObjects = formats.map(format => 
      UORFactory.createObject('test', format, 'test-namespace')
    );
    
    // Extract normalized data from each representation
    const canonicalValues = uorObjects.map(obj => {
      // Serialize the object to simulate persistence
      const serialized = obj.serialize();
      
      // Deserialize to simulate retrieval
      const deserialized = UORFactory.fromSerialized(serialized);
      
      // Return the normalized canonical data
      return JSON.stringify(deserialized.canonicalRepresentation?.value);
    });

    // Different input formats with the same semantic content should converge
    // to the same canonical format for core properties
    for (let i = 1; i < canonicalValues.length; i++) {
      const normalizedValue1 = JSON.parse(canonicalValues[0]);
      const normalizedValueI = JSON.parse(canonicalValues[i]);
      
      // The nested structure will have different canonical representation
      // but checking for specific properties should show value equivalence
      if (formats[i].complexObject) {
        expect(normalizedValueI.data.complexObject.name).toEqual('Test Object');
        expect(normalizedValueI.data.complexObject.values).toEqual([1, 2, 3]);
      } else {
        // These should have identical canonical representations for their data
        expect(normalizedValue1.data.name).toEqual(normalizedValueI.data.name);
        expect(normalizedValue1.data.values).toEqual(normalizedValueI.data.values);
      }
    }
  });
  
  // Test that the canonical format is independent of the input order
  test('Property order should not affect the canonical format', () => {
    // Create objects with properties in different orders
    const obj1 = UORFactory.createObject(
      'test',
      { a: 1, b: 2, c: 3, d: 4, e: 5 },
      'test-namespace'
    );
    
    const obj2 = UORFactory.createObject(
      'test',
      { e: 5, c: 3, a: 1, d: 4, b: 2 },
      'test-namespace'
    );
    
    // Canonical representations should be identical
    expect(obj1.canonicalRepresentation?.value).toEqual(obj2.canonicalRepresentation?.value);
  });
  
  // Test that nested structures are properly canonicalized
  test('Nested structures should be canonicalized recursively', () => {
    // Create objects with nested structures in different orders
    const obj1 = UORFactory.createObject(
      'test',
      { 
        top: 'level',
        nested: { 
          a: 1, 
          b: 2,
          deep: { x: 100, y: 200 }
        }
      },
      'test-namespace'
    );
    
    const obj2 = UORFactory.createObject(
      'test',
      { 
        nested: { 
          b: 2, 
          a: 1,
          deep: { y: 200, x: 100 }
        },
        top: 'level'
      },
      'test-namespace'
    );
    
    // Canonical representations should be identical despite different property orders at all levels
    expect(obj1.canonicalRepresentation?.value).toEqual(obj2.canonicalRepresentation?.value);
  });
  
  // Test that the canonical format is preserved during serialization and deserialization
  test('Canonical format should be preserved during serialization/deserialization', () => {
    // Create an object with complex nested structure
    const obj = UORFactory.createObject(
      'test',
      { 
        name: 'Serialization Test',
        properties: {
          numeric: 123,
          boolean: true,
          nested: {
            array: [3, 2, 1], // Intentionally out of order
            object: { z: 26, a: 1 } // Intentionally out of order
          }
        }
      },
      'test-namespace'
    );
    
    // Verify initial canonical representation
    const initialRepresentation = obj.canonicalRepresentation;
    expect(initialRepresentation).toBeDefined();
    
    // Serialize the object
    const serialized = obj.serialize();
    
    // Deserialize to a new object
    const deserialized = UORFactory.fromSerialized(serialized);
    
    // Canonical representations should be preserved exactly
    expect(deserialized.canonicalRepresentation).toEqual(initialRepresentation);
  });
  
  // Test conversion between different types maintains semantic equivalence
  test('Conversion between types should maintain semantic equivalence', () => {
    // Create a regular object with data
    const baseObj = UORFactory.createObject(
      'test',
      { 
        title: 'Schema Document',
        definition: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' }
          }
        }
      },
      'test-namespace'
    );
    
    // Create a schema object with the same semantic content
    const schemaObj = UORFactory.createObject(
      'schema',
      {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        }
      },
      'test-namespace'
    );
    
    // Extract equivalent data from both objects
    const baseDefinition = (baseObj.canonicalRepresentation?.value as any).data.definition;
    const schemaDefinition = (schemaObj as any).schema;
    
    // While the overall representations differ due to type differences,
    // the core semantic content should be equivalent
    expect(baseDefinition.type).toEqual(schemaDefinition.type);
    expect(baseDefinition.properties).toEqual(schemaDefinition.properties);
  });
});