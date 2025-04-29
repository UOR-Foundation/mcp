/**
 * UOR Resource Implementation
 * Implements resource objects in the UOR system
 */

import { UORObject, ObserverFrame, PrimeDecomposition, CanonicalRepresentation, CoherenceMeasure, PrimeFactor } from '../core/uor-core';
import { ContentType, ResourceContent, ContentUORObject } from './content-types';

/**
 * Resource object implementation
 */
export class ResourceObject extends UORObject implements ContentUORObject {
  private content: ResourceContent;
  
  /**
   * Creates a new resource object
   * @param id Unique identifier
   * @param content Resource content
   */
  constructor(id: string, content: ResourceContent) {
    super(id, ContentType.RESOURCE);
    this.content = content;
  }
  
  /**
   * Gets the resource content data
   * @returns The resource content
   */
  getContentData(): ResourceContent {
    return this.content;
  }
  
  /**
   * Adds a tag to the resource
   * @param tag Tag to add
   */
  addTag(tag: string): void {
    if (!this.content.tags) {
      this.content.tags = [];
    }
    
    if (!this.content.tags.includes(tag)) {
      this.content.tags.push(tag);
      this.content.updatedAt = new Date();
    }
  }
  
  /**
   * Removes a tag from the resource
   * @param tag Tag to remove
   */
  removeTag(tag: string): void {
    if (this.content.tags) {
      const index = this.content.tags.indexOf(tag);
      
      if (index !== -1) {
        this.content.tags.splice(index, 1);
        this.content.updatedAt = new Date();
      }
    }
  }
  
  /**
   * Updates the resource content
   * @param data Updated resource data
   */
  updateContent(data: Partial<ResourceContent>): void {
    this.content = {
      ...this.content,
      ...data,
      updatedAt: new Date()
    };
  }
  
  /**
   * Transforms this object to a different observer frame
   * @param newFrame The new observer frame to transform to
   * @returns A new UOR object in the new observer frame
   */
  transformToFrame(newFrame: ObserverFrame): UORObject {
    const transformedResource = new ResourceObject(this.id, { ...this.content });
    
    transformedResource.setObserverFrame(newFrame);
    
    if (this.canonicalRepresentation) {
      transformedResource.setCanonicalRepresentation(this.canonicalRepresentation);
    }
    
    if (this.primeDecomposition) {
      transformedResource.setPrimeDecomposition(this.primeDecomposition);
    }
    
    return transformedResource;
  }
  
  /**
   * Measures the coherence of this object's representation
   * This quantifies the representational integrity
   */
  measureCoherence(): CoherenceMeasure {
    return {
      type: 'resource-coherence',
      value: 1.0, // Perfect coherence for resource objects
      normalization: 'identity'
    };
  }
  
  /**
   * Validates this object against its schema
   * @returns Whether the object is valid
   */
  validate(): boolean {
    if (!this.content.title || !this.content.url || !this.content.type) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Gets the intrinsic prime factors for this object's domain
   * @returns Array of prime factors that are intrinsic to this domain
   */
  getIntrinsicPrimes(): PrimeFactor[] {
    return [
      {
        id: 'resource:base',
        value: { type: 'resource' },
        domain: 'resource'
      }
    ];
  }
  
  /**
   * Computes the prime decomposition of this resource
   */
  computePrimeDecomposition(): PrimeDecomposition {
    return {
      primeFactors: [
        {
          id: `resource:${this.id}`,
          value: { 
            title: this.content.title, 
            url: this.content.url,
            type: this.content.type
          },
          domain: 'resource'
        },
        ...(this.content.authors || []).map(author => ({
          id: `attribution:${this.id}:${author}`,
          value: { type: 'author', source: this.id, target: author },
          domain: 'attribution'
        }))
      ],
      decompositionMethod: 'resource-attribution'
    };
  }
  
  /**
   * Computes the canonical representation of this resource
   */
  computeCanonicalRepresentation(): CanonicalRepresentation {
    return {
      representationType: 'resource-canonical',
      value: {
        id: this.id,
        title: this.content.title,
        url: this.content.url,
        type: this.content.type,
        format: this.content.format
      }
    };
  }
  
  /**
   * Serializes this resource to a JSON representation
   */
  serialize(): object {
    return {
      id: this.id,
      type: this.type,
      content: this.content,
      canonicalRepresentation: this.canonicalRepresentation || this.computeCanonicalRepresentation(),
      primeDecomposition: this.primeDecomposition || this.computePrimeDecomposition()
    };
  }
}
