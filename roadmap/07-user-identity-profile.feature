Feature: User Identity and Profile Management
  As a UOR-MCP user
  I want to manage my identity and profile information
  So that I can control how I'm represented in the UOR system

  Background:
    Given I am authenticated with GitHub
    And I have a uordb repository

  Scenario: UOR Identity Creation
    When I create my UOR identity
    Then a UOR object should be created representing my identity
    And the identity should be linked to my GitHub account
    And the identity should have a unique UOR identifier
    And the identity should be stored in my uordb repository

  Scenario: Profile Information Management
    When I update my profile information
    Then the changes should be stored in my identity UOR object
    And the profile should support basic fields like name, bio, and contact information
    And the profile should support custom fields
    And all profile data should have canonical UOR representation

  Scenario: Public Identity Verification
    When others view my public identity
    Then they should see my verified GitHub username
    And they should see my public profile information
    And they should be able to verify my identity through GitHub
    And sensitive information should be protected

  Scenario: Profile Image Management
    When I set my profile image
    Then the image should be stored using UOR artifact representation
    And the image should be viewable by others
    And the image should be available in different resolutions
    And the image should be linked to my identity UOR object