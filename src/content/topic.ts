/**
 * UOR Topic Implementation
 * Implements topic objects in the UOR system
 */

import {
  UORObject,
  ObserverFrame,
  PrimeDecomposition,
  CanonicalRepresentation,
  CoherenceMeasure,
  PrimeFactor,
} from '../core/uor-core';
import { ContentType, TopicContent, ContentUORObject } from './content-types';

/**
 * Topic object implementation
 */
export class TopicObject extends UORObject implements ContentUORObject {
  private content: TopicContent;

  /**
   * Creates a new topic object
   * @param id Unique identifier
   * @param content Topic content
   */
  constructor(id: string, content: TopicContent) {
    super(id, ContentType.TOPIC);
    this.content = content;
  }

  /**
   * Gets the topic content data
   * @returns The topic content
   */
  getContentData(): TopicContent {
    return this.content;
  }

  /**
   * Adds a tag to the topic
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
   * Removes a tag from the topic
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
   * Updates the topic content
   * @param data Updated topic data
   */
  updateContent(data: Partial<TopicContent>): void {
    this.content = {
      ...this.content,
      ...data,
      updatedAt: new Date(),
    };
  }

  /**
   * Adds a concept to the topic
   * @param conceptRef UOR reference to the concept
   */
  addConcept(conceptRef: string): void {
    if (!this.content.concepts) {
      this.content.concepts = [];
    }

    if (!this.content.concepts.includes(conceptRef)) {
      this.content.concepts.push(conceptRef);
      this.content.updatedAt = new Date();
    }
  }

  /**
   * Adds a resource to the topic
   * @param resourceRef UOR reference to the resource
   */
  addResource(resourceRef: string): void {
    if (!this.content.resources) {
      this.content.resources = [];
    }

    if (!this.content.resources.includes(resourceRef)) {
      this.content.resources.push(resourceRef);
      this.content.updatedAt = new Date();
    }
  }

  /**
   * Adds a subtopic to the topic
   * @param subtopicRef UOR reference to the subtopic
   */
  addSubtopic(subtopicRef: string): void {
    if (!this.content.subtopics) {
      this.content.subtopics = [];
    }

    if (!this.content.subtopics.includes(subtopicRef)) {
      this.content.subtopics.push(subtopicRef);
      this.content.updatedAt = new Date();
    }
  }

  /**
   * Transforms this object to a different observer frame
   * @param newFrame The new observer frame to transform to
   * @returns A new UOR object in the new observer frame
   */
  transformToFrame(newFrame: ObserverFrame): UORObject {
    const transformedTopic = new TopicObject(this.id, { ...this.content });

    transformedTopic.setObserverFrame(newFrame);

    if (this.canonicalRepresentation) {
      transformedTopic.setCanonicalRepresentation(this.canonicalRepresentation);
    }

    if (this.primeDecomposition) {
      transformedTopic.setPrimeDecomposition(this.primeDecomposition);
    }

    return transformedTopic;
  }

  /**
   * Measures the coherence of this object's representation
   * This quantifies the representational integrity
   */
  measureCoherence(): CoherenceMeasure {
    return {
      type: 'topic-coherence',
      value: 1.0, // Perfect coherence for topic objects
      normalization: 'identity',
    };
  }

  /**
   * Validates this object against its schema
   * @returns Whether the object is valid
   */
  validate(): boolean {
    if (!this.content.title || !this.content.summary) {
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
        id: 'topic:base',
        value: { type: 'topic' },
        domain: 'topic',
      },
    ];
  }

  /**
   * Computes the prime decomposition of this topic
   */
  computePrimeDecomposition(): PrimeDecomposition {
    return {
      primeFactors: [
        {
          id: `topic:${this.id}`,
          value: {
            title: this.content.title,
            summary: this.content.summary,
          },
          domain: 'topic',
        },
        ...(this.content.concepts || []).map(concept => ({
          id: `inclusion:${this.id}:${concept}`,
          value: { type: 'concept', source: this.id, target: concept },
          domain: 'inclusion',
        })),
        ...(this.content.resources || []).map(resource => ({
          id: `inclusion:${this.id}:${resource}`,
          value: { type: 'resource', source: this.id, target: resource },
          domain: 'inclusion',
        })),
        ...(this.content.subtopics || []).map(subtopic => ({
          id: `hierarchy:${this.id}:${subtopic}`,
          value: { type: 'parent', source: this.id, target: subtopic },
          domain: 'hierarchy',
        })),
        ...(this.content.parentTopic
          ? [
              {
                id: `hierarchy:${this.content.parentTopic}:${this.id}`,
                value: { type: 'child', source: this.content.parentTopic, target: this.id },
                domain: 'hierarchy',
              },
            ]
          : []),
      ],
      decompositionMethod: 'topic-hierarchical',
    };
  }

  /**
   * Computes the canonical representation of this topic
   */
  computeCanonicalRepresentation(): CanonicalRepresentation {
    return {
      representationType: 'topic-canonical',
      value: {
        id: this.id,
        title: this.content.title,
        summary: this.content.summary,
        conceptCount: (this.content.concepts || []).length,
        resourceCount: (this.content.resources || []).length,
        subtopicCount: (this.content.subtopics || []).length,
      },
    };
  }

  /**
   * Serializes this topic to a JSON representation
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
