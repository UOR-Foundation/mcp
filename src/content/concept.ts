/**
 * UOR Concept Implementation
 * Implements concept objects in the UOR system
 */

import {
  UORObject,
  ObserverFrame,
  PrimeDecomposition,
  CanonicalRepresentation,
  CoherenceMeasure,
  PrimeFactor,
} from '../core/uor-core';
import { ContentType, ConceptContent, ContentUORObject } from './content-types';

/**
 * Concept object implementation
 */
export class ConceptObject extends UORObject implements ContentUORObject {
  private content: ConceptContent;

  /**
   * Creates a new concept object
   * @param id Unique identifier
   * @param content Concept content
   */
  constructor(id: string, content: ConceptContent) {
    super(id, ContentType.CONCEPT);
    this.content = content;
  }

  /**
   * Gets the concept content data
   * @returns The concept content
   */
  getContentData(): ConceptContent {
    return this.content;
  }

  /**
   * Adds a tag to the concept
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
   * Removes a tag from the concept
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
   * Updates the concept content
   * @param data Updated concept data
   */
  updateContent(data: Partial<ConceptContent>): void {
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
    const transformedConcept = new ConceptObject(this.id, { ...this.content });

    transformedConcept.setObserverFrame(newFrame);

    if (this.canonicalRepresentation) {
      transformedConcept.setCanonicalRepresentation(this.canonicalRepresentation);
    }

    if (this.primeDecomposition) {
      transformedConcept.setPrimeDecomposition(this.primeDecomposition);
    }

    return transformedConcept;
  }

  /**
   * Measures the coherence of this object's representation
   * This quantifies the representational integrity
   */
  measureCoherence(): CoherenceMeasure {
    return {
      type: 'concept-coherence',
      value: 1.0, // Perfect coherence for concept objects
      normalization: 'identity',
    };
  }

  /**
   * Validates this object against its schema
   * @returns Whether the object is valid
   */
  validate(): boolean {
    if (!this.content.title || !this.content.definition) {
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
        id: 'concept:base',
        value: { type: 'concept' },
        domain: 'concept',
      },
    ];
  }

  /**
   * Computes the prime decomposition of this concept
   */
  computePrimeDecomposition(): PrimeDecomposition {
    return {
      primeFactors: [
        {
          id: `concept:${this.id}`,
          value: { title: this.content.title, definition: this.content.definition },
          domain: 'concept',
        },
        ...(this.content.relatedConcepts || []).map(concept => ({
          id: `relation:${this.id}:${concept}`,
          value: { type: 'related', source: this.id, target: concept },
          domain: 'relation',
        })),
      ],
      decompositionMethod: 'concept-semantic',
    };
  }

  /**
   * Computes the canonical representation of this concept
   */
  computeCanonicalRepresentation(): CanonicalRepresentation {
    return {
      representationType: 'concept-canonical',
      value: {
        id: this.id,
        title: this.content.title,
        definition: this.content.definition,
        domain: this.content.domain,
      },
    };
  }

  /**
   * Serializes this concept to a JSON representation
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
