/**
 * UOR Resource Implementation
 * Implements resource objects in the UOR system
 */

import { UORObject, CanonicalRepresentation, PrimeDecomposition, ObserverFrame, CoherenceMeasure, PrimeFactor } from '../core/uor-core';
import { ResourceContent, ContentUORObject } from './content-types';

/**
 * Implementation of UOR Resource Object
 */
export class ResourceObject extends UORObject implements ContentUORObject {
  private data: ResourceContent;

  /**
   * Creates a new resource object
   * @param id Unique resource ID
   * @param data Initial resource data
   */
  constructor(id: string, data: Partial<ResourceContent>) {
    super(id, 'resource');
    
    this.data = {
      id: id,
      title: data.title || '',
      content: data.content || '',
      contentType: data.contentType || 'text/plain',
      tags: data.tags || [],
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
      createdBy: data.createdBy || '',
      ...data
    };
  }

  /**
   * Gets the complete resource data
   * @returns The resource data
   */
  getContentData(): ResourceContent {
    return { ...this.data };
  }

  /**
   * Updates resource information
   * @param content Updated resource data
   */
  updateContent(content: Partial<ResourceContent>): void {
    this.data = {
      ...this.data,
      ...content,
      updatedAt: new Date()
    };
  }

  /**
   * Adds a tag to the resource
   * @param tag Tag to add
   */
  addTag(tag: string): void {
    if (!this.data.tags) {
      this.data.tags = [];
    }
    
    if (!this.data.tags.includes(tag)) {
      this.data.tags.push(tag);
      this.data.updatedAt = new Date();
    }
  }

  /**
   * Removes a tag from the resource
   * @param tag Tag to remove
   */
  removeTag(tag: string): void {
    if (this.data.tags) {
      this.data.tags = this.data.tags.filter(t => t !== tag);
      this.data.updatedAt = new Date();
    }
  }

  /**
   * Adds a reference to the resource
   * @param referenceRef UOR reference to related resource
   */
  addReference(referenceRef: string): void {
    if (!this.data.references) {
      this.data.references = [];
    }
    
    if (!this.data.references.includes(referenceRef)) {
      this.data.references.push(referenceRef);
      this.data.updatedAt = new Date();
    }
  }

  /**
   * Removes a reference from the resource
   * @param referenceRef UOR reference to related resource
   */
  removeReference(referenceRef: string): void {
    if (this.data.references) {
      this.data.references = this.data.references.filter(ref => ref !== referenceRef);
      this.data.updatedAt = new Date();
    }
  }

  /**
   * Sets the source URL for the resource
   * @param url Source URL
   */
  setSourceUrl(url: string): void {
    this.data.sourceUrl = url;
    this.data.updatedAt = new Date();
  }

  /**
   * Transforms this resource to a different observer frame
   * @param newFrame The new observer frame
   * @returns A new resource object in the new frame
   */
  transformToFrame(newFrame: ObserverFrame): UORObject {
    const newResource = new ResourceObject(this.id, this.data);
    newResource.setObserverFrame(newFrame);
    return newResource;
  }

  /**
   * Computes the prime decomposition of this resource
   * @returns The prime decomposition
   */
  computePrimeDecomposition(): PrimeDecomposition {
    const primeFactors: PrimeFactor[] = [
      {
        id: `resource:${this.id}`,
        value: { id: this.id, type: 'resource' },
        domain: 'resource'
      },
      {
        id: `resource:title:${this.data.title}`,
        value: { title: this.data.title },
        domain: 'resource.title'
      }
    ];
    
    const contentChunks = this.getContentChunks();
    contentChunks.forEach((chunk, index) => {
      primeFactors.push({
        id: `resource:content:${index}`,
        value: { content: chunk, index },
        domain: 'resource.content'
      });
    });
    
    primeFactors.push({
      id: `resource:contentType:${this.data.contentType}`,
      value: { contentType: this.data.contentType },
      domain: 'resource.metadata'
    });
    
    if (this.data.sourceUrl) {
      primeFactors.push({
        id: `resource:sourceUrl:${this.data.sourceUrl}`,
        value: { sourceUrl: this.data.sourceUrl },
        domain: 'resource.metadata'
      });
    }
    
    if (this.data.tags && this.data.tags.length > 0) {
      this.data.tags.forEach(tag => {
        primeFactors.push({
          id: `resource:tag:${tag}`,
          value: { tag },
          domain: 'resource.tag'
        });
      });
    }
    
    if (this.data.references && this.data.references.length > 0) {
      this.data.references.forEach(ref => {
        primeFactors.push({
          id: `resource:reference:${ref}`,
          value: { reference: ref },
          domain: 'resource.reference'
        });
      });
    }
    
    return {
      primeFactors,
      decompositionMethod: 'resource-decomposition'
    };
  }

  /**
   * Breaks content into semantic chunks for prime decomposition
   * @returns Array of content chunks
   */
  private getContentChunks(): string[] {
    const content = this.data.content;
    
    if (content.length < 1000) {
      return [content];
    }
    
    const paragraphs = content.split(/\n\s*\n/);
    
    const chunks: string[] = [];
    const maxChunkSize = 1000;
    
    for (const paragraph of paragraphs) {
      if (paragraph.length < maxChunkSize) {
        chunks.push(paragraph);
      } else {
        const sentences = paragraph.split(/(?<=[.!?])\s+/);
        let currentChunk = '';
        
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length < maxChunkSize) {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
          } else {
            chunks.push(currentChunk);
            currentChunk = sentence;
          }
        }
        
        if (currentChunk) {
          chunks.push(currentChunk);
        }
      }
    }
    
    return chunks;
  }

  /**
   * Computes the canonical representation of this resource
   * @returns The canonical representation
   */
  computeCanonicalRepresentation(): CanonicalRepresentation {
    const canonicalData = {
      id: this.data.id,
      title: this.data.title,
      contentType: this.data.contentType,
      contentHash: this.computeContentHash(),
      tags: this.data.tags ? [...this.data.tags].sort() : [],
      sourceUrl: this.data.sourceUrl,
      references: this.data.references ? [...this.data.references].sort() : [],
      createdAt: this.data.createdAt.toISOString(),
      updatedAt: this.data.updatedAt.toISOString(),
      createdBy: this.data.createdBy
    };
    
    return {
      representationType: 'resource-canonical',
      value: canonicalData,
      coherenceNorm: this.measureCoherence().value
    };
  }

  /**
   * Computes a hash of the resource content
   * @returns Content hash string
   */
  private computeContentHash(): string {
    return `hash-${this.id}-${this.data.content.length}`;
  }

  /**
   * Measures the coherence of this resource representation
   * @returns The coherence measure
   */
  measureCoherence(): CoherenceMeasure {
    let coherenceScore = 0;
    
    if (this.data.title && this.data.title.length > 0) coherenceScore += 0.2;
    if (this.data.content && this.data.content.length > 0) coherenceScore += 0.4;
    
    if (this.data.contentType) coherenceScore += 0.1;
    
    if (this.data.tags && this.data.tags.length > 0) coherenceScore += 0.1;
    if (this.data.sourceUrl) coherenceScore += 0.1;
    if (this.data.references && this.data.references.length > 0) coherenceScore += 0.1;
    
    return {
      type: 'resource-coherence',
      value: coherenceScore,
      normalization: 'linear-sum'
    };
  }

  /**
   * Serializes this resource to a JSON representation
   * @returns Serialized resource object
   */
  serialize(): object {
    return {
      id: this.id,
      type: this.type,
      data: this.data,
      canonicalRepresentation: this.canonicalRepresentation || this.computeCanonicalRepresentation(),
      primeDecomposition: this.primeDecomposition || this.computePrimeDecomposition(),
      observerFrame: this.observerFrame
    };
  }

  /**
   * Validates this resource against its schema
   * @returns Whether the resource is valid
   */
  validate(): boolean {
    if (!this.data.id || this.data.id !== this.id) {
      return false;
    }
    
    if (!this.data.title || this.data.title.trim() === '') {
      return false;
    }
    
    if (!this.data.content || this.data.content.trim() === '') {
      return false;
    }
    
    if (!this.data.contentType) {
      return false;
    }
    
    if (!this.data.createdBy || this.data.createdBy.trim() === '') {
      return false;
    }
    
    return true;
  }

  /**
   * Gets the intrinsic prime factors for the resource domain
   * @returns Array of intrinsic prime factors
   */
  getIntrinsicPrimes(): PrimeFactor[] {
    return [
      {
        id: 'resource:core',
        value: { type: 'resource' },
        domain: 'resource'
      }
    ];
  }
}
