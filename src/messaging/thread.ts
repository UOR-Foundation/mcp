/**
 * UOR Message Thread Implementation
 * Implements thread objects in the UOR system
 */

import { UORObject, CanonicalRepresentation, PrimeDecomposition, ObserverFrame, CoherenceMeasure, PrimeFactor } from '../core/uor-core';
import { MessageThread, ThreadUORObject } from './message-types';

/**
 * Implementation of UOR Thread Object
 */
export class ThreadObject extends UORObject implements ThreadUORObject {
  private data: MessageThread;

  /**
   * Creates a new thread object
   * @param id Unique thread ID
   * @param data Initial thread data
   */
  constructor(id: string, data: Partial<MessageThread>) {
    super(id, 'thread');
    
    this.data = {
      id: id,
      title: data.title || '',
      participants: data.participants || [],
      messageIds: data.messageIds || [],
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
      createdBy: data.createdBy || '',
      tags: data.tags || [],
      ...data
    };
  }

  /**
   * Gets the complete thread data
   * @returns The thread data
   */
  getThreadData(): MessageThread {
    return { ...this.data };
  }

  /**
   * Updates thread information
   * @param thread Updated thread data
   */
  updateThread(thread: Partial<MessageThread>): void {
    this.data = {
      ...this.data,
      ...thread,
      updatedAt: new Date()
    };
  }

  /**
   * Adds a message to the thread
   * @param messageId UOR reference to message
   */
  addMessage(messageId: string): void {
    if (!this.data.messageIds.includes(messageId)) {
      this.data.messageIds.push(messageId);
      this.data.updatedAt = new Date();
    }
  }

  /**
   * Removes a message from the thread
   * @param messageId UOR reference to message
   */
  removeMessage(messageId: string): void {
    this.data.messageIds = this.data.messageIds.filter(id => id !== messageId);
    this.data.updatedAt = new Date();
  }

  /**
   * Adds a participant to the thread
   * @param participantId UOR reference to participant identity
   */
  addParticipant(participantId: string): void {
    if (!this.data.participants.includes(participantId)) {
      this.data.participants.push(participantId);
      this.data.updatedAt = new Date();
    }
  }

  /**
   * Removes a participant from the thread
   * @param participantId UOR reference to participant identity
   */
  removeParticipant(participantId: string): void {
    this.data.participants = this.data.participants.filter(id => id !== participantId);
    this.data.updatedAt = new Date();
  }

  /**
   * Adds a tag to the thread
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
   * Removes a tag from the thread
   * @param tag Tag to remove
   */
  removeTag(tag: string): void {
    if (this.data.tags) {
      this.data.tags = this.data.tags.filter(t => t !== tag);
      this.data.updatedAt = new Date();
    }
  }

  /**
   * Transforms this thread to a different observer frame
   * @param newFrame The new observer frame
   * @returns A new thread object in the new frame
   */
  transformToFrame(newFrame: ObserverFrame): UORObject {
    const newThread = new ThreadObject(this.id, this.data);
    newThread.setObserverFrame(newFrame);
    return newThread;
  }

  /**
   * Computes the prime decomposition of this thread
   * @returns The prime decomposition
   */
  computePrimeDecomposition(): PrimeDecomposition {
    const primeFactors: PrimeFactor[] = [
      {
        id: `thread:${this.id}`,
        value: { id: this.id, type: 'thread' },
        domain: 'thread'
      },
      {
        id: `thread:title:${this.data.title}`,
        value: { title: this.data.title },
        domain: 'thread.title'
      },
      {
        id: `thread:creator:${this.data.createdBy}`,
        value: { createdBy: this.data.createdBy },
        domain: 'thread.creator'
      }
    ];
    
    this.data.participants.forEach(participant => {
      primeFactors.push({
        id: `thread:participant:${participant}`,
        value: { participant },
        domain: 'thread.participant'
      });
    });
    
    this.data.messageIds.forEach(messageId => {
      primeFactors.push({
        id: `thread:message:${messageId}`,
        value: { messageId },
        domain: 'thread.message'
      });
    });
    
    if (this.data.tags && this.data.tags.length > 0) {
      this.data.tags.forEach(tag => {
        primeFactors.push({
          id: `thread:tag:${tag}`,
          value: { tag },
          domain: 'thread.tag'
        });
      });
    }
    
    return {
      primeFactors,
      decompositionMethod: 'thread-decomposition'
    };
  }

  /**
   * Computes the canonical representation of this thread
   * @returns The canonical representation
   */
  computeCanonicalRepresentation(): CanonicalRepresentation {
    const canonicalData = {
      id: this.data.id,
      title: this.data.title,
      participants: [...this.data.participants].sort(),
      messageIds: [...this.data.messageIds].sort(),
      createdAt: this.data.createdAt.toISOString(),
      updatedAt: this.data.updatedAt.toISOString(),
      createdBy: this.data.createdBy,
      tags: this.data.tags ? [...this.data.tags].sort() : []
    };
    
    return {
      representationType: 'thread-canonical',
      value: canonicalData,
      coherenceNorm: this.measureCoherence().value
    };
  }

  /**
   * Measures the coherence of this thread representation
   * @returns The coherence measure
   */
  measureCoherence(): CoherenceMeasure {
    let coherenceScore = 0;
    
    if (this.data.title && this.data.title.length > 0) coherenceScore += 0.1;
    if (this.data.createdBy) coherenceScore += 0.1;
    
    coherenceScore += Math.min(0.3, this.data.participants.length * 0.05);
    
    coherenceScore += Math.min(0.5, this.data.messageIds.length * 0.05);
    
    return {
      type: 'thread-coherence',
      value: coherenceScore,
      normalization: 'linear-sum'
    };
  }

  /**
   * Serializes this thread to a JSON representation
   * @returns Serialized thread object
   */
  serialize(): object {
    return {
      id: this.id,
      type: this.type,
      data: {
        ...this.data,
        createdAt: this.data.createdAt.toISOString(),
        updatedAt: this.data.updatedAt.toISOString()
      },
      canonicalRepresentation: this.canonicalRepresentation || this.computeCanonicalRepresentation(),
      primeDecomposition: this.primeDecomposition || this.computePrimeDecomposition(),
      observerFrame: this.observerFrame
    };
  }

  /**
   * Validates this thread against its schema
   * @returns Whether the thread is valid
   */
  validate(): boolean {
    if (!this.data.id || this.data.id !== this.id) {
      return false;
    }
    
    if (!this.data.title || this.data.title.trim() === '') {
      return false;
    }
    
    if (!this.data.createdBy || this.data.createdBy.trim() === '') {
      return false;
    }
    
    return true;
  }

  /**
   * Gets the intrinsic prime factors for the thread domain
   * @returns Array of intrinsic prime factors
   */
  getIntrinsicPrimes(): PrimeFactor[] {
    return [
      {
        id: 'thread:core',
        value: { type: 'thread' },
        domain: 'thread'
      }
    ];
  }
}
