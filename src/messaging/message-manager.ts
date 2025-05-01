/**
 * UOR Message Manager
 * Manages message objects in the UOR system
 */

import { UORObject } from '../core/uor-core';
import {
  MessageBase,
  MessageStatus,
  MessagePriority,
  MessageThread,
  MessageSubscription,
} from './message-types';
import { MessageObject } from './message';
import { ThreadObject } from './thread';
import { SubscriptionObject } from './subscription';

/**
 * Message Manager class
 * Singleton that manages message objects
 */
export class MessageManager {
  private static instance: MessageManager;

  /**
   * Gets the singleton instance
   * @returns The message manager instance
   */
  public static getInstance(): MessageManager {
    if (!MessageManager.instance) {
      MessageManager.instance = new MessageManager();
    }
    return MessageManager.instance;
  }

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}

  /**
   * Creates a new message
   * @param id Unique message ID
   * @param data Message data
   * @returns The created message object
   */
  createMessage(id: string, data: Partial<MessageBase>): MessageObject {
    const message = new MessageObject(id, data);
    message.setCanonicalRepresentation(message.computeCanonicalRepresentation());
    message.setPrimeDecomposition(message.computePrimeDecomposition());
    return message;
  }

  /**
   * Updates an existing message
   * @param message Message object to update
   * @param data Updated message data
   * @returns The updated message object
   */
  updateMessage(message: MessageObject, data: Partial<MessageBase>): MessageObject {
    message.updateMessage(data);
    message.setCanonicalRepresentation(message.computeCanonicalRepresentation());
    message.setPrimeDecomposition(message.computePrimeDecomposition());
    return message;
  }

  /**
   * Sets the status of a message
   * @param message Message object
   * @param status New message status
   * @returns The updated message object
   */
  setMessageStatus(message: MessageObject, status: MessageStatus): MessageObject {
    message.setStatus(status);
    message.setCanonicalRepresentation(message.computeCanonicalRepresentation());
    message.setPrimeDecomposition(message.computePrimeDecomposition());
    return message;
  }

  /**
   * Creates a new thread
   * @param id Unique thread ID
   * @param data Thread data
   * @returns The created thread object
   */
  createThread(id: string, data: Partial<MessageThread>): ThreadObject {
    const thread = new ThreadObject(id, data);
    thread.setCanonicalRepresentation(thread.computeCanonicalRepresentation());
    thread.setPrimeDecomposition(thread.computePrimeDecomposition());
    return thread;
  }

  /**
   * Updates an existing thread
   * @param thread Thread object to update
   * @param data Updated thread data
   * @returns The updated thread object
   */
  updateThread(thread: ThreadObject, data: Partial<MessageThread>): ThreadObject {
    thread.updateThread(data);
    thread.setCanonicalRepresentation(thread.computeCanonicalRepresentation());
    thread.setPrimeDecomposition(thread.computePrimeDecomposition());
    return thread;
  }

  /**
   * Adds a message to a thread
   * @param thread Thread object
   * @param messageId Message ID to add
   * @returns The updated thread object
   */
  addMessageToThread(thread: ThreadObject, messageId: string): ThreadObject {
    thread.addMessage(messageId);
    thread.setCanonicalRepresentation(thread.computeCanonicalRepresentation());
    thread.setPrimeDecomposition(thread.computePrimeDecomposition());
    return thread;
  }

  /**
   * Adds a participant to a thread
   * @param thread Thread object
   * @param participantId Participant ID to add
   * @returns The updated thread object
   */
  addParticipantToThread(thread: ThreadObject, participantId: string): ThreadObject {
    thread.addParticipant(participantId);
    thread.setCanonicalRepresentation(thread.computeCanonicalRepresentation());
    thread.setPrimeDecomposition(thread.computePrimeDecomposition());
    return thread;
  }

  /**
   * Creates a new subscription
   * @param id Unique subscription ID
   * @param data Subscription data
   * @returns The created subscription object
   */
  createSubscription(id: string, data: Partial<MessageSubscription>): SubscriptionObject {
    const subscription = new SubscriptionObject(id, data);
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
  updateSubscription(
    subscription: SubscriptionObject,
    data: Partial<MessageSubscription>
  ): SubscriptionObject {
    subscription.updateSubscription(data);
    subscription.setCanonicalRepresentation(subscription.computeCanonicalRepresentation());
    subscription.setPrimeDecomposition(subscription.computePrimeDecomposition());
    return subscription;
  }

  /**
   * Updates subscription notification preferences
   * @param subscription Subscription object
   * @param preferences Updated notification preferences
   * @returns The updated subscription object
   */
  updateNotificationPreferences(
    subscription: SubscriptionObject,
    preferences: Partial<MessageSubscription['notificationPreferences']>
  ): SubscriptionObject {
    subscription.updateNotificationPreferences(preferences);
    subscription.setCanonicalRepresentation(subscription.computeCanonicalRepresentation());
    subscription.setPrimeDecomposition(subscription.computePrimeDecomposition());
    return subscription;
  }

  /**
   * Publishes a message to recipients
   * @param message Message to publish
   * @returns Promise that resolves when the message is published
   */
  async publishMessage(message: MessageObject): Promise<void> {
    message.setStatus(MessageStatus._SENT);
    message.setCanonicalRepresentation(message.computeCanonicalRepresentation());
    message.setPrimeDecomposition(message.computePrimeDecomposition());

    console.log(
      `Message ${message.id} published to ${message.getMessageData().recipients.length} recipients`
    );
  }

  /**
   * Delivers a message to a recipient
   * @param message Message to deliver
   * @param recipientId Recipient ID
   * @returns Promise that resolves when the message is delivered
   */
  async deliverMessage(message: MessageObject, recipientId: string): Promise<void> {
    message.setStatus(MessageStatus._DELIVERED);
    message.setCanonicalRepresentation(message.computeCanonicalRepresentation());
    message.setPrimeDecomposition(message.computePrimeDecomposition());

    console.log(`Message ${message.id} delivered to recipient ${recipientId}`);
  }

  /**
   * Marks a message as read
   * @param message Message to mark as read
   * @returns The updated message object
   */
  markMessageAsRead(message: MessageObject): MessageObject {
    message.setStatus(MessageStatus._READ);
    message.setCanonicalRepresentation(message.computeCanonicalRepresentation());
    message.setPrimeDecomposition(message.computePrimeDecomposition());
    return message;
  }

  /**
   * Validates a message object
   * @param message Message object to validate
   * @returns Whether the message is valid
   */
  validateMessage(message: UORObject): boolean {
    return message.validate();
  }

  /**
   * Validates a thread object
   * @param thread Thread object to validate
   * @returns Whether the thread is valid
   */
  validateThread(thread: UORObject): boolean {
    return thread.validate();
  }

  /**
   * Validates a subscription object
   * @param subscription Subscription object to validate
   * @returns Whether the subscription is valid
   */
  validateSubscription(subscription: UORObject): boolean {
    return subscription.validate();
  }
}

export default MessageManager.getInstance();
