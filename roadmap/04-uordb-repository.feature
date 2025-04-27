Feature: UORDB Repository Management
  As a UOR-MCP user
  I want my personal UORDB repository created and managed
  So that my UOR objects can be stored and versioned

  Background:
    Given I am authenticated with GitHub
    And I have or need a uordb repository

  Scenario: Repository Creation
    When I access the MCP server for the first time
    Then the system should check if I have a uordb repository
    And if not, create a uordb repository in my GitHub account
    And initialize the repository with the correct directory structure
    And create a README.md with basic information

  Scenario: Repository Structure Initialization
    When a new uordb repository is created
    Then it should contain directories for concepts, resources, topics, predicates, and resolvers
    And it should include a basic index.json file with repository metadata
    And all directories should have appropriate .gitkeep files
    And the repository should be initialized with a main branch

  Scenario: Repository Access Verification
    When I access my uordb repository through the MCP server
    Then the system should verify I have write access to the repository
    And the system should handle permission errors gracefully
    And inform me if I need to adjust repository permissions

  Scenario: Repository Status Monitoring
    When I view my uordb repository status
    Then I should see the repository creation date
    And I should see the last synchronization time
    And I should see the number of objects in each category
    And I should be able to trigger a manual refresh of status information