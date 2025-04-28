/**
 * UOR Media Implementation
 * Implements media objects in the UOR system
 */

import { UORObject, UORArtifact, CanonicalRepresentation, PrimeDecomposition, ObserverFrame, CoherenceMeasure, PrimeFactor } from '../core/uor-core';
import { MediaContent, ContentUORObject } from './content-types';

/**
 * Implementation of UOR Media Object
 */
export class MediaObject extends UORArtifact implements ContentUORObject {
  private data: MediaContent;

  /**
   * Creates a new media object
   * @param id Unique media ID
   * @param data Initial media data
   */
  constructor(id: string, data: Partial<MediaContent>) {
    super(id, data.mimeType || 'application/octet-stream', data.size || 0);
    
    this.data = {
      id: id,
      title: data.title || '',
      mimeType: data.mimeType || 'application/octet-stream',
      size: data.size || 0,
      filename: data.filename || '',
      tags: data.tags || [],
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
      createdBy: data.createdBy || '',
      ...data
    };
  }

  /**
   * Gets the complete media data
   * @returns The media data
   */
  getContentData(): MediaContent {
    return { ...this.data };
  }

  /**
   * Updates media information
   * @param content Updated media data
   */
  updateContent(content: Partial<MediaContent>): void {
    this.data = {
      ...this.data,
      ...content,
      updatedAt: new Date()
    };
    
    if (content.mimeType) {
      this.mimeType = content.mimeType;
    }
    
    if (content.size) {
      this.size = content.size;
    }
  }

  /**
   * Adds a tag to the media
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
   * Removes a tag from the media
   * @param tag Tag to remove
   */
  removeTag(tag: string): void {
    if (this.data.tags) {
      this.data.tags = this.data.tags.filter(t => t !== tag);
      this.data.updatedAt = new Date();
    }
  }

  /**
   * Sets the thumbnail reference for the media
   * @param thumbnailRef UOR reference to thumbnail
   */
  setThumbnail(thumbnailRef: string): void {
    this.data.thumbnailRef = thumbnailRef;
    this.data.updatedAt = new Date();
  }

  /**
   * Sets metadata for the media
   * @param metadata Media metadata
   */
  setMetadata(metadata: Record<string, any>): void {
    this.data.metadata = {
      ...this.data.metadata,
      ...metadata
    };
    this.data.updatedAt = new Date();
  }

  /**
   * Assembles the complete content from chunks
   * @returns The complete content as a string
   */
  assembleContent(): string {
    return this.chunks.join('');
  }

  /**
   * Transforms this media to a different observer frame
   * @param newFrame The new observer frame
   * @returns A new media object in the new frame
   */
  transformToFrame(newFrame: ObserverFrame): UORObject {
    const newMedia = new MediaObject(this.id, this.data);
    
    this.chunks.forEach(chunk => newMedia.addChunk(chunk));
    
    newMedia.setObserverFrame(newFrame);
    return newMedia;
  }

  /**
   * Computes the prime decomposition of this media
   * @returns The prime decomposition
   */
  computePrimeDecomposition(): PrimeDecomposition {
    const primeFactors: PrimeFactor[] = [
      {
        id: `media:${this.id}`,
        value: { id: this.id, type: 'media' },
        domain: 'media'
      },
      {
        id: `media:title:${this.data.title}`,
        value: { title: this.data.title },
        domain: 'media.title'
      },
      {
        id: `media:mimeType:${this.data.mimeType}`,
        value: { mimeType: this.data.mimeType },
        domain: 'media.metadata'
      },
      {
        id: `media:filename:${this.data.filename}`,
        value: { filename: this.data.filename },
        domain: 'media.metadata'
      }
    ];
    
    primeFactors.push({
      id: `media:contentHash:${this.computeContentHash()}`,
      value: { contentHash: this.computeContentHash() },
      domain: 'media.content'
    });
    
    if (this.data.thumbnailRef) {
      primeFactors.push({
        id: `media:thumbnail:${this.data.thumbnailRef}`,
        value: { thumbnailRef: this.data.thumbnailRef },
        domain: 'media.thumbnail'
      });
    }
    
    if (this.data.metadata) {
      Object.entries(this.data.metadata).forEach(([key, value]) => {
        primeFactors.push({
          id: `media:metadata:${key}:${value}`,
          value: { [key]: value },
          domain: 'media.metadata'
        });
      });
    }
    
    if (this.data.tags && this.data.tags.length > 0) {
      this.data.tags.forEach(tag => {
        primeFactors.push({
          id: `media:tag:${tag}`,
          value: { tag },
          domain: 'media.tag'
        });
      });
    }
    
    return {
      primeFactors,
      decompositionMethod: 'media-decomposition'
    };
  }

  /**
   * Computes a hash of the media content
   * @returns Content hash string
   */
  private computeContentHash(): string {
    return `hash-${this.id}-${this.size}`;
  }

  /**
   * Computes the canonical representation of this media
   * @returns The canonical representation
   */
  computeCanonicalRepresentation(): CanonicalRepresentation {
    const canonicalData = {
      id: this.data.id,
      title: this.data.title,
      mimeType: this.data.mimeType,
      size: this.data.size,
      filename: this.data.filename,
      contentHash: this.computeContentHash(),
      thumbnailRef: this.data.thumbnailRef,
      metadata: this.data.metadata ? { ...this.data.metadata } : undefined,
      tags: this.data.tags ? [...this.data.tags].sort() : [],
      createdAt: this.data.createdAt.toISOString(),
      updatedAt: this.data.updatedAt.toISOString(),
      createdBy: this.data.createdBy
    };
    
    return {
      representationType: 'media-canonical',
      value: canonicalData,
      coherenceNorm: this.measureCoherence().value
    };
  }

  /**
   * Measures the coherence of this media representation
   * @returns The coherence measure
   */
  measureCoherence(): CoherenceMeasure {
    let coherenceScore = 0;
    
    if (this.data.title && this.data.title.length > 0) coherenceScore += 0.2;
    if (this.data.filename && this.data.filename.length > 0) coherenceScore += 0.1;
    
    if (this.data.mimeType) coherenceScore += 0.1;
    if (this.data.size > 0) coherenceScore += 0.1;
    
    if (this.chunks.length > 0) coherenceScore += 0.3;
    
    if (this.data.thumbnailRef) coherenceScore += 0.1;
    if (this.data.metadata) coherenceScore += 0.1;
    
    return {
      type: 'media-coherence',
      value: coherenceScore,
      normalization: 'linear-sum'
    };
  }

  /**
   * Serializes this media to a JSON representation
   * @returns Serialized media object
   */
  serialize(): object {
    return {
      id: this.id,
      type: this.type,
      data: this.data,
      mimeType: this.mimeType,
      size: this.size,
      chunkCount: this.chunks.length,
      canonicalRepresentation: this.canonicalRepresentation || this.computeCanonicalRepresentation(),
      primeDecomposition: this.primeDecomposition || this.computePrimeDecomposition(),
      observerFrame: this.observerFrame
    };
  }

  /**
   * Validates this media against its schema
   * @returns Whether the media is valid
   */
  validate(): boolean {
    if (!this.data.id || this.data.id !== this.id) {
      return false;
    }
    
    if (!this.data.title || this.data.title.trim() === '') {
      return false;
    }
    
    if (!this.data.mimeType) {
      return false;
    }
    
    if (!this.data.filename || this.data.filename.trim() === '') {
      return false;
    }
    
    if (!this.data.createdBy || this.data.createdBy.trim() === '') {
      return false;
    }
    
    return true;
  }

  /**
   * Gets the intrinsic prime factors for the media domain
   * @returns Array of intrinsic prime factors
   */
  getIntrinsicPrimes(): PrimeFactor[] {
    return [
      {
        id: 'media:core',
        value: { type: 'media' },
        domain: 'media'
      }
    ];
  }
}
