/**
 * Client for the Model Context Protocol (MCP)
 * Handles communication with the MCP server using JSON-RPC 2.0
 */
class MCPClient {
  constructor(endpoint = '/mcp') {
    this.endpoint = endpoint;
    this.requestId = 1;
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
      id: this.requestId++,
      method,
      params
    };

    try {
      // For GitHub Pages, we use localStorage as an intermediary
      localStorage.setItem('mcp:request', JSON.stringify(request));
      
      // Trigger processing (in real implementation, this would be an actual fetch)
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
}

// Create a global instance
window.mcpClient = new MCPClient();