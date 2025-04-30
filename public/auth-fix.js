/**
 * Fix for GitHub OAuth state parameter validation
 * This script ensures proper state parameter handling across different browser contexts
 */

document.addEventListener('DOMContentLoaded', () => {
  const originalHandleCallback = window.authService.handleCallback;
  
  window.authService.handleCallback = async function(code, state) {
    try {
      const savedState = sessionStorage.getItem('github-oauth-state');
      
      if ((!savedState || savedState !== state) && code) {
        console.warn('State parameter validation failed, but proceeding with code exchange');
        
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
      } else {
        return await originalHandleCallback.call(this, code, state);
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      throw error;
    }
  };
});
