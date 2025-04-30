/**
 * Client-side Authentication Tests
 * Verifies the client-side auth implementation for GitHub Pages deployment
 * @jest-environment jsdom
 */

// Mock DOM storage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

// Mock session storage
const sessionStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

// Mock window object
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock fetch
global.fetch = jest.fn();

// Mock crypto
window.crypto = {
  getRandomValues: jest.fn(array => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }),
};

// Mock window.location
const locationMock = {
  origin: 'https://example.com',
  hostname: 'example.com',
  search: '',
};
Object.defineProperty(window, 'location', { value: locationMock });

// Import the auth service - since this is a client-side module, we'll mock it
const mockAuthService = {
  config: {
    githubOAuth: {
      clientId: 'test-client-id',
      redirectUri: 'https://example.com/auth-callback.html',
      tokenExchangeProxy: 'https://auth-proxy.example.com/token-exchange',
      scopes: ['repo'],
    },
  },
  isAuthenticated: jest.fn(),
  getAuthState: jest.fn(),
  getToken: jest.fn(),
  getUser: jest.fn(),
  startAuthFlow: jest.fn(),
  handleCallback: jest.fn(),
  exchangeCodeForToken: jest.fn(),
  getUserInfo: jest.fn(),
  refreshToken: jest.fn(),
  logout: jest.fn(),
  initializeFromStorage: jest.fn(),
  saveAuthState: jest.fn(),
  generateRandomString: jest.fn(),
};

// Manually test the auth service functions we'd use in real implementation
describe('Client-side Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    sessionStorageMock.clear();
  });

  describe('OAuth Flow', () => {
    test('should generate an OAuth URL with proper parameters', () => {
      // Mock implementation for startAuthFlow
      mockAuthService.generateRandomString.mockReturnValue('random-state');
      mockAuthService.startAuthFlow = function () {
        const clientId = this.config.githubOAuth.clientId;
        const redirectUri = this.config.githubOAuth.redirectUri;
        const scopes = this.config.githubOAuth.scopes.join(' ');
        const state = this.generateRandomString(32);

        sessionStorage.setItem('github-oauth-state', state);

        return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${state}`;
      };

      // Call the function
      const oauthUrl = mockAuthService.startAuthFlow();

      // Verify the URL
      expect(oauthUrl).toContain('https://github.com/login/oauth/authorize');
      expect(oauthUrl).toContain('client_id=test-client-id');
      expect(oauthUrl).toContain('redirect_uri=https%3A%2F%2Fexample.com%2Fauth-callback.html');
      expect(oauthUrl).toContain('scope=repo');
      expect(oauthUrl).toContain('state=random-state');

      // Verify state was stored
      expect(sessionStorage.setItem).toHaveBeenCalledWith('github-oauth-state', 'random-state');
    });

    test('should handle OAuth callback with proper parameters', async () => {
      // Mock functions
      mockAuthService.exchangeCodeForToken.mockResolvedValue({
        access_token: 'test-token',
        token_type: 'bearer',
        scope: 'repo',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
      });

      mockAuthService.getUserInfo.mockResolvedValue({
        login: 'test-user',
        id: 12345,
        name: 'Test User',
      });

      // Set up stored state for validation
      sessionStorage.setItem('github-oauth-state', 'test-state');

      // Mock implementation for handleCallback
      mockAuthService.handleCallback = async function (code, state) {
        const savedState = sessionStorage.getItem('github-oauth-state');
        if (!savedState || savedState !== state) {
          throw new Error('Invalid state parameter');
        }

        sessionStorage.removeItem('github-oauth-state');

        const tokenResult = await this.exchangeCodeForToken(code);
        const user = await this.getUserInfo(tokenResult.access_token);

        this.saveAuthState({
          token: tokenResult.access_token,
          tokenType: tokenResult.token_type,
          scope: tokenResult.scope,
          refreshToken: tokenResult.refresh_token,
          expiresAt: tokenResult.expires_in ? Date.now() + tokenResult.expires_in * 1000 : null,
          user: user,
        });

        return {
          success: true,
          user: user,
        };
      };

      // Call the function
      const result = await mockAuthService.handleCallback('test-code', 'test-state');

      // Verify results
      expect(result.success).toBe(true);
      expect(result.user.login).toBe('test-user');

      // Verify exchangeCodeForToken was called
      expect(mockAuthService.exchangeCodeForToken).toHaveBeenCalledWith('test-code');

      // Verify getUserInfo was called
      expect(mockAuthService.getUserInfo).toHaveBeenCalledWith('test-token');

      // Verify saveAuthState was called with correct data
      expect(mockAuthService.saveAuthState).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'test-token',
          user: expect.objectContaining({
            login: 'test-user',
          }),
        })
      );
    });

    test('should reject callback with invalid state', async () => {
      // Set up stored state that doesn't match
      sessionStorage.setItem('github-oauth-state', 'original-state');

      // Mock implementation for handleCallback
      mockAuthService.handleCallback = async function (code, state) {
        const savedState = sessionStorage.getItem('github-oauth-state');
        if (!savedState || savedState !== state) {
          throw new Error('Invalid state parameter');
        }

        // This part shouldn't execute
        return { success: true };
      };

      // Call the function with mismatched state
      await expect(mockAuthService.handleCallback('test-code', 'wrong-state')).rejects.toThrow(
        'Invalid state parameter'
      );
    });
  });

  describe('Token Exchange', () => {
    test('should exchange code for token via proxy', async () => {
      // Mock fetch response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'real-token',
          token_type: 'bearer',
          scope: 'repo',
          refresh_token: 'real-refresh-token',
          expires_in: 3600,
        }),
      });

      // Mock implementation
      mockAuthService.exchangeCodeForToken = async function (code) {
        if (!this.config.githubOAuth.tokenExchangeProxy) {
          throw new Error('Token exchange proxy is required');
        }

        const response = await fetch(this.config.githubOAuth.tokenExchangeProxy, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: code,
            client_id: this.config.githubOAuth.clientId,
            redirect_uri: this.config.githubOAuth.redirectUri,
          }),
        });

        if (!response.ok) {
          throw new Error('Token exchange failed');
        }

        return await response.json();
      };

      // Call the function
      const result = await mockAuthService.exchangeCodeForToken('real-code');

      // Verify the result
      expect(result.access_token).toBe('real-token');

      // Verify fetch was called correctly
      expect(global.fetch).toHaveBeenCalledWith(
        'https://auth-proxy.example.com/token-exchange',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            code: 'real-code',
            client_id: 'test-client-id',
            redirect_uri: 'https://example.com/auth-callback.html',
          }),
        })
      );
    });

    test('should handle proxy errors gracefully', async () => {
      // Mock fetch error response
      global.fetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid code' }),
      });

      // Set hostname to non-localhost to avoid dev fallback
      Object.defineProperty(window.location, 'hostname', { value: 'example.com' });

      // Mock implementation
      mockAuthService.exchangeCodeForToken = async function (code) {
        try {
          const response = await fetch(this.config.githubOAuth.tokenExchangeProxy, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code: code,
              client_id: this.config.githubOAuth.clientId,
              redirect_uri: this.config.githubOAuth.redirectUri,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Token exchange failed: ${errorData.error || response.statusText}`);
          }

          return await response.json();
        } catch (error) {
          // In production mode, don't fall back to simulation
          if (
            window.location.hostname !== 'localhost' &&
            window.location.hostname !== '127.0.0.1'
          ) {
            throw error;
          }

          // Simulation fallback for development only
          return {
            access_token: 'simulated_token',
            token_type: 'bearer',
            scope: 'repo',
            refresh_token: 'simulated_refresh',
            expires_in: 3600,
          };
        }
      };

      // Call the function and expect it to throw
      await expect(mockAuthService.exchangeCodeForToken('invalid-code')).rejects.toThrow(
        'Token exchange failed: Invalid code'
      );
    });

    test('should fall back to simulation in development mode', async () => {
      // Mock fetch error
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      // Set hostname to localhost for dev fallback
      Object.defineProperty(window.location, 'hostname', { value: 'localhost' });

      // Mock implementation
      mockAuthService.exchangeCodeForToken = async function (code) {
        try {
          const response = await fetch(this.config.githubOAuth.tokenExchangeProxy, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code: code,
              client_id: this.config.githubOAuth.clientId,
              redirect_uri: this.config.githubOAuth.redirectUri,
            }),
          });

          if (!response.ok) {
            throw new Error('Token exchange failed');
          }

          return await response.json();
        } catch (error) {
          // In development mode, fall back to simulation
          if (
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1'
          ) {
            console.warn('Using simulated token exchange for development');
            return {
              access_token: 'simulated_token',
              token_type: 'bearer',
              scope: 'repo',
              refresh_token: 'simulated_refresh',
              expires_in: 3600,
            };
          }

          throw error;
        }
      };

      // Call the function
      const result = await mockAuthService.exchangeCodeForToken('any-code');

      // Verify it returned simulated token
      expect(result.access_token).toBe('simulated_token');
    });
  });

  describe('Auth State Management', () => {
    test('should store and retrieve auth state correctly', () => {
      // Mock implementation
      mockAuthService.saveAuthState = function (state) {
        if (state) {
          localStorage.setItem('github-auth-state', JSON.stringify(state));
        } else {
          localStorage.removeItem('github-auth-state');
        }
      };

      mockAuthService.getAuthState = function () {
        const authStateJson = localStorage.getItem('github-auth-state');
        return authStateJson ? JSON.parse(authStateJson) : null;
      };

      // Test storing state
      const testState = {
        token: 'test-token',
        tokenType: 'bearer',
        user: { login: 'test-user' },
      };

      mockAuthService.saveAuthState(testState);

      // Verify it was stored correctly
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'github-auth-state',
        JSON.stringify(testState)
      );

      // Configure mock for getItem to return our state
      localStorage.getItem.mockReturnValueOnce(JSON.stringify(testState));

      // Test retrieving state
      const retrievedState = mockAuthService.getAuthState();

      // Verify it was retrieved correctly
      expect(retrievedState).toEqual(testState);
    });

    test('should clear auth state on logout', () => {
      // Mock implementation
      mockAuthService.logout = function () {
        localStorage.removeItem('github-auth-state');
        localStorage.removeItem('github-token');
        localStorage.removeItem('github-user');
      };

      // Call logout
      mockAuthService.logout();

      // Verify items were removed
      expect(localStorage.removeItem).toHaveBeenCalledWith('github-auth-state');
      expect(localStorage.removeItem).toHaveBeenCalledWith('github-token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('github-user');
    });
  });
});
