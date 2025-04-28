/**
 * UOR Content Type Definitions
 * Defines the structure of content objects in the UOR system
 */

import { UORObject } from '../core/uor-core';

/**
 * Content types supported by the UOR system
 */
export enum ContentType {
  CONCEPT = 'concept',
  RESOURCE = 'resource',
  TOPIC = 'topic',
  PREDICATE = 'predicate',
  MEDIA = 'media'
}

/**
 * Base content interface with common properties
 */
export interface ContentBase {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Concept content interface
 * Represents a fundamental idea or abstraction
 */
export interface ConceptContent extends ContentBase {
  definition: string;
  examples?: string[];
  relatedConcepts?: string[]; // UOR references to related concepts
}

/**
 * Resource content interface
 * Represents a document, article, or other content resource
 */
export interface ResourceContent extends ContentBase {
  content: string;
  contentType: string; // MIME type
  sourceUrl?: string;
  references?: string[]; // UOR references to related resources
}

/**
 * Topic content interface
 * Represents a collection of related concepts and resources
 */
export interface TopicContent extends ContentBase {
  concepts: string[]; // UOR references to concepts
  resources: string[]; // UOR references to resources
  subtopics?: string[]; // UOR references to subtopics
  parentTopic?: string; // UOR reference to parent topic
}

/**
 * Predicate relationship types
 */
export enum PredicateType {
  IS_A = 'is_a',
  HAS_PART = 'has_part',
  RELATED_TO = 'related_to',
  DEPENDS_ON = 'depends_on',
  REFERENCES = 'references',
  CUSTOM = 'custom'
}

/**
 * Predicate content interface
 * Represents a relationship between UOR objects
 */
export interface PredicateContent extends ContentBase {
  sourceRef: string; // UOR reference to source object
  targetRef: string; // UOR reference to target object
  predicateType: PredicateType;
  customType?: string; // Used when predicateType is CUSTOM
  bidirectional: boolean;
  weight?: number; // Optional weight for the relationship
}

/**
 * Media content interface
 * Represents media content such as images, videos, etc.
 */
export interface MediaContent extends ContentBase {
  mimeType: string;
  size: number;
  filename: string;
  artifactRef?: string; // UOR reference to artifact for large content
  thumbnailRef?: string; // UOR reference to thumbnail
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    [key: string]: any;
  };
}

/**
 * Content UOR object interface
 */
export interface ContentUORObject extends UORObject {
  getContentData(): ContentBase;
  updateContent(content: Partial<ContentBase>): void;
  addTag(tag: string): void;
  removeTag(tag: string): void;
}
