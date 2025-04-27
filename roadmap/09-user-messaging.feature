Feature: User-to-User Messaging
  As a UOR-MCP user
  I want to send and receive messages with other users
  So that I can communicate within the UOR framework

  Background:
    Given I am authenticated with GitHub
    And I have a uordb repository
    And other users have uordb repositories

  Scenario: Message Creation
    When I create a message to another user
    Then the message should be stored as a UOR object in my repository
    And the message should have a canonical representation
    And the message should include the recipient's UOR identifier
    And the message should be encrypted if appropriate

  Scenario: Message Publication
    When I publish a message
    Then the message should be added to the uordb publish/subscribe system
    And the message should include proper recipient routing information
    And the system should maintain delivery status information
    And the message should remain in my repository regardless of delivery status

  Scenario: Message Reception
    When another user sends me a message
    Then I should receive a notification
    And the message should be stored in my repository as a UOR object
    And I should be able to verify the sender's identity
    And I should be able to view the message content

  Scenario: Message Thread Management
    When I participate in a message thread
    Then messages should be linked together in a thread structure
    And the thread should maintain chronological order
    And the thread should be retrievable as a cohesive unit
    And new messages should be properly added to existing threads

  Scenario: Message Subscription Management
    When I manage my message subscriptions
    Then I should be able to subscribe to specific users or topics
    And I should be able to unsubscribe from unwanted communications
    And I should be able to set notification preferences
    And subscription changes should take effect immediately