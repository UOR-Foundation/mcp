/**
 * MCP Protocol Handler
 * Client-side implementation of MCP protocol for GitHub Pages
 */

class MCPHandler {
  constructor() {
    this.objectStore = {}; // In-memory object store (for client-side only)
    this.nextRequestId = 1;
  }

  /**
   * Handles an MCP request
   * @param {Object} request - The JSON-RPC 2.0 request
   * @returns {Object} The JSON-RPC 2.0 response
   */
  async handleRequest(request) {
    // Validate request format
    if (!request.jsonrpc || request.jsonrpc !== '2.0') {
      return this.createErrorResponse(
        request.id || null,
        -32600,
        'Invalid Request',
        'The JSON sent is not a valid JSON-RPC 2.0 request'
      );
    }

    try {
      // Handle different method types
      switch (request.method) {
        case 'initialize':
          return this.handleInitialize(request);
        
        case 'tools/list':
          return this.handleToolsList(request);
        
        case 'resources/list':
          return this.handleResourcesList(request);
          
        case 'tool/call':
          return await this.handleToolCall(request);
        
        // Direct MCP server methods
        case 'uor.resolve':
        case 'uor.create':
        case 'uor.update':
        case 'uor.delete':
        case 'uordb.list':
        case 'uordb.search':
        case 'uordb.status':
        case 'uordb.initialize':
          return await this.handleMCPMethod(request);
          
        default:
          return this.createErrorResponse(
            request.id,
            -32601,
            'Method not found',
            `The method ${request.method} is not supported`
          );
      }
    } catch (error) {
      console.error('Error handling MCP request:', error);
      
      return this.createErrorResponse(
        request.id || null,
        -32603,
        'Internal error',
        error.message
      );
    }
  }

  /**
   * Handles the initialize method
   * @param {Object} request - The initialize request
   * @returns {Object} The initialize response
   */
  handleInitialize(request) {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        protocolVersion: 'DRAFT-2025-v2',
        serverInfo: {
          name: 'uor-mcp-client-server',
          version: '0.1.0'
        },
        capabilities: {
          resources: {
            listChanged: true,
            subscribe: true
          },
          tools: {
            listChanged: true
          },
          prompts: {
            listChanged: true
          },
          repository: {
            initialize: true,
            status: true,
            storage: true
          }
        },
        instructions: 'This MCP server implements the UOR Framework with GitHub-based storage. You can access UOR objects through resources and manipulate them using tools.'
      }
    };
  }

  /**
   * Handles the tools/list method
   * @param {Object} request - The tools/list request
   * @returns {Object} The tools/list response
   */
  handleToolsList(request) {
    // Get auth context from local storage
    const token = localStorage.getItem('github-token');
    const isAuthenticated = !!token;
    
    const tools = [
      {
        name: 'getConcept',
        description: 'Gets a UOR concept by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' }
          },
          required: ['id']
        }
      },
      {
        name: 'getResource',
        description: 'Gets a UOR resource by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' }
          },
          required: ['id']
        }
      },
      {
        name: 'searchUOR',
        description: 'Searches UOR objects',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' }
          },
          required: ['query']
        }
      }
    ];
    
    // Add authentication-required tools if authenticated
    if (isAuthenticated) {
      tools.push(
        {
          name: 'initializeRepository',
          description: 'Initializes the UOR repository',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: 'getRepositoryStatus',
          description: 'Gets the status of the UOR repository',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: 'createConcept',
          description: 'Creates a new UOR concept',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              primeFactors: { type: 'array' },
              observerFrame: { type: 'object' }
            },
            required: ['name']
          }
        },
        {
          name: 'createResource',
          description: 'Creates a new UOR resource',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              content: { type: 'string' },
              primeFactors: { type: 'array' }
            },
            required: ['name', 'content']
          }
        },
        {
          name: 'createTopic',
          description: 'Creates a new UOR topic',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              relatedConcepts: { type: 'array' }
            },
            required: ['name']
          }
        },
        {
          name: 'createPredicate',
          description: 'Creates a new UOR predicate',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              domain: { type: 'string' },
              range: { type: 'string' }
            },
            required: ['name', 'domain', 'range']
          }
        },
        {
          name: 'createResolver',
          description: 'Creates a new namespace resolver',
          inputSchema: {
            type: 'object',
            properties: {
              targetNamespace: { type: 'string' },
              description: { type: 'string' }
            },
            required: ['targetNamespace']
          }
        },
        {
          name: 'listObjects',
          description: 'Lists UOR objects by type',
          inputSchema: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['concept', 'resource', 'topic', 'predicate', 'resolver'] }
            },
            required: ['type']
          }
        }
      );
    }
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        tools
      }
    };
  }

  /**
   * Handles the resources/list method
   * @param {Object} request - The resources/list request
   * @returns {Object} The resources/list response
   */
  handleResourcesList(request) {
    // Get user context from local storage
    const userJson = localStorage.getItem('github-user');
    const user = userJson ? JSON.parse(userJson) : { login: 'anonymous' };
    
    const resources = [
      {
        uri: `uor://${user.login}/concepts`,
        name: 'UOR Concepts',
        description: 'Collection of UOR concepts'
      },
      {
        uri: `uor://${user.login}/resources`,
        name: 'UOR Resources',
        description: 'Collection of UOR information resources'
      },
      {
        uri: `uor://${user.login}/topics`,
        name: 'UOR Topics',
        description: 'Collection of UOR topics'
      },
      {
        uri: `uor://${user.login}/predicates`,
        name: 'UOR Predicates',
        description: 'Collection of UOR fact predicates'
      },
      {
        uri: `uor://${user.login}/resolvers`,
        name: 'UOR Resolvers',
        description: 'Collection of UOR namespace resolvers'
      }
    ];
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        resources
      }
    };
  }

  /**
   * Handles MCP server methods directly
   * @param {Object} request - The MCP method request
   * @returns {Object} The method response
   */
  async handleMCPMethod(request) {
    try {
      // Validate authentication for certain methods
      const authRequiredMethods = [
        'uor.create', 'uor.update', 'uor.delete',
        'uordb.list', 'uordb.status', 'uordb.initialize'
      ];
      
      if (authRequiredMethods.includes(request.method)) {
        const token = localStorage.getItem('github-token');
        const userJson = localStorage.getItem('github-user');
        
        if (!token || !userJson) {
          return this.createErrorResponse(
            request.id,
            401,
            'Unauthorized',
            'Authentication required for this operation'
          );
        }
      }
      
      // Call the corresponding MCP server method
      const result = await window.mcpClient.sendRequest(request.method, request.params);
      
      return {
        jsonrpc: '2.0',
        id: request.id,
        result
      };
    } catch (error) {
      console.error(`Error handling MCP method ${request.method}:`, error);
      
      return this.createErrorResponse(
        request.id,
        -32603,
        'Method execution error',
        error.message
      );
    }
  }

  /**
   * Handles tool calls
   * @param {Object} request - The tool/call request
   * @returns {Object} The tool/call response
   */
  async handleToolCall(request) {
    const { name, parameters } = request.params;
    
    // Get auth context from local storage
    const token = localStorage.getItem('github-token');
    const userJson = localStorage.getItem('github-user');
    const user = userJson ? JSON.parse(userJson) : null;
    
    // Check if authenticated for auth-required tools
    const authRequiredTools = [
      'initializeRepository', 'getRepositoryStatus',
      'createConcept', 'createResource', 'createTopic', 
      'createPredicate', 'createResolver', 'listObjects'
    ];
    
    if (authRequiredTools.includes(name) && (!token || !user)) {
      return this.createErrorResponse(
        request.id,
        401,
        'Unauthorized',
        'Authentication required for this operation'
      );
    }
    
    // Handle different tool types
    try {
      let result;
      
      switch (name) {
        case 'getConcept':
          result = await this.handleGetConcept(parameters.id, user ? user.login : 'anonymous');
          break;
          
        case 'getResource':
          result = await this.handleGetResource(parameters.id, user ? user.login : 'anonymous');
          break;
          
        case 'searchUOR':
          result = await this.handleSearchUOR(parameters.query, user ? user.login : 'anonymous');
          break;
        
        case 'initializeRepository':
          result = await this.handleInitializeRepository(user.login);
          break;
          
        case 'getRepositoryStatus':
          result = await this.handleGetRepositoryStatus(user.login);
          break;
          
        case 'listObjects':
          result = await this.handleListObjects(parameters.type, user.login);
          break;
          
        case 'createConcept':
          result = await this.handleCreateConcept(parameters, user.login);
          break;
          
        case 'createResource':
          result = await this.handleCreateResource(parameters, user.login);
          break;
          
        case 'createTopic':
          result = await this.handleCreateTopic(parameters, user.login);
          break;
          
        case 'createPredicate':
          result = await this.handleCreatePredicate(parameters, user.login);
          break;
          
        case 'createResolver':
          result = await this.handleCreateResolver(parameters, user.login);
          break;
          
        default:
          return this.createErrorResponse(
            request.id,
            -32601,
            'Method not found',
            `The tool ${name} is not supported`
          );
      }
      
      return {
        jsonrpc: '2.0',
        id: request.id,
        result
      };
    } catch (error) {
      console.error(`Error handling tool call ${name}:`, error);
      
      return this.createErrorResponse(
        request.id,
        -32603,
        'Tool execution error',
        error.message
      );
    }
  }

  /**
   * Creates an error response
   * @param {string|number} id - The request ID
   * @param {number} code - The error code
   * @param {string} message - The error message
   * @param {string} data - Additional error data
   * @returns {Object} The error response
   */
  createErrorResponse(id, code, message, data) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message,
        data
      }
    };
  }

  /**
   * Handles initialize repository operation
   * @param {string} username - The GitHub username
   * @returns {Object} Initialization status
   */
  async handleInitializeRepository(username) {
    try {
      await window.mcpClient.sendRequest('uordb.initialize', {});
      return { success: true, message: 'Repository initialized successfully' };
    } catch (error) {
      console.error('Failed to initialize repository:', error);
      throw error;
    }
  }

  /**
   * Handles get repository status operation
   * @param {string} username - The GitHub username
   * @returns {Object} Repository status
   */
  async handleGetRepositoryStatus(username) {
    try {
      return await window.mcpClient.sendRequest('uordb.status', {});
    } catch (error) {
      console.error('Failed to get repository status:', error);
      throw error;
    }
  }

  /**
   * Handles list objects operation
   * @param {string} type - Object type
   * @param {string} username - The GitHub username
   * @returns {Array} List of objects
   */
  async handleListObjects(type, username) {
    try {
      return await window.mcpClient.sendRequest('uordb.list', { type });
    } catch (error) {
      console.error(`Failed to list objects of type ${type}:`, error);
      throw error;
    }
  }

  /**
   * Handles search UOR operation
   * @param {string} query - Search query
   * @param {string} username - The GitHub username
   * @returns {Array} Search results
   */
  async handleSearchUOR(query, username) {
    try {
      if (username !== 'anonymous') {
        return await window.mcpClient.sendRequest('uordb.search', { query });
      } else {
        // Simple demo search in object store for anonymous users
        const results = [];
        for (const key in this.objectStore) {
          const obj = this.objectStore[key];
          const objStr = JSON.stringify(obj).toLowerCase();
          if (objStr.includes(query.toLowerCase())) {
            results.push(obj);
          }
        }
        return results;
      }
    } catch (error) {
      console.error('Failed to search UOR objects:', error);
      throw error;
    }
  }

  /**
   * Handles GET concept operation
   * @param {string} id - The concept ID
   * @param {string} namespace - The namespace
   * @returns {Object} The concept data
   */
  async handleGetConcept(id, namespace) {
    try {
      // Try to resolve via MCP server
      if (namespace !== 'anonymous') {
        const reference = `uor://concept/${id}`;
        const response = await window.mcpClient.sendRequest('uor.resolve', { reference });
        if (response) {
          return response.data;
        }
      }
      
      // Fallback to memory store
      const storedConcept = this.objectStore[`concept:${id}`];
      if (storedConcept) {
        return storedConcept;
      }
      
      // Not found, return mock concept
      return {
        id: `uor://concept/${id}`,
        type: 'concept',
        name: id,
        description: `Concept ${id} in namespace ${namespace}`,
        dateCreated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get concept:', error);
      throw error;
    }
  }

  /**
   * Handles GET resource operation
   * @param {string} id - The resource ID
   * @param {string} namespace - The namespace
   * @returns {Object} The resource data
   */
  async handleGetResource(id, namespace) {
    try {
      // Try to resolve via MCP server
      if (namespace !== 'anonymous') {
        const reference = `uor://resource/${id}`;
        const response = await window.mcpClient.sendRequest('uor.resolve', { reference });
        if (response) {
          return response.data;
        }
      }
      
      // Fallback to memory store
      const storedResource = this.objectStore[`resource:${id}`];
      if (storedResource) {
        return storedResource;
      }
      
      // Not found, return mock resource
      return {
        id: `uor://resource/${id}`,
        type: 'resource',
        name: id,
        description: `Resource ${id} in namespace ${namespace}`,
        content: `This is the content of resource ${id}`,
        dateCreated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get resource:', error);
      throw error;
    }
  }

  /**
   * Handles create concept operation
   * @param {Object} params - The concept parameters
   * @param {string} namespace - The namespace
   * @returns {Object} The created concept
   */
  async handleCreateConcept(params, namespace) {
    try {
      // Create concept object
      const concept = {
        type: 'concept',
        name: params.name,
        description: params.description || '',
        primeFactors: params.primeFactors || [],
        observerFrame: params.observerFrame || null,
        canonicalRepresentation: {
          representationType: 'MinimalEncoding',
          value: {
            name: params.name,
            description: params.description || ''
          }
        }
      };
      
      // Create via MCP server
      const reference = await window.mcpClient.sendRequest('uor.create', {
        type: 'concept',
        data: concept
      });
      
      // Return the created concept with its reference
      return {
        ...concept,
        id: reference
      };
    } catch (error) {
      console.error('Failed to create concept:', error);
      throw error;
    }
  }

  /**
   * Handles create resource operation
   * @param {Object} params - The resource parameters
   * @param {string} namespace - The namespace
   * @returns {Object} The created resource
   */
  async handleCreateResource(params, namespace) {
    try {
      // Create resource object
      const resource = {
        type: 'resource',
        name: params.name,
        description: params.description || '',
        content: params.content,
        primeFactors: params.primeFactors || [],
        canonicalRepresentation: {
          representationType: 'MinimalEncoding',
          value: {
            name: params.name,
            content: params.content
          }
        }
      };
      
      // Create via MCP server
      const reference = await window.mcpClient.sendRequest('uor.create', {
        type: 'resource',
        data: resource
      });
      
      // Return the created resource with its reference
      return {
        ...resource,
        id: reference
      };
    } catch (error) {
      console.error('Failed to create resource:', error);
      throw error;
    }
  }

  /**
   * Handles create topic operation
   * @param {Object} params - The topic parameters
   * @param {string} namespace - The namespace
   * @returns {Object} The created topic
   */
  async handleCreateTopic(params, namespace) {
    try {
      // Create topic object
      const topic = {
        type: 'topic',
        name: params.name,
        description: params.description || '',
        relatedConcepts: params.relatedConcepts || [],
        canonicalRepresentation: {
          representationType: 'MinimalEncoding',
          value: {
            name: params.name,
            description: params.description || ''
          }
        }
      };
      
      // Create via MCP server
      const reference = await window.mcpClient.sendRequest('uor.create', {
        type: 'topic',
        data: topic
      });
      
      // Return the created topic with its reference
      return {
        ...topic,
        id: reference
      };
    } catch (error) {
      console.error('Failed to create topic:', error);
      throw error;
    }
  }

  /**
   * Handles create predicate operation
   * @param {Object} params - The predicate parameters
   * @param {string} namespace - The namespace
   * @returns {Object} The created predicate
   */
  async handleCreatePredicate(params, namespace) {
    try {
      // Create predicate object
      const predicate = {
        type: 'predicate',
        name: params.name,
        description: params.description || '',
        domain: params.domain,
        range: params.range,
        canonicalRepresentation: {
          representationType: 'MinimalEncoding',
          value: {
            name: params.name,
            domain: params.domain,
            range: params.range
          }
        }
      };
      
      // Create via MCP server
      const reference = await window.mcpClient.sendRequest('uor.create', {
        type: 'predicate',
        data: predicate
      });
      
      // Return the created predicate with its reference
      return {
        ...predicate,
        id: reference
      };
    } catch (error) {
      console.error('Failed to create predicate:', error);
      throw error;
    }
  }

  /**
   * Handles create resolver operation
   * @param {Object} params - The resolver parameters
   * @param {string} namespace - The namespace
   * @returns {Object} The created resolver
   */
  async handleCreateResolver(params, namespace) {
    try {
      // Create resolver object
      const resolver = {
        type: 'resolver',
        targetNamespace: params.targetNamespace,
        description: params.description || '',
        resolutionMethod: 'github',
        canonicalRepresentation: {
          representationType: 'MinimalEncoding',
          value: {
            targetNamespace: params.targetNamespace,
            resolutionMethod: 'github'
          }
        }
      };
      
      // Create via MCP server
      const reference = await window.mcpClient.sendRequest('uor.create', {
        type: 'resolver',
        data: resolver
      });
      
      // Return the created resolver with its reference
      return {
        ...resolver,
        id: reference
      };
    } catch (error) {
      console.error('Failed to create resolver:', error);
      throw error;
    }
  }
}

// Initialize MCP handler as global object
window.mcpHandler = new MCPHandler();