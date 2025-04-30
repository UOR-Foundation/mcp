/**
 * UOR Publish/Subscribe System Type Definitions
 * Defines types for events, channels, and subscriptions in the UOR system
 */

import { UORObject } from '../core/uor-core';

/**
 * Event priority levels
 */
export enum EventPriority {
  _LOW = 'low',
  _NORMAL = 'normal',
  _HIGH = 'high',
  _CRITICAL = 'critical',
}

/**
 * Event delivery status
 */
export enum EventDeliveryStatus {
  _PENDING = 'pending',
  _DELIVERED = 'delivered',
  _FAILED = 'failed',
  _RETRYING = 'retrying',
}

/**
 * Channel visibility
 */
export enum ChannelVisibility {
  _PUBLIC = 'public',
  _PRIVATE = 'private',
  _PROTECTED = 'protected',
}

/**
 * Base event interface
 */
export interface EventBase {
  id: string;
  type: string;
  publisher: string;
  timestamp: Date;
  priority: EventPriority;
  metadata: Record<string, any>;
  payload: any;
  channelId: string;
}

/**
 * Event delivery record
 */
export interface EventDelivery {
  eventId: string;
  subscriberId: string;
  status: EventDeliveryStatus;
  attempts: number;
  lastAttempt: Date | null;
  deliveredAt: Date | null;
  error?: string;
}

/**
 * Publication channel interface
 */
export interface Channel {
  id: string;
  name: string;
  description: string;
  namespace: string;
  contentType: string;
  visibility: ChannelVisibility;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tags: string[];
  metadata: Record<string, any>;
}

/**
 * Channel subscription interface
 */
export interface ChannelSubscription {
  id: string;
  channelId: string;
  subscriber: string;
  criteria: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
  notificationPreferences: {
    enabled: boolean;
    method: string;
  };
}

/**
 * Event UOR object interface
 */
export interface EventUORObject extends UORObject {
  getEventData(): EventBase;
  updateEvent(_event: Partial<EventBase>): void;
  addMetadata(_key: string, _value: any): void;
  removeMetadata(_key: string): void;
  setPayload(_payload: any): void;
  setPriority(_priority: EventPriority): void;
}

/**
 * Channel UOR object interface
 */
export interface ChannelUORObject extends UORObject {
  getChannelData(): Channel;
  updateChannel(_channel: Partial<Channel>): void;
  addTag(_tag: string): void;
  removeTag(_tag: string): void;
  setVisibility(_visibility: ChannelVisibility): void;
  addMetadata(_key: string, _value: any): void;
  removeMetadata(_key: string): void;
}

/**
 * Channel subscription UOR object interface
 */
export interface SubscriptionUORObject extends UORObject {
  getSubscriptionData(): ChannelSubscription;
  updateSubscription(_subscription: Partial<ChannelSubscription>): void;
  updateCriteria(_criteria: Partial<Record<string, any>>): void;
  updateNotificationPreferences(
    _preferences: Partial<ChannelSubscription['notificationPreferences']>
  ): void;
  setActive(_active: boolean): void;
}

/**
 * Event delivery record interface
 */
export interface DeliveryRecord {
  eventId: string;
  subscriberId: string;
  status: EventDeliveryStatus;
  attempts: number;
  maxAttempts: number;
  lastAttempt: Date | null;
  deliveredAt: Date | null;
  error?: string;
  nextAttempt?: Date;
}
