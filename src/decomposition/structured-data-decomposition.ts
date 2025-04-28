/**
 * Structured Data Decomposition Algorithm
 * Implements prime decomposition for structured data (JSON, XML)
 */

import { PrimeFactor, PrimeDecomposition, CanonicalRepresentation } from '../core/uor-core';
import { BaseDecompositionAlgorithm } from './decomposition-types';

/**
 * Structured data decomposition algorithm
 * Decomposes JSON and XML objects into structural elements
 */
export class StructuredDataDecompositionAlgorithm extends BaseDecompositionAlgorithm {
  /** Structure element types */
  private static readonly ELEMENT_TYPES = {
    OBJECT: 'object',
    ARRAY: 'array',
    PROPERTY: 'property',
    VALUE: 'value',
    SCHEMA: 'schema'
  };
  
  /**
   * Creates a new structured data decomposition algorithm
   */
  constructor() {
    super('structured-data-decomposition', 'structured-data');
  }
  
  /**
   * Decompose structured data into prime factors
   * @param data Structured data to decompose (JSON object or string)
   * @returns Prime decomposition of the data
   */
  decompose(data: any): PrimeDecomposition {
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    
    if (typeof parsedData !== 'object' || parsedData === null) {
      throw new Error('Input must be a valid JSON object or array');
    }
    
    const factors: PrimeFactor[] = [];
    
    factors.push(this.createPrimeFactor(
      'structure',
      {
        type: Array.isArray(parsedData) ? 'array' : 'object',
        length: Array.isArray(parsedData) ? parsedData.length : Object.keys(parsedData).length
      }
    ));
    
    this.processStructure(parsedData, '', factors);
    
    if (parsedData.$schema) {
      factors.push(this.createPrimeFactor(
        'schema',
        { schema: parsedData.$schema }
      ));
    }
    
    return this.createDecomposition(factors, 'structural-elements');
  }
  
  /**
   * Recompose structured data from prime factors
   * @param decomposition Prime decomposition to recompose
   * @returns Recomposed structured data
   */
  recompose(decomposition: PrimeDecomposition): any {
    const structureFactor = decomposition.primeFactors.find(factor => factor.id === 'structure');
    
    if (!structureFactor) {
      throw new Error('Invalid decomposition: missing structure factor');
    }
    
    const structureType = (structureFactor.value as any).type;
    
    const result = structureType === 'array' ? [] : {};
    
    const propertyFactors = decomposition.primeFactors.filter(
      factor => factor.value && 'path' in factor.value && 'key' in factor.value
    );
    
    const valueFactors = decomposition.primeFactors.filter(
      factor => factor.value && 'path' in factor.value && 'value' in factor.value
    );
    
    propertyFactors.forEach(factor => {
      const path = (factor.value as any).path;
      const key = (factor.value as any).key;
      
      const parent = this.getObjectAtPath(result, path);
      
      if (parent) {
        if (typeof key === 'number') {
          if (!Array.isArray(parent)) {
            throw new Error(`Cannot set numeric key on non-array at path: ${path}`);
          }
        } else {
          if (Array.isArray(parent)) {
            throw new Error(`Cannot set string key on array at path: ${path}`);
          }
          
          const childType = (factor.value as any).childType;
          parent[key] = childType === 'array' ? [] : {};
        }
      }
    });
    
    valueFactors.forEach(factor => {
      const path = (factor.value as any).path;
      const key = (factor.value as any).key;
      const value = (factor.value as any).value;
      
      const parent = this.getObjectAtPath(result, path);
      
      if (parent) {
        parent[key] = value;
      }
    });
    
    const schemaFactor = decomposition.primeFactors.find(factor => factor.id === 'schema');
    if (schemaFactor && !Array.isArray(result)) {
      (result as any).$schema = (schemaFactor.value as any).schema;
    }
    
    return result;
  }
  
  /**
   * Compute canonical representation from prime decomposition
   * @param decomposition Prime decomposition
   * @returns Canonical representation
   */
  computeCanonical(decomposition: PrimeDecomposition): CanonicalRepresentation {
    
    const data = this.recompose(decomposition);
    
    const normalized = this.normalizeStructure(data);
    
    const coherenceNorm = this.calculateStructuralCoherence(normalized);
    
    return this.createCanonicalRepresentation(
      { normalizedStructure: normalized },
      'normalized-structure',
      coherenceNorm
    );
  }
  
  /**
   * Process a structured object or array recursively
   * @param data Data to process
   * @param path Current path in the structure
   * @param factors Array of prime factors to append to
   */
  private processStructure(data: any, path: string, factors: PrimeFactor[]): void {
    if (Array.isArray(data)) {
      factors.push(this.createPrimeFactor(
        `array-${path || 'root'}`,
        {
          path,
          type: 'array',
          length: data.length
        }
      ));
      
      data.forEach((item, index) => {
        const itemPath = path ? `${path}.${index}` : `${index}`;
        
        if (typeof item === 'object' && item !== null) {
          factors.push(this.createPrimeFactor(
            `property-${itemPath}`,
            {
              path,
              key: index,
              childType: Array.isArray(item) ? 'array' : 'object'
            }
          ));
          
          this.processStructure(item, itemPath, factors);
        } else {
          factors.push(this.createPrimeFactor(
            `value-${itemPath}`,
            {
              path,
              key: index,
              value: item,
              valueType: typeof item
            }
          ));
        }
      });
    } else if (typeof data === 'object' && data !== null) {
      factors.push(this.createPrimeFactor(
        `object-${path || 'root'}`,
        {
          path,
          type: 'object',
          propertyCount: Object.keys(data).length
        }
      ));
      
      Object.entries(data).forEach(([key, value]) => {
        const propPath = path ? `${path}.${key}` : key;
        
        if (typeof value === 'object' && value !== null) {
          factors.push(this.createPrimeFactor(
            `property-${propPath}`,
            {
              path,
              key,
              childType: Array.isArray(value) ? 'array' : 'object'
            }
          ));
          
          this.processStructure(value, propPath, factors);
        } else {
          factors.push(this.createPrimeFactor(
            `value-${propPath}`,
            {
              path,
              key,
              value,
              valueType: typeof value
            }
          ));
        }
      });
    }
  }
  
  /**
   * Get the object at a specific path in a structure
   * @param root Root object
   * @param path Path to the object
   * @returns Object at the path or undefined if not found
   */
  private getObjectAtPath(root: any, path: string): any {
    if (!path) {
      return root;
    }
    
    const parts = path.split('.');
    let current = root;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const index = parseInt(part);
      
      if (isNaN(index)) {
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      } else {
        if (!current[index]) {
          current[index] = {};
        }
        current = current[index];
      }
    }
    
    return current;
  }
  
  /**
   * Normalize a structured object or array
   * @param data Data to normalize
   * @returns Normalized data
   */
  private normalizeStructure(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.normalizeStructure(item));
    } else if (typeof data === 'object' && data !== null) {
      const result: Record<string, any> = {};
      
      const keys = Object.keys(data).sort();
      
      keys.forEach(key => {
        result[key] = this.normalizeStructure(data[key]);
      });
      
      return result;
    } else {
      return data;
    }
  }
  
  /**
   * Calculate structural coherence of a structure
   * @param data Data to calculate coherence for
   * @returns Coherence value between 0 and 1
   */
  private calculateStructuralCoherence(data: any): number {
    
    if (typeof data !== 'object' || data === null) {
      return 1; // Primitive values are maximally coherent
    }
    
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return 1; // Empty arrays are maximally coherent
      }
      
      const types = new Set(data.map(item => Array.isArray(item) ? 'array' : typeof item));
      
      const typeCoherence = 1 / types.size;
      const sizeCoherence = Math.min(1, 10 / data.length); // Smaller arrays are more coherent
      
      const elementCoherences = data.map(item => this.calculateStructuralCoherence(item));
      const avgElementCoherence = elementCoherences.reduce((sum, val) => sum + val, 0) / elementCoherences.length;
      
      return (typeCoherence * 0.4) + (sizeCoherence * 0.2) + (avgElementCoherence * 0.4);
    } else {
      const keys = Object.keys(data);
      
      if (keys.length === 0) {
        return 1; // Empty objects are maximally coherent
      }
      
      const propertyCoherence = Math.min(1, 10 / keys.length); // Fewer properties are more coherent
      
      const valueTypes = new Set(keys.map(key => Array.isArray(data[key]) ? 'array' : typeof data[key]));
      const typeCoherence = 1 / valueTypes.size;
      
      const propertyCoherences = keys.map(key => this.calculateStructuralCoherence(data[key]));
      const avgPropertyCoherence = propertyCoherences.reduce((sum, val) => sum + val, 0) / propertyCoherences.length;
      
      return (propertyCoherence * 0.3) + (typeCoherence * 0.3) + (avgPropertyCoherence * 0.4);
    }
  }
}
