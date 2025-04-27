/**
 * UOR MCP Server - GitHub Pages Version
 * 
 * This file is just a placeholder for TypeScript compilation.
 * The actual implementation for GitHub Pages is in the public directory
 * and uses client-side JavaScript.
 * 
 * This file maintains the TypeScript compatibility with the original server
 * concept, but in practice, the GitHub Pages version doesn't use a traditional
 * server.
 */
import { UORObject } from './core/uor-core';
import { UORFactory } from './core/uor-factory';
import { UORReferenceUtil } from './core/uor-reference';

/**
 * Mock server class that logs information about GitHub Pages deployment
 */
class GitHubPagesMCPServer {
  constructor() {
    console.log('UOR MCP Server - GitHub Pages Version');
    console.log('This TypeScript file is for compilation compatibility.');
    console.log('The actual implementation is in the public directory.');
  }
  
  /**
   * Mock start method
   */
  start(): void {
    console.log('For GitHub Pages, no server startup is needed.');
    console.log('Deploy the contents of the public directory to GitHub Pages.');
  }
  
  /**
   * Creates a simple UOR object for testing
   * @param id Object ID
   * @param data Object data
   * @returns Created UOR object
   */
  createUORObject(id: string, data: any): UORObject {
    return UORFactory.createObject('test', data, 'test-namespace');
  }
  
  /**
   * Creates a UOR reference string
   * @param namespace Namespace
   * @param type Type
   * @param id ID
   * @returns UOR reference string
   */
  createUORReference(namespace: string, type: string, id: string): string {
    return UORReferenceUtil.create(namespace, type, id);
  }
}

// Only execute if run directly
if (require.main === module) {
  const server = new GitHubPagesMCPServer();
  server.start();
}

export default GitHubPagesMCPServer;