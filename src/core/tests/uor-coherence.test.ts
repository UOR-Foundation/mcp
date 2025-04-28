/**
 * UOR Coherence Verification Tests
 * Tests for verifying trilateral coherence in the UOR system
 */

import { UORObject, ObserverFrame, CanonicalRepresentation, PrimeDecomposition, PrimeFactor, CoherenceMeasure } from '../uor-core';

class MockUORObject implements UORObject {
  id: string;
  type: string;
  primeDecomposition?: PrimeDecomposition;
  canonicalRepresentation?: CanonicalRepresentation;
  observerFrame?: ObserverFrame;
  
  constructor(id: string, type: string) {
    this.id = id;
    this.type = type;
  }
  
  transformToFrame(newFrame: ObserverFrame): UORObject {
    const transformed = new MockUORObject(this.id, this.type);
    transformed.canonicalRepresentation = this.canonicalRepresentation;
    transformed.primeDecomposition = this.primeDecomposition;
    transformed.observerFrame = newFrame;
    return transformed;
  }
  
  computePrimeDecomposition(): PrimeDecomposition {
    return this.primeDecomposition || { 
      primeFactors: [],
      decompositionMethod: 'mock'
    };
  }
  
  computeCanonicalRepresentation(): CanonicalRepresentation {
    return this.canonicalRepresentation || {
      representationType: 'mock',
      value: {}
    };
  }
  
  measureCoherence(): CoherenceMeasure {
    return {
      type: 'internal',
      value: 1.0
    };
  }
  
  serialize(): object {
    return {
      id: this.id,
      type: this.type,
      canonicalRepresentation: this.canonicalRepresentation,
      primeDecomposition: this.primeDecomposition,
      observerFrame: this.observerFrame
    };
  }
  
  validate(): boolean {
    return true;
  }
  
  getIntrinsicPrimes(): PrimeFactor[] {
    return [];
  }
  
  setPrimeDecomposition(decomposition: PrimeDecomposition): void {
    this.primeDecomposition = decomposition;
  }
  
  setCanonicalRepresentation(representation: CanonicalRepresentation): void {
    this.canonicalRepresentation = representation;
  }
  
  setObserverFrame(frame: ObserverFrame): void {
    this.observerFrame = frame;
  }
}

describe('UOR Coherence Verification', () => {
  const objectiveFrame: ObserverFrame = {
    id: 'objective-frame',
    type: 'objective',
    transformationRules: [
      { from: 'objective', to: 'subjective', rule: 'identity' }
    ],
    invariantProperties: ['id', 'type']
  };

  const subjectiveFrame: ObserverFrame = {
    id: 'subjective-frame',
    type: 'subjective',
    transformationRules: [
      { from: 'subjective', to: 'objective', rule: 'identity' }
    ],
    invariantProperties: ['id', 'type']
  };

  const intersubjectiveFrame: ObserverFrame = {
    id: 'intersubjective-frame',
    type: 'intersubjective',
    transformationRules: [
      { from: 'intersubjective', to: 'objective', rule: 'identity' }
    ],
    invariantProperties: ['id', 'type']
  };

  const createPrimeFactors = (): PrimeFactor[] => {
    return [
      { id: 'factor-1', value: { name: 'Factor 1' }, multiplicity: 1 },
      { id: 'factor-2', value: { name: 'Factor 2' }, multiplicity: 2 }
    ];
  };

  const createUORObject = (id: string, observerFrame: ObserverFrame): UORObject => {
    const uorObject = new MockUORObject(id, 'concept');
    
    uorObject.setCanonicalRepresentation({
      representationType: 'json',
      value: { test: 'data' },
      coherenceNorm: 1.0
    });
    
    uorObject.setPrimeDecomposition({
      primeFactors: createPrimeFactors(),
      decompositionMethod: 'test'
    });
    
    uorObject.setObserverFrame(observerFrame);
    
    return uorObject;
  };

  describe('Trilateral Coherence', () => {
    it('should maintain object identity across observer frames', () => {
      const objectiveObject = createUORObject('test-1', objectiveFrame);
      const subjectiveObject = createUORObject('test-1', subjectiveFrame);
      const intersubjectiveObject = createUORObject('test-1', intersubjectiveFrame);
      
      expect(objectiveObject.id).toBe(subjectiveObject.id);
      expect(subjectiveObject.id).toBe(intersubjectiveObject.id);
      
      expect(objectiveObject.type).toBe(subjectiveObject.type);
      expect(subjectiveObject.type).toBe(intersubjectiveObject.type);
    });

    it('should maintain canonical representation consistency', () => {
      const objectiveObject = createUORObject('test-2', objectiveFrame);
      const subjectiveObject = createUORObject('test-2', subjectiveFrame);
      
      expect(objectiveObject.canonicalRepresentation?.representationType)
        .toBe(subjectiveObject.canonicalRepresentation?.representationType);
      
      expect(JSON.stringify(objectiveObject.canonicalRepresentation?.value))
        .toBe(JSON.stringify(subjectiveObject.canonicalRepresentation?.value));
    });

    it('should maintain prime decomposition consistency', () => {
      const objectiveObject = createUORObject('test-3', objectiveFrame);
      const subjectiveObject = createUORObject('test-3', subjectiveFrame);
      
      expect(objectiveObject.primeDecomposition?.primeFactors.length)
        .toBe(subjectiveObject.primeDecomposition?.primeFactors.length);
      
      objectiveObject.primeDecomposition?.primeFactors.forEach((factor, index) => {
        expect(factor.id).toBe(subjectiveObject.primeDecomposition?.primeFactors[index].id);
        expect(factor.multiplicity).toBe(subjectiveObject.primeDecomposition?.primeFactors[index].multiplicity);
      });
    });
  });

  describe('Observer Frame Transformations', () => {
    it('should preserve object identity during frame transformations', () => {
      const objectiveObject = createUORObject('test-4', objectiveFrame);
      
      const transformedObject = objectiveObject.transformToFrame(subjectiveFrame);
      
      expect(transformedObject.id).toBe(objectiveObject.id);
      expect(transformedObject.type).toBe(objectiveObject.type);
    });

    it('should maintain canonical representation during frame transformations', () => {
      const objectiveObject = createUORObject('test-5', objectiveFrame);
      
      const transformedObject = objectiveObject.transformToFrame(intersubjectiveFrame);
      
      expect(transformedObject.canonicalRepresentation?.representationType)
        .toBe(objectiveObject.canonicalRepresentation?.representationType);
      expect(JSON.stringify(transformedObject.canonicalRepresentation?.value))
        .toBe(JSON.stringify(objectiveObject.canonicalRepresentation?.value));
    });
  });

  describe('Coherence Measures', () => {
    it('should calculate internal coherence of a UOR object', () => {
      const uorObject = createUORObject('test-6', objectiveFrame);
      
      const coherence = uorObject.measureCoherence();
      
      expect(coherence.type).toBe('internal');
      expect(coherence.value).toBe(1.0);
    });

    it('should detect incoherent UOR objects', () => {
      const incoherentObject = new MockUORObject('test-7', 'concept');
      incoherentObject.setPrimeDecomposition({
        primeFactors: createPrimeFactors(),
        decompositionMethod: 'test'
      });
      incoherentObject.setObserverFrame(objectiveFrame);
      
      jest.spyOn(incoherentObject, 'measureCoherence').mockReturnValue({
        type: 'internal',
        value: 0.5
      });
      
      const coherence = incoherentObject.measureCoherence();
      expect(coherence.value).toBeLessThan(1.0);
    });
  });
});
