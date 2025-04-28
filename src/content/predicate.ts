/**
 * UOR Predicate Implementation
 * Implements predicate objects in the UOR system
 */

import { UORObject, CanonicalRepresentation, PrimeDecomposition, ObserverFrame, CoherenceMeasure, PrimeFactor } from '../core/uor-core';
import { PredicateContent, PredicateType, ContentUORObject } from './content-types';

/**
 * Implementation of UOR Predicate Object
 */
export class PredicateObject extends UORObject implements ContentUORObject {
  private data: PredicateContent;

  /**
   * Creates a new predicate object
   * @param id Unique predicate ID
   * @param data Initial predicate data
   */
  constructor(id: string, data: Partial<PredicateContent>) {
    super(id, 'predicate');
    
    this.data = {
      id: id,
      title: data.title || '',
      sourceRef: data.sourceRef || '',
      targetRef: data.targetRef || '',
      predicateType: data.predicateType || PredicateType.RELATED_TO,
      bidirectional: data.bidirectional !== undefined ? data.bidirectional : false,
      tags: data.tags || [],
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
      createdBy: data.createdBy || '',
      ...data
    };
  }

  /**
   * Gets the complete predicate data
   * @returns The predicate data
   */
  getContentData(): PredicateContent {
    return { ...this.data };
  }

  /**
   * Updates predicate information
   * @param content Updated predicate data
   */
  updateContent(content: Partial<PredicateContent>): void {
    this.data = {
      ...this.data,
      ...content,
      updatedAt: new Date()
    };
  }

  /**
   * Adds a tag to the predicate
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
   * Removes a tag from the predicate
   * @param tag Tag to remove
   */
  removeTag(tag: string): void {
    if (this.data.tags) {
      this.data.tags = this.data.tags.filter(t => t !== tag);
      this.data.updatedAt = new Date();
    }
  }

  /**
   * Sets the source reference for the predicate
   * @param sourceRef UOR reference to source object
   */
  setSourceRef(sourceRef: string): void {
    this.data.sourceRef = sourceRef;
    this.data.updatedAt = new Date();
  }

  /**
   * Sets the target reference for the predicate
   * @param targetRef UOR reference to target object
   */
  setTargetRef(targetRef: string): void {
    this.data.targetRef = targetRef;
    this.data.updatedAt = new Date();
  }

  /**
   * Sets the predicate type
   * @param predicateType Type of predicate
   * @param customType Custom type (if predicateType is CUSTOM)
   */
  setPredicateType(predicateType: PredicateType, customType?: string): void {
    this.data.predicateType = predicateType;
    
    if (predicateType === PredicateType.CUSTOM) {
      if (!customType) {
        throw new Error('Custom predicate type requires a customType value');
      }
      this.data.customType = customType;
    } else {
      this.data.customType = undefined;
    }
    
    this.data.updatedAt = new Date();
  }

  /**
   * Sets whether the predicate is bidirectional
   * @param bidirectional Whether the predicate is bidirectional
   */
  setBidirectional(bidirectional: boolean): void {
    this.data.bidirectional = bidirectional;
    this.data.updatedAt = new Date();
  }

  /**
   * Sets the weight of the predicate
   * @param weight Predicate weight
   */
  setWeight(weight: number): void {
    this.data.weight = weight;
    this.data.updatedAt = new Date();
  }

  /**
   * Transforms this predicate to a different observer frame
   * @param newFrame The new observer frame
   * @returns A new predicate object in the new frame
   */
  transformToFrame(newFrame: ObserverFrame): UORObject {
    const newPredicate = new PredicateObject(this.id, this.data);
    newPredicate.setObserverFrame(newFrame);
    return newPredicate;
  }

  /**
   * Computes the prime decomposition of this predicate
   * @returns The prime decomposition
   */
  computePrimeDecomposition(): PrimeDecomposition {
    const primeFactors: PrimeFactor[] = [
      {
        id: `predicate:${this.id}`,
        value: { id: this.id, type: 'predicate' },
        domain: 'predicate'
      },
      {
        id: `predicate:title:${this.data.title}`,
        value: { title: this.data.title },
        domain: 'predicate.title'
      },
      {
        id: `predicate:source:${this.data.sourceRef}`,
        value: { sourceRef: this.data.sourceRef },
        domain: 'predicate.source'
      },
      {
        id: `predicate:target:${this.data.targetRef}`,
        value: { targetRef: this.data.targetRef },
        domain: 'predicate.target'
      },
      {
        id: `predicate:type:${this.data.predicateType}`,
        value: { predicateType: this.data.predicateType },
        domain: 'predicate.type'
      },
      {
        id: `predicate:bidirectional:${this.data.bidirectional}`,
        value: { bidirectional: this.data.bidirectional },
        domain: 'predicate.property'
      }
    ];
    
    if (this.data.customType) {
      primeFactors.push({
        id: `predicate:customType:${this.data.customType}`,
        value: { customType: this.data.customType },
        domain: 'predicate.type'
      });
    }
    
    if (this.data.weight !== undefined) {
      primeFactors.push({
        id: `predicate:weight:${this.data.weight}`,
        value: { weight: this.data.weight },
        domain: 'predicate.property'
      });
    }
    
    if (this.data.tags && this.data.tags.length > 0) {
      this.data.tags.forEach(tag => {
        primeFactors.push({
          id: `predicate:tag:${tag}`,
          value: { tag },
          domain: 'predicate.tag'
        });
      });
    }
    
    return {
      primeFactors,
      decompositionMethod: 'predicate-decomposition'
    };
  }

  /**
   * Computes the canonical representation of this predicate
   * @returns The canonical representation
   */
  computeCanonicalRepresentation(): CanonicalRepresentation {
    const canonicalData = {
      id: this.data.id,
      title: this.data.title,
      sourceRef: this.data.sourceRef,
      targetRef: this.data.targetRef,
      predicateType: this.data.predicateType,
      customType: this.data.customType,
      bidirectional: this.data.bidirectional,
      weight: this.data.weight,
      tags: this.data.tags ? [...this.data.tags].sort() : [],
      createdAt: this.data.createdAt.toISOString(),
      updatedAt: this.data.updatedAt.toISOString(),
      createdBy: this.data.createdBy
    };
    
    return {
      representationType: 'predicate-canonical',
      value: canonicalData,
      coherenceNorm: this.measureCoherence().value
    };
  }

  /**
   * Measures the coherence of this predicate representation
   * @returns The coherence measure
   */
  measureCoherence(): CoherenceMeasure {
    let coherenceScore = 0;
    
    if (this.data.title && this.data.title.length > 0) coherenceScore += 0.1;
    
    if (this.data.sourceRef && this.data.sourceRef.length > 0) coherenceScore += 0.3;
    if (this.data.targetRef && this.data.targetRef.length > 0) coherenceScore += 0.3;
    
    if (this.data.predicateType) coherenceScore += 0.2;
    
    if (this.data.predicateType === PredicateType.CUSTOM && this.data.customType) {
      coherenceScore += 0.1;
    }
    
    return {
      type: 'predicate-coherence',
      value: coherenceScore,
      normalization: 'linear-sum'
    };
  }

  /**
   * Serializes this predicate to a JSON representation
   * @returns Serialized predicate object
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
   * Validates this predicate against its schema
   * @returns Whether the predicate is valid
   */
  validate(): boolean {
    if (!this.data.id || this.data.id !== this.id) {
      return false;
    }
    
    if (!this.data.title || this.data.title.trim() === '') {
      return false;
    }
    
    if (!this.data.sourceRef || this.data.sourceRef.trim() === '') {
      return false;
    }
    
    if (!this.data.targetRef || this.data.targetRef.trim() === '') {
      return false;
    }
    
    if (!this.data.predicateType) {
      return false;
    }
    
    if (this.data.predicateType === PredicateType.CUSTOM && !this.data.customType) {
      return false;
    }
    
    if (!this.data.createdBy || this.data.createdBy.trim() === '') {
      return false;
    }
    
    return true;
  }

  /**
   * Gets the intrinsic prime factors for the predicate domain
   * @returns Array of intrinsic prime factors
   */
  getIntrinsicPrimes(): PrimeFactor[] {
    return [
      {
        id: 'predicate:core',
        value: { type: 'predicate' },
        domain: 'predicate'
      }
    ];
  }
}
