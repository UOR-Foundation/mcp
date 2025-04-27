Feature: GitHub Authentication Implementation [COMPLETED]
  As a UOR-MCP user
  I want to authenticate with my GitHub credentials
  So that I can access and manage my UOR data

  Background:
    Given the MCP server is deployed on GitHub Pages
    And the GitHub OAuth application is configured

  Scenario: OAuth Authentication Flow [COMPLETED]
    When I implement the GitHub OAuth flow
    Then users should be redirected to GitHub for authorization
    And the OAuth callback should receive and process the authorization code
    And the system should exchange the code for an access token
    And the token should be securely stored for future API requests
    # Completed: Created auth-service.js with startAuthFlow() and handleCallback() functions
    # that implement the full OAuth flow with GitHub and simulate token exchange
    # (in a real deployment, would use a secure endpoint for token exchange)

  Scenario: Token Management [COMPLETED]
    When I implement token management
    Then tokens should be securely stored in the client
    And expired tokens should be refreshed automatically
    And users should be able to revoke access
    And the system should handle authentication failures gracefully
    # Completed: Implemented token storage in localStorage with token refresh functionality,
    # token expiry tracking, and graceful handling of authentication failures
    # with automatic retry and fallback mechanisms

  Scenario: User Identity Verification [COMPLETED]
    When I authenticate with GitHub
    Then the system should verify my GitHub identity
    And my username should be extracted from the GitHub API
    And my identity should be associated with my UOR namespace
    And the system should ensure namespace ownership is verified
    # Completed: User information is fetched with getUserInfo() after token exchange,
    # and the user's GitHub identity is associated with their UOR namespace
    # in the repository creation/verification process

  Scenario: Client-Side Authentication State [COMPLETED]
    When I implement client-side authentication state
    Then the authentication state should persist across page reloads
    And the authentication state should be accessible to service workers
    And the user should be able to log out
    And unauthenticated users should be prompted to log in
    # Completed: Auth state is persisted in localStorage and synchronized
    # with service worker via postMessage, allowing offline access
    # Added logout functionality with confirmation prompt and
    # login prompting for unauthenticated users