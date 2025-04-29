/**
 * UOR Message Type Definitions
 * Defines the structure of message objects in the UOR system
 */

import { UORObject } from '../core/uor-core';

/**
 * Message status enum
 */
export enum MessageStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed'
}

/**
 * Message priority enum
 */
export enum MessagePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Base message interface with common properties
 */
export interface MessageBase {
  id: string;
  sender: string;       // UOR reference to sender identity
  recipients: string[]; // UOR references to recipient identities
  subject?: string;
  content: string;
  contentType: string;  // MIME type of content
  status: MessageStatus;
  priority: MessagePriority;
  threadId?: string;    // UOR reference to thread
  parentMessageId?: string; // UOR reference to parent message in thread
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  tags?: string[];
  encrypted: boolean;
  encryptionMetadata?: {
    algorithm: string;
    keyId?: string;
    [key: string]: any;
  };
}

/**
 * Thread interface for managing message threads
 */
export interface MessageThread {
  id: string;
  title: string;
  participants: string[]; // UOR references to participant identities
  messageIds: string[];   // UOR references to messages in thread
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;      // UOR reference to creator identity
  tags?: string[];
}

/**
 * Subscription interface for message subscriptions
 */
export interface MessageSubscription {
  id: string;
  subscriber: string;    // UOR reference to subscriber identity
  criteria: {
    senders?: string[];  // UOR references to sender identities
    topics?: string[];   // Topics to subscribe to
    pattern?: string;    // Pattern matching for messages
    [key: string]: any;
  };
  notificationPreferences: {
    enabled: boolean;
    method: string;      // Notification method (e.g., 'email', 'in-app')
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Message UOR object interface
 */
export interface MessageUORObject extends UORObject {
  getMessageData(): MessageBase;
  updateMessage(message: Partial<MessageBase>): void;
  setStatus(status: MessageStatus): void;
  addTag(tag: string): void;
  removeTag(tag: string): void;
  encrypt(algorithm: string, keyId?: string): void;
  decrypt(): string;
}

/**
 * Thread UOR object interface
 */
export interface ThreadUORObject extends UORObject {
  getThreadData(): MessageThread;
  updateThread(thread: Partial<MessageThread>): void;
  addMessage(messageId: string): void;
  removeMessage(messageId: string): void;
  addParticipant(participantId: string): void;
  removeParticipant(participantId: string): void;
  addTag(tag: string): void;
  removeTag(tag: string): void;
}

/**
 * Subscription UOR object interface
 */
export interface SubscriptionUORObject extends UORObject {
  getSubscriptionData(): MessageSubscription;
  updateSubscription(subscription: Partial<MessageSubscription>): void;
  updateNotificationPreferences(preferences: Partial<MessageSubscription['notificationPreferences']>): void;
  updateCriteria(criteria: Partial<MessageSubscription['criteria']>): void;
}
