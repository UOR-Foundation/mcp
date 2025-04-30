/**
 * UOR MCP Server Client-Side Application
 * Implements GitHub Pages compatible functionality with MCP Protocol support
 */

// Load configuration
const config = window.MCPConfig.getConfig();

// Application initialization
document.addEventListener('DOMContentLoaded', async () => {
  // Set app version
  document.getElementById('app-version').textContent = 
    `Version: ${config.appVersion || '1.0.0'}`;
    
  // Initialize GitHub authentication
  initializeGitHubAuth();
  
  // Update MCP endpoint URL
  document.getElementById('mcp-endpoint-url').textContent = 
    `${window.location.origin}/mcp`;
  
  // Initialize MCP protocol connection
  try {
    const capabilities = await window.mcpClient.initialize();
    console.log('MCP Protocol initialized with capabilities:', capabilities);
    
    // Display MCP protocol version
    if (capabilities && capabilities.protocolVersion) {
      const protocolVersionElement = document.getElementById('mcp-protocol-version');
      if (protocolVersionElement) {
        protocolVersionElement.textContent = `MCP Protocol: ${capabilities.protocolVersion}`;
      }
    }
    
    // If authentication is available, show UI elements
    if (window.authService && window.authService.isAuthenticated()) {
      await updateAuthUI();
    }
    
    // Initialize UORdb Manager
    window.uordbManager = new UORdbManager();
  } catch (error) {
    console.error('MCP initialization failed:', error);
    showMessage(`MCP initialization error: ${error.message}`, 'error');
  }
});

// UORdb Manager - client-side repository management
class UORdbManager {
  constructor() {
    this.currentType = 'concept';
    this.currentObjects = [];
    this.bindUIEvents();
    
    // Initialize by refreshing repository status
    this.handleRefreshStatus().catch(error => {
      console.error('Initial status refresh failed:', error);
    });
  }
  
  // Bind all UI event handlers
  bindUIEvents() {
    // Repository action buttons
    const initRepoButton = document.getElementById('init-repo-button');
    if (initRepoButton) {
      initRepoButton.addEventListener('click', this.handleInitRepository.bind(this));
    }
    
    const refreshStatusButton = document.getElementById('refresh-status-button');
    if (refreshStatusButton) {
      refreshStatusButton.addEventListener('click', this.handleRefreshStatus.bind(this));
    }
    
    // Tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.addEventListener('click', this.handleTabClick.bind(this));
    });
    
    // Add buttons
    const addButtons = document.querySelectorAll('.add-button');
    addButtons.forEach(button => {
      button.addEventListener('click', this.handleAddButtonClick.bind(this));
    });
    
    // Modal close buttons
    const closeButtons = document.querySelectorAll('.modal .close');
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        document.getElementById('detail-view').style.display = 'none';
        document.getElementById('create-form').style.display = 'none';
      });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', event => {
      if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
      }
    });
  }
  
  // Handle repository initialization
  async handleInitRepository() {
    try {
      const button = document.getElementById('init-repo-button');
      button.disabled = true;
      button.textContent = 'Initializing...';
      
      const result = await window.mcpClient.initializeRepository();
      
      if (result) {
        showMessage('Repository initialized successfully', 'success');
        await this.handleRefreshStatus();
      } else {
        showMessage('Failed to initialize repository', 'error');
      }
    } catch (error) {
      console.error('Error initializing repository:', error);
      showMessage(`Error: ${error.message}`, 'error');
    } finally {
      const button = document.getElementById('init-repo-button');
      button.disabled = false;
      button.textContent = 'Initialize Repository';
    }
  }
  
  // Handle status refresh
  async handleRefreshStatus() {
    try {
      const button = document.getElementById('refresh-status-button');
      if (button) {
        button.disabled = true;
        button.textContent = 'Refreshing...';
      }
      
      await this.refreshRepositoryStatus();
      await this.refreshCurrentObjects();
      
      showMessage('Repository status refreshed', 'success');
    } catch (error) {
      console.error('Error refreshing status:', error);
      // Only show error message if it's not a 401 (Unauthorized)
      if (!error.message.includes('Authentication required')) {
        showMessage(`Error: ${error.message}`, 'error');
      }
    } finally {
      const button = document.getElementById('refresh-status-button');
      if (button) {
        button.disabled = false;
        button.textContent = 'Refresh Status';
      }
    }
  }
  
  // Handle tab click
  async handleTabClick(event) {
    // Update active tab
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Show corresponding pane
    const tabType = event.target.getAttribute('data-tab');
    const tabPanes = document.querySelectorAll('.tab-pane');
    tabPanes.forEach(pane => {
      pane.classList.remove('active');
    });
    document.getElementById(`${tabType}-tab`).classList.add('active');
    
    // Set current type and refresh objects
    this.currentType = tabType.endsWith('s') ? tabType.slice(0, -1) : tabType;
    await this.refreshCurrentObjects();
  }
  
  // Refresh repository status
  async refreshRepositoryStatus() {
    try {
      // Only proceed if user is authenticated
      if (!window.authService || !window.authService.isAuthenticated()) {
        document.getElementById('repository-status').innerHTML = `
          <p>You need to authenticate with GitHub to access your UOR repository.</p>
        `;
        document.getElementById('content-stats').innerHTML = '';
        return;
      }
      
      const status = await window.mcpClient.getRepositoryStatus();
      
      if (status) {
        // Update repository status display
        document.getElementById('repository-status').innerHTML = `
          <h3>${status.name || 'UOR Repository'}</h3>
          <p>Namespace: ${status.namespace || status.owner}</p>
          <p>Created: ${new Date(status.createdAt || status.creationDate).toLocaleString()}</p>
          <p>Last sync: ${new Date(status.lastSyncTime || Date.now()).toLocaleString()}</p>
        `;
        
        // Update content stats
        const objectCounts = status.objectCounts || {
          concepts: 0,
          resources: 0,
          topics: 0,
          predicates: 0,
          resolvers: 0
        };
        
        const statsHtml = `
          <div class="stat-card">
            <div class="stat-count">${objectCounts.concepts || 0}</div>
            <div class="stat-label">Concepts</div>
          </div>
          <div class="stat-card">
            <div class="stat-count">${objectCounts.resources || 0}</div>
            <div class="stat-label">Resources</div>
          </div>
          <div class="stat-card">
            <div class="stat-count">${objectCounts.topics || 0}</div>
            <div class="stat-label">Topics</div>
          </div>
          <div class="stat-card">
            <div class="stat-count">${objectCounts.predicates || 0}</div>
            <div class="stat-label">Predicates</div>
          </div>
          <div class="stat-card">
            <div class="stat-count">${objectCounts.resolvers || 0}</div>
            <div class="stat-label">Resolvers</div>
          </div>
        `;
        document.getElementById('content-stats').innerHTML = statsHtml;
      } else {
        document.getElementById('repository-status').innerHTML = `
          <p>No repository information available. Click "Initialize Repository" to create one.</p>
        `;
        document.getElementById('content-stats').innerHTML = '';
      }
    } catch (error) {
      console.error('Error getting repository status:', error);
      
      if (error.message.includes('Authentication required')) {
        document.getElementById('repository-status').innerHTML = `
          <p>You need to authenticate with GitHub to access your UOR repository.</p>
        `;
      } else {
        document.getElementById('repository-status').innerHTML = `
          <p class="error">Error retrieving repository status: ${error.message}</p>
        `;
      }
      
      document.getElementById('content-stats').innerHTML = '';
    }
  }
  
  // Refresh current type objects
  async refreshCurrentObjects() {
    try {
      const listElement = document.getElementById(`${this.currentType}s-list`);
      if (!listElement) return;
      
      // Only proceed if user is authenticated
      if (!window.authService || !window.authService.isAuthenticated()) {
        listElement.innerHTML = `<p>You need to authenticate with GitHub to view ${this.currentType}s.</p>`;
        return;
      }
      
      // Show loading
      listElement.innerHTML = '<p>Loading...</p>';
      
      try {
        // List objects
        const objects = await window.mcpClient.listUORObjects(this.currentType);
        this.currentObjects = objects || [];
        
        if (objects && objects.length > 0) {
          // Render object cards
          const objectsHtml = objects.map(obj => this.renderObjectCard(obj)).join('');
          listElement.innerHTML = objectsHtml;
          
          // Attach event handlers to card buttons
          this.attachCardEventHandlers();
        } else {
          listElement.innerHTML = `<p>No ${this.currentType}s found. Click "+ New ${this.currentType.charAt(0).toUpperCase() + this.currentType.slice(1)}" to create one.</p>`;
        }
      } catch (error) {
        console.error(`Error listing ${this.currentType}s:`, error);
        
        if (error.message.includes('Authentication required')) {
          listElement.innerHTML = `<p>You need to authenticate with GitHub to view ${this.currentType}s.</p>`;
        } else {
          listElement.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        }
      }
    } catch (error) {
      console.error('Error refreshing objects:', error);
    }
  }
  
  // Render an object card
  renderObjectCard(obj) {
    return `
      <div class="object-card" data-id="${obj.id}">
        <h5>${obj.name || obj.id}</h5>
        <p>${obj.description || ''}</p>
        <div class="card-actions">
          <button class="card-button view-object" data-id="${obj.id}">View</button>
          <button class="card-button delete delete-object" data-id="${obj.id}">Delete</button>
        </div>
      </div>
    `;
  }
  
  // Attach event handlers to card buttons
  attachCardEventHandlers() {
    // View buttons
    const viewButtons = document.querySelectorAll('.view-object');
    viewButtons.forEach(button => {
      button.addEventListener('click', () => {
        const objId = button.getAttribute('data-id');
        const obj = this.currentObjects.find(o => o.id === objId);
        if (obj) {
          this.showObjectDetail(obj);
        }
      });
    });
    
    // Delete buttons
    const deleteButtons = document.querySelectorAll('.delete-object');
    deleteButtons.forEach(button => {
      button.addEventListener('click', () => {
        const objId = button.getAttribute('data-id');
        if (confirm(`Are you sure you want to delete this ${this.currentType}?`)) {
          this.deleteObject(objId);
        }
      });
    });
  }
  
  // Show object detail
  showObjectDetail(obj) {
    const detailView = document.getElementById('detail-view');
    const detailTitle = document.getElementById('detail-title');
    const detailContent = document.getElementById('detail-content');
    
    // Set title
    detailTitle.textContent = `${this.currentType.charAt(0).toUpperCase() + this.currentType.slice(1)}: ${obj.name || obj.id}`;
    
    // Build content
    let content = `
      <div class="detail-group">
        <h4>ID</h4>
        <div class="detail-value">${obj.id}</div>
      </div>
      <div class="detail-group">
        <h4>Type</h4>
        <div class="detail-value">${obj.type}</div>
      </div>
    `;
    
    // Add properties based on what exists in the object
    for (const [key, value] of Object.entries(obj)) {
      if (['id', 'type'].includes(key)) continue; // Skip already shown fields
      
      if (typeof value === 'object' && value !== null) {
        content += `
          <div class="detail-group">
            <h4>${key.charAt(0).toUpperCase() + key.slice(1)}</h4>
            <div class="detail-value detail-object">${JSON.stringify(value, null, 2)}</div>
          </div>
        `;
      } else if (value !== undefined && value !== null) {
        content += `
          <div class="detail-group">
            <h4>${key.charAt(0).toUpperCase() + key.slice(1)}</h4>
            <div class="detail-value">${value}</div>
          </div>
        `;
      }
    }
    
    // Full JSON representation
    content += `
      <div class="detail-group">
        <h4>Full Object</h4>
        <div class="detail-value detail-object"><pre>${JSON.stringify(obj, null, 2)}</pre></div>
      </div>
    `;
    
    detailContent.innerHTML = content;
    detailView.style.display = 'block';
  }
  
  // Handle add button click
  handleAddButtonClick(event) {
    const type = event.target.getAttribute('data-type');
    const createForm = document.getElementById('create-form');
    const createTitle = document.getElementById('create-title');
    const createFormContent = document.getElementById('create-form-content');
    
    // Set title
    createTitle.textContent = `Create New ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    
    // Build form
    let formHtml = `<form id="create-${type}-form">`;
    
    // Common fields
    formHtml += `
      <div class="form-group">
        <label for="${type}-name">Name:</label>
        <input type="text" id="${type}-name" name="name" class="form-control" required>
      </div>
      <div class="form-group">
        <label for="${type}-description">Description:</label>
        <textarea id="${type}-description" name="description" class="form-control"></textarea>
      </div>
    `;
    
    // Type-specific fields
    switch (type) {
      case 'resource':
        formHtml += `
          <div class="form-group">
            <label for="resource-content">Content:</label>
            <textarea id="resource-content" name="content" class="form-control" required></textarea>
          </div>
        `;
        break;
        
      case 'predicate':
        formHtml += `
          <div class="form-group">
            <label for="predicate-domain">Domain:</label>
            <input type="text" id="predicate-domain" name="domain" class="form-control" required>
          </div>
          <div class="form-group">
            <label for="predicate-range">Range:</label>
            <input type="text" id="predicate-range" name="range" class="form-control" required>
          </div>
        `;
        break;
        
      case 'resolver':
        formHtml += `
          <div class="form-group">
            <label for="resolver-target">Target Namespace:</label>
            <input type="text" id="resolver-target" name="targetNamespace" class="form-control" required>
          </div>
        `;
        break;
        
      case 'topic':
        formHtml += `
          <div class="form-group">
            <label for="topic-related">Related Concepts (comma separated):</label>
            <input type="text" id="topic-related" name="relatedConcepts" class="form-control">
          </div>
        `;
        break;
    }
    
    // Form actions
    formHtml += `
      <div class="form-actions">
        <button type="button" class="button secondary" id="cancel-create">Cancel</button>
        <button type="submit" class="button" id="submit-create">Create</button>
      </div>
    </form>`;
    
    createFormContent.innerHTML = formHtml;
    createForm.style.display = 'block';
    
    // Handle form cancel
    document.getElementById('cancel-create').addEventListener('click', () => {
      createForm.style.display = 'none';
    });
    
    // Handle form submit
    document.getElementById(`create-${type}-form`).addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.createObject(type, e.target);
    });
  }
  
  // Create a new object
  async createObject(type, form) {
    try {
      const formData = new FormData(form);
      const data = {};
      
      // Process form data
      for (const [key, value] of formData.entries()) {
        if (key === 'relatedConcepts' && value) {
          // Split comma-separated values
          data[key] = value.split(',').map(v => v.trim()).filter(v => v);
        } else {
          data[key] = value;
        }
      }
      
      // Disable submit button
      const submitButton = document.getElementById('submit-create');
      submitButton.disabled = true;
      submitButton.textContent = 'Creating...';
      
      // Create UOR object
      const reference = await window.mcpClient.createUOR(type, data);
      
      if (reference) {
        showMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} created successfully`, 'success');
        document.getElementById('create-form').style.display = 'none';
        
        // Refresh objects
        await this.refreshCurrentObjects();
      } else {
        showMessage(`Failed to create ${type}`, 'error');
      }
    } catch (error) {
      console.error(`Error creating ${type}:`, error);
      showMessage(`Error: ${error.message}`, 'error');
    } finally {
      // Reset submit button
      const submitButton = document.getElementById('submit-create');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Create';
      }
    }
  }
  
  // Delete an object
  async deleteObject(id) {
    try {
      const result = await window.mcpClient.deleteUOR(id);
      
      if (result) {
        showMessage(`${this.currentType.charAt(0).toUpperCase() + this.currentType.slice(1)} deleted successfully`, 'success');
        await this.refreshCurrentObjects();
      } else {
        showMessage(`Failed to delete ${this.currentType}`, 'error');
      }
    } catch (error) {
      console.error(`Error deleting ${this.currentType}:`, error);
      showMessage(`Error: ${error.message}`, 'error');
    }
  }
}

// Initialize GitHub authentication
function initializeGitHubAuth() {
  const authButton = document.getElementById('github-auth-button');
  const authStatus = document.getElementById('auth-status');
  const userSection = document.getElementById('user-section');
  
  // Check if already authenticated and update UI
  updateAuthUI();
  
  // Set up auth button click handler
  if (authButton) {
    authButton.addEventListener('click', () => {
      if (window.authService.isAuthenticated()) {
        // If already authenticated, show logout confirmation
        if (confirm('Are you sure you want to log out?')) {
          window.authService.logout();
          updateAuthUI();
        }
      } else {
        // Start new authentication flow
        try {
          const oauthUrl = window.authService.startAuthFlow();
          
          // Open in a popup or redirect
          if (window.innerWidth > 800) {
            window.open(oauthUrl, 'github-oauth', 'width=600,height=800');
          } else {
            window.location.href = oauthUrl;
          }
        } catch (error) {
          showMessage(`Failed to start authentication: ${error.message}`, 'error');
        }
      }
    });
  }
  
  // Add a logout button to the user section
  if (userSection) {
    const logoutButton = document.createElement('button');
    logoutButton.className = 'button secondary';
    logoutButton.textContent = 'Logout';
    logoutButton.addEventListener('click', () => {
      if (confirm('Are you sure you want to log out?')) {
        window.authService.logout();
        updateAuthUI();
      }
    });
    userSection.appendChild(logoutButton);
  }
  
  // Listen for messages from the auth popup
  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) return;
    
    if (event.data && event.data.type === 'github-auth-success') {
      // Authentication was successful, update UI
      updateAuthUI();
    }
  });
  
  // Listen for auth state changes
  if (window.authService) {
    window.authService.addListener(() => {
      updateAuthUI();
    });
  }
}

// Update the UI based on the current authentication state
async function updateAuthUI() {
  const authButton = document.getElementById('github-auth-button');
  const authStatus = document.getElementById('auth-status');
  const userSection = document.getElementById('user-section');
  
  if (!window.authService) return;
  
  if (window.authService.isAuthenticated()) {
    // User is authenticated
    const user = window.authService.getUser();
    const token = window.authService.getToken();
    
    if (user && token) {
      try {
        // Show authenticated user
        if (authStatus) {
          authStatus.innerHTML = `
            <div class="status success">
              Authenticated as <strong>${user.login || user.username}</strong>
              ${user.avatar_url ? `<img src="${user.avatar_url}" alt="${user.login || user.username}" style="width: 32px; height: 32px; border-radius: 50%; margin-left: 8px;">` : ''}
            </div>
          `;
          authStatus.style.display = 'block';
        }
        
        if (authButton) {
          authButton.textContent = 'Switch Account';
        }
        
        // Show user section
        if (userSection) {
          userSection.style.display = 'block';
        }
        
        // Update MCP server with auth info
        await window.mcpClient.sendRequest('setAuthentication', {
          username: user.login || user.username,
          token: token
        });
        
        // Refresh repository status
        if (window.uordbManager) {
          await window.uordbManager.refreshRepositoryStatus();
          await window.uordbManager.refreshCurrentObjects();
        }
      } catch (error) {
        console.error('Error updating auth UI:', error);
        showMessage(`Error: ${error.message}`, 'error');
      }
    } else {
      // We have a token but no user, try to refresh auth state
      try {
        await window.authService.refreshToken();
        updateAuthUI(); // Retry after refresh
      } catch (error) {
        console.error('Failed to refresh token:', error);
        window.authService.logout(); // Clear invalid state
        updateAuthUI(); // Update UI to logged out state
      }
    }
  } else {
    // User is not authenticated
    if (authStatus) {
      authStatus.innerHTML = `
        <div class="status">
          You are not logged in. Please authenticate with GitHub to access your UOR data.
        </div>
      `;
      authStatus.style.display = 'block';
    }
    
    if (authButton) {
      authButton.textContent = 'Authenticate with GitHub';
    }
    
    // Hide user section
    if (userSection) {
      userSection.style.display = 'none';
    }
    
    // Clear MCP server auth info
    await window.mcpClient.sendRequest('clearAuthentication', {});
  }
}

// Show message
function showMessage(message, type = 'info') {
  const messageElement = document.createElement('div');
  messageElement.className = `status ${type}`;
  messageElement.textContent = message;
  
  // Add to status container
  let statusContainer = document.getElementById('status-messages');
  if (!statusContainer) {
    console.warn('Status container not found, creating one');
    const newContainer = document.createElement('div');
    newContainer.id = 'status-messages';
    newContainer.style.position = 'fixed';
    newContainer.style.top = '20px';
    newContainer.style.right = '20px';
    newContainer.style.zIndex = '1000';
    document.body.appendChild(newContainer);
    statusContainer = newContainer;
  }
  
  statusContainer.appendChild(messageElement);
  
  // Auto-remove after 5 seconds for non-error messages
  if (type !== 'error') {
    setTimeout(() => {
      messageElement.remove();
    }, 5000);
  } else {
    // For errors, add a close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.className = 'close-button';
    closeButton.style.marginLeft = '10px';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', () => {
      messageElement.remove();
    });
    messageElement.appendChild(closeButton);
  }
}
