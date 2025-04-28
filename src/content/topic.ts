/**
 * UOR Topic Implementation
 * Implements topic objects in the UOR system
 */

import { UORObject, CanonicalRepresentation, PrimeDecomposition, ObserverFrame, CoherenceMeasure, PrimeFactor } from '../core/uor-core';
import { TopicContent, ContentUORObject } from './content-types';

/**
 * Implementation of UOR Topic Object
 */
export class TopicObject extends UORObject implements ContentUORObject {
  private data: TopicContent;

  /**
   * Creates a new topic object
   * @param id Unique topic ID
   * @param data Initial topic data
   */
  constructor(id: string, data: Partial<TopicContent>) {
    super(id, 'topic');
    
    this.data = {
      id: id,
      title: data.title || '',
      concepts: data.concepts || [],
      resources: data.resources || [],
      tags: data.tags || [],
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
      createdBy: data.createdBy || '',
      ...data
    };
  }

  /**
   * Gets the complete topic data
   * @returns The topic data
   */
  getContentData(): TopicContent {
    return { ...this.data };
  }

  /**
   * Updates topic information
   * @param content Updated topic data
   */
  updateContent(content: Partial<TopicContent>): void {
    this.data = {
      ...this.data,
      ...content,
      updatedAt: new Date()
    };
  }

  /**
   * Adds a tag to the topic
   * @param tag Tag to add
   */
  addTag(tag: string): void {
    if (!this.data.tags) {
      this.data.tags = [];
    }
    
    if (!this.data.tags.includes(tag)) {
      this.data.tags.push(tag);
      this.data.updatedAt = new Date();
    }
  }

  /**
   * Removes a tag from the topic
   * @param tag Tag to remove
   */
  removeTag(tag: string): void {
    if (this.data.tags) {
      this.data.tags = this.data.tags.filter(t => t !== tag);
      this.data.updatedAt = new Date();
    }
  }

  /**
   * Adds a concept to the topic
   * @param conceptRef UOR reference to concept
   */
  addConcept(conceptRef: string): void {
    if (!this.data.concepts.includes(conceptRef)) {
      this.data.concepts.push(conceptRef);
      this.data.updatedAt = new Date();
    }
  }

  /**
   * Removes a concept from the topic
   * @param conceptRef UOR reference to concept
   */
  removeConcept(conceptRef: string): void {
    this.data.concepts = this.data.concepts.filter(ref => ref !== conceptRef);
    this.data.updatedAt = new Date();
  }

  /**
   * Adds a resource to the topic
   * @param resourceRef UOR reference to resource
   */
  addResource(resourceRef: string): void {
    if (!this.data.resources.includes(resourceRef)) {
      this.data.resources.push(resourceRef);
      this.data.updatedAt = new Date();
    }
  }

  /**
   * Removes a resource from the topic
   * @param resourceRef UOR reference to resource
   */
  removeResource(resourceRef: string): void {
    this.data.resources = this.data.resources.filter(ref => ref !== resourceRef);
    this.data.updatedAt = new Date();
  }

  /**
   * Adds a subtopic to the topic
   * @param subtopicRef UOR reference to subtopic
   */
  addSubtopic(subtopicRef: string): void {
    if (!this.data.subtopics) {
      this.data.subtopics = [];
    }
    
    if (!this.data.subtopics.includes(subtopicRef)) {
      this.data.subtopics.push(subtopicRef);
      this.data.updatedAt = new Date();
    }
  }

  /**
   * Removes a subtopic from the topic
   * @param subtopicRef UOR reference to subtopic
   */
  removeSubtopic(subtopicRef: string): void {
    if (this.data.subtopics) {
      this.data.subtopics = this.data.subtopics.filter(ref => ref !== subtopicRef);
      this.data.updatedAt = new Date();
    }
  }

  /**
   * Sets the parent topic for this topic
   * @param parentRef UOR reference to parent topic
   */
  setParentTopic(parentRef: string): void {
    this.data.parentTopic = parentRef;
    this.data.updatedAt = new Date();
  }

  /**
   * Clears the parent topic reference
   */
  clearParentTopic(): void {
    this.data.parentTopic = undefined;
    this.data.updatedAt = new Date();
  }

  /**
   * Transforms this topic to a different observer frame
   * @param newFrame The new observer frame
   * @returns A new topic object in the new frame
   */
  transformToFrame(newFrame: ObserverFrame): UORObject {
    const newTopic = new TopicObject(this.id, this.data);
    newTopic.setObserverFrame(newFrame);
    return newTopic;
  }

  /**
   * Computes the prime decomposition of this topic
   * @returns The prime decomposition
   */
  computePrimeDecomposition(): PrimeDecomposition {
    const primeFactors: PrimeFactor[] = [
      {
        id: `topic:${this.id}`,
        value: { id: this.id, type: 'topic' },
        domain: 'topic'
      },
      {
        id: `topic:title:${this.data.title}`,
        value: { title: this.data.title },
        domain: 'topic.title'
      }
    ];
    
    this.data.concepts.forEach(conceptRef => {
      primeFactors.push({
        id: `topic:concept:${conceptRef}`,
        value: { conceptRef },
        domain: 'topic.concept'
      });
    });
    
    this.data.resources.forEach(resourceRef => {
      primeFactors.push({
        id: `topic:resource:${resourceRef}`,
        value: { resourceRef },
        domain: 'topic.resource'
      });
    });
    
    if (this.data.subtopics && this.data.subtopics.length > 0) {
      this.data.subtopics.forEach(subtopicRef => {
        primeFactors.push({
          id: `topic:subtopic:${subtopicRef}`,
          value: { subtopicRef },
          domain: 'topic.subtopic'
        });
      });
    }
    
    if (this.data.parentTopic) {
      primeFactors.push({
        id: `topic:parent:${this.data.parentTopic}`,
        value: { parentTopic: this.data.parentTopic },
        domain: 'topic.parent'
      });
    }
    
    if (this.data.tags && this.data.tags.length > 0) {
      this.data.tags.forEach(tag => {
        primeFactors.push({
          id: `topic:tag:${tag}`,
          value: { tag },
          domain: 'topic.tag'
        });
      });
    }
    
    return {
      primeFactors,
      decompositionMethod: 'topic-decomposition'
    };
  }

  /**
   * Computes the canonical representation of this topic
   * @returns The canonical representation
   */
  computeCanonicalRepresentation(): CanonicalRepresentation {
    const canonicalData = {
      id: this.data.id,
      title: this.data.title,
      concepts: [...this.data.concepts].sort(),
      resources: [...this.data.resources].sort(),
      subtopics: this.data.subtopics ? [...this.data.subtopics].sort() : [],
      parentTopic: this.data.parentTopic,
      tags: this.data.tags ? [...this.data.tags].sort() : [],
      createdAt: this.data.createdAt.toISOString(),
      updatedAt: this.data.updatedAt.toISOString(),
      createdBy: this.data.createdBy
    };
    
    return {
      representationType: 'topic-canonical',
      value: canonicalData,
      coherenceNorm: this.measureCoherence().value
    };
  }

  /**
   * Measures the coherence of this topic representation
   * @returns The coherence measure
   */
  measureCoherence(): CoherenceMeasure {
    let coherenceScore = 0;
    
    if (this.data.title && this.data.title.length > 0) coherenceScore += 0.2;
    
    if (this.data.concepts.length > 0) coherenceScore += 0.3;
    if (this.data.resources.length > 0) coherenceScore += 0.3;
    
    if (this.data.subtopics && this.data.subtopics.length > 0) coherenceScore += 0.1;
    if (this.data.parentTopic) coherenceScore += 0.1;
    
    return {
      type: 'topic-coherence',
      value: coherenceScore,
      normalization: 'linear-sum'
    };
  }

  /**
   * Serializes this topic to a JSON representation
   * @returns Serialized topic object
   */
  serialize(): object {
    return {
      id: this.id,
      type: this.type,
      data: this.data,
      canonicalRepresentation: this.canonicalRepresentation || this.computeCanonicalRepresentation(),
      primeDecomposition: this.primeDecomposition || this.computePrimeDecomposition(),
      observerFrame: this.observerFrame
    };
  }

  /**
   * Validates this topic against its schema
   * @returns Whether the topic is valid
   */
  validate(): boolean {
    if (!this.data.id || this.data.id !== this.id) {
      return false;
    }
    
    if (!this.data.title || this.data.title.trim() === '') {
      return false;
    }
    
    if (!Array.isArray(this.data.concepts)) {
      return false;
    }
    
    if (!Array.isArray(this.data.resources)) {
      return false;
    }
    
    if (!this.data.createdBy || this.data.createdBy.trim() === '') {
      return false;
    }
    
    return true;
  }

  /**
   * Gets the intrinsic prime factors for the topic domain
   * @returns Array of intrinsic prime factors
   */
  getIntrinsicPrimes(): PrimeFactor[] {
    return [
      {
        id: 'topic:core',
        value: { type: 'topic' },
        domain: 'topic'
      }
    ];
  }
}
