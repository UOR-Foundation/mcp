/**
 * UOR Content Type Definitions
 * Defines the structure of content objects in the UOR system
 */

import { UORObject } from '../core/uor-core';

/**
 * Content types enumeration
 */
export enum ContentType {
  CONCEPT = 'concept',
  RESOURCE = 'resource',
  TOPIC = 'topic',
  PREDICATE = 'predicate',
  MEDIA = 'media'
}

/**
 * Base content interface
 */
export interface ContentBase {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Concept content interface
 */
export interface ConceptContent extends ContentBase {
  definition: string;
  examples?: string[];
  relatedConcepts?: string[];
  domain?: string;
}

/**
 * Resource content interface
 */
export interface ResourceContent extends ContentBase {
  url: string;
  type: string;
  format?: string;
  size?: number;
  license?: string;
  authors?: string[];
}

/**
 * Topic content interface
 */
export interface TopicContent extends ContentBase {
  summary: string;
  concepts?: string[];
  resources?: string[];
  subtopics?: string[];
  parentTopic?: string;
}

/**
 * Predicate content interface
 */
export interface PredicateContent extends ContentBase {
  relation: string;
  domain?: string;
  range?: string;
  inverseOf?: string;
  transitive?: boolean;
  symmetric?: boolean;
}

/**
 * Media content interface
 */
export interface MediaContent extends ContentBase {
  mimeType: string;
  size: number;
  chunks?: string[];
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
  addTag(tag: string): void;
  removeTag(tag: string): void;
  updateContent(data: Partial<ContentBase>): void;
}
