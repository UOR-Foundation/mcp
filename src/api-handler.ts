import { Request, Response } from 'express';
import { MCPJSONRPCHandler } from './mcp/mcp-jsonrpc-handler';
import MCPServer from './mcp/mcp-server';

/**
 * API handler for the UOR MCP server
 * Supports both direct API calls and MCP Protocol JSON-RPC requests
 */
export class APIHandler {
  private jsonRpcHandler: MCPJSONRPCHandler;
  private mcpServer: any;

  constructor() {
    this.jsonRpcHandler = new MCPJSONRPCHandler();
    this.mcpServer = (MCPServer as any).getInstance?.() || MCPServer;
  }

  /**
   * Handle API requests
   * @param req Express request
   * @param res Express response
   */
  public async handleAPIRequest(req: Request, res: Response): Promise<void> {
    try {
      // Determine if this is an MCP Protocol JSON-RPC request
      const isJsonRpc = 
        req.headers['content-type']?.includes('application/json') && 
        (req.body.jsonrpc === '2.0' || Array.isArray(req.body));

      if (isJsonRpc) {
        // Handle MCP Protocol JSON-RPC request
        const response = await this.jsonRpcHandler.handleJSONRPCRequest(req.body);
        res.status(200).json(response);
      } else {
        // Legacy API format
        const { method, params } = req.body;
        
        if (!method) {
          res.status(400).json({ error: 'Method is required' });
          return;
        }
        
        try {
          const result = await this.mcpServer.handleRequest(method, params || {});
          res.status(200).json({ result });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          res.status(400).json({ error: message });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ 
        error: {
          code: -32603,
          message: `Internal server error: ${message}`
        }
      });
    }
  }

  /**
   * Handle MCP Endpoint requests (only MCP Protocol)
   * @param req Express request
   * @param res Express response
   */
  public async handleMCPEndpoint(req: Request, res: Response): Promise<void> {
    try {
      // Only handle JSON-RPC requests at the MCP protocol endpoint
      const response = await this.jsonRpcHandler.handleJSONRPCRequest(req.body);
      res.status(200).json(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ 
        jsonrpc: '2.0',
        id: req.body?.id || null,
        error: {
          code: -32603,
          message: `Internal server error: ${message}`
        }
      });
    }
  }
}

export default new APIHandler();