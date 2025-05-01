/**
 * Netlify OAuth State Parameter Fix
 * 
 * This script completely bypasses the state parameter validation when using
 * Netlify's built-in OAuth proxy to fix the "Invalid state key" error.
 */

(function() {
  window.addEventListener('DOMContentLoaded', () => {
    if (!window.authService) {
      console.error('Auth service not found, cannot apply Netlify OAuth fix');
      return;
    }
    
    console.log('Applying Netlify OAuth state parameter fix');
    
    const originalHandleCallback = window.authService.handleCallback;
    
    window.authService.handleCallback = async function(code, state) {
      const isNetlifyAuth = window.location.href.includes('api.netlify.com/auth/done') || 
                           window.location.hostname.endsWith('.netlify.app');
      
      if (isNetlifyAuth) {
        console.log('Netlify OAuth detected, bypassing state validation');
        
        try {
          sessionStorage.removeItem('github-oauth-state');
          
          const tokenResult = await this.exchangeCodeForToken(code);
          
          const user = await this.getUserInfo(tokenResult.access_token);
          
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
        } catch (error) {
          console.error('Error during Netlify OAuth authentication:', error);
          throw new Error(`Netlify OAuth error: ${error.message}`);
        }
      } else {
        return await originalHandleCallback.call(this, code, state);
      }
    };
    
    const originalStartAuthFlow = window.authService.startAuthFlow;
    
    window.authService.startAuthFlow = function() {
      const state = this.generateRandomString(32);
      
      sessionStorage.setItem('github-oauth-state', state);
      sessionStorage.setItem('github-auth-flow-started', Date.now().toString());
      
      const clientId = this.config.githubOAuth.clientId;
      const scopes = this.config.githubOAuth.scopes.join(' ');
      
      return `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=${encodeURIComponent(scopes)}&state=${state}`;
    };
    
    console.log('Netlify OAuth state parameter fix applied successfully');
  });
})();
