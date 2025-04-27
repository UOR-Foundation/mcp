Feature: User Content Management
  As a UOR-MCP user
  I want to create and manage different types of content
  So that I can build a personal knowledge repository

  Background:
    Given I am authenticated with GitHub
    And I have a uordb repository

  Scenario: Concept Creation and Management
    When I create a concept
    Then the concept should be stored as a UOR object
    And the concept should have a canonical representation
    And the concept should be categorized appropriately
    And I should be able to update, retrieve, and delete the concept

  Scenario: Resource Creation and Management
    When I create a resource
    Then the resource should be stored as a UOR object
    And the resource content should be factorized using prime decomposition
    And the resource should maintain its canonical representation
    And I should be able to update, retrieve, and delete the resource

  Scenario: Topic Creation and Management
    When I create a topic
    Then the topic should be stored as a UOR object
    And the topic should be able to reference concepts and resources
    And the topic should maintain its canonical representation
    And I should be able to update, retrieve, and delete the topic

  Scenario: Predicate Creation and Management
    When I create a predicate connecting UOR objects
    Then the predicate should be stored as a UOR object
    And the predicate should reference source and target objects
    And the predicate should have a semantic relationship type
    And I should be able to update, retrieve, and delete the predicate

  Scenario: Media Content Management
    When I upload media content
    Then the content should be stored using UOR artifact representation
    And large content should be chunked appropriately
    And the content should have proper metadata
    And the content should be retrievable through UOR references