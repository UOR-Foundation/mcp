/**
 * MCP (Model Context Protocol) - UOR Implementation
 * Main entry point for the library
 */

export { UORObject, UORSchema, UORArtifact, UORResolver } from './core/uor-core';

export type {
  PrimeDecomposition,
  PrimeFactor,
  CanonicalRepresentation,
  ObserverFrame,
  CoherenceMeasure,
  UORDomain,
  UORType,
} from './core/uor-core';

export * from './mcp/mcp-jsonrpc';
export * from './mcp/mcp-jsonrpc-handler';
export * from './mcp/mcp-server';

export * from './github/github-client';
export * from './github/repository-service';
export * from './github/uordb-manager';

export * from './resolvers/namespace-resolver';

export * from './identity/identity-manager';
export * from './identity/profile-manager';
export * from './identity/identity-types';

export * from './content/content-manager';
export { ContentType } from './content/content-types';
export type { ContentBase } from './content/content-types';
export * from './content/concept';
export * from './content/resource';
export * from './content/topic';
export * from './content/predicate';
export * from './content/media';

export * from './messaging/message-manager';
export { MessageStatus, MessagePriority } from './messaging/message-types';
export * from './messaging/message';
export * from './messaging/thread';
export * from './messaging/subscription';

export * from './pubsub/pubsub-manager';
export { EventPriority, EventDeliveryStatus } from './pubsub/event-types';
export * from './pubsub/event';
export * from './pubsub/channel';
export * from './pubsub/subscription';

export * from './storage/storage-provider';
export * from './storage/github-provider';
export * from './storage/ipfs-provider';

export * from './decomposition/decomposition-types';
export * from './decomposition/decomposition-manager';
export * from './decomposition/text-decomposition';
export * from './decomposition/structured-data-decomposition';
export * from './decomposition/linked-data-decomposition';
export * from './decomposition/domain-specific-decomposition';
export * from './decomposition/media-decomposition';

export * from './schema/schema-types';
export * from './schema/schema-loader';
export { SchemaValidator as SchemaValidatorClass } from './schema/schema-validator';
export * from './schema/schema-integration';
