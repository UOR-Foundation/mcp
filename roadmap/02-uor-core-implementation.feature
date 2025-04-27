Feature: UOR Core Implementation [COMPLETED]
  As a UOR-MCP developer
  I want to implement the core UOR abstractions
  So that all objects can be represented in a canonical, base-independent form

  Background:
    Given the UOR schema definitions exist in the models/schemas directory
    And the UOR core abstract class is defined

  Scenario: Prime Decomposition Implementation [COMPLETED]
    When I implement the prime decomposition algorithm
    Then any object should be decomposable into prime factors
    And the factorization should be unique for identical objects
    And the factorization should be stored in a canonical form
    # Completed: BaseUORObject.computePrimeDecomposition implements generic JSON decomposition
    # and specialized implementations exist for different object types

  Scenario: Canonical Representation Implementation [COMPLETED]
    When I implement the canonical representation system
    Then any object should have a unique canonical representation
    And the representation should be observer-invariant
    And the representation should minimize the coherence norm
    # Completed: BaseUORObject.computeCanonicalRepresentation implements normalized JSON representation
    # with key sorting and object normalization to ensure uniqueness

  Scenario: Observer Frame Implementation [COMPLETED]
    When I implement the observer frame system
    Then frames should define perspectives for viewing objects
    And transformations between frames should preserve essential properties
    And invariant properties should remain unchanged across transformations
    # Completed: UORFactory.defaultFrame provides standard observer frame
    # and transformToFrame implemented in all concrete classes
    # with invariant property preservation

  Scenario: Coherence Measure Implementation [COMPLETED]
    When I implement the coherence measurement system
    Then the coherence between object, representation, and observer should be quantifiable
    And the system should optimize for maximum coherence
    And coherence should be verifiable during all operations
    # Completed: Added uor-coherence.ts with CoherenceMetrics class providing
    # advanced coherence measurements including trilateral coherence
    # and optimization for maximum coherence across metrics