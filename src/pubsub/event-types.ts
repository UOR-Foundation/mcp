/**
 * UOR Publish/Subscribe System Type Definitions
 * Defines types for events, channels, and subscriptions in the UOR system
 */

import { UORObject } from '../core/uor-core';

/**
 * Event priority levels
 */
export enum EventPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Event delivery status
 */
export enum EventDeliveryStatus {
  PENDING = 'pending',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETRYING = 'retrying'
}

/**
 * Channel visibility
 */
export enum ChannelVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  PROTECTED = 'protected'
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
  updateEvent(event: Partial<EventBase>): void;
  addMetadata(key: string, value: any): void;
  removeMetadata(key: string): void;
  setPayload(payload: any): void;
  setPriority(priority: EventPriority): void;
}

/**
 * Channel UOR object interface
 */
export interface ChannelUORObject extends UORObject {
  getChannelData(): Channel;
  updateChannel(channel: Partial<Channel>): void;
  addTag(tag: string): void;
  removeTag(tag: string): void;
  setVisibility(visibility: ChannelVisibility): void;
  addMetadata(key: string, value: any): void;
  removeMetadata(key: string): void;
}

/**
 * Channel subscription UOR object interface
 */
export interface SubscriptionUORObject extends UORObject {
  getSubscriptionData(): ChannelSubscription;
  updateSubscription(subscription: Partial<ChannelSubscription>): void;
  updateCriteria(criteria: Partial<Record<string, any>>): void;
  updateNotificationPreferences(preferences: Partial<ChannelSubscription['notificationPreferences']>): void;
  setActive(active: boolean): void;
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
