/**
 * JSON-RPC 2.0 Type Definitions for MCP Protocol
 * Aligned with MCP specification v2025-03-26
 */

export const JSONRPC_VERSION = '2.0';
export const MCP_PROTOCOL_VERSION = '2025-03-26';

/**
 * A uniquely identifying ID for a request in JSON-RPC.
 */
export type RequestId = string | number | null;

/**
 * A request that expects a response.
 */
export interface JSONRPCRequest {
  jsonrpc: typeof JSONRPC_VERSION;
  id: RequestId;
  method: string;
  params?: any;
}

/**
 * A notification which does not expect a response.
 */
export interface JSONRPCNotification {
  jsonrpc: typeof JSONRPC_VERSION;
  method: string;
  params?: any;
}

/**
 * A successful (non-error) response to a request.
 */
export interface JSONRPCResponse {
  jsonrpc: typeof JSONRPC_VERSION;
  id: RequestId;
  result: any;
}

/**
 * A response to a request that indicates an error occurred.
 */
export interface JSONRPCErrorResponse {
  jsonrpc: typeof JSONRPC_VERSION;
  id: RequestId;
  error: JSONRPCError;
}

/**
 * Error object for JSON-RPC responses
 */
export interface JSONRPCError {
  code: number;
  message: string;
  data?: any;
}

/**
 * A JSON-RPC batch request, as described in https://www.jsonrpc.org/specification#batch.
 */
export type JSONRPCBatchRequest = (JSONRPCRequest | JSONRPCNotification)[];

/**
 * A JSON-RPC batch response, as described in https://www.jsonrpc.org/specification#batch.
 */
export type JSONRPCBatchResponse = (JSONRPCResponse | JSONRPCErrorResponse)[];

/**
 * Refers to any valid JSON-RPC object that can be decoded off the wire, or encoded to be sent.
 */
export type JSONRPCMessage =
  | JSONRPCRequest
  | JSONRPCNotification
  | JSONRPCBatchRequest
  | JSONRPCResponse
  | JSONRPCErrorResponse
  | JSONRPCBatchResponse;

// Standard JSON-RPC error codes
export enum JSONRPCErrorCode {
  _ParseError = -32700,
  _InvalidRequest = -32600,
  MethodNotFound = -32601,
  _InvalidParams = -32602,
  _InternalError = -32603,
  // Server errors -32000 to -32099
  _AuthenticationRequired = -32000,
  _PermissionDenied = -32001,
  _ResourceNotFound = -32002,
  _ValidationError = -32003,
}

// MCP Tool specification
export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: {
    type: 'object';
    properties?: Record<string, any>;
    required?: string[];
  };
  annotations?: MCPToolAnnotations;
}

// Tool annotations
export interface MCPToolAnnotations {
  title?: string;
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}

// MCP resource types
export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  annotations?: MCPAnnotations;
  size?: number;
  // Extended properties for UOR resources
  metadata?: Record<string, any>;
  count?: number;
  [key: string]: any; // Allow additional properties
}

// General annotations
export interface MCPAnnotations {
  audience?: ('user' | 'assistant')[];
  priority?: number;
}

// MCP server capabilities
export interface MCPServerCapabilities {
  experimental?: Record<string, object>;
  logging?: object;
  completions?: object;
  prompts?: {
    listChanged?: boolean;
  };
  resources?: {
    subscribe?: boolean;
    listChanged?: boolean;
  };
  tools?: {
    listChanged?: boolean;
  };
}

// Implementation info
export interface MCPImplementation {
  name: string;
  version: string;
}
