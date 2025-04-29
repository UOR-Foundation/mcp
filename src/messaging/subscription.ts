/**
 * UOR Message Subscription Implementation
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
import { MessageSubscription, SubscriptionUORObject } from './message-types';

/**
 * Implementation of UOR Subscription Object
 */
export class SubscriptionObject extends UORObject implements SubscriptionUORObject {
  private data: MessageSubscription;

  /**
   * Creates a new subscription object
   * @param id Unique subscription ID
   * @param data Initial subscription data
   */
  constructor(id: string, data: Partial<MessageSubscription>) {
    super(id, 'subscription');

    this.data = {
      id: id,
      subscriber: data.subscriber || '',
      criteria: data.criteria || {},
      notificationPreferences: data.notificationPreferences || {
        enabled: true,
        method: 'in-app',
      },
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
      ...data,
    };
  }

  /**
   * Gets the complete subscription data
   * @returns The subscription data
   */
  getSubscriptionData(): MessageSubscription {
    return { ...this.data };
  }

  /**
   * Updates subscription information
   * @param subscription Updated subscription data
   */
  updateSubscription(subscription: Partial<MessageSubscription>): void {
    this.data = {
      ...this.data,
      ...subscription,
      updatedAt: new Date(),
    };
  }

  /**
   * Updates notification preferences
   * @param preferences Updated notification preferences
   */
  updateNotificationPreferences(
    preferences: Partial<MessageSubscription['notificationPreferences']>
  ): void {
    this.data.notificationPreferences = {
      ...this.data.notificationPreferences,
      ...preferences,
    };
    this.data.updatedAt = new Date();
  }

  /**
   * Updates subscription criteria
   * @param criteria Updated subscription criteria
   */
  updateCriteria(criteria: Partial<MessageSubscription['criteria']>): void {
    this.data.criteria = {
      ...this.data.criteria,
      ...criteria,
    };
    this.data.updatedAt = new Date();
  }

  /**
   * Transforms this subscription to a different observer frame
   * @param newFrame The new observer frame
   * @returns A new subscription object in the new frame
   */
  transformToFrame(newFrame: ObserverFrame): UORObject {
    const newSubscription = new SubscriptionObject(this.id, this.data);
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
        value: { id: this.id, type: 'subscription' },
        domain: 'subscription',
      },
      {
        id: `subscription:subscriber:${this.data.subscriber}`,
        value: { subscriber: this.data.subscriber },
        domain: 'subscription.subscriber',
      },
    ];

    if (this.data.criteria) {
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
    }

    if (this.data.notificationPreferences) {
      Object.entries(this.data.notificationPreferences).forEach(([key, value]) => {
        primeFactors.push({
          id: `subscription:notification:${key}:${value}`,
          value: { [key]: value },
          domain: 'subscription.notification',
        });
      });
    }

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
      subscriber: this.data.subscriber,
      criteria: this.canonicalizeCriteria(),
      notificationPreferences: { ...this.data.notificationPreferences },
      createdAt: this.data.createdAt.toISOString(),
      updatedAt: this.data.updatedAt.toISOString(),
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

    if (!this.data.criteria) {
      return result;
    }

    Object.entries(this.data.criteria).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        result[key] = [...value].sort();
      } else {
        result[key] = value;
      }
    });

    return result;
  }

  /**
   * Measures the coherence of this subscription representation
   * @returns The coherence measure
   */
  measureCoherence(): CoherenceMeasure {
    let coherenceScore = 0;

    if (this.data.subscriber) coherenceScore += 0.2;

    if (this.data.criteria) {
      const criteriaCount = Object.keys(this.data.criteria).length;
      coherenceScore += Math.min(0.4, criteriaCount * 0.1);
    }

    if (this.data.notificationPreferences) {
      coherenceScore += 0.2;
      if (this.data.notificationPreferences.enabled) coherenceScore += 0.1;
      if (this.data.notificationPreferences.method) coherenceScore += 0.1;
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
        value: { type: 'subscription' },
        domain: 'subscription',
      },
    ];
  }
}
