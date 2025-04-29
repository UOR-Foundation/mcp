/**
 * UOR Channel Subscription Implementation
 * Implements subscription objects in the UOR system
 */

import {
  UORObject,
  CanonicalRepresentation,
  PrimeDecomposition,
  ObserverFrame,
  CoherenceMeasure,
  PrimeFactor,
} from '../core/uor-core';
import { ChannelSubscription, SubscriptionUORObject } from './event-types';

/**
 * Implementation of UOR Channel Subscription Object
 */
export class ChannelSubscriptionObject extends UORObject implements SubscriptionUORObject {
  private data: ChannelSubscription;

  /**
   * Creates a new channel subscription object
   * @param id Unique subscription ID
   * @param data Initial subscription data
   */
  constructor(id: string, data: Partial<ChannelSubscription>) {
    super(id, 'channel-subscription');

    this.data = {
      id: id,
      channelId: data.channelId || '',
      subscriber: data.subscriber || '',
      criteria: data.criteria || {},
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
      active: data.active !== undefined ? data.active : true,
      notificationPreferences: data.notificationPreferences || {
        enabled: true,
        method: 'in-app',
      },
      ...data,
    };
  }

  /**
   * Gets the complete subscription data
   * @returns The subscription data
   */
  getSubscriptionData(): ChannelSubscription {
    return { ...this.data };
  }

  /**
   * Updates subscription information
   * @param subscription Updated subscription data
   */
  updateSubscription(subscription: Partial<ChannelSubscription>): void {
    this.data = {
      ...this.data,
      ...subscription,
      updatedAt: new Date(),
    };
  }

  /**
   * Updates subscription criteria
   * @param criteria Updated criteria
   */
  updateCriteria(criteria: Partial<Record<string, any>>): void {
    this.data.criteria = {
      ...this.data.criteria,
      ...criteria,
    };
    this.data.updatedAt = new Date();
  }

  /**
   * Updates notification preferences
   * @param preferences Updated notification preferences
   */
  updateNotificationPreferences(
    preferences: Partial<ChannelSubscription['notificationPreferences']>
  ): void {
    this.data.notificationPreferences = {
      ...this.data.notificationPreferences,
      ...preferences,
    };
    this.data.updatedAt = new Date();
  }

  /**
   * Sets the active state of the subscription
   * @param active Whether the subscription is active
   */
  setActive(active: boolean): void {
    this.data.active = active;
    this.data.updatedAt = new Date();
  }

  /**
   * Transforms this subscription to a different observer frame
   * @param newFrame The new observer frame
   * @returns A new subscription object in the new frame
   */
  transformToFrame(newFrame: ObserverFrame): UORObject {
    const newSubscription = new ChannelSubscriptionObject(this.id, this.data);
    newSubscription.setObserverFrame(newFrame);
    return newSubscription;
  }

  /**
   * Computes the prime decomposition of this subscription
   * @returns The prime decomposition
   */
  computePrimeDecomposition(): PrimeDecomposition {
    const primeFactors: PrimeFactor[] = [
      {
        id: `subscription:${this.id}`,
        value: { id: this.id, type: 'channel-subscription' },
        domain: 'subscription',
      },
      {
        id: `subscription:channel:${this.data.channelId}`,
        value: { channelId: this.data.channelId },
        domain: 'subscription.channel',
      },
      {
        id: `subscription:subscriber:${this.data.subscriber}`,
        value: { subscriber: this.data.subscriber },
        domain: 'subscription.subscriber',
      },
      {
        id: `subscription:active:${this.data.active}`,
        value: { active: this.data.active },
        domain: 'subscription.active',
      },
    ];

    Object.entries(this.data.criteria).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(item => {
          primeFactors.push({
            id: `subscription:criteria:${key}:${item}`,
            value: { [key]: item },
            domain: 'subscription.criteria',
          });
        });
      } else if (value) {
        primeFactors.push({
          id: `subscription:criteria:${key}:${value}`,
          value: { [key]: value },
          domain: 'subscription.criteria',
        });
      }
    });

    Object.entries(this.data.notificationPreferences).forEach(([key, value]) => {
      primeFactors.push({
        id: `subscription:notification:${key}:${value}`,
        value: { [key]: value },
        domain: 'subscription.notification',
      });
    });

    return {
      primeFactors,
      decompositionMethod: 'subscription-decomposition',
    };
  }

  /**
   * Computes the canonical representation of this subscription
   * @returns The canonical representation
   */
  computeCanonicalRepresentation(): CanonicalRepresentation {
    const canonicalData = {
      id: this.data.id,
      channelId: this.data.channelId,
      subscriber: this.data.subscriber,
      criteria: this.canonicalizeCriteria(),
      createdAt: this.data.createdAt.toISOString(),
      updatedAt: this.data.updatedAt.toISOString(),
      active: this.data.active,
      notificationPreferences: { ...this.data.notificationPreferences },
    };

    return {
      representationType: 'subscription-canonical',
      value: canonicalData,
      coherenceNorm: this.measureCoherence().value,
    };
  }

  /**
   * Canonicalizes the criteria object
   * @returns Canonicalized criteria
   */
  private canonicalizeCriteria(): object {
    const result: Record<string, any> = {};

    const sortedKeys = Object.keys(this.data.criteria).sort();

    for (const key of sortedKeys) {
      const value = this.data.criteria[key];

      if (Array.isArray(value)) {
        result[key] = [...value].sort();
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Measures the coherence of this subscription representation
   * @returns The coherence measure
   */
  measureCoherence(): CoherenceMeasure {
    let coherenceScore = 0;

    if (this.data.id) coherenceScore += 0.1;
    if (this.data.channelId) coherenceScore += 0.1;
    if (this.data.subscriber) coherenceScore += 0.1;

    const criteriaCount = Object.keys(this.data.criteria).length;
    coherenceScore += Math.min(0.3, criteriaCount * 0.05);

    if (this.data.notificationPreferences) {
      coherenceScore += 0.1;
      if (this.data.notificationPreferences.enabled) coherenceScore += 0.05;
      if (this.data.notificationPreferences.method) coherenceScore += 0.05;
    }

    return {
      type: 'subscription-coherence',
      value: coherenceScore,
      normalization: 'linear-sum',
    };
  }

  /**
   * Serializes this subscription to a JSON representation
   * @returns Serialized subscription object
   */
  serialize(): object {
    return {
      id: this.id,
      type: this.type,
      data: {
        ...this.data,
        createdAt: this.data.createdAt.toISOString(),
        updatedAt: this.data.updatedAt.toISOString(),
      },
      canonicalRepresentation:
        this.canonicalRepresentation || this.computeCanonicalRepresentation(),
      primeDecomposition: this.primeDecomposition || this.computePrimeDecomposition(),
      observerFrame: this.observerFrame,
    };
  }

  /**
   * Validates this subscription against its schema
   * @returns Whether the subscription is valid
   */
  validate(): boolean {
    if (!this.data.id || this.data.id !== this.id) {
      return false;
    }

    if (!this.data.channelId || this.data.channelId.trim() === '') {
      return false;
    }

    if (!this.data.subscriber || this.data.subscriber.trim() === '') {
      return false;
    }

    if (!this.data.notificationPreferences) {
      return false;
    }

    return true;
  }

  /**
   * Gets the intrinsic prime factors for the subscription domain
   * @returns Array of intrinsic prime factors
   */
  getIntrinsicPrimes(): PrimeFactor[] {
    return [
      {
        id: 'subscription:core',
        value: { type: 'channel-subscription' },
        domain: 'subscription',
      },
    ];
  }
}
