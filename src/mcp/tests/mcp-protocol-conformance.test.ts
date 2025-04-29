/**
 * MCP Protocol Conformance Tests
 * Tests for verifying conformance to the MCP protocol specification
 */

import { MCPJSONRPCHandler } from '../mcp-jsonrpc-handler';
import { MCPServer } from '../mcp-server';
import { 
  JSONRPCRequest, 
  JSONRPCResponse, 
  JSONRPCErrorResponse,
  JSONRPCNotification,
  JSONRPCBatchRequest,
  JSONRPCBatchResponse,
  JSONRPCErrorCode
} from '../mcp-jsonrpc';

jest.mock('../mcp-server');

describe('MCP Protocol Conformance', () => {
  let handler: MCPJSONRPCHandler;
  let mockServer: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockServer = {
      initialize: jest.fn().mockResolvedValue(true),
      resolveUOR: jest.fn().mockResolvedValue({ id: 'test-id', type: 'concept' }),
      createUOR: jest.fn().mockResolvedValue({ id: 'new-id', type: 'concept' }),
      updateUOR: jest.fn().mockResolvedValue(true),
      deleteUOR: jest.fn().mockResolvedValue(true),
      listUORObjects: jest.fn().mockResolvedValue([{ id: 'test-id', type: 'concept' }]),
      searchUORObjects: jest.fn().mockResolvedValue([{ id: 'test-id', type: 'concept' }])
    };
    
    (MCPServer.getInstance as jest.Mock).mockReturnValue(mockServer);
    
    handler = new MCPJSONRPCHandler();
  });
  
  describe('JSON-RPC 2.0 Compliance', () => {
    it('should handle valid JSON-RPC 2.0 requests', async () => {
      const request: JSONRPCRequest = {
        jsonrpc: '2.0',
        id: '1',
        method: 'resolveUOR',
        params: { uorReference: 'uor://test/concept/test-id' }
      };
      
      const response = await handler.handleJSONRPCRequest(JSON.stringify(request));
      
      expect(response).toHaveProperty('jsonrpc', '2.0');
      expect(response).toHaveProperty('id', '1');
      expect(response).toHaveProperty('result');
      expect(response).not.toHaveProperty('error');
    });
    
    it('should handle invalid JSON-RPC 2.0 requests', async () => {
      const invalidRequest = {
        id: '1',
        method: 'resolveUOR',
        params: { uorReference: 'uor://test/concept/test-id' }
      };
      
      const response = await handler.handleJSONRPCRequest(JSON.stringify(invalidRequest));
      
      expect(response).toHaveProperty('jsonrpc', '2.0');
      expect(response).toHaveProperty('id', '1');
      expect(response).toHaveProperty('error');
      expect((response as JSONRPCErrorResponse).error.code).toBe(JSONRPCErrorCode.InvalidRequest);
    });
    
    it('should handle JSON-RPC 2.0 batch requests', async () => {
      const batchRequest: JSONRPCBatchRequest = [
        {
          jsonrpc: '2.0',
          id: '1',
          method: 'resolveUOR',
          params: { uorReference: 'uor://test/concept/test-id-1' }
        },
        {
          jsonrpc: '2.0',
          id: '2',
          method: 'resolveUOR',
          params: { uorReference: 'uor://test/concept/test-id-2' }
        }
      ];
      
      const response = await handler.handleJSONRPCRequest(JSON.stringify(batchRequest));
      
      expect(Array.isArray(response)).toBe(true);
      expect((response as JSONRPCBatchResponse).length).toBe(2);
      expect((response as JSONRPCBatchResponse)[0]).toHaveProperty('id', '1');
      expect((response as JSONRPCBatchResponse)[1]).toHaveProperty('id', '2');
    });
    
    it('should handle JSON-RPC 2.0 notifications (no id)', async () => {
      const notification: JSONRPCNotification = {
        jsonrpc: '2.0',
        method: 'ping',
        params: {}
      };
      
      const response = await handler.handleJSONRPCRequest(JSON.stringify(notification));
      
      expect(response).toBe('');
    });
  });
  
  describe('MCP Method Conformance', () => {
    it('should handle resolveUOR method correctly', async () => {
      const request: JSONRPCRequest = {
        jsonrpc: '2.0',
        id: '1',
        method: 'resolveUOR',
        params: { uorReference: 'uor://test/concept/test-id' }
      };
      
      const response = await handler.handleJSONRPCRequest(JSON.stringify(request));
      
      expect(response).toHaveProperty('result');
      expect(mockServer.resolveUOR).toHaveBeenCalledWith('uor://test/concept/test-id');
    });
    
    it('should handle createUOR method correctly', async () => {
      const uorObject = {
        id: 'new-id',
        type: 'concept',
        canonicalRepresentation: {
          representationType: 'json',
          value: { test: 'data' }
        }
      };
      
      const request: JSONRPCRequest = {
        jsonrpc: '2.0',
        id: '1',
        method: 'createUOR',
        params: { 
          namespace: 'test',
          type: 'concept',
          data: uorObject
        }
      };
      
      const response = await handler.handleJSONRPCRequest(JSON.stringify(request));
      
      expect(response).toHaveProperty('result');
      expect(mockServer.createUOR).toHaveBeenCalledWith('test', 'concept', uorObject);
    });
    
    it('should handle updateUOR method correctly', async () => {
      const uorObject = {
        id: 'test-id',
        type: 'concept',
        canonicalRepresentation: {
          representationType: 'json',
          value: { test: 'updated-data' }
        }
      };
      
      const request: JSONRPCRequest = {
        jsonrpc: '2.0',
        id: '1',
        method: 'updateUOR',
        params: { 
          uorReference: 'uor://test/concept/test-id',
          data: uorObject
        }
      };
      
      const response = await handler.handleJSONRPCRequest(JSON.stringify(request));
      
      expect((response as JSONRPCResponse).result).toBe(true);
      expect(mockServer.updateUOR).toHaveBeenCalledWith('uor://test/concept/test-id', uorObject);
    });
    
    it('should handle deleteUOR method correctly', async () => {
      const request: JSONRPCRequest = {
        jsonrpc: '2.0',
        id: '1',
        method: 'deleteUOR',
        params: { uorReference: 'uor://test/concept/test-id' }
      };
      
      const response = await handler.handleJSONRPCRequest(JSON.stringify(request));
      
      expect((response as JSONRPCResponse).result).toBe(true);
      expect(mockServer.deleteUOR).toHaveBeenCalledWith('uor://test/concept/test-id');
    });
    
    it('should handle listUORObjects method correctly', async () => {
      const request: JSONRPCRequest = {
        jsonrpc: '2.0',
        id: '1',
        method: 'listUORObjects',
        params: { 
          namespace: 'test',
          type: 'concept'
        }
      };
      
      const response = await handler.handleJSONRPCRequest(JSON.stringify(request));
      
      expect(Array.isArray((response as JSONRPCResponse).result)).toBe(true);
      expect(mockServer.listUORObjects).toHaveBeenCalledWith('test', 'concept');
    });
    
    it('should handle searchUORObjects method correctly', async () => {
      const request: JSONRPCRequest = {
        jsonrpc: '2.0',
        id: '1',
        method: 'searchUORObjects',
        params: { 
          query: 'test query',
          namespace: 'test',
          type: 'concept'
        }
      };
      
      const response = await handler.handleJSONRPCRequest(JSON.stringify(request));
      
      expect(Array.isArray((response as JSONRPCResponse).result)).toBe(true);
      expect(mockServer.searchUORObjects).toHaveBeenCalledWith('test query', 'test', 'concept');
    });
  });
  
  describe('Error Handling', () => {
    it('should handle method not found errors', async () => {
      const request: JSONRPCRequest = {
        jsonrpc: '2.0',
        id: '1',
        method: 'nonExistentMethod',
        params: {}
      };
      
      const response = await handler.handleJSONRPCRequest(JSON.stringify(request));
      
      expect(response).toHaveProperty('error');
      expect((response as JSONRPCErrorResponse).error.code).toBe(JSONRPCErrorCode.MethodNotFound);
    });
    
    it('should handle invalid params errors', async () => {
      const request: JSONRPCRequest = {
        jsonrpc: '2.0',
        id: '1',
        method: 'resolveUOR',
        params: {} // Missing required uorReference
      };
      
      const response = await handler.handleJSONRPCRequest(JSON.stringify(request));
      
      expect(response).toHaveProperty('error');
      expect((response as JSONRPCErrorResponse).error.code).toBe(JSONRPCErrorCode.InvalidParams);
    });
    
    it('should handle internal errors', async () => {
      mockServer.resolveUOR.mockRejectedValue(new Error('Internal error'));
      
      const request: JSONRPCRequest = {
        jsonrpc: '2.0',
        id: '1',
        method: 'resolveUOR',
        params: { uorReference: 'uor://test/concept/test-id' }
      };
      
      const response = await handler.handleJSONRPCRequest(JSON.stringify(request));
      
      expect(response).toHaveProperty('error');
      expect((response as JSONRPCErrorResponse).error.code).toBe(JSONRPCErrorCode.InternalError);
    });
  });
});
