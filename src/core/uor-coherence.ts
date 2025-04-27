/**
 * UOR Coherence Utilities
 * Provides advanced coherence metrics and measurement algorithms
 */
import { 
  UORObject, 
  CoherenceMeasure, 
  CanonicalRepresentation, 
  PrimeDecomposition 
} from './uor-core';

/**
 * Available coherence metric types
 */
export enum CoherenceMetricType {
  REPRESENTATION_COMPLETENESS = 'representation-completeness',
  PRIME_FACTOR_INTEGRITY = 'prime-factor-integrity',
  OBSERVER_INVARIANCE = 'observer-invariance',
  TRILATERAL_COHERENCE = 'trilateral-coherence',
  INFORMATION_DENSITY = 'information-density',
  STRUCTURAL_INTEGRITY = 'structural-integrity'
}

/**
 * Available normalization methods
 */
export enum CoherenceNormalization {
  UNIT_NORMALIZED = 'unit-normalized',
  LOG_NORMALIZED = 'log-normalized',
  EXPONENTIAL_NORMALIZED = 'exponential-normalized',
  RELATIVE_NORMALIZED = 'relative-normalized'
}

/**
 * Coherence measurement utilities
 */
export class CoherenceMetrics {
  /**
   * Measures representation completeness coherence
   * This metric quantifies how completely the canonical representation captures the object
   * @param obj The UOR object to measure
   * @returns Coherence measure
   */
  static measureRepresentationCompleteness(obj: UORObject): CoherenceMeasure {
    // Ensure we have both decomposition and representation
    if (!obj.primeDecomposition || !obj.canonicalRepresentation) {
      return {
        type: CoherenceMetricType.REPRESENTATION_COMPLETENESS,
        value: 0.5, // Default value without full components
        normalization: CoherenceNormalization.UNIT_NORMALIZED
      };
    }

    // Ratio of prime factors to representation size
    const factorCount = obj.primeDecomposition.primeFactors.length;
    const representationSize = JSON.stringify(obj.canonicalRepresentation.value).length;
    
    // Higher ratio indicates better coherence (more factors, concise representation)
    const coherenceValue = Math.min(1.0, factorCount / (Math.log(representationSize) + 1));
    
    return {
      type: CoherenceMetricType.REPRESENTATION_COMPLETENESS,
      value: coherenceValue,
      normalization: CoherenceNormalization.UNIT_NORMALIZED,
      referenceFrame: obj.observerFrame?.id
    };
  }
  
  /**
   * Measures prime factor integrity coherence
   * This metric quantifies the uniqueness and irreducibility of prime factors
   * @param decomposition The prime decomposition to measure
   * @returns Coherence measure
   */
  static measurePrimeFactorIntegrity(decomposition: PrimeDecomposition): CoherenceMeasure {
    if (!decomposition.primeFactors || decomposition.primeFactors.length === 0) {
      return {
        type: CoherenceMetricType.PRIME_FACTOR_INTEGRITY,
        value: 0.0,
        normalization: CoherenceNormalization.UNIT_NORMALIZED
      };
    }
    
    // Check for factor uniqueness (no duplicated factor IDs)
    const factorIds = decomposition.primeFactors.map(factor => factor.id);
    const uniqueFactorIds = new Set(factorIds);
    
    // Factor uniqueness ratio
    const uniquenessRatio = uniqueFactorIds.size / factorIds.length;
    
    // Average factor complexity (simple factors preferred)
    const avgComplexity = decomposition.primeFactors.reduce((sum, factor) => {
      const complexity = JSON.stringify(factor.value).length;
      return sum + Math.min(1.0, 10 / complexity); // Higher score for simpler factors
    }, 0) / decomposition.primeFactors.length;
    
    // Combined measure
    const coherenceValue = (uniquenessRatio + avgComplexity) / 2;
    
    return {
      type: CoherenceMetricType.PRIME_FACTOR_INTEGRITY,
      value: coherenceValue,
      normalization: CoherenceNormalization.UNIT_NORMALIZED
    };
  }
  
  /**
   * Measures observer invariance coherence
   * This metric quantifies how well essential properties are preserved across observers
   * @param representation The canonical representation to measure
   * @param referenceFrame The observer frame to consider
   * @returns Coherence measure
   */
  static measureObserverInvariance(
    representation: CanonicalRepresentation,
    referenceFrame?: string
  ): CoherenceMeasure {
    // Simple measure for this implementation
    return {
      type: CoherenceMetricType.OBSERVER_INVARIANCE,
      value: 1.0, // Assume perfect invariance in our implementation
      normalization: CoherenceNormalization.UNIT_NORMALIZED,
      referenceFrame
    };
  }
  
  /**
   * Measures trilateral coherence
   * This metric quantifies the coherence between object, representation, and observer
   * @param obj The UOR object to measure
   * @returns Coherence measure
   */
  static measureTrilateralCoherence(obj: UORObject): CoherenceMeasure {
    // Ensure we have all three components
    if (!obj.primeDecomposition || !obj.canonicalRepresentation || !obj.observerFrame) {
      return {
        type: CoherenceMetricType.TRILATERAL_COHERENCE,
        value: 0.5, // Default value without full components
        normalization: CoherenceNormalization.UNIT_NORMALIZED
      };
    }
    
    // Measure sub-coherences
    const representationCompleteness = this.measureRepresentationCompleteness(obj).value;
    const primeFactorIntegrity = this.measurePrimeFactorIntegrity(obj.primeDecomposition).value;
    const observerInvariance = this.measureObserverInvariance(
      obj.canonicalRepresentation,
      obj.observerFrame.id
    ).value;
    
    // Aggregate the sub-measures
    const coherenceValue = (representationCompleteness + primeFactorIntegrity + observerInvariance) / 3;
    
    return {
      type: CoherenceMetricType.TRILATERAL_COHERENCE,
      value: coherenceValue,
      normalization: CoherenceNormalization.UNIT_NORMALIZED,
      referenceFrame: obj.observerFrame?.id
    };
  }
  
  /**
   * Computes the optimal coherence measure for an object
   * @param obj The UOR object to measure
   * @returns The optimal coherence measure
   */
  static measureOptimalCoherence(obj: UORObject): CoherenceMeasure {
    // Compute various coherence measures
    const measures = [
      this.measureRepresentationCompleteness(obj),
      obj.primeDecomposition ? this.measurePrimeFactorIntegrity(obj.primeDecomposition) : undefined,
      obj.canonicalRepresentation ? this.measureObserverInvariance(obj.canonicalRepresentation, obj.observerFrame?.id) : undefined,
      this.measureTrilateralCoherence(obj)
    ].filter(measure => measure !== undefined) as CoherenceMeasure[];
    
    // Return the measure with the highest value
    return measures.reduce((best, current) => 
      current.value > best.value ? current : best, 
      measures[0]
    );
  }
  
  /**
   * Normalize a coherence value using the specified method
   * @param value Raw coherence value
   * @param method Normalization method
   * @returns Normalized coherence value
   */
  static normalizeCoherence(value: number, method: CoherenceNormalization): number {
    switch (method) {
      case CoherenceNormalization.UNIT_NORMALIZED:
        // Clamp to [0,1]
        return Math.max(0, Math.min(1, value));
        
      case CoherenceNormalization.LOG_NORMALIZED:
        // Log normalization for very large values
        return Math.max(0, Math.min(1, Math.log(value + 1) / Math.log(101)));
        
      case CoherenceNormalization.EXPONENTIAL_NORMALIZED:
        // Exponential normalization for very small values
        return Math.max(0, Math.min(1, 1 - Math.exp(-value)));
        
      case CoherenceNormalization.RELATIVE_NORMALIZED:
        // Relative to a baseline of 0.5
        return Math.max(0, Math.min(1, 0.5 + value / 2));
        
      default:
        return value;
    }
  }
}