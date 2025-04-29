/**
 * UOR Publish/Subscribe Manager
 * Manages the publish/subscribe system in the UOR framework
 */

import { UORObject } from '../core/uor-core';
import { NamespaceResolver } from '../resolvers/namespace-resolver';
import { EventBase, EventPriority, EventDeliveryStatus, Channel, ChannelVisibility, ChannelSubscription, DeliveryRecord } from './event-types';
import { EventObject } from './event';
import { ChannelObject } from './channel';
import { ChannelSubscriptionObject } from './subscription';

/**
 * PubSub Manager class
 * Singleton that manages the publish/subscribe system
 */
export class PubSubManager {
  private static instance: PubSubManager;
  private deliveryQueue: Map<string, DeliveryRecord[]> = new Map();
  private namespaceResolver: NamespaceResolver;
  private deliveryInProgress: boolean = false;
  
  /**
   * Gets the singleton instance
   * @returns The pubsub manager instance
   */
  public static getInstance(): PubSubManager {
    if (!PubSubManager.instance) {
      PubSubManager.instance = new PubSubManager();
    }
    return PubSubManager.instance;
  }
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.namespaceResolver = new NamespaceResolver();
    
    setInterval(() => this.processDeliveryQueue(), 5000);
  }
  
  /**
   * Creates a new event
   * @param id Unique event ID
   * @param data Event data
   * @returns The created event object
   */
  createEvent(id: string, data: Partial<EventBase>): EventObject {
    const event = new EventObject(id, data);
    event.setCanonicalRepresentation(event.computeCanonicalRepresentation());
    event.setPrimeDecomposition(event.computePrimeDecomposition());
    return event;
  }
  
  /**
   * Updates an existing event
   * @param event Event object to update
   * @param data Updated event data
   * @returns The updated event object
   */
  updateEvent(event: EventObject, data: Partial<EventBase>): EventObject {
    event.updateEvent(data);
    event.setCanonicalRepresentation(event.computeCanonicalRepresentation());
    event.setPrimeDecomposition(event.computePrimeDecomposition());
    return event;
  }
  
  /**
   * Creates a new channel
   * @param id Unique channel ID
   * @param data Channel data
   * @returns The created channel object
   */
  createChannel(id: string, data: Partial<Channel>): ChannelObject {
    const channel = new ChannelObject(id, data);
    channel.setCanonicalRepresentation(channel.computeCanonicalRepresentation());
    channel.setPrimeDecomposition(channel.computePrimeDecomposition());
    return channel;
  }
  
  /**
   * Updates an existing channel
   * @param channel Channel object to update
   * @param data Updated channel data
   * @returns The updated channel object
   */
  updateChannel(channel: ChannelObject, data: Partial<Channel>): ChannelObject {
    channel.updateChannel(data);
    channel.setCanonicalRepresentation(channel.computeCanonicalRepresentation());
    channel.setPrimeDecomposition(channel.computePrimeDecomposition());
    return channel;
  }
  
  /**
   * Creates a new subscription
   * @param id Unique subscription ID
   * @param data Subscription data
   * @returns The created subscription object
   */
  createSubscription(id: string, data: Partial<ChannelSubscription>): ChannelSubscriptionObject {
    const subscription = new ChannelSubscriptionObject(id, data);
    subscription.setCanonicalRepresentation(subscription.computeCanonicalRepresentation());
    subscription.setPrimeDecomposition(subscription.computePrimeDecomposition());
    return subscription;
  }
  
  /**
   * Updates an existing subscription
   * @param subscription Subscription object to update
   * @param data Updated subscription data
   * @returns The updated subscription object
   */
  updateSubscription(subscription: ChannelSubscriptionObject, data: Partial<ChannelSubscription>): ChannelSubscriptionObject {
    subscription.updateSubscription(data);
    subscription.setCanonicalRepresentation(subscription.computeCanonicalRepresentation());
    subscription.setPrimeDecomposition(subscription.computePrimeDecomposition());
    return subscription;
  }
  
  /**
   * Publishes an event to a channel
   * @param event Event to publish
   * @param channel Channel to publish to
   * @param subscribers List of subscribers to deliver to
   * @returns Promise that resolves when the event is published
   */
  async publishEvent(
    event: EventObject, 
    channel: ChannelObject, 
    subscribers: ChannelSubscriptionObject[]
  ): Promise<void> {
    console.log(`Publishing event ${event.id} to channel ${channel.id} with ${subscribers.length} subscribers`);
    
    const deliveryRecords: DeliveryRecord[] = subscribers.map(subscriber => ({
      eventId: event.id,
      subscriberId: subscriber.getSubscriptionData().subscriber,
      status: EventDeliveryStatus.PENDING,
      attempts: 0,
      maxAttempts: 3,
      lastAttempt: null,
      deliveredAt: null
    }));
    
    this.deliveryQueue.set(event.id, deliveryRecords);
    
    this.processDeliveryQueue();
  }
  
  /**
   * Processes the delivery queue
   * @returns Promise that resolves when processing is complete
   */
  private async processDeliveryQueue(): Promise<void> {
    if (this.deliveryInProgress) {
      return;
    }
    
    this.deliveryInProgress = true;
    
    try {
      for (const [eventId, records] of this.deliveryQueue.entries()) {
        const pendingRecords = records.filter(record => 
          record.status === EventDeliveryStatus.PENDING || 
          record.status === EventDeliveryStatus.RETRYING
        );
        
        if (pendingRecords.length === 0) {
          this.deliveryQueue.delete(eventId);
          continue;
        }
        
        for (const record of pendingRecords) {
          try {
            await this.deliverEvent(record);
          } catch (error) {
            console.error(`Error delivering event ${eventId} to subscriber ${record.subscriberId}:`, error);
            
            record.attempts += 1;
            record.lastAttempt = new Date();
            record.error = (error as Error).message;
            
            if (record.attempts >= record.maxAttempts) {
              record.status = EventDeliveryStatus.FAILED;
            } else {
              record.status = EventDeliveryStatus.RETRYING;
              const delayMinutes = Math.pow(2, record.attempts - 1);
              record.nextAttempt = new Date(Date.now() + delayMinutes * 60 * 1000);
            }
          }
        }
      }
    } finally {
      this.deliveryInProgress = false;
    }
  }
  
  /**
   * Delivers an event to a subscriber
   * @param record Delivery record
   * @returns Promise that resolves when delivery is complete
   */
  private async deliverEvent(record: DeliveryRecord): Promise<void> {
    console.log(`Delivering event ${record.eventId} to subscriber ${record.subscriberId}`);
    
    record.attempts += 1;
    record.lastAttempt = new Date();
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    record.status = EventDeliveryStatus.DELIVERED;
    record.deliveredAt = new Date();
  }
  
  /**
   * Gets matching subscribers for a channel
   * @param channel Channel to get subscribers for
   * @param subscriptions All available subscriptions
   * @returns Array of matching subscribers
   */
  getMatchingSubscribers(
    channel: ChannelObject, 
    subscriptions: ChannelSubscriptionObject[]
  ): ChannelSubscriptionObject[] {
    const channelData = channel.getChannelData();
    
    return subscriptions.filter(subscription => {
      const subscriptionData = subscription.getSubscriptionData();
      
      if (!subscriptionData.active) {
        return false;
      }
      
      if (subscriptionData.channelId !== channelData.id) {
        return false;
      }
      
      if (channelData.visibility === ChannelVisibility.PRIVATE) {
        const subscriberNamespace = this.getNamespaceFromId(subscriptionData.subscriber);
        const channelNamespace = channelData.namespace;
        
        if (subscriberNamespace !== channelNamespace) {
          return false;
        }
      }
      
      return true;
    });
  }
  
  /**
   * Gets the namespace from an ID
   * @param id ID to get namespace from
   * @returns Namespace
   */
  private getNamespaceFromId(id: string): string {
    const parts = id.split('/');
    return parts.length > 1 ? parts[0] : '';
  }
  
  /**
   * Validates an event object
   * @param event Event object to validate
   * @returns Whether the event is valid
   */
  validateEvent(event: UORObject): boolean {
    return event.validate();
  }
  
  /**
   * Validates a channel object
   * @param channel Channel object to validate
   * @returns Whether the channel is valid
   */
  validateChannel(channel: UORObject): boolean {
    return channel.validate();
  }
  
  /**
   * Validates a subscription object
   * @param subscription Subscription object to validate
   * @returns Whether the subscription is valid
   */
  validateSubscription(subscription: UORObject): boolean {
    return subscription.validate();
  }
  
  /**
   * Checks if a subscription matches an event
   * @param subscription Subscription to check
   * @param event Event to check against
   * @returns Whether the subscription matches the event
   */
  subscriptionMatchesEvent(subscription: ChannelSubscriptionObject, event: EventObject): boolean {
    const subscriptionData = subscription.getSubscriptionData();
    const eventData = event.getEventData();
    
    if (subscriptionData.channelId !== eventData.channelId) {
      return false;
    }
    
    const criteria = subscriptionData.criteria;
    
    for (const [key, value] of Object.entries(criteria)) {
      if (key.startsWith('metadata.')) {
        const metadataKey = key.substring('metadata.'.length);
        if (!eventData.metadata || eventData.metadata[metadataKey] !== value) {
          return false;
        }
      }
      else if (key === 'type' && eventData.type !== value) {
        return false;
      }
      else if (key === 'priority' && eventData.priority !== value) {
        return false;
      }
      else if (key === 'publisher' && eventData.publisher !== value) {
        return false;
      }
      else if (key.startsWith('payload.')) {
        const payloadKey = key.substring('payload.'.length);
        if (!eventData.payload || 
            typeof eventData.payload !== 'object' || 
            eventData.payload[payloadKey] !== value) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * Propagates an event across namespaces
   * @param event Event to propagate
   * @param sourceNamespace Source namespace
   * @param targetNamespaces Target namespaces
   * @returns Promise that resolves when propagation is complete
   */
  async propagateEventAcrossNamespaces(
    event: EventObject,
    sourceNamespace: string,
    targetNamespaces: string[]
  ): Promise<void> {
    console.log(`Propagating event ${event.id} from ${sourceNamespace} to ${targetNamespaces.join(', ')}`);
    
    for (const targetNamespace of targetNamespaces) {
      try {
        const resolution = await this.namespaceResolver.resolveAcrossNamespaces(
          `uor://${sourceNamespace}/event/${event.id}`
        );
        
        if (!resolution.resolvedReference || !resolution.path.resolved) {
          console.log(`No resolution path from ${sourceNamespace} to ${targetNamespace}`);
          continue;
        }
        
        const targetEvent = this.createEvent(`${targetNamespace}/${event.id}`, {
          ...event.getEventData(),
          metadata: {
            ...event.getEventData().metadata,
            sourceNamespace,
            sourceEventId: event.id,
            resolutionPath: resolution.path.steps.map((step: {from: string, to: string}) => step.from).join(',')
          }
        });
        
        console.log(`Created target event ${targetEvent.id} in namespace ${targetNamespace}`);
      } catch (error) {
        console.error(`Error propagating event to namespace ${targetNamespace}:`, error);
      }
    }
  }
}

export default PubSubManager.getInstance();
