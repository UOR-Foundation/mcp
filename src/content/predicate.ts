/**
 * UOR Predicate Implementation
 * Implements predicate objects in the UOR system
 */

import {
  UORObject,
  ObserverFrame,
  PrimeDecomposition,
  CanonicalRepresentation,
  CoherenceMeasure,
  PrimeFactor,
} from '../core/uor-core';
import { ContentType, PredicateContent, ContentUORObject } from './content-types';

/**
 * Predicate object implementation
 */
export class PredicateObject extends UORObject implements ContentUORObject {
  private content: PredicateContent;

  /**
   * Creates a new predicate object
   * @param id Unique identifier
   * @param content Predicate content
   */
  constructor(id: string, content: PredicateContent) {
    super(id, ContentType.PREDICATE);
    this.content = content;
  }

  /**
   * Gets the predicate content data
   * @returns The predicate content
   */
  getContentData(): PredicateContent {
    return this.content;
  }

  /**
   * Adds a tag to the predicate
   * @param tag Tag to add
   */
  addTag(tag: string): void {
    if (!this.content.tags) {
      this.content.tags = [];
    }

    if (!this.content.tags.includes(tag)) {
      this.content.tags.push(tag);
      this.content.updatedAt = new Date();
    }
  }

  /**
   * Removes a tag from the predicate
   * @param tag Tag to remove
   */
  removeTag(tag: string): void {
    if (this.content.tags) {
      const index = this.content.tags.indexOf(tag);

      if (index !== -1) {
        this.content.tags.splice(index, 1);
        this.content.updatedAt = new Date();
      }
    }
  }

  /**
   * Updates the predicate content
   * @param data Updated predicate data
   */
  updateContent(data: Partial<PredicateContent>): void {
    this.content = {
      ...this.content,
      ...data,
      updatedAt: new Date(),
    };
  }

  /**
   * Transforms this object to a different observer frame
   * @param newFrame The new observer frame to transform to
   * @returns A new UOR object in the new observer frame
   */
  transformToFrame(newFrame: ObserverFrame): UORObject {
    const transformedPredicate = new PredicateObject(this.id, { ...this.content });

    transformedPredicate.setObserverFrame(newFrame);

    if (this.canonicalRepresentation) {
      transformedPredicate.setCanonicalRepresentation(this.canonicalRepresentation);
    }

    if (this.primeDecomposition) {
      transformedPredicate.setPrimeDecomposition(this.primeDecomposition);
    }

    return transformedPredicate;
  }

  /**
   * Measures the coherence of this object's representation
   * This quantifies the representational integrity
   */
  measureCoherence(): CoherenceMeasure {
    return {
      type: 'predicate-coherence',
      value: 1.0, // Perfect coherence for predicate objects
      normalization: 'identity',
    };
  }

  /**
   * Validates this object against its schema
   * @returns Whether the object is valid
   */
  validate(): boolean {
    if (!this.content.relation) {
      return false;
    }

    return true;
  }

  /**
   * Gets the intrinsic prime factors for this object's domain
   * @returns Array of prime factors that are intrinsic to this domain
   */
  getIntrinsicPrimes(): PrimeFactor[] {
    return [
      {
        id: 'predicate:base',
        value: { type: 'predicate' },
        domain: 'predicate',
      },
    ];
  }

  /**
   * Computes the prime decomposition of this predicate
   */
  computePrimeDecomposition(): PrimeDecomposition {
    return {
      primeFactors: [
        {
          id: `predicate:${this.id}`,
          value: {
            relation: this.content.relation,
            domain: this.content.domain,
            range: this.content.range,
          },
          domain: 'predicate',
        },
        ...(this.content.inverseOf
          ? [
              {
                id: `inverse:${this.id}:${this.content.inverseOf}`,
                value: { source: this.id, target: this.content.inverseOf },
                domain: 'inverse-relation',
              },
            ]
          : []),
        ...(this.content.transitive
          ? [
              {
                id: `property:${this.id}:transitive`,
                value: { property: 'transitive' },
                domain: 'logical-property',
              },
            ]
          : []),
        ...(this.content.symmetric
          ? [
              {
                id: `property:${this.id}:symmetric`,
                value: { property: 'symmetric' },
                domain: 'logical-property',
              },
            ]
          : []),
      ],
      decompositionMethod: 'predicate-logical',
    };
  }

  /**
   * Computes the canonical representation of this predicate
   */
  computeCanonicalRepresentation(): CanonicalRepresentation {
    return {
      representationType: 'predicate-canonical',
      value: {
        id: this.id,
        relation: this.content.relation,
        domain: this.content.domain,
        range: this.content.range,
        properties: [
          ...(this.content.transitive ? ['transitive'] : []),
          ...(this.content.symmetric ? ['symmetric'] : []),
        ],
      },
    };
  }

  /**
   * Serializes this predicate to a JSON representation
   */
  serialize(): object {
    return {
      id: this.id,
      type: this.type,
      content: this.content,
      canonicalRepresentation:
        this.canonicalRepresentation || this.computeCanonicalRepresentation(),
      primeDecomposition: this.primeDecomposition || this.computePrimeDecomposition(),
    };
  }
}
