/**
 * UOR MCP Server Client-Side Application
 * Implements GitHub Pages compatible functionality
 */

// Load configuration
const config = window.MCPConfig.getConfig();

// MCP Client for MCP protocol requests
class MCPClient {
  constructor(endpoint) {
    this.endpoint = endpoint || `${window.location.origin}/mcp`;
    this.nextRequestId = 1;
  }
  
  /**
   * Sends an MCP request
   * @param {string} method - The method name
   * @param {object} params - The method parameters
   * @returns {Promise<object>} The response result
   */
  async sendRequest(method, params = {}) {
    const requestId = this.nextRequestId++;
    
    const request = {
      jsonrpc: '2.0',
      id: requestId,
      method,
      params
    };
    
    // For client-side implementation, we use a combination of approaches:
    // 1. For GET methods, we use a simulated approach with localStorage
    // 2. For GitHub Pages, we could use a service worker approach
    
    // Store request in localStorage for the MCP endpoint
    localStorage.setItem('mcp-pending-request', JSON.stringify(request));
    
    // In a real implementation with a server, we would use fetch:
    /*
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      throw new Error(`MCP request failed: ${response.statusText}`);
    }
    
    const responseData = await response.json();
    */
    
    // For client-side demo, navigate to MCP endpoint and then come back
    // This is a hack for demonstration and would be replaced with proper calls in production
    const currentUrl = window.location.href;
    
    // Open MCP endpoint in a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = this.endpoint;
    document.body.appendChild(iframe);
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get response from localStorage
    const responseJson = localStorage.getItem('mcp-last-response');
    document.body.removeChild(iframe);
    
    if (!responseJson) {
      throw new Error('No response received from MCP endpoint');
    }
    
    const responseData = JSON.parse(responseJson);
    
    if (responseData.error) {
      throw new Error(`MCP error: ${responseData.error.message}`);
    }
    
    return responseData.result;
  }
  
  /**
   * Initializes the MCP connection
   * @returns {Promise<object>} The initialization result
   */
  async initialize() {
    return this.sendRequest('initialize', {
      protocolVersion: 'DRAFT-2025-v2',
      clientInfo: {
        name: 'uor-mcp-web-client',
        version: '0.1.0'
      },
      capabilities: {
        sampling: {}
      }
    });
  }
  
  /**
   * Lists available tools
   * @returns {Promise<object>} The tools list result
   */
  async listTools() {
    return this.sendRequest('tools/list');
  }
  
  /**
   * Lists available resources
   * @returns {Promise<object>} The resources list result
   */
  async listResources() {
    return this.sendRequest('resources/list');
  }
  
  /**
   * Calls a tool
   * @param {string} name - The tool name
   * @param {object} parameters - The tool parameters
   * @returns {Promise<object>} The tool call result
   */
  async callTool(name, parameters) {
    return this.sendRequest('tool/call', {
      name,
      parameters
    });
  }
}

// GitHub API client for client-side operations
class GitHubClient {
  constructor(token) {
    this.token = token;
    this.apiBase = 'https://api.github.com';
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
  }

  // Get authenticated user
  async getAuthenticatedUser() {
    const response = await this.request('/user');
    return response;
  }

  // Check if repository exists
  async repositoryExists(owner, repo) {
    try {
      await this.request(`/repos/${owner}/${repo}`);
      return true;
    } catch (error) {
      if (error.status === 404) {
        return false;
      }
      throw error;
    }
  }

  // Create repository
  async createRepository(name, description = '', isPrivate = false) {
    const response = await this.request('/user/repos', {
      method: 'POST',
      body: JSON.stringify({
        name,
        description,
        private: isPrivate,
        auto_init: true
      })
    });
    return response;
  }

  // Create file in repository
  async createFile(owner, repo, path, content, message) {
    const encodedContent = btoa(unescape(encodeURIComponent(content)));
    const response = await this.request(`/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify({
        message,
        content: encodedContent
      })
    });
    return response;
  }

  // Get file content
  async getFileContent(owner, repo, path) {
    const response = await this.request(`/repos/${owner}/${repo}/contents/${path}`);
    if (response.content) {
      const content = decodeURIComponent(escape(atob(response.content)));
      return content;
    }
    return null;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = this.apiBase + endpoint;
    
    // Set default headers
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    // Add authorization if token is available
    if (this.token) {
      headers['Authorization'] = `token ${this.token}`;
    } else if (window.authService && window.authService.isAuthenticated()) {
      // If no token was provided but authService has a token, use it
      const token = window.authService.getToken();
      if (token) {
        headers['Authorization'] = `token ${token}`;
        this.token = token; // Update stored token
      }
    }
    
    // Make the request
    let response;
    try {
      response = await fetch(url, {
        ...options,
        headers
      });
      
      // Check for error responses
      if (!response.ok) {
        const error = new Error(`GitHub API error: ${response.statusText}`);
        error.status = response.status;
        error.response = response;
        
        // If unauthorized, try to refresh token and retry
        if (response.status === 401 && window.authService) {
          console.log('Unauthorized, attempting to refresh token...');
          const refreshed = await window.authService.refreshToken();
          if (refreshed) {
            // Retry with new token
            this.token = window.authService.getToken();
            return this.request(endpoint, options);
          }
        }
        
        throw error;
      }
      
      // Parse JSON response
      const data = await response.json();
      return data;
    } catch (error) {
      // If network error or other failure, and we haven't already tried refreshing
      if (!options._retried && window.authService) {
        console.log('Request failed, attempting to refresh token...');
        const refreshed = await window.authService.refreshToken();
        if (refreshed) {
          // Retry with new token
          this.token = window.authService.getToken();
          return this.request(endpoint, { ...options, _retried: true });
        }
      }
      
      throw error;
    }
  }
}

// UOR Client - implements UOR operations
class UORClient {
  constructor(githubClient) {
    this.githubClient = githubClient;
    this.repoName = config.uor.repositoryName || 'uordb';
  }
  
  // Set GitHub client
  setGitHubClient(githubClient) {
    this.githubClient = githubClient;
  }
  
  // Create or get UOR repository
  async getOrCreateRepository(username) {
    const exists = await this.githubClient.repositoryExists(username, this.repoName);
    
    if (!exists) {
      // Create new repository
      const repo = await this.githubClient.createRepository(
        this.repoName, 
        'Universal Object Reference Database',
        false // public repository
      );
      
      // Initialize repository structure
      await this.initializeRepositoryStructure(username);
      
      return {
        ...repo,
        newly_created: true
      };
    }
    
    // Get existing repository
    const repo = await this.githubClient.request(`/repos/${username}/${this.repoName}`);
    return {
      ...repo,
      newly_created: false
    };
  }
  
  // Initialize repository structure
  async initializeRepositoryStructure(username) {
    const directories = [
      'concepts',
      'resources',
      'topics',
      'predicates',
      'resolvers'
    ];
    
    // Create .gitkeep files in each directory
    for (const dir of directories) {
      await this.githubClient.createFile(
        username,
        this.repoName,
        `${dir}/.gitkeep`,
        '',
        `Initialize ${dir} directory`
      );
    }
    
    // Create README.md
    await this.githubClient.createFile(
      username,
      this.repoName,
      'README.md',
      `# Universal Object Reference Database\n\nThis repository contains UOR data for the ${username} namespace.\n`,
      'Initialize UOR database'
    );
    
    // Create index.json
    await this.githubClient.createFile(
      username,
      this.repoName,
      'index.json',
      JSON.stringify({
        namespace: username,
        name: `${username} UOR Database`,
        created: new Date().toISOString(),
        contentTypes: directories
      }, null, 2),
      'Initialize UOR database index'
    );
  }
  
  // Get repository status
  async getRepositoryStatus(username) {
    try {
      const indexContent = await this.githubClient.getFileContent(
        username,
        this.repoName,
        'index.json'
      );
      
      return JSON.parse(indexContent);
    } catch (error) {
      console.error('Error getting repository status:', error);
      return null;
    }
  }
}

// UORdb Manager - client-side repository management
class UORdbManager {
  constructor() {
    this.currentType = 'concept';
    this.currentObjects = [];
    this.bindUIEvents();
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
      
      const result = await window.mcpClient.callTool('initializeRepository', {});
      
      if (result && result.success) {
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
      button.disabled = true;
      button.textContent = 'Refreshing...';
      
      await this.refreshRepositoryStatus();
      await this.refreshCurrentObjects();
      
      showMessage('Repository status refreshed', 'success');
    } catch (error) {
      console.error('Error refreshing status:', error);
      showMessage(`Error: ${error.message}`, 'error');
    } finally {
      const button = document.getElementById('refresh-status-button');
      button.disabled = false;
      button.textContent = 'Refresh Status';
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
      const status = await window.mcpClient.callTool('getRepositoryStatus', {});
      
      if (status) {
        // Update repository status display
        document.getElementById('repository-status').innerHTML = `
          <h3>${status.name}</h3>
          <p>Namespace: ${status.namespace}</p>
          <p>Created: ${new Date(status.creationDate).toLocaleString()}</p>
          <p>Last sync: ${new Date(status.lastSyncTime).toLocaleString()}</p>
        `;
        
        // Update content stats
        const statsHtml = `
          <div class="stat-card">
            <div class="stat-count">${status.objectCounts.concepts}</div>
            <div class="stat-label">Concepts</div>
          </div>
          <div class="stat-card">
            <div class="stat-count">${status.objectCounts.resources}</div>
            <div class="stat-label">Resources</div>
          </div>
          <div class="stat-card">
            <div class="stat-count">${status.objectCounts.topics}</div>
            <div class="stat-label">Topics</div>
          </div>
          <div class="stat-card">
            <div class="stat-count">${status.objectCounts.predicates}</div>
            <div class="stat-label">Predicates</div>
          </div>
          <div class="stat-card">
            <div class="stat-count">${status.objectCounts.resolvers}</div>
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
      document.getElementById('repository-status').innerHTML = `
        <p class="error">Error retrieving repository status: ${error.message}</p>
      `;
    }
  }
  
  // Refresh current type objects
  async refreshCurrentObjects() {
    try {
      const listElement = document.getElementById(`${this.currentType}s-list`);
      
      // Show loading
      listElement.innerHTML = '<p>Loading...</p>';
      
      try {
        // List objects
        const objects = await window.mcpClient.callTool('listObjects', { type: this.currentType });
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
        listElement.innerHTML = `<p class="error">Error: ${error.message}</p>`;
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
    
    // Add type-specific fields
    if (obj.name) {
      content += `
        <div class="detail-group">
          <h4>Name</h4>
          <div class="detail-value">${obj.name}</div>
        </div>
      `;
    }
    
    if (obj.description) {
      content += `
        <div class="detail-group">
          <h4>Description</h4>
          <div class="detail-value">${obj.description}</div>
        </div>
      `;
    }
    
    if (obj.content) {
      content += `
        <div class="detail-group">
          <h4>Content</h4>
          <div class="detail-value">${obj.content}</div>
        </div>
      `;
    }
    
    if (obj.domain && obj.range) {
      content += `
        <div class="detail-group">
          <h4>Domain</h4>
          <div class="detail-value">${obj.domain}</div>
        </div>
        <div class="detail-group">
          <h4>Range</h4>
          <div class="detail-value">${obj.range}</div>
        </div>
      `;
    }
    
    if (obj.targetNamespace) {
      content += `
        <div class="detail-group">
          <h4>Target Namespace</h4>
          <div class="detail-value">${obj.targetNamespace}</div>
        </div>
      `;
    }
    
    if (obj.relatedConcepts && obj.relatedConcepts.length > 0) {
      content += `
        <div class="detail-group">
          <h4>Related Concepts</h4>
          <div class="detail-value">${obj.relatedConcepts.join(', ')}</div>
        </div>
      `;
    }
    
    // Full JSON representation
    content += `
      <div class="detail-group">
        <h4>Full Object</h4>
        <div class="detail-value detail-object">${JSON.stringify(obj, null, 2)}</div>
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
      
      // Create object using appropriate tool based on type
      const toolName = `create${type.charAt(0).toUpperCase() + type.slice(1)}`;
      const result = await window.mcpClient.callTool(toolName, data);
      
      if (result) {
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
      const result = await window.mcpClient.sendRequest('uor.delete', { reference: id });
      
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

// Application initialization
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize MCP client
  window.mcpClient = new MCPClient();
  
  // Initialize GitHub authentication
  initializeGitHubAuth();
  
  // Update MCP endpoint URL
  document.getElementById('mcp-endpoint-url').textContent = 
    `${window.location.origin}/mcp`;
  
  // Set app version
  document.getElementById('app-version').textContent = 
    `Version: ${config.appVersion || '0.1.0'}`;
    
  // Initialize MCP connection
  try {
    const initResult = await window.mcpClient.initialize();
    console.log('MCP initialized:', initResult);
  } catch (error) {
    console.error('MCP initialization failed:', error);
  }
  
  // Initialize UORdb Manager
  window.uordbManager = new UORdbManager();
});

// Initialize GitHub authentication
function initializeGitHubAuth() {
  const authButton = document.getElementById('github-auth-button');
  const authStatus = document.getElementById('auth-status');
  const userSection = document.getElementById('user-section');
  
  // Check if already authenticated and update UI
  updateAuthUI();
  
  // Set up auth button click handler
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
        showError(`Failed to start authentication: ${error.message}`);
      }
    }
  });
  
  // Add a logout button to the user section
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
  
  // Listen for messages from the auth popup
  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) return;
    
    if (event.data && event.data.type === 'github-auth-success') {
      // Authentication was successful, update UI
      updateAuthUI();
    }
  });
  
  // Listen for auth state changes
  window.authService.addListener(() => {
    updateAuthUI();
  });
  
  // Setup periodic token refresh check (every 5 minutes)
  setInterval(() => {
    if (window.authService.isAuthenticated()) {
      const authState = window.authService.getAuthState();
      
      // If token expires in less than 10 minutes, refresh it
      if (authState.expiresAt && (authState.expiresAt - Date.now() < 10 * 60 * 1000)) {
        console.log('Token will expire soon, refreshing...');
        window.authService.refreshToken();
      }
    }
  }, 5 * 60 * 1000); // 5 minutes
}

// Update the UI based on the current authentication state
async function updateAuthUI() {
  const authButton = document.getElementById('github-auth-button');
  const authStatus = document.getElementById('auth-status');
  const userSection = document.getElementById('user-section');
  
  if (window.authService.isAuthenticated()) {
    // User is authenticated
    const user = window.authService.getUser();
    const token = window.authService.getToken();
    
    if (user && token) {
      try {
        // Show authenticated user
        authStatus.innerHTML = `
          <div class="status success">
            Authenticated as <strong>${user.login}</strong>
            ${user.avatar_url ? `<img src="${user.avatar_url}" alt="${user.login}" style="width: 32px; height: 32px; border-radius: 50%; margin-left: 8px;">` : ''}
          </div>
        `;
        authStatus.style.display = 'block';
        authButton.textContent = 'Switch Account';
        
        // Show user section
        userSection.style.display = 'block';
        
        // Update MCP server with auth info
        await window.mcpClient.sendRequest('setAuthentication', {
          username: user.login,
          token: token
        });
        
        // Refresh repository status
        if (window.uordbManager) {
          await window.uordbManager.refreshRepositoryStatus();
          await window.uordbManager.refreshCurrentObjects();
        }
      } catch (error) {
        console.error('Error updating auth UI:', error);
        showError(`Error: ${error.message}`);
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
    authStatus.innerHTML = `
      <div class="status">
        You are not logged in. Please authenticate with GitHub to access your UOR data.
      </div>
    `;
    authStatus.style.display = 'block';
    authButton.textContent = 'Authenticate with GitHub';
    
    // Hide user section
    userSection.style.display = 'none';
    
    // Clear MCP server auth info
    await window.mcpClient.sendRequest('clearAuthentication', {});
  }
}

// Show error message
function showError(message) {
  const authStatus = document.getElementById('auth-status');
  authStatus.innerHTML = `
    <div class="status error">
      ${message}
    </div>
  `;
  authStatus.style.display = 'block';
}

// Show message
function showMessage(message, type = 'info') {
  const messageElement = document.createElement('div');
  messageElement.className = `status ${type}`;
  messageElement.textContent = message;
  
  // Add to status container
  const statusContainer = document.getElementById('auth-status');
  statusContainer.innerHTML = '';
  statusContainer.appendChild(messageElement);
  statusContainer.style.display = 'block';
  
  // Auto-remove after 5 seconds for non-error messages
  if (type !== 'error') {
    setTimeout(() => {
      messageElement.remove();
      if (statusContainer.children.length === 0) {
        statusContainer.style.display = 'none';
      }
    }, 5000);
  }
}