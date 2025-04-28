import { UORObject } from '../core/uor-core';
import { GitHubClient } from '../github/github-client';
import { UORDBManager } from '../github/uordb-manager';
import PubSubManager from '../pubsub/pubsub-manager';
import { EventBase, EventPriority, Channel, ChannelVisibility, ChannelSubscription } from '../pubsub/event-types';
import { EventObject } from '../pubsub/event';
import { ChannelObject } from '../pubsub/channel';
import { ChannelSubscriptionObject } from '../pubsub/subscription';

// Custom interface for stored UOR objects
interface StoredUORObject {
  type: string;
  data: any;
  reference: string;
}

// Client-side compatible MCP server implementation
export class MCPServer {
  private static instance: MCPServer;
  private uordbManager: UORDBManager | null = null;
  private currentUser: { username: string, token: string } | null = null;
  private pubSubManager: typeof PubSubManager;

  private constructor() {
    // Initialize pubsub manager
    this.pubSubManager = PubSubManager;
  }

  public static getInstance(): MCPServer {
    if (!MCPServer.instance) {
      MCPServer.instance = new MCPServer();
    }
    return MCPServer.instance;
  }

  public setAuthentication(username: string, token: string): void {
    this.currentUser = { username, token };
    
    // Initialize GitHub client and UORdb manager
    const githubClient = new GitHubClient({ token });
    this.uordbManager = new UORDBManager(githubClient);
  }

  public clearAuthentication(): void {
    this.currentUser = null;
    this.uordbManager = null;
  }

  public isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  public getCurrentUsername(): string | null {
    return this.currentUser?.username || null;
  }

  public async initializeRepository(): Promise<void> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }

    await this.uordbManager.initialize(this.currentUser.username);
  }

  public async getRepositoryStatus(): Promise<any> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }

    try {
      return await this.uordbManager.getRepositoryStatus(this.currentUser.username);
    } catch (error) {
      // Check if repository exists before throwing error
      const exists = await this.checkRepositoryExists();
      if (!exists) {
        throw new Error('Repository does not exist. Please initialize it first.');
      }
      throw error;
    }
  }
  
  /**
   * Check if the repository exists for the current user
   * @returns Whether repository exists
   */
  public async checkRepositoryExists(): Promise<boolean> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }
    
    try {
      const accessStatus = await (this.uordbManager as any).repositoryService.checkRepositoryAccess(
        this.currentUser.username
      );
      return accessStatus.exists;
    } catch (error) {
      console.error('Error checking repository existence:', error);
      return false;
    }
  }

  public async handleRequest(method: string, params: any): Promise<any> {
    switch (method) {
      case 'uor.resolve':
        return this.resolveUOR(params.reference);
      case 'uor.create':
        return this.createUOR(params.type, params.data);
      case 'uor.update':
        return this.updateUOR(params.reference, params.data);
      case 'uor.delete':
        return this.deleteUOR(params.reference);
      case 'uordb.list':
        return this.listUORObjects(params.type);
      case 'uordb.search':
        return this.searchUORObjects(params.query);
      case 'uordb.status':
        return this.getRepositoryStatus();
      case 'uordb.initialize':
        return this.initializeRepository();
      case 'pubsub.createEvent':
        return this.createEvent(params.data, params.id);
      case 'pubsub.createChannel':
        return this.createChannel(params.data, params.id);
      case 'pubsub.createSubscription':
        return this.createSubscription(params.data, params.id);
      case 'pubsub.updateEvent':
        return this.updateEvent(params.reference, params.data);
      case 'pubsub.updateChannel':
        return this.updateChannel(params.reference, params.data);
      case 'pubsub.updateSubscription':
        return this.updateSubscription(params.reference, params.data);
      case 'pubsub.publishEvent':
        return this.publishEvent(params.eventReference, params.channelReference);
      case 'pubsub.propagateEvent':
        return this.propagateEvent(params.eventReference, params.targetNamespaces);
      case 'setAuthentication':
        this.setAuthentication(params.username, params.token);
        return true;
      case 'clearAuthentication':
        this.clearAuthentication();
        return true;
      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }

  private async resolveUOR(reference: string): Promise<StoredUORObject | null> {
    // Try to resolve from GitHub repository if authenticated
    if (this.uordbManager && this.currentUser) {
      // Extract type and ID from the reference
      const parts = reference.split('/');
      const type = parts[2]; // Assuming format uor://type/id
      const id = parts.slice(3).join('/');
      
      const object = await this.uordbManager.getObject(this.currentUser.username, type, id);
      
      if (object) {
        return {
          type: object.type,
          data: object,
          reference: reference
        };
      }
    }
    
    // Fallback to local storage for offline or non-GitHub authenticated mode
    const storedData = localStorage.getItem(`uor:${reference}`);
    
    if (!storedData) {
      return null;
    }

    try {
      return JSON.parse(storedData) as StoredUORObject;
    } catch (error) {
      console.error('Error parsing stored UOR:', error);
      return null;
    }
  }

  private async createUOR(type: string, data: any): Promise<string> {
    // Generate a reference 
    const reference = `uor://${type}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Create UOR object
    const uorObject = {
      id: reference,
      type: type,
      ...data
    };
    
    // Store in GitHub if authenticated
    if (this.uordbManager && this.currentUser) {
      await this.uordbManager.storeObject(this.currentUser.username, uorObject);
    } else {
      // Fallback to localStorage for offline mode
      localStorage.setItem(`uor:${reference}`, JSON.stringify({
        type,
        data: uorObject,
        reference
      }));
    }

    return reference;
  }

  private async updateUOR(reference: string, data: any): Promise<boolean> {
    if (this.uordbManager && this.currentUser) {
      // Extract type and ID from the reference
      const parts = reference.split('/');
      const type = parts[2]; // Assuming format uor://type/id
      const id = parts.slice(3).join('/');
      
      // Get existing object
      const existingObject = await this.uordbManager.getObject(this.currentUser.username, type, id);
      
      if (existingObject) {
        // Update the object
        const updatedObject = {
          ...existingObject,
          ...data,
          id: reference,
          type: type
        };
        
        await this.uordbManager.storeObject(this.currentUser.username, updatedObject);
        return true;
      }
    }
    
    // Fallback to localStorage
    const existingData = localStorage.getItem(`uor:${reference}`);
    
    if (!existingData) {
      return false;
    }

    try {
      const uorObject = JSON.parse(existingData) as StoredUORObject;
      uorObject.data = { ...uorObject.data, ...data };
      
      localStorage.setItem(`uor:${reference}`, JSON.stringify(uorObject));
      return true;
    } catch (error) {
      console.error('Error updating UOR:', error);
      return false;
    }
  }

  private async deleteUOR(reference: string): Promise<boolean> {
    if (this.uordbManager && this.currentUser) {
      // Extract type and ID from the reference
      const parts = reference.split('/');
      const type = parts[2]; // Assuming format uor://type/id
      const id = parts.slice(3).join('/');
      
      try {
        await this.uordbManager.deleteObject(this.currentUser.username, type, id);
        return true;
      } catch (error) {
        console.error('Error deleting UOR from GitHub:', error);
        // Fall back to local storage deletion if GitHub deletion fails
      }
    }
    
    // Fallback or complementary localStorage removal
    const existingData = localStorage.getItem(`uor:${reference}`);
    
    if (!existingData) {
      return false;
    }

    localStorage.removeItem(`uor:${reference}`);
    return true;
  }

  private async listUORObjects(type: string): Promise<any[]> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }

    return await this.uordbManager.listObjects(this.currentUser.username, type);
  }

  private async searchUORObjects(query: string): Promise<any[]> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }

    return await this.uordbManager.searchObjects(this.currentUser.username, query);
  }

  /**
   * Creates a new event
   * @param id Unique event ID (optional, generated if not provided)
   * @param data Event data
   * @returns The UOR reference to the created event
   */
  private async createEvent(data: Partial<EventBase>, id?: string): Promise<string> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }
    
    // Generate ID if not provided
    const eventId = id || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    if (!data.publisher) {
      data.publisher = `uor://identity/${this.currentUser.username}`;
    }
    
    // Create event object
    const event = this.pubSubManager.createEvent(eventId, data);
    
    // Store in repository
    await this.uordbManager.storeObject(this.currentUser.username, event);
    
    return `uor://event/${eventId}`;
  }
  
  /**
   * Creates a new channel
   * @param id Unique channel ID (optional, generated if not provided)
   * @param data Channel data
   * @returns The UOR reference to the created channel
   */
  private async createChannel(data: Partial<Channel>, id?: string): Promise<string> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }
    
    // Generate ID if not provided
    const channelId = id || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    if (!data.createdBy) {
      data.createdBy = `uor://identity/${this.currentUser.username}`;
    }
    
    if (!data.namespace) {
      data.namespace = this.currentUser.username;
    }
    
    // Create channel object
    const channel = this.pubSubManager.createChannel(channelId, data);
    
    // Store in repository
    await this.uordbManager.storeObject(this.currentUser.username, channel);
    
    return `uor://channel/${channelId}`;
  }
  
  /**
   * Creates a new subscription
   * @param id Unique subscription ID (optional, generated if not provided)
   * @param data Subscription data
   * @returns The UOR reference to the created subscription
   */
  private async createSubscription(data: Partial<ChannelSubscription>, id?: string): Promise<string> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }
    
    // Generate ID if not provided
    const subscriptionId = id || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    if (!data.subscriber) {
      data.subscriber = `uor://identity/${this.currentUser.username}`;
    }
    
    // Create subscription object
    const subscription = this.pubSubManager.createSubscription(subscriptionId, data);
    
    // Store in repository
    await this.uordbManager.storeObject(this.currentUser.username, subscription);
    
    return `uor://subscription/${subscriptionId}`;
  }
  
  /**
   * Updates an existing event
   * @param reference UOR reference to the event
   * @param data Updated event data
   * @returns Whether the update was successful
   */
  private async updateEvent(reference: string, data: Partial<EventBase>): Promise<boolean> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }
    
    // Extract ID from the reference
    const parts = reference.split('/');
    const type = parts[2]; // Assuming format uor://type/id
    const id = parts.slice(3).join('/');
    
    if (type !== 'event') {
      throw new Error(`Not an event object: ${reference}`);
    }
    
    // Get existing object
    const existingObject = await this.uordbManager.getObject(this.currentUser.username, type, id);
    
    if (!existingObject) {
      throw new Error(`Event not found: ${reference}`);
    }
    
    // Update the event
    const updatedObject = this.pubSubManager.updateEvent(existingObject as EventObject, data);
    
    // Store in repository
    await this.uordbManager.storeObject(this.currentUser.username, updatedObject);
    
    return true;
  }
  
  /**
   * Updates an existing channel
   * @param reference UOR reference to the channel
   * @param data Updated channel data
   * @returns Whether the update was successful
   */
  private async updateChannel(reference: string, data: Partial<Channel>): Promise<boolean> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }
    
    // Extract ID from the reference
    const parts = reference.split('/');
    const type = parts[2]; // Assuming format uor://type/id
    const id = parts.slice(3).join('/');
    
    if (type !== 'channel') {
      throw new Error(`Not a channel object: ${reference}`);
    }
    
    // Get existing object
    const existingObject = await this.uordbManager.getObject(this.currentUser.username, type, id);
    
    if (!existingObject) {
      throw new Error(`Channel not found: ${reference}`);
    }
    
    // Update the channel
    const updatedObject = this.pubSubManager.updateChannel(existingObject as ChannelObject, data);
    
    // Store in repository
    await this.uordbManager.storeObject(this.currentUser.username, updatedObject);
    
    return true;
  }
  
  /**
   * Updates an existing subscription
   * @param reference UOR reference to the subscription
   * @param data Updated subscription data
   * @returns Whether the update was successful
   */
  private async updateSubscription(reference: string, data: Partial<ChannelSubscription>): Promise<boolean> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }
    
    // Extract ID from the reference
    const parts = reference.split('/');
    const type = parts[2]; // Assuming format uor://type/id
    const id = parts.slice(3).join('/');
    
    if (type !== 'subscription') {
      throw new Error(`Not a subscription object: ${reference}`);
    }
    
    // Get existing object
    const existingObject = await this.uordbManager.getObject(this.currentUser.username, type, id);
    
    if (!existingObject) {
      throw new Error(`Subscription not found: ${reference}`);
    }
    
    // Update the subscription
    const updatedObject = this.pubSubManager.updateSubscription(existingObject as ChannelSubscriptionObject, data);
    
    // Store in repository
    await this.uordbManager.storeObject(this.currentUser.username, updatedObject);
    
    return true;
  }
  
  /**
   * Publishes an event to a channel
   * @param eventReference UOR reference to the event
   * @param channelReference UOR reference to the channel
   * @returns Whether the publication was successful
   */
  private async publishEvent(eventReference: string, channelReference: string): Promise<boolean> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }
    
    // Extract event ID from the reference
    const eventParts = eventReference.split('/');
    const eventType = eventParts[2]; // Assuming format uor://type/id
    const eventId = eventParts.slice(3).join('/');
    
    if (eventType !== 'event') {
      throw new Error(`Not an event object: ${eventReference}`);
    }
    
    // Extract channel ID from the reference
    const channelParts = channelReference.split('/');
    const channelType = channelParts[2]; // Assuming format uor://type/id
    const channelId = channelParts.slice(3).join('/');
    
    if (channelType !== 'channel') {
      throw new Error(`Not a channel object: ${channelReference}`);
    }
    
    // Get existing event
    const existingEvent = await this.uordbManager.getObject(this.currentUser.username, eventType, eventId);
    
    if (!existingEvent) {
      throw new Error(`Event not found: ${eventReference}`);
    }
    
    // Get existing channel
    const existingChannel = await this.uordbManager.getObject(this.currentUser.username, channelType, channelId);
    
    if (!existingChannel) {
      throw new Error(`Channel not found: ${channelReference}`);
    }
    
    const subscriptions = await this.uordbManager.listObjects(this.currentUser.username, 'subscription');
    const channelSubscriptions = subscriptions
      .filter(sub => sub.type === 'channel-subscription')
      .map(sub => new ChannelSubscriptionObject(sub.id, sub.data));
    
    const matchingSubscribers = this.pubSubManager.getMatchingSubscribers(
      existingChannel as ChannelObject,
      channelSubscriptions
    );
    
    await this.pubSubManager.publishEvent(
      existingEvent as EventObject,
      existingChannel as ChannelObject,
      matchingSubscribers
    );
    
    return true;
  }
  
  /**
   * Propagates an event across namespaces
   * @param eventReference UOR reference to the event
   * @param targetNamespaces Target namespaces to propagate to
   * @returns Whether the propagation was successful
   */
  private async propagateEvent(eventReference: string, targetNamespaces: string[]): Promise<boolean> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }
    
    // Extract event ID from the reference
    const eventParts = eventReference.split('/');
    const eventType = eventParts[2]; // Assuming format uor://type/id
    const eventId = eventParts.slice(3).join('/');
    
    if (eventType !== 'event') {
      throw new Error(`Not an event object: ${eventReference}`);
    }
    
    // Get existing event
    const existingEvent = await this.uordbManager.getObject(this.currentUser.username, eventType, eventId);
    
    if (!existingEvent) {
      throw new Error(`Event not found: ${eventReference}`);
    }
    
    await this.pubSubManager.propagateEventAcrossNamespaces(
      existingEvent as EventObject,
      this.currentUser.username,
      targetNamespaces
    );
    
    return true;
  }
}

export default MCPServer.getInstance();
