/**
 * Model Context Protocol (MCP) Client
 * 
 * A client implementation for the MCP protocol that handles communication
 * with the MCP server using JSON-RPC 2.0. Optimized for GitHub Pages deployment.
 */
class MCPClient {
  constructor() {
    this.requestId = 1;
    this.initialized = false;
    this.serverCapabilities = null;
  }

  /**
   * Send a JSON-RPC 2.0 request to the MCP server
   * @param {string} method - The method to call
   * @param {object} params - The parameters for the method
   * @returns {Promise<any>} - The result of the method call
   */
  async sendRequest(method, params) {
    const request = {
      jsonrpc: '2.0',
      id: this.generateRequestId(),
      method,
      params
    };

    try {
      // For GitHub Pages, we use localStorage as an intermediary
      // and dispatch an event to trigger processing
      localStorage.setItem('mcp:request', JSON.stringify(request));
      
      // Trigger processing
      const event = new CustomEvent('mcp:request', { detail: request });
      window.dispatchEvent(event);
      
      // Wait for response
      return new Promise((resolve, reject) => {
        const checkResponse = () => {
          const responseStr = localStorage.getItem(`mcp:response:${request.id}`);
          if (responseStr) {
            try {
              const response = JSON.parse(responseStr);
              localStorage.removeItem(`mcp:response:${request.id}`);
              
              if (response.error) {
                reject(new Error(response.error.message));
              } else {
                resolve(response.result);
              }
            } catch (err) {
              reject(new Error('Invalid response format'));
            }
          } else {
            setTimeout(checkResponse, 50);
          }
        };
        
        checkResponse();
      });
    } catch (error) {
      console.error('MCP request failed:', error);
      throw error;
    }
  }

  /**
   * Send a JSON-RPC 2.0 request directly to the handler
   * This is used internally by the client
   * @param {object} request - The full JSON-RPC request object
   * @returns {Promise<object>} - The JSON-RPC response object
   */
  async handleRequest(request) {
    try {
      // Call the MCP handler directly
      return await window.mcpHandler.handleRequest(request);
    } catch (error) {
      console.error('Error handling direct request:', error);
      throw error;
    }
  }

  /**
   * Send a notification (request with no response expected)
   * @param {string} method - The notification method
   * @param {object} params - The parameters for the notification
   */
  sendNotification(method, params) {
    const notification = {
      jsonrpc: '2.0',
      method,
      params
    };

    // Store the notification in localStorage and dispatch event
    localStorage.setItem('mcp:notification', JSON.stringify(notification));
    const event = new CustomEvent('mcp:notification', { detail: notification });
    window.dispatchEvent(event);
  }

  /**
   * Initialize the MCP protocol connection
   * @returns {Promise<object>} - The server capabilities
   */
  async initialize() {
    if (this.initialized) {
      return this.serverCapabilities;
    }

    const response = await this.handleRequest({
      jsonrpc: '2.0',
      id: this.generateRequestId(),
      method: 'initialize',
      params: {
        clientInfo: {
          name: 'UOR-MCP Web Client',
          version: '1.0.0'
        },
        protocolVersion: '2025-03-26',
        capabilities: {
          sampling: {},
          roots: { listChanged: true }
        }
      }
    });

    if (response.result) {
      this.serverCapabilities = response.result;
      this.initialized = true;
      
      // Send initialized notification
      this.handleRequest({
        jsonrpc: '2.0',
        method: 'notifications/initialized'
      });
      
      return this.serverCapabilities;
    } else if (response.error) {
      throw new Error(`Initialization failed: ${response.error.message}`);
    } else {
      throw new Error('Initialization failed with unknown error');
    }
  }

  /**
   * List available tools
   * @param {object} options - Optional parameters like cursor for pagination
   * @returns {Promise<object>} - List of tools
   */
  async listTools(options = {}) {
    await this.ensureInitialized();
    
    return this.sendRequest('tools/list', options);
  }

  /**
   * Call a tool
   * @param {string} name - The name of the tool to call
   * @param {object} args - The arguments for the tool
   * @returns {Promise<object>} - The result of the tool call
   */
  async callTool(name, args) {
    await this.ensureInitialized();
    
    return this.sendRequest('tools/call', {
      name,
      arguments: args
    });
  }

  /**
   * List available resources
   * @param {object} options - Optional parameters like cursor for pagination
   * @returns {Promise<object>} - List of resources
   */
  async listResources(options = {}) {
    await this.ensureInitialized();
    
    return this.sendRequest('resources/list', options);
  }

  /**
   * Resolve a UOR reference
   * @param {string} reference - The UOR reference to resolve
   * @returns {Promise<object>} - The resolved UOR object
   */
  async resolveUOR(reference) {
    return this.sendRequest('uor.resolve', { reference });
  }

  /**
   * Create a new UOR object
   * @param {string} type - The type of the UOR object
   * @param {any} data - The data for the UOR object
   * @returns {Promise<string>} - The reference to the new UOR object
   */
  async createUOR(type, data) {
    return this.sendRequest('uor.create', { type, data });
  }

  /**
   * Update a UOR object
   * @param {string} reference - The reference to the UOR object
   * @param {any} data - The new data for the UOR object
   * @returns {Promise<boolean>} - Whether the update was successful
   */
  async updateUOR(reference, data) {
    return this.sendRequest('uor.update', { reference, data });
  }

  /**
   * Delete a UOR object
   * @param {string} reference - The reference to the UOR object
   * @returns {Promise<boolean>} - Whether the deletion was successful
   */
  async deleteUOR(reference) {
    return this.sendRequest('uor.delete', { reference });
  }

  /**
   * List UOR objects
   * @param {string} type - The type of UOR objects to list
   * @returns {Promise<Array>} - List of UOR objects
   */
  async listUORObjects(type) {
    return this.sendRequest('uordb.list', { type });
  }

  /**
   * Search UOR objects
   * @param {string} query - The search query
   * @returns {Promise<Array>} - List of matching UOR objects
   */
  async searchUORObjects(query) {
    return this.sendRequest('uordb.search', { query });
  }

  /**
   * Get repository status
   * @returns {Promise<object>} - Repository status
   */
  async getRepositoryStatus() {
    return this.sendRequest('uordb.status', {});
  }

  /**
   * Initialize UOR repository
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  async initializeRepository() {
    return this.sendRequest('uordb.initialize', {});
  }

  /**
   * Make sure the client is initialized
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Generate a unique request ID
   * @returns {string} - A unique ID for a request
   */
  generateRequestId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Create a global instance
window.mcpClient = new MCPClient();

// Setup event listener to handle MCP requests via the handler
window.addEventListener('mcp:request', async (event) => {
  const request = event.detail;
  
  try {
    // Process the request through the MCP handler
    const response = await window.mcpHandler.handleRequest(request);
    
    // Store the response in localStorage for retrieval
    if (response && request.id) {
      localStorage.setItem(`mcp:response:${request.id}`, JSON.stringify(response));
    }
  } catch (error) {
    console.error('Error processing MCP request:', error);
    
    // Store an error response
    if (request.id) {
      const errorResponse = {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603,
          message: error.message || 'Internal error'
        }
      };
      localStorage.setItem(`mcp:response:${request.id}`, JSON.stringify(errorResponse));
    }
  }
});