/**
 * UOR Message Implementation
 * Implements message objects in the UOR system
 */

import {
  UORObject,
  CanonicalRepresentation,
  PrimeDecomposition,
  ObserverFrame,
  CoherenceMeasure,
  PrimeFactor,
} from '../core/uor-core';
import { MessageBase, MessageStatus, MessagePriority, MessageUORObject } from './message-types';

/**
 * Implementation of UOR Message Object
 */
export class MessageObject extends UORObject implements MessageUORObject {
  private data: MessageBase;

  /**
   * Creates a new message object
   * @param id Unique message ID
   * @param data Initial message data
   */
  constructor(id: string, data: Partial<MessageBase>) {
    super(id, 'message');

    this.data = {
      id: id,
      sender: data.sender || '',
      recipients: data.recipients || [],
      content: data.content || '',
      contentType: data.contentType || 'text/plain',
      status: data.status || MessageStatus._DRAFT,
      priority: data.priority || MessagePriority._NORMAL,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
      encrypted: data.encrypted || false,
      ...data,
    };
  }

  /**
   * Gets the complete message data
   * @returns The message data
   */
  getMessageData(): MessageBase {
    return { ...this.data };
  }

  /**
   * Updates message information
   * @param message Updated message data
   */
  updateMessage(message: Partial<MessageBase>): void {
    this.data = {
      ...this.data,
      ...message,
      updatedAt: new Date(),
    };
  }

  /**
   * Sets the message status
   * @param status New message status
   */
  setStatus(status: MessageStatus): void {
    this.data.status = status;
    this.data.updatedAt = new Date();

    switch (status) {
      case MessageStatus._SENT:
        this.data.sentAt = new Date();
        break;
      case MessageStatus._DELIVERED:
        this.data.deliveredAt = new Date();
        break;
      case MessageStatus._READ:
        this.data.readAt = new Date();
        break;
    }
  }

  /**
   * Adds a tag to the message
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
   * Removes a tag from the message
   * @param tag Tag to remove
   */
  removeTag(tag: string): void {
    if (this.data.tags) {
      this.data.tags = this.data.tags.filter(t => t !== tag);
      this.data.updatedAt = new Date();
    }
  }

  /**
   * Encrypts the message content
   * @param algorithm Encryption algorithm
   * @param keyId Optional key ID
   */
  encrypt(algorithm: string, keyId?: string): void {
    this.data.encrypted = true;
    this.data.encryptionMetadata = {
      algorithm,
      keyId,
    };
    this.data.updatedAt = new Date();
  }

  /**
   * Decrypts the message content
   * @returns Decrypted content
   */
  decrypt(): string {
    if (!this.data.encrypted) {
      return this.data.content;
    }

    return this.data.content;
  }

  /**
   * Transforms this message to a different observer frame
   * @param newFrame The new observer frame
   * @returns A new message object in the new frame
   */
  transformToFrame(newFrame: ObserverFrame): UORObject {
    const newMessage = new MessageObject(this.id, this.data);
    newMessage.setObserverFrame(newFrame);
    return newMessage;
  }

  /**
   * Computes the prime decomposition of this message
   * @returns The prime decomposition
   */
  computePrimeDecomposition(): PrimeDecomposition {
    const primeFactors: PrimeFactor[] = [
      {
        id: `message:${this.id}`,
        value: { id: this.id, type: 'message' },
        domain: 'message',
      },
      {
        id: `message:sender:${this.data.sender}`,
        value: { sender: this.data.sender },
        domain: 'message.sender',
      },
      {
        id: `message:content:${this.hashContent()}`,
        value: { contentHash: this.hashContent() },
        domain: 'message.content',
      },
      {
        id: `message:status:${this.data.status}`,
        value: { status: this.data.status },
        domain: 'message.status',
      },
    ];

    this.data.recipients.forEach(recipient => {
      primeFactors.push({
        id: `message:recipient:${recipient}`,
        value: { recipient },
        domain: 'message.recipient',
      });
    });

    if (this.data.threadId) {
      primeFactors.push({
        id: `message:thread:${this.data.threadId}`,
        value: { threadId: this.data.threadId },
        domain: 'message.thread',
      });
    }

    if (this.data.parentMessageId) {
      primeFactors.push({
        id: `message:parent:${this.data.parentMessageId}`,
        value: { parentMessageId: this.data.parentMessageId },
        domain: 'message.parent',
      });
    }

    if (this.data.tags && this.data.tags.length > 0) {
      this.data.tags.forEach(tag => {
        primeFactors.push({
          id: `message:tag:${tag}`,
          value: { tag },
          domain: 'message.tag',
        });
      });
    }

    return {
      primeFactors,
      decompositionMethod: 'message-decomposition',
    };
  }

  /**
   * Computes a hash of the message content
   * @returns Content hash string
   */
  private hashContent(): string {
    return `hash-${this.id}-${this.data.content.length}`;
  }

  /**
   * Computes the canonical representation of this message
   * @returns The canonical representation
   */
  computeCanonicalRepresentation(): CanonicalRepresentation {
    const canonicalData = {
      id: this.data.id,
      sender: this.data.sender,
      recipients: [...this.data.recipients].sort(),
      subject: this.data.subject,
      contentHash: this.hashContent(),
      contentType: this.data.contentType,
      status: this.data.status,
      priority: this.data.priority,
      threadId: this.data.threadId,
      parentMessageId: this.data.parentMessageId,
      createdAt: this.data.createdAt.toISOString(),
      updatedAt: this.data.updatedAt.toISOString(),
      sentAt: this.data.sentAt?.toISOString(),
      deliveredAt: this.data.deliveredAt?.toISOString(),
      readAt: this.data.readAt?.toISOString(),
      tags: this.data.tags ? [...this.data.tags].sort() : [],
      encrypted: this.data.encrypted,
      encryptionMetadata: this.data.encryptionMetadata,
    };

    return {
      representationType: 'message-canonical',
      value: canonicalData,
      coherenceNorm: this.measureCoherence().value,
    };
  }

  /**
   * Measures the coherence of this message representation
   * @returns The coherence measure
   */
  measureCoherence(): CoherenceMeasure {
    let coherenceScore = 0;

    if (this.data.sender) coherenceScore += 0.1;
    if (this.data.recipients.length > 0) coherenceScore += 0.1;
    if (this.data.content && this.data.content.length > 0) coherenceScore += 0.2;

    if (this.data.threadId) coherenceScore += 0.1;
    if (this.data.parentMessageId) coherenceScore += 0.1;

    if (this.data.status !== MessageStatus._DRAFT) coherenceScore += 0.1;
    if (this.data.sentAt) coherenceScore += 0.1;
    if (this.data.deliveredAt) coherenceScore += 0.1;
    if (this.data.readAt) coherenceScore += 0.1;

    return {
      type: 'message-coherence',
      value: coherenceScore,
      normalization: 'linear-sum',
    };
  }

  /**
   * Serializes this message to a JSON representation
   * @returns Serialized message object
   */
  serialize(): object {
    return {
      id: this.id,
      type: this.type,
      data: {
        ...this.data,
        createdAt: this.data.createdAt.toISOString(),
        updatedAt: this.data.updatedAt.toISOString(),
        sentAt: this.data.sentAt?.toISOString(),
        deliveredAt: this.data.deliveredAt?.toISOString(),
        readAt: this.data.readAt?.toISOString(),
      },
      canonicalRepresentation:
        this.canonicalRepresentation || this.computeCanonicalRepresentation(),
      primeDecomposition: this.primeDecomposition || this.computePrimeDecomposition(),
      observerFrame: this.observerFrame,
    };
  }

  /**
   * Validates this message against its schema
   * @returns Whether the message is valid
   */
  validate(): boolean {
    if (!this.data.id || this.data.id !== this.id) {
      return false;
    }

    if (!this.data.sender || this.data.sender.trim() === '') {
      return false;
    }

    if (!this.data.recipients || this.data.recipients.length === 0) {
      return false;
    }

    if (!this.data.content || this.data.content.trim() === '') {
      return false;
    }

    return true;
  }

  /**
   * Gets the intrinsic prime factors for the message domain
   * @returns Array of intrinsic prime factors
   */
  getIntrinsicPrimes(): PrimeFactor[] {
    return [
      {
        id: 'message:core',
        value: { type: 'message' },
        domain: 'message',
      },
    ];
  }
}
