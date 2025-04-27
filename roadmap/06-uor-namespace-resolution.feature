Feature: UOR Namespace Resolution
  As a UOR-MCP user
  I want to resolve references across different UOR namespaces
  So that I can access content from other users' repositories

  Background:
    Given I am authenticated with GitHub
    And I have a uordb repository
    And other users have uordb repositories

  Scenario: Resolver Record Creation
    When I create a resolver record pointing to another namespace
    Then the resolver record should be stored in my resolvers directory
    And the record should include the target namespace identifier
    And the record should specify the resolution method
    And the record should have a unique identifier

  Scenario: Direct Namespace Resolution
    When I reference an object in another namespace
    Then the system should check if I have a resolver for that namespace
    And if a resolver exists, it should resolve the reference
    And the resolved reference should maintain the UOR canonical form
    And the system should verify access permissions for the target object

  Scenario: Transitive Namespace Resolution
    When I reference an object that requires multi-step resolution
    Then the system should follow resolver chains across namespaces
    And the system should detect and prevent circular references
    And the resolution path should be recorded for diagnostics
    And the system should have a maximum resolution depth

  Scenario: Namespace Resolution Cache
    When I resolve references across namespaces
    Then successful resolutions should be cached
    And the cache should have an appropriate expiration time
    And the cache should be invalidated when resolver records change
    And the cache should improve resolution performance for repeated requests