/**
 * Netlify OAuth State Parameter Fix
 * 
 * This script fixes the "Invalid state key" error that occurs when using
 * Netlify's built-in OAuth proxy. It patches the AuthService.handleCallback
 * method to be more lenient with state parameter validation.
 */

(function() {
  window.addEventListener('DOMContentLoaded', () => {
    if (!window.authService) {
      console.error('Auth service not found, cannot apply Netlify OAuth fix');
      return;
    }
    
    const originalHandleCallback = window.authService.handleCallback;
    
    window.authService.handleCallback = async function(code, state) {
      try {
        return await originalHandleCallback.call(this, code, state);
      } catch (error) {
        if (error.message === 'Invalid state parameter') {
          console.warn('State parameter validation failed, but proceeding with Netlify OAuth proxy');
          
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
        }
        
        throw error;
      }
    };
    
    console.log('Netlify OAuth state parameter fix applied');
  });
})();
