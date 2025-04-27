Feature: Prime Decomposition Algorithms
  As a UOR-MCP developer
  I want to implement prime decomposition algorithms for different data types
  So that all objects can be factorized into their canonical representations

  Background:
    Given the UOR core implementation is complete

  Scenario: Text Content Decomposition
    When I implement text content decomposition
    Then text should be factorizable into semantic units
    And the decomposition should be reversible
    And the decomposition should be deterministic
    And the prime factors should capture essential semantic structure

  Scenario: Structured Data Decomposition
    When I implement structured data decomposition
    Then JSON and XML objects should be factorizable
    And the decomposition should preserve structural relationships
    And the decomposition should be schema-aware when applicable
    And the prime factors should represent minimal structural elements

  Scenario: Media Content Decomposition
    When I implement basic media content decomposition
    Then media metadata should be factorizable
    And simple image characteristics should be factorizable
    And content references should be factorizable
    And the decomposition should support chunked content

  Scenario: Linked Data Decomposition
    When I implement linked data decomposition
    Then relationship structures should be factorizable
    And graph-like data should maintain connection integrity
    And circular references should be properly handled
    And the prime factors should represent atomic relationship elements

  Scenario: Domain-Specific Decomposition
    When I implement domain-specific decomposition
    Then domain types should have specialized factorization algorithms
    And the algorithms should respect domain-specific integrity constraints
    And the algorithms should produce optimal factorizations for the domain
    And the system should be extensible for new domain types