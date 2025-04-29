/**
 * UOR Channel Implementation
 * Implements channel objects in the UOR system
 */

import {
  UORObject,
  CanonicalRepresentation,
  PrimeDecomposition,
  ObserverFrame,
  CoherenceMeasure,
  PrimeFactor,
} from '../core/uor-core';
import { Channel, ChannelVisibility, ChannelUORObject } from './event-types';

/**
 * Implementation of UOR Channel Object
 */
export class ChannelObject extends UORObject implements ChannelUORObject {
  private data: Channel;

  /**
   * Creates a new channel object
   * @param id Unique channel ID
   * @param data Initial channel data
   */
  constructor(id: string, data: Partial<Channel>) {
    super(id, 'channel');

    this.data = {
      id: id,
      name: data.name || '',
      description: data.description || '',
      namespace: data.namespace || '',
      contentType: data.contentType || 'generic',
      visibility: data.visibility || ChannelVisibility.PUBLIC,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
      createdBy: data.createdBy || '',
      tags: data.tags || [],
      metadata: data.metadata || {},
      ...data,
    };
  }

  /**
   * Gets the complete channel data
   * @returns The channel data
   */
  getChannelData(): Channel {
    return { ...this.data };
  }

  /**
   * Updates channel information
   * @param channel Updated channel data
   */
  updateChannel(channel: Partial<Channel>): void {
    this.data = {
      ...this.data,
      ...channel,
      updatedAt: new Date(),
    };
  }

  /**
   * Adds a tag to the channel
   * @param tag Tag to add
   */
  addTag(tag: string): void {
    if (!this.data.tags.includes(tag)) {
      this.data.tags.push(tag);
      this.data.updatedAt = new Date();
    }
  }

  /**
   * Removes a tag from the channel
   * @param tag Tag to remove
   */
  removeTag(tag: string): void {
    this.data.tags = this.data.tags.filter(t => t !== tag);
    this.data.updatedAt = new Date();
  }

  /**
   * Sets the channel visibility
   * @param visibility Channel visibility
   */
  setVisibility(visibility: ChannelVisibility): void {
    this.data.visibility = visibility;
    this.data.updatedAt = new Date();
  }

  /**
   * Adds metadata to the channel
   * @param key Metadata key
   * @param value Metadata value
   */
  addMetadata(key: string, value: any): void {
    this.data.metadata = {
      ...this.data.metadata,
      [key]: value,
    };
    this.data.updatedAt = new Date();
  }

  /**
   * Removes metadata from the channel
   * @param key Metadata key to remove
   */
  removeMetadata(key: string): void {
    const { [key]: _, ...rest } = this.data.metadata;
    this.data.metadata = rest;
    this.data.updatedAt = new Date();
  }

  /**
   * Transforms this channel to a different observer frame
   * @param newFrame The new observer frame
   * @returns A new channel object in the new frame
   */
  transformToFrame(newFrame: ObserverFrame): UORObject {
    const newChannel = new ChannelObject(this.id, this.data);
    newChannel.setObserverFrame(newFrame);
    return newChannel;
  }

  /**
   * Computes the prime decomposition of this channel
   * @returns The prime decomposition
   */
  computePrimeDecomposition(): PrimeDecomposition {
    const primeFactors: PrimeFactor[] = [
      {
        id: `channel:${this.id}`,
        value: { id: this.id, type: 'channel' },
        domain: 'channel',
      },
      {
        id: `channel:name:${this.data.name}`,
        value: { name: this.data.name },
        domain: 'channel.name',
      },
      {
        id: `channel:namespace:${this.data.namespace}`,
        value: { namespace: this.data.namespace },
        domain: 'channel.namespace',
      },
      {
        id: `channel:contentType:${this.data.contentType}`,
        value: { contentType: this.data.contentType },
        domain: 'channel.contentType',
      },
      {
        id: `channel:visibility:${this.data.visibility}`,
        value: { visibility: this.data.visibility },
        domain: 'channel.visibility',
      },
      {
        id: `channel:creator:${this.data.createdBy}`,
        value: { createdBy: this.data.createdBy },
        domain: 'channel.creator',
      },
    ];

    this.data.tags.forEach(tag => {
      primeFactors.push({
        id: `channel:tag:${tag}`,
        value: { tag },
        domain: 'channel.tag',
      });
    });

    Object.entries(this.data.metadata).forEach(([key, value]) => {
      primeFactors.push({
        id: `channel:metadata:${key}:${JSON.stringify(value)}`,
        value: { [key]: value },
        domain: 'channel.metadata',
      });
    });

    return {
      primeFactors,
      decompositionMethod: 'channel-decomposition',
    };
  }

  /**
   * Computes the canonical representation of this channel
   * @returns The canonical representation
   */
  computeCanonicalRepresentation(): CanonicalRepresentation {
    const canonicalData = {
      id: this.data.id,
      name: this.data.name,
      description: this.data.description,
      namespace: this.data.namespace,
      contentType: this.data.contentType,
      visibility: this.data.visibility,
      createdAt: this.data.createdAt.toISOString(),
      updatedAt: this.data.updatedAt.toISOString(),
      createdBy: this.data.createdBy,
      tags: [...this.data.tags].sort(),
      metadata: this.canonicalizeMetadata(),
    };

    return {
      representationType: 'channel-canonical',
      value: canonicalData,
      coherenceNorm: this.measureCoherence().value,
    };
  }

  /**
   * Canonicalizes the metadata object
   * @returns Canonicalized metadata
   */
  private canonicalizeMetadata(): object {
    const result: Record<string, any> = {};

    const sortedKeys = Object.keys(this.data.metadata).sort();

    for (const key of sortedKeys) {
      result[key] = this.data.metadata[key];
    }

    return result;
  }

  /**
   * Measures the coherence of this channel representation
   * @returns The coherence measure
   */
  measureCoherence(): CoherenceMeasure {
    let coherenceScore = 0;

    if (this.data.id) coherenceScore += 0.05;
    if (this.data.name) coherenceScore += 0.1;
    if (this.data.description) coherenceScore += 0.1;
    if (this.data.namespace) coherenceScore += 0.1;
    if (this.data.contentType) coherenceScore += 0.1;
    if (this.data.createdBy) coherenceScore += 0.05;

    coherenceScore += Math.min(0.2, this.data.tags.length * 0.05);

    const metadataCount = Object.keys(this.data.metadata).length;
    coherenceScore += Math.min(0.3, metadataCount * 0.05);

    return {
      type: 'channel-coherence',
      value: coherenceScore,
      normalization: 'linear-sum',
    };
  }

  /**
   * Serializes this channel to a JSON representation
   * @returns Serialized channel object
   */
  serialize(): object {
    return {
      id: this.id,
      type: this.type,
      data: {
        ...this.data,
        createdAt: this.data.createdAt.toISOString(),
        updatedAt: this.data.updatedAt.toISOString(),
      },
      canonicalRepresentation:
        this.canonicalRepresentation || this.computeCanonicalRepresentation(),
      primeDecomposition: this.primeDecomposition || this.computePrimeDecomposition(),
      observerFrame: this.observerFrame,
    };
  }

  /**
   * Validates this channel against its schema
   * @returns Whether the channel is valid
   */
  validate(): boolean {
    if (!this.data.id || this.data.id !== this.id) {
      return false;
    }

    if (!this.data.name || this.data.name.trim() === '') {
      return false;
    }

    if (!this.data.namespace || this.data.namespace.trim() === '') {
      return false;
    }

    if (!this.data.contentType || this.data.contentType.trim() === '') {
      return false;
    }

    if (!this.data.createdBy || this.data.createdBy.trim() === '') {
      return false;
    }

    return true;
  }

  /**
   * Gets the intrinsic prime factors for the channel domain
   * @returns Array of intrinsic prime factors
   */
  getIntrinsicPrimes(): PrimeFactor[] {
    return [
      {
        id: 'channel:core',
        value: { type: 'channel' },
        domain: 'channel',
      },
    ];
  }
}
