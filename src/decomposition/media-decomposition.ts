/**
 * Media Content Decomposition Algorithm
 * Implements prime decomposition for media content
 */

import { PrimeFactor, PrimeDecomposition, CanonicalRepresentation } from '../core/uor-core';
import { BaseDecompositionAlgorithm } from './decomposition-types';

/**
 * Media metadata interface
 */
interface MediaMetadata {
  title?: string;
  description?: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  bitrate?: number;
  codec?: string;
  createdAt?: Date;
  modifiedAt?: Date;
  author?: string;
  copyright?: string;
  tags?: string[];
  [key: string]: any;
}

/**
 * Media content decomposition algorithm
 * Decomposes media metadata and basic characteristics
 */
export class MediaDecompositionAlgorithm extends BaseDecompositionAlgorithm {
  /**
   * Creates a new media decomposition algorithm
   */
  constructor() {
    super('media-decomposition', 'media');
  }
  
  /**
   * Decompose media content into prime factors
   * @param data Media data to decompose
   * @returns Prime decomposition of the media data
   */
  decompose(data: any): PrimeDecomposition {
    if (!data || typeof data !== 'object') {
      throw new Error('Input must be a valid media object');
    }
    
    const metadata = this.extractMetadata(data);
    
    const factors: PrimeFactor[] = [];
    
    Object.entries(metadata).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        factors.push(this.createPrimeFactor(
          `metadata-${key}`,
          { key, value }
        ));
      }
    });
    
    if (data.contentReference) {
      factors.push(this.createPrimeFactor(
        'content-reference',
        { reference: data.contentReference }
      ));
    }
    
    if (Array.isArray(data.chunks) && data.chunks.length > 0) {
      factors.push(this.createPrimeFactor(
        'chunk-count',
        { count: data.chunks.length }
      ));
      
      data.chunks.forEach((chunk, index) => {
        factors.push(this.createPrimeFactor(
          `chunk-${index}`,
          { index, reference: chunk }
        ));
      });
    }
    
    if (data.thumbnailReference) {
      factors.push(this.createPrimeFactor(
        'thumbnail-reference',
        { reference: data.thumbnailReference }
      ));
    }
    
    if (metadata.width && metadata.height) {
      const gcd = this.calculateGCD(metadata.width, metadata.height);
      const aspectRatioX = metadata.width / gcd;
      const aspectRatioY = metadata.height / gcd;
      
      factors.push(this.createPrimeFactor(
        'aspect-ratio',
        { 
          x: aspectRatioX, 
          y: aspectRatioY,
          ratio: metadata.width / metadata.height
        }
      ));
      
      const resolutionCategory = this.categorizeResolution(metadata.width, metadata.height);
      
      factors.push(this.createPrimeFactor(
        'resolution-category',
        { category: resolutionCategory }
      ));
    }
    
    return this.createDecomposition(factors, 'media-characteristics');
  }
  
  /**
   * Recompose media content from prime factors
   * @param decomposition Prime decomposition to recompose
   * @returns Recomposed media data
   */
  recompose(decomposition: PrimeDecomposition): any {
    const result: Record<string, any> = {
      metadata: {}
    };
    
    const metadataFactors = decomposition.primeFactors.filter(
      factor => factor.id.startsWith('metadata-')
    );
    
    metadataFactors.forEach(factor => {
      const key = (factor.value as any).key;
      const value = (factor.value as any).value;
      result.metadata[key] = value;
    });
    
    const commonMetadataKeys = [
      'title', 'description', 'mimeType', 'size', 
      'width', 'height', 'duration', 'createdAt', 'modifiedAt'
    ];
    
    commonMetadataKeys.forEach(key => {
      if (result.metadata[key] !== undefined) {
        result[key] = result.metadata[key];
      }
    });
    
    const contentReferenceFactor = decomposition.primeFactors.find(
      factor => factor.id === 'content-reference'
    );
    
    if (contentReferenceFactor) {
      result.contentReference = (contentReferenceFactor.value as any).reference;
    }
    
    const thumbnailReferenceFactor = decomposition.primeFactors.find(
      factor => factor.id === 'thumbnail-reference'
    );
    
    if (thumbnailReferenceFactor) {
      result.thumbnailReference = (thumbnailReferenceFactor.value as any).reference;
    }
    
    const chunkFactors = decomposition.primeFactors.filter(
      factor => factor.id.startsWith('chunk-') && factor.id !== 'chunk-count'
    );
    
    if (chunkFactors.length > 0) {
      result.chunks = [];
      
      chunkFactors
        .sort((a, b) => {
          const aIndex = (a.value as any).index;
          const bIndex = (b.value as any).index;
          return aIndex - bIndex;
        })
        .forEach(factor => {
          result.chunks.push((factor.value as any).reference);
        });
    }
    
    return result;
  }
  
  /**
   * Compute canonical representation from prime decomposition
   * @param decomposition Prime decomposition
   * @returns Canonical representation
   */
  computeCanonical(decomposition: PrimeDecomposition): CanonicalRepresentation {
    
    const canonical: Record<string, any> = {};
    
    const essentialMetadataKeys = [
      'mimeType', 'size', 'width', 'height', 'duration'
    ];
    
    essentialMetadataKeys.forEach(key => {
      const factor = decomposition.primeFactors.find(
        f => f.id === `metadata-${key}`
      );
      
      if (factor) {
        canonical[key] = (factor.value as any).value;
      }
    });
    
    const contentReferenceFactor = decomposition.primeFactors.find(
      factor => factor.id === 'content-reference'
    );
    
    if (contentReferenceFactor) {
      canonical.contentReference = (contentReferenceFactor.value as any).reference;
    }
    
    const metadataFactors = decomposition.primeFactors.filter(
      factor => factor.id.startsWith('metadata-')
    );
    
    const coherenceNorm = metadataFactors.length > 0 
      ? Math.min(1, metadataFactors.length / 10) 
      : 0;
    
    return this.createCanonicalRepresentation(
      canonical,
      'essential-media-metadata',
      coherenceNorm
    );
  }
  
  /**
   * Extract metadata from media data
   * @param data Media data
   * @returns Media metadata
   */
  private extractMetadata(data: any): MediaMetadata {
    const metadata: MediaMetadata = {
      mimeType: data.mimeType || 'application/octet-stream',
      size: data.size || 0
    };
    
    const metadataFields = [
      'title', 'description', 'width', 'height', 'duration',
      'bitrate', 'codec', 'createdAt', 'modifiedAt', 'author',
      'copyright', 'tags'
    ];
    
    metadataFields.forEach(field => {
      if (data[field] !== undefined) {
        metadata[field] = data[field];
      }
    });
    
    if (data.metadata && typeof data.metadata === 'object') {
      Object.entries(data.metadata).forEach(([key, value]) => {
        if (metadata[key] === undefined) {
          metadata[key] = value;
        }
      });
    }
    
    return metadata;
  }
  
  /**
   * Calculate greatest common divisor (for aspect ratio)
   * @param a First number
   * @param b Second number
   * @returns Greatest common divisor
   */
  private calculateGCD(a: number, b: number): number {
    return b === 0 ? a : this.calculateGCD(b, a % b);
  }
  
  /**
   * Categorize resolution based on width and height
   * @param width Image width
   * @param height Image height
   * @returns Resolution category
   */
  private categorizeResolution(width: number, height: number): string {
    const pixels = width * height;
    
    if (pixels >= 8294400) { // 3840x2160
      return '4K';
    } else if (pixels >= 2073600) { // 1920x1080
      return 'FullHD';
    } else if (pixels >= 921600) { // 1280x720
      return 'HD';
    } else if (pixels >= 307200) { // 640x480
      return 'SD';
    } else {
      return 'Low';
    }
  }
}
