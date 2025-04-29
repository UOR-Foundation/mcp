// Deployment-specific configuration for UOR MCP Server
window.DEPLOYMENT_CONFIG = {
  githubUser: "UOR-Foundation",
  deployedAt: "2025-04-29T12:36:32Z"
};

// Apply the deployment configuration
document.addEventListener('DOMContentLoaded', () => {
  const config = window.MCPConfig.getConfig();
  // Configuration is done through URL parameters
  window.MCPConfig.saveConfig(config);
});
