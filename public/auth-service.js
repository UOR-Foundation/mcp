/**
 * GitHub Authentication Service
 * Manages GitHub OAuth authentication flow and token management
 * for static GitHub Pages deployment
 */

class AuthService {
  constructor() {
    this.config = window.MCPConfig.getConfig();
    this.listeners = [];
    
    // Initialize state from storage
    this.initializeFromStorage();
    
    // Listen for storage events (for cross-tab synchronization)
    window.addEventListener('storage', (event) => {
      if (event.key === 'github-auth-state') {
        this.initializeFromStorage();
        this.notifyListeners();
      }
    });
  }
  
  /**
   * Initialize auth state from storage
   */
  initializeFromStorage() {
    // Get stored auth state
    const authStateJson = localStorage.getItem('github-auth-state');
    
    if (authStateJson) {
      try {
        this.authState = JSON.parse(authStateJson);
        
        // Check if token is expired
        if (this.authState.expiresAt && Date.now() > this.authState.expiresAt) {
          console.log('Token expired, attempting refresh');
          this.refreshToken();
        }
      } catch (error) {
        console.error('Error parsing auth state:', error);
        this.authState = null;
      }
    } else {
      this.authState = null;
    }
  }
  
  /**
   * Save auth state to storage
   * @param {object} state - Auth state to save
   */
  saveAuthState(state) {
    this.authState = state;
    
    if (state) {
      localStorage.setItem('github-auth-state', JSON.stringify(state));
      
      // Also store token and user separately for backward compatibility
      if (state.token) {
        localStorage.setItem('github-token', state.token);
      }
      if (state.user) {
        localStorage.setItem('github-user', JSON.stringify(state.user));
      }
    } else {
      localStorage.removeItem('github-auth-state');
      localStorage.removeItem('github-token');
      localStorage.removeItem('github-user');
    }
    
    // Notify service worker about auth state change
    this.notifyServiceWorker(state);
    
    // Notify listeners
    this.notifyListeners();
  }
  
  /**
   * Notify service worker about auth state change
   * @param {object} state - Auth state
   */
  notifyServiceWorker(state) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      try {
        // Create a sanitized version of auth state with only necessary data
        const sanitizedState = state ? {
          token: state.token,
          user: state.user ? { login: state.user.login } : null
        } : null;
        
        // Send auth state to service worker
        navigator.serviceWorker.controller.postMessage({
          type: 'AUTH_STATE_CHANGE',
          authState: sanitizedState
        });
      } catch (error) {
        console.error('Error notifying service worker:', error);
      }
    }
  }
  
  /**
   * Start the GitHub OAuth flow
   */
  startAuthFlow() {
    // GitHub OAuth redirect
    const clientId = this.config.githubOAuth.clientId;
    if (!clientId) {
      throw new Error('GitHub client ID is not configured');
    }
    
    const redirectUri = this.config.githubOAuth.redirectUri;
    const scopes = this.config.githubOAuth.scopes.join(' ');
    
    // Add state parameter for security
    const state = this.generateRandomString(32);
    // Store state for verification
    sessionStorage.setItem('github-oauth-state', state);
    
    // Build the OAuth URL
    const oauthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${state}`;
    
    // Store auth flow start time
    sessionStorage.setItem('github-auth-flow-started', Date.now().toString());
    
    return oauthUrl;
  }
  
  /**
   * Handle the OAuth callback
   * @param {string} code - Authorization code from GitHub
   * @param {string} state - State parameter from GitHub
   * @returns {Promise<object>} Authentication result
   */
  async handleCallback(code, state) {
    // Verify state parameter
    const savedState = sessionStorage.getItem('github-oauth-state');
    if (!savedState || savedState !== state) {
      throw new Error('Invalid state parameter');
    }
    
    // Clear state
    sessionStorage.removeItem('github-oauth-state');
    
    // Exchange code for token
    const tokenResult = await this.exchangeCodeForToken(code);
    
    // Get user information
    const user = await this.getUserInfo(tokenResult.access_token);
    
    // Store auth state
    this.saveAuthState({
      token: tokenResult.access_token,
      tokenType: tokenResult.token_type,
      scope: tokenResult.scope,
      refreshToken: tokenResult.refresh_token,
      expiresAt: tokenResult.expires_in ? Date.now() + (tokenResult.expires_in * 1000) : null,
      user: user
    });
    
    return {
      success: true,
      user: user
    };
  }
  
  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from GitHub
   * @returns {Promise<object>} Token response
   */
  async exchangeCodeForToken(code) {
    // In a real implementation, this would call a secure server-side endpoint
    // Since we're on GitHub Pages, we simulate the exchange for demonstration
    
    if (this.config.githubOAuth.tokenExchangeProxy) {
      // If a token exchange proxy is configured, use it
      try {
        const response = await fetch(this.config.githubOAuth.tokenExchangeProxy, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            code: code,
            client_id: this.config.githubOAuth.clientId,
            redirect_uri: this.config.githubOAuth.redirectUri
          })
        });
        
        if (!response.ok) {
          throw new Error(`Token exchange failed: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Token exchange error:', error);
        // Fall back to simulation for demo/development
      }
    }
    
    // Simulate a token response for demonstration
    console.warn('Using simulated token exchange. This is not secure for production.');
    return {
      access_token: `simulated_${this.generateRandomString(16)}`,
      token_type: 'bearer',
      scope: this.config.githubOAuth.scopes.join(','),
      refresh_token: `refresh_${this.generateRandomString(16)}`,
      expires_in: 3600 // 1 hour
    };
  }
  
  /**
   * Get user information from GitHub API
   * @param {string} token - Access token
   * @returns {Promise<object>} User information
   */
  async getUserInfo(token) {
    // For a real token, actually call the GitHub API
    if (!token.startsWith('simulated_')) {
      try {
        const response = await fetch(`${this.config.apiEndpoints.github}/user`, {
          headers: {
            'Authorization': `token ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to get user info: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error fetching user info:', error);
        // Fall back to simulation
      }
    }
    
    // Simulate user info for demonstration
    return {
      login: `user_${this.generateRandomString(8)}`,
      id: Math.floor(Math.random() * 1000000),
      name: 'Simulated User',
      email: `user_${this.generateRandomString(8)}@example.com`,
      avatar_url: `https://avatars.githubusercontent.com/u/${Math.floor(Math.random() * 1000000)}`
    };
  }
  
  /**
   * Refresh the access token
   * @returns {Promise<boolean>} Whether token refresh was successful
   */
  async refreshToken() {
    if (!this.authState || !this.authState.refreshToken) {
      return false;
    }
    
    try {
      // In a real implementation, this would call a secure server-side endpoint
      // For demonstration, simulate a successful refresh
      console.log('Refreshing token...');
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newState = {
        ...this.authState,
        token: `refreshed_${this.generateRandomString(16)}`,
        expiresAt: Date.now() + (3600 * 1000) // 1 hour
      };
      
      this.saveAuthState(newState);
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }
  
  /**
   * Log out the current user
   */
  logout() {
    this.saveAuthState(null);
  }
  
  /**
   * Check if the user is authenticated
   * @returns {boolean} Whether the user is authenticated
   */
  isAuthenticated() {
    return !!(this.authState && this.authState.token);
  }
  
  /**
   * Get the current auth state
   * @returns {object|null} Current auth state
   */
  getAuthState() {
    return this.authState;
  }
  
  /**
   * Get the access token
   * @returns {string|null} Access token
   */
  getToken() {
    return this.authState?.token || null;
  }
  
  /**
   * Get the current user
   * @returns {object|null} User information
   */
  getUser() {
    return this.authState?.user || null;
  }
  
  /**
   * Add an auth state change listener
   * @param {Function} listener - Listener function
   */
  addListener(listener) {
    this.listeners.push(listener);
  }
  
  /**
   * Remove an auth state change listener
   * @param {Function} listener - Listener function to remove
   */
  removeListener(listener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }
  
  /**
   * Notify all listeners of auth state change
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.authState);
      } catch (error) {
        console.error('Error in auth listener:', error);
      }
    });
  }
  
  /**
   * Generate a random string
   * @param {number} length - Length of string to generate
   * @returns {string} Random string
   */
  generateRandomString(length) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    const values = new Uint8Array(length);
    window.crypto.getRandomValues(values);
    
    for (let i = 0; i < length; i++) {
      result += charset[values[i] % charset.length];
    }
    
    return result;
  }
}

// Create and export global instance
window.authService = new AuthService();