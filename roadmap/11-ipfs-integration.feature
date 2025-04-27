Feature: IPFS Provider Integration
  As a UOR-MCP user
  I want to use IPFS as an alternative storage provider
  So that my UOR objects can be stored in a decentralized network

  Background:
    Given I am authenticated
    And the UOR core implementation is complete

  Scenario: IPFS Provider Configuration
    When I configure an IPFS provider
    Then I should be able to specify an IPFS node endpoint
    And I should be able to provide authentication if required
    And the system should verify connectivity to the IPFS node
    And the provider configuration should be stored in my user settings

  Scenario: UOR Object Storage in IPFS
    When I store a UOR object using IPFS
    Then the object should be stored with its canonical representation
    And the storage operation should return an IPFS content identifier (CID)
    And the CID should be recorded in my uordb repository
    And the object should be retrievable via its CID

  Scenario: IPFS Provider for Large Content
    When I store large content using IPFS
    Then the content should be chunked appropriately
    And each chunk should be stored as a separate IPFS object
    And a directory structure should link all chunks together
    And the complete content should be retrievable via the root CID

  Scenario: UOR Reference Resolution for IPFS
    When I reference a UOR object stored in IPFS
    Then the system should resolve the reference to the IPFS CID
    And the object should be retrieved from IPFS
    And the retrieved object should be verified against its canonical representation
    And the system should handle IPFS retrieval failures gracefully

  Scenario: Provider Fallback Mechanism
    When an IPFS operation fails
    Then the system should attempt to fall back to GitHub storage
    And the fallback should be transparent to the user
    And the system should log the failure and fallback
    And subsequent operations should consider the provider status