/**
 * JSON-RPC 2.0 Type Definitions for MCP Protocol
 */

export interface JSONRPCRequest {
  jsonrpc: string;  // Must be "2.0"
  id: string | number | null;
  method: string;
  params?: any;
}

export interface JSONRPCResponse {
  jsonrpc: string;  // Must be "2.0"
  id: string | number | null;
  result?: any;
  error?: JSONRPCError;
}

export interface JSONRPCError {
  code: number;
  message: string;
  data?: any;
}

export interface JSONRPCBatchRequest {
  requests: JSONRPCRequest[];
}

export interface JSONRPCBatchResponse {
  responses: JSONRPCResponse[];
}

// Standard JSON-RPC error codes
export enum JSONRPCErrorCode {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
  // Server errors -32000 to -32099
  AuthenticationRequired = -32000,
  PermissionDenied = -32001,
  ResourceNotFound = -32002,
  ValidationError = -32003
}

// MCP specific tool schema
export interface MCPTool {
  name: string;
  description: string;
  schema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

// MCP resource types
export interface MCPResource {
  name: string;
  uri: string;
  description: string;
  schema?: {
    type: string;
    properties?: Record<string, any>;
  };
}

// MCP server capabilities
export interface MCPServerCapabilities {
  protocol: {
    version: string;
    supportedVersions: string[];
  };
  uor: {
    version: string;
    features: string[];
    supportedNamespaces: string[];
  };
  extensions: string[];
  authentication: {
    methods: string[];
    scopes: string[];
  };
}