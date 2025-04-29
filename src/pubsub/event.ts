/**
 * UOR Event Implementation
 * Implements event objects in the UOR system
 */

import {
  UORObject,
  CanonicalRepresentation,
  PrimeDecomposition,
  ObserverFrame,
  CoherenceMeasure,
  PrimeFactor,
} from '../core/uor-core';
import { EventBase, EventPriority, EventUORObject } from './event-types';

/**
 * Implementation of UOR Event Object
 */
export class EventObject extends UORObject implements EventUORObject {
  private data: EventBase;

  /**
   * Creates a new event object
   * @param id Unique event ID
   * @param data Initial event data
   */
  constructor(id: string, data: Partial<EventBase>) {
    super(id, 'event');

    this.data = {
      id: id,
      type: data.type || 'generic',
      publisher: data.publisher || '',
      timestamp: data.timestamp || new Date(),
      priority: data.priority || EventPriority.NORMAL,
      metadata: data.metadata || {},
      payload: data.payload || null,
      channelId: data.channelId || '',
      ...data,
    };
  }

  /**
   * Gets the complete event data
   * @returns The event data
   */
  getEventData(): EventBase {
    return { ...this.data };
  }

  /**
   * Updates event information
   * @param event Updated event data
   */
  updateEvent(event: Partial<EventBase>): void {
    this.data = {
      ...this.data,
      ...event,
    };
  }

  /**
   * Adds metadata to the event
   * @param key Metadata key
   * @param value Metadata value
   */
  addMetadata(key: string, value: any): void {
    this.data.metadata = {
      ...this.data.metadata,
      [key]: value,
    };
  }

  /**
   * Removes metadata from the event
   * @param key Metadata key to remove
   */
  removeMetadata(key: string): void {
    const { [key]: _, ...rest } = this.data.metadata;
    this.data.metadata = rest;
  }

  /**
   * Sets the event payload
   * @param payload Event payload
   */
  setPayload(payload: any): void {
    this.data.payload = payload;
  }

  /**
   * Sets the event priority
   * @param priority Event priority
   */
  setPriority(priority: EventPriority): void {
    this.data.priority = priority;
  }

  /**
   * Transforms this event to a different observer frame
   * @param newFrame The new observer frame
   * @returns A new event object in the new frame
   */
  transformToFrame(newFrame: ObserverFrame): UORObject {
    const newEvent = new EventObject(this.id, this.data);
    newEvent.setObserverFrame(newFrame);
    return newEvent;
  }

  /**
   * Computes the prime decomposition of this event
   * @returns The prime decomposition
   */
  computePrimeDecomposition(): PrimeDecomposition {
    const primeFactors: PrimeFactor[] = [
      {
        id: `event:${this.id}`,
        value: { id: this.id, type: 'event' },
        domain: 'event',
      },
      {
        id: `event:type:${this.data.type}`,
        value: { type: this.data.type },
        domain: 'event.type',
      },
      {
        id: `event:publisher:${this.data.publisher}`,
        value: { publisher: this.data.publisher },
        domain: 'event.publisher',
      },
      {
        id: `event:channel:${this.data.channelId}`,
        value: { channelId: this.data.channelId },
        domain: 'event.channel',
      },
      {
        id: `event:priority:${this.data.priority}`,
        value: { priority: this.data.priority },
        domain: 'event.priority',
      },
    ];

    Object.entries(this.data.metadata).forEach(([key, value]) => {
      primeFactors.push({
        id: `event:metadata:${key}:${JSON.stringify(value)}`,
        value: { [key]: value },
        domain: 'event.metadata',
      });
    });

    if (this.data.payload && typeof this.data.payload === 'object') {
      Object.entries(this.data.payload).forEach(([key, value]) => {
        primeFactors.push({
          id: `event:payload:${key}:${JSON.stringify(value)}`,
          value: { [key]: value },
          domain: 'event.payload',
        });
      });
    } else if (this.data.payload) {
      primeFactors.push({
        id: `event:payload:${JSON.stringify(this.data.payload)}`,
        value: { payload: this.data.payload },
        domain: 'event.payload',
      });
    }

    return {
      primeFactors,
      decompositionMethod: 'event-decomposition',
    };
  }

  /**
   * Computes the canonical representation of this event
   * @returns The canonical representation
   */
  computeCanonicalRepresentation(): CanonicalRepresentation {
    const canonicalData = {
      id: this.data.id,
      type: this.data.type,
      publisher: this.data.publisher,
      timestamp: this.data.timestamp.toISOString(),
      priority: this.data.priority,
      metadata: this.canonicalizeMetadata(),
      payload: this.canonicalizePayload(),
      channelId: this.data.channelId,
    };

    return {
      representationType: 'event-canonical',
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
   * Canonicalizes the payload
   * @returns Canonicalized payload
   */
  private canonicalizePayload(): any {
    if (!this.data.payload) {
      return null;
    }

    if (typeof this.data.payload !== 'object') {
      return this.data.payload;
    }

    if (Array.isArray(this.data.payload)) {
      try {
        return [...this.data.payload].sort();
      } catch (e) {
        return this.data.payload;
      }
    }

    const result: Record<string, any> = {};
    const sortedKeys = Object.keys(this.data.payload).sort();

    for (const key of sortedKeys) {
      result[key] = this.data.payload[key];
    }

    return result;
  }

  /**
   * Measures the coherence of this event representation
   * @returns The coherence measure
   */
  measureCoherence(): CoherenceMeasure {
    let coherenceScore = 0;

    if (this.data.id) coherenceScore += 0.1;
    if (this.data.type) coherenceScore += 0.1;
    if (this.data.publisher) coherenceScore += 0.1;
    if (this.data.channelId) coherenceScore += 0.1;

    const metadataCount = Object.keys(this.data.metadata).length;
    coherenceScore += Math.min(0.3, metadataCount * 0.05);

    if (this.data.payload) {
      if (typeof this.data.payload === 'object') {
        const payloadSize = Object.keys(this.data.payload).length;
        coherenceScore += Math.min(0.3, payloadSize * 0.05);
      } else {
        coherenceScore += 0.1;
      }
    }

    return {
      type: 'event-coherence',
      value: coherenceScore,
      normalization: 'linear-sum',
    };
  }

  /**
   * Serializes this event to a JSON representation
   * @returns Serialized event object
   */
  serialize(): object {
    return {
      id: this.id,
      type: this.type,
      data: {
        ...this.data,
        timestamp: this.data.timestamp.toISOString(),
      },
      canonicalRepresentation:
        this.canonicalRepresentation || this.computeCanonicalRepresentation(),
      primeDecomposition: this.primeDecomposition || this.computePrimeDecomposition(),
      observerFrame: this.observerFrame,
    };
  }

  /**
   * Validates this event against its schema
   * @returns Whether the event is valid
   */
  validate(): boolean {
    if (!this.data.id || this.data.id !== this.id) {
      return false;
    }

    if (!this.data.type) {
      return false;
    }

    if (!this.data.publisher) {
      return false;
    }

    if (!this.data.channelId) {
      return false;
    }

    return true;
  }

  /**
   * Gets the intrinsic prime factors for the event domain
   * @returns Array of intrinsic prime factors
   */
  getIntrinsicPrimes(): PrimeFactor[] {
    return [
      {
        id: 'event:core',
        value: { type: 'event' },
        domain: 'event',
      },
    ];
  }
}
