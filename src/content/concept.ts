/**
 * UOR Concept Implementation
 * Implements concept objects in the UOR system
 */

import { UORObject, CanonicalRepresentation, PrimeDecomposition, ObserverFrame, CoherenceMeasure, PrimeFactor } from '../core/uor-core';
import { ConceptContent, ContentUORObject } from './content-types';

/**
 * Implementation of UOR Concept Object
 */
export class ConceptObject extends UORObject implements ContentUORObject {
  private data: ConceptContent;

  /**
   * Creates a new concept object
   * @param id Unique concept ID
   * @param data Initial concept data
   */
  constructor(id: string, data: Partial<ConceptContent>) {
    super(id, 'concept');
    
    this.data = {
      id: id,
      title: data.title || '',
      definition: data.definition || '',
      tags: data.tags || [],
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
      createdBy: data.createdBy || '',
      ...data
    };
  }

  /**
   * Gets the complete concept data
   * @returns The concept data
   */
  getContentData(): ConceptContent {
    return { ...this.data };
  }

  /**
   * Updates concept information
   * @param content Updated concept data
   */
  updateContent(content: Partial<ConceptContent>): void {
    this.data = {
      ...this.data,
      ...content,
      updatedAt: new Date()
    };
  }

  /**
   * Adds a tag to the concept
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
   * Removes a tag from the concept
   * @param tag Tag to remove
   */
  removeTag(tag: string): void {
    if (this.data.tags) {
      this.data.tags = this.data.tags.filter(t => t !== tag);
      this.data.updatedAt = new Date();
    }
  }

  /**
   * Adds a related concept reference
   * @param conceptRef UOR reference to related concept
   */
  addRelatedConcept(conceptRef: string): void {
    if (!this.data.relatedConcepts) {
      this.data.relatedConcepts = [];
    }
    
    if (!this.data.relatedConcepts.includes(conceptRef)) {
      this.data.relatedConcepts.push(conceptRef);
      this.data.updatedAt = new Date();
    }
  }

  /**
   * Removes a related concept reference
   * @param conceptRef UOR reference to related concept
   */
  removeRelatedConcept(conceptRef: string): void {
    if (this.data.relatedConcepts) {
      this.data.relatedConcepts = this.data.relatedConcepts.filter(ref => ref !== conceptRef);
      this.data.updatedAt = new Date();
    }
  }

  /**
   * Adds an example to the concept
   * @param example Example to add
   */
  addExample(example: string): void {
    if (!this.data.examples) {
      this.data.examples = [];
    }
    
    this.data.examples.push(example);
    this.data.updatedAt = new Date();
  }

  /**
   * Removes an example from the concept
   * @param example Example to remove
   */
  removeExample(example: string): void {
    if (this.data.examples) {
      this.data.examples = this.data.examples.filter(e => e !== example);
      this.data.updatedAt = new Date();
    }
  }

  /**
   * Transforms this concept to a different observer frame
   * @param newFrame The new observer frame
   * @returns A new concept object in the new frame
   */
  transformToFrame(newFrame: ObserverFrame): UORObject {
    const newConcept = new ConceptObject(this.id, this.data);
    newConcept.setObserverFrame(newFrame);
    return newConcept;
  }

  /**
   * Computes the prime decomposition of this concept
   * @returns The prime decomposition
   */
  computePrimeDecomposition(): PrimeDecomposition {
    const primeFactors: PrimeFactor[] = [
      {
        id: `concept:${this.id}`,
        value: { id: this.id, type: 'concept' },
        domain: 'concept'
      },
      {
        id: `concept:title:${this.data.title}`,
        value: { title: this.data.title },
        domain: 'concept.title'
      },
      {
        id: `concept:definition:${this.data.definition}`,
        value: { definition: this.data.definition },
        domain: 'concept.definition'
      }
    ];
    
    if (this.data.tags && this.data.tags.length > 0) {
      this.data.tags.forEach(tag => {
        primeFactors.push({
          id: `concept:tag:${tag}`,
          value: { tag },
          domain: 'concept.tag'
        });
      });
    }
    
    if (this.data.examples && this.data.examples.length > 0) {
      this.data.examples.forEach((example, index) => {
        primeFactors.push({
          id: `concept:example:${index}`,
          value: { example },
          domain: 'concept.example'
        });
      });
    }
    
    if (this.data.relatedConcepts && this.data.relatedConcepts.length > 0) {
      this.data.relatedConcepts.forEach(ref => {
        primeFactors.push({
          id: `concept:related:${ref}`,
          value: { relatedConcept: ref },
          domain: 'concept.relation'
        });
      });
    }
    
    return {
      primeFactors,
      decompositionMethod: 'concept-decomposition'
    };
  }

  /**
   * Computes the canonical representation of this concept
   * @returns The canonical representation
   */
  computeCanonicalRepresentation(): CanonicalRepresentation {
    const canonicalData = {
      id: this.data.id,
      title: this.data.title,
      definition: this.data.definition,
      tags: this.data.tags ? [...this.data.tags].sort() : [],
      examples: this.data.examples ? [...this.data.examples] : [],
      relatedConcepts: this.data.relatedConcepts ? [...this.data.relatedConcepts].sort() : [],
      createdAt: this.data.createdAt.toISOString(),
      updatedAt: this.data.updatedAt.toISOString(),
      createdBy: this.data.createdBy
    };
    
    return {
      representationType: 'concept-canonical',
      value: canonicalData,
      coherenceNorm: this.measureCoherence().value
    };
  }

  /**
   * Measures the coherence of this concept representation
   * @returns The coherence measure
   */
  measureCoherence(): CoherenceMeasure {
    let coherenceScore = 0;
    
    if (this.data.title && this.data.title.length > 0) coherenceScore += 0.3;
    if (this.data.definition && this.data.definition.length > 0) coherenceScore += 0.3;
    
    if (this.data.tags && this.data.tags.length > 0) coherenceScore += 0.1;
    if (this.data.examples && this.data.examples.length > 0) coherenceScore += 0.15;
    if (this.data.relatedConcepts && this.data.relatedConcepts.length > 0) coherenceScore += 0.15;
    
    return {
      type: 'concept-coherence',
      value: coherenceScore,
      normalization: 'linear-sum'
    };
  }

  /**
   * Serializes this concept to a JSON representation
   * @returns Serialized concept object
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
   * Validates this concept against its schema
   * @returns Whether the concept is valid
   */
  validate(): boolean {
    if (!this.data.id || this.data.id !== this.id) {
      return false;
    }
    
    if (!this.data.title || this.data.title.trim() === '') {
      return false;
    }
    
    if (!this.data.definition || this.data.definition.trim() === '') {
      return false;
    }
    
    if (!this.data.createdBy || this.data.createdBy.trim() === '') {
      return false;
    }
    
    return true;
  }

  /**
   * Gets the intrinsic prime factors for the concept domain
   * @returns Array of intrinsic prime factors
   */
  getIntrinsicPrimes(): PrimeFactor[] {
    return [
      {
        id: 'concept:core',
        value: { type: 'concept' },
        domain: 'concept'
      }
    ];
  }
}
