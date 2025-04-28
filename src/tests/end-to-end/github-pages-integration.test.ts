/**
 * GitHub Pages Integration End-to-End Tests
 * Tests for verifying the integration with GitHub Pages deployment
 */

import axios from 'axios';
import { MCPServer } from '../../mcp/mcp-server';
import { SchemaLoader } from '../../schema/schema-loader';

const skipTests = process.env.SKIP_E2E_TESTS === 'true';

const baseUrl = process.env.GITHUB_PAGES_URL || 'https://uor-foundation.github.io/mcp';

describe('GitHub Pages Integration', () => {
  let server: MCPServer;
  
  beforeAll(async () => {
    if (!skipTests) {
      server = MCPServer.getInstance();
      
      await SchemaLoader.getInstance().initialize();
    }
  });
  
  beforeEach(() => {
    if (skipTests) {
      jest.fn();
    }
  });
  
  describe('Static Assets', () => {
    it('should serve the main HTML page', async () => {
      if (skipTests) {
        return;
      }
      
      const response = await axios.get(`${baseUrl}/index.html`);
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
      expect(response.data).toContain('<!DOCTYPE html>');
    });
    
    it('should serve JavaScript assets', async () => {
      if (skipTests) {
        return;
      }
      
      const response = await axios.get(`${baseUrl}/app.js`);
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/javascript');
    });
    
    it('should serve CSS assets', async () => {
      if (skipTests) {
        return;
      }
      
      const response = await axios.get(`${baseUrl}/styles.css`);
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/css');
    });
  });
  
  describe('MCP Client Integration', () => {
    it('should load the MCP client script', async () => {
      if (skipTests) {
        return;
      }
      
      const response = await axios.get(`${baseUrl}/mcp-client.js`);
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/javascript');
      expect(response.data).toContain('class MCPClient');
    });
    
    it('should load the MCP handler script', async () => {
      if (skipTests) {
        return;
      }
      
      const response = await axios.get(`${baseUrl}/mcp-handler.js`);
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/javascript');
      expect(response.data).toContain('class MCPHandler');
    });
  });
  
  describe('Schema Integration', () => {
    it('should serve schema files', async () => {
      if (skipTests) {
        return;
      }
      
      const response = await axios.get(`${baseUrl}/models/schemas/uor-core.schema.json`);
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.data).toHaveProperty('$schema');
      expect(response.data).toHaveProperty('$id');
      expect(response.data).toHaveProperty('title');
    });
  });
  
  describe('UI Components', () => {
    it('should serve UI component scripts', async () => {
      if (skipTests) {
        return;
      }
      
      const response = await axios.get(`${baseUrl}/components/js/main-ui.js`);
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/javascript');
    });
    
    it('should serve UI component styles', async () => {
      if (skipTests) {
        return;
      }
      
      const response = await axios.get(`${baseUrl}/components/css/main-ui.css`);
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/css');
    });
  });
  
  describe('Authentication Integration', () => {
    it('should serve the authentication service script', async () => {
      if (skipTests) {
        return;
      }
      
      const response = await axios.get(`${baseUrl}/auth-service.js`);
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/javascript');
      expect(response.data).toContain('class AuthService');
    });
  });
});
