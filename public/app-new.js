/**
 * UOR MCP Server Client-Side Application
 * Enhanced version with modular UI components
 */

const config = window.MCPConfig.getConfig();

document.addEventListener('DOMContentLoaded', async () => {
  const appRoot = document.getElementById('app-root');
  if (appRoot && window.MainUIComponent) {
    window.MainUIComponent.initialize(appRoot);
  }
  
  initializeAuthService();
  
  try {
    const capabilities = await window.mcpClient.initialize();
    console.log('MCP Protocol initialized with capabilities:', capabilities);
    
    if (window.authService && window.authService.isAuthenticated()) {
      await updateAuthState();
    }
  } catch (error) {
    console.error('MCP initialization failed:', error);
    showToast(`MCP initialization error: ${error.message}`, 'error');
  }
});

/**
 * Initialize the authentication service
 */
function initializeAuthService() {
  if (!window.authService) {
    console.error('Auth service not available');
    return;
  }
  
  window.authService.onAuthStateChanged(async () => {
    await updateAuthState();
  });
  
  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) return;
    
    if (event.data && event.data.type === 'github-auth-success') {
      updateAuthState();
    }
  });
}

/**
 * Update authentication state
 */
async function updateAuthState() {
  if (!window.authService) return;
  
  if (window.authService.isAuthenticated()) {
    const user = window.authService.getUser();
    const token = window.authService.getToken();
    
    if (user && token) {
      try {
        await window.mcpClient.sendRequest('setAuthentication', {
          username: user.login || user.username,
          token: token
        });
        
        if (window.MainUIComponent) {
          window.MainUIComponent.updateAuthState();
        }
      } catch (error) {
        console.error('Error updating auth state:', error);
        showToast(`Error: ${error.message}`, 'error');
      }
    } else {
      try {
        await window.authService.refreshToken();
        updateAuthState(); // Retry after refresh
      } catch (error) {
        console.error('Failed to refresh token:', error);
        window.authService.logout(); // Clear invalid state
        updateAuthState(); // Update UI to logged out state
      }
    }
  } else {
    await window.mcpClient.sendRequest('clearAuthentication', {});
    
    if (window.MainUIComponent) {
      window.MainUIComponent.updateAuthState();
    }
  }
}

/**
 * Show a toast notification
 * @param {string} message Message to display
 * @param {string} type Toast type (success, error, info, warning)
 * @param {number} duration Duration in milliseconds
 */
function showToast(message, type = 'info', duration = 3000) {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-content">${message}</div>
    <button class="toast-close">&times;</button>
  `;
  
  toastContainer.appendChild(toast);
  
  const closeButton = toast.querySelector('.toast-close');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      toast.remove();
    });
  }
  
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}

/**
 * Global error handler
 */
window.addEventListener('error', (event) => {
  console.error('Unhandled error:', event.error);
  showToast(`Unhandled error: ${event.error?.message || 'Unknown error'}`, 'error');
});

/**
 * Global promise rejection handler
 */
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  showToast(`Unhandled promise rejection: ${event.reason?.message || 'Unknown error'}`, 'error');
});
