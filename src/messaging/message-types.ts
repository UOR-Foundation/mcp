/**
 * UOR Message Type Definitions
 * Defines the structure of message objects in the UOR system
 */

import { UORObject } from '../core/uor-core';

/**
 * Message status enum
 */
export enum MessageStatus {
  _DRAFT = 'draft',
  _SENT = 'sent',
  _DELIVERED = 'delivered',
  _READ = 'read',
  _FAILED = 'failed',
}

/**
 * Message priority enum
 */
export enum MessagePriority {
  _LOW = 'low',
  _NORMAL = 'normal',
  _HIGH = 'high',
  _URGENT = 'urgent',
}

/**
 * Base message interface with common properties
 */
export interface MessageBase {
  id: string;
  sender: string; // UOR reference to sender identity
  recipients: string[]; // UOR references to recipient identities
  subject?: string;
  content: string;
  contentType: string; // MIME type of content
  status: MessageStatus;
  priority: MessagePriority;
  threadId?: string; // UOR reference to thread
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
  messageIds: string[]; // UOR references to messages in thread
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // UOR reference to creator identity
  tags?: string[];
}

/**
 * Subscription interface for message subscriptions
 */
export interface MessageSubscription {
  id: string;
  subscriber: string; // UOR reference to subscriber identity
  criteria: {
    senders?: string[]; // UOR references to sender identities
    topics?: string[]; // Topics to subscribe to
    pattern?: string; // Pattern matching for messages
    [key: string]: any;
  };
  notificationPreferences: {
    enabled: boolean;
    method: string; // Notification method (e.g., 'email', 'in-app')
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
  updateMessage(_message: Partial<MessageBase>): void;
  setStatus(_status: MessageStatus): void;
  addTag(_tag: string): void;
  removeTag(_tag: string): void;
  encrypt(_algorithm: string, _keyId?: string): void;
  decrypt(): string;
}

/**
 * Thread UOR object interface
 */
export interface ThreadUORObject extends UORObject {
  getThreadData(): MessageThread;
  updateThread(_thread: Partial<MessageThread>): void;
  addMessage(_messageId: string): void;
  removeMessage(_messageId: string): void;
  addParticipant(_participantId: string): void;
  removeParticipant(_participantId: string): void;
  addTag(_tag: string): void;
  removeTag(_tag: string): void;
}

/**
 * Subscription UOR object interface
 */
export interface SubscriptionUORObject extends UORObject {
  getSubscriptionData(): MessageSubscription;
  updateSubscription(_subscription: Partial<MessageSubscription>): void;
  updateNotificationPreferences(
    _preferences: Partial<MessageSubscription['notificationPreferences']>
  ): void;
  updateCriteria(_criteria: Partial<MessageSubscription['criteria']>): void;
}
