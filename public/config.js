/**
 * MCP Server Configuration for GitHub Pages
 * Enables client-side configuration without needing server-side environment variables
 */

window.MCPConfig = {
  // Default configuration values
  defaultConfig: {
    // GitHub OAuth configuration - Using Netlify's built-in OAuth proxy
    githubOAuth: {
      clientId: 'Ov23li9oj0Sn7CVoXC20', // Client ID provided by user
      tokenExchangeProxy: (window.location.hostname.endsWith('.netlify.app') ? 
                          '/.netlify/functions/token-exchange' : 
                          'https://uor-foundation-mcp-auth.netlify.app/.netlify/functions/token-exchange'),
      scopes: ['repo']
    },
    
    // API endpoints
    apiEndpoints: {
      github: 'https://api.github.com',
      mcp: window.location.origin + '/mcp'
    },
    
    // Default IPFS configuration (optional)
    ipfs: {
      enabled: false,
      gateway: 'https://ipfs.io/ipfs/'
    },
    
    // UOR configuration
    uor: {
      repositoryName: 'uordb',
      defaultNamespace: '',
      resolverDepthLimit: 5
    }
  },
  
  // Load configuration from multiple sources with precedence:
  // 1. URL parameters
  // 2. Local storage
  // 3. Default values
  loadConfig: function() {
    const config = { ...this.defaultConfig };
    
    // Load from local storage if available
    const storedConfig = localStorage.getItem('mcp-config');
    if (storedConfig) {
      try {
        const parsedConfig = JSON.parse(storedConfig);
        this.mergeConfig(config, parsedConfig);
      } catch (error) {
        console.error('Error parsing stored configuration:', error);
      }
    }
    
    // Override with URL parameters if provided
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('github_client_id')) {
      config.githubOAuth.clientId = urlParams.get('github_client_id');
    }
    
    if (urlParams.has('token_exchange_proxy')) {
      config.githubOAuth.tokenExchangeProxy = urlParams.get('token_exchange_proxy');
    }
    
    if (urlParams.has('ipfs_gateway')) {
      config.ipfs.enabled = true;
      config.ipfs.gateway = urlParams.get('ipfs_gateway');
    }
    
    if (urlParams.has('default_namespace')) {
      config.uor.defaultNamespace = urlParams.get('default_namespace');
    }
    
    return config;
  },
  
  // Save the current configuration to local storage
  saveConfig: function(config) {
    // Don't save sensitive values like tokens to localStorage
    const configToSave = { ...config };
    
    if (configToSave.auth && configToSave.auth.token) {
      delete configToSave.auth.token;
    }
    
    localStorage.setItem('mcp-config', JSON.stringify(configToSave));
  },
  
  // Merge configurations
  mergeConfig: function(target, source) {
    for (const key in source) {
      if (Object.hasOwn(source, key)) {
        if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
          if (!target[key]) target[key] = {};
          this.mergeConfig(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }
    return target;
  },
  
  // Get the effective config
  getConfig: function() {
    return this.loadConfig();
  }
};
