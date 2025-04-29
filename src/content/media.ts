/**
 * UOR Media Implementation
 * Implements media objects in the UOR system
 */

import { UORObject, ObserverFrame, PrimeDecomposition, CanonicalRepresentation, CoherenceMeasure, PrimeFactor } from '../core/uor-core';
import { ContentType, MediaContent, ContentUORObject } from './content-types';

/**
 * Media object implementation
 */
export class MediaObject extends UORObject implements ContentUORObject {
  private content: MediaContent;
  
  /**
   * Creates a new media object
   * @param id Unique identifier
   * @param content Media content
   */
  constructor(id: string, content: MediaContent) {
    super(id, ContentType.MEDIA);
    this.content = content;
  }
  
  /**
   * Gets the media content data
   * @returns The media content
   */
  getContentData(): MediaContent {
    return this.content;
  }
  
  /**
   * Adds a tag to the media
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
   * Removes a tag from the media
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
   * Updates the media content
   * @param data Updated media data
   */
  updateContent(data: Partial<MediaContent>): void {
    this.content = {
      ...this.content,
      ...data,
      updatedAt: new Date()
    };
  }
  
  /**
   * Adds content to the media
   * @param chunk Content chunk (base64-encoded)
   */
  addContent(chunk: string): void {
    if (!this.content.chunks) {
      this.content.chunks = [];
    }
    
    this.content.chunks.push(chunk);
    this.content.updatedAt = new Date();
  }
  
  /**
   * Gets the complete media content
   * @returns Base64-encoded content
   */
  getContent(): string {
    return (this.content.chunks || []).join('');
  }
  
  /**
   * Updates media metadata
   * @param metadata Updated metadata
   */
  updateMetadata(metadata: Record<string, any>): void {
    this.content.metadata = {
      ...this.content.metadata,
      ...metadata
    };
    
    this.content.updatedAt = new Date();
  }
  
  /**
   * Transforms this object to a different observer frame
   * @param newFrame The new observer frame to transform to
   * @returns A new UOR object in the new observer frame
   */
  transformToFrame(newFrame: ObserverFrame): UORObject {
    const transformedMedia = new MediaObject(this.id, { ...this.content });
    
    transformedMedia.setObserverFrame(newFrame);
    
    if (this.canonicalRepresentation) {
      transformedMedia.setCanonicalRepresentation(this.canonicalRepresentation);
    }
    
    if (this.primeDecomposition) {
      transformedMedia.setPrimeDecomposition(this.primeDecomposition);
    }
    
    return transformedMedia;
  }
  
  /**
   * Measures the coherence of this object's representation
   * This quantifies the representational integrity
   */
  measureCoherence(): CoherenceMeasure {
    return {
      type: 'media-coherence',
      value: 1.0, // Perfect coherence for media objects
      normalization: 'identity'
    };
  }
  
  /**
   * Validates this object against its schema
   * @returns Whether the object is valid
   */
  validate(): boolean {
    if (!this.content.title || !this.content.mimeType || !this.content.size) {
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
        id: 'media:base',
        value: { type: 'media' },
        domain: 'media'
      }
    ];
  }
  
  /**
   * Computes the prime decomposition of this media
   */
  computePrimeDecomposition(): PrimeDecomposition {
    return {
      primeFactors: [
        {
          id: `media:${this.id}`,
          value: { 
            title: this.content.title,
            mimeType: this.content.mimeType,
            size: this.content.size
          },
          domain: 'media'
        },
        ...(this.content.metadata ? Object.entries(this.content.metadata).map(([key, value]) => ({
          id: `metadata:${this.id}:${key}`,
          value: { property: key, value },
          domain: 'media-metadata'
        })) : [])
      ],
      decompositionMethod: 'media-metadata'
    };
  }
  
  /**
   * Computes the canonical representation of this media
   */
  computeCanonicalRepresentation(): CanonicalRepresentation {
    return {
      representationType: 'media-canonical',
      value: {
        id: this.id,
        title: this.content.title,
        mimeType: this.content.mimeType,
        size: this.content.size,
        chunkCount: (this.content.chunks || []).length,
        metadata: this.content.metadata
      }
    };
  }
  
  /**
   * Serializes this media to a JSON representation
   */
  serialize(): object {
    return {
      id: this.id,
      type: this.type,
      content: {
        ...this.content,
        chunks: this.content.chunks ? [`${this.content.chunks.length} chunks`] : []
      },
      canonicalRepresentation: this.canonicalRepresentation || this.computeCanonicalRepresentation(),
      primeDecomposition: this.primeDecomposition || this.computePrimeDecomposition()
    };
  }
}
