/**
 * UOR Content Manager
 * Manages content objects in the UOR system
 */

import { UORObject } from '../core/uor-core';
import { ContentType, ContentBase, ConceptContent, ResourceContent, TopicContent, PredicateContent, MediaContent } from './content-types';
import { ConceptObject } from './concept';
import { ResourceObject } from './resource';
import { TopicObject } from './topic';
import { PredicateObject } from './predicate';
import { MediaObject } from './media';

/**
 * Content Manager class
 * Singleton that manages content objects
 */
export class ContentManager {
  private static instance: ContentManager;
  
  /**
   * Gets the singleton instance
   * @returns The content manager instance
   */
  public static getInstance(): ContentManager {
    if (!ContentManager.instance) {
      ContentManager.instance = new ContentManager();
    }
    return ContentManager.instance;
  }
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}
  
  /**
   * Creates a new content object
   * @param type Content type
   * @param id Unique content ID
   * @param data Content data
   * @returns The created content object
   */
  createContent(type: ContentType, id: string, data: Partial<ContentBase>): UORObject {
    switch (type) {
      case ContentType.CONCEPT:
        return new ConceptObject(id, data as Partial<ConceptContent>);
        
      case ContentType.RESOURCE:
        return new ResourceObject(id, data as Partial<ResourceContent>);
        
      case ContentType.TOPIC:
        return new TopicObject(id, data as Partial<TopicContent>);
        
      case ContentType.PREDICATE:
        return new PredicateObject(id, data as Partial<PredicateContent>);
        
      case ContentType.MEDIA:
        return new MediaObject(id, data as Partial<MediaContent>);
        
      default:
        throw new Error(`Unsupported content type: ${type}`);
    }
  }
  
  /**
   * Updates an existing content object
   * @param content Content object to update
   * @param data Updated content data
   * @returns The updated content object
   */
  updateContent(content: UORObject, data: Partial<ContentBase>): UORObject {
    switch (content.type) {
      case ContentType.CONCEPT:
        (content as ConceptObject).updateContent(data as Partial<ConceptContent>);
        break;
        
      case ContentType.RESOURCE:
        (content as ResourceObject).updateContent(data as Partial<ResourceContent>);
        break;
        
      case ContentType.TOPIC:
        (content as TopicObject).updateContent(data as Partial<TopicContent>);
        break;
        
      case ContentType.PREDICATE:
        (content as PredicateObject).updateContent(data as Partial<PredicateContent>);
        break;
        
      case ContentType.MEDIA:
        (content as MediaObject).updateContent(data as Partial<MediaContent>);
        break;
        
      default:
        throw new Error(`Unsupported content type: ${content.type}`);
    }
    
    content.setCanonicalRepresentation(content.computeCanonicalRepresentation());
    content.setPrimeDecomposition(content.computePrimeDecomposition());
    
    return content;
  }
  
  /**
   * Validates a content object
   * @param content Content object to validate
   * @returns Whether the content is valid
   */
  validateContent(content: UORObject): boolean {
    return content.validate();
  }
  
  /**
   * Adds a tag to a content object
   * @param content Content object
   * @param tag Tag to add
   * @returns The updated content object
   */
  addTag(content: UORObject, tag: string): UORObject {
    switch (content.type) {
      case ContentType.CONCEPT:
        (content as ConceptObject).addTag(tag);
        break;
        
      case ContentType.RESOURCE:
        (content as ResourceObject).addTag(tag);
        break;
        
      case ContentType.TOPIC:
        (content as TopicObject).addTag(tag);
        break;
        
      case ContentType.PREDICATE:
        (content as PredicateObject).addTag(tag);
        break;
        
      case ContentType.MEDIA:
        (content as MediaObject).addTag(tag);
        break;
        
      default:
        throw new Error(`Unsupported content type: ${content.type}`);
    }
    
    content.setCanonicalRepresentation(content.computeCanonicalRepresentation());
    content.setPrimeDecomposition(content.computePrimeDecomposition());
    
    return content;
  }
  
  /**
   * Removes a tag from a content object
   * @param content Content object
   * @param tag Tag to remove
   * @returns The updated content object
   */
  removeTag(content: UORObject, tag: string): UORObject {
    switch (content.type) {
      case ContentType.CONCEPT:
        (content as ConceptObject).removeTag(tag);
        break;
        
      case ContentType.RESOURCE:
        (content as ResourceObject).removeTag(tag);
        break;
        
      case ContentType.TOPIC:
        (content as TopicObject).removeTag(tag);
        break;
        
      case ContentType.PREDICATE:
        (content as PredicateObject).removeTag(tag);
        break;
        
      case ContentType.MEDIA:
        (content as MediaObject).removeTag(tag);
        break;
        
      default:
        throw new Error(`Unsupported content type: ${content.type}`);
    }
    
    content.setCanonicalRepresentation(content.computeCanonicalRepresentation());
    content.setPrimeDecomposition(content.computePrimeDecomposition());
    
    return content;
  }
  
  /**
   * Creates a concept object
   * @param id Unique concept ID
   * @param data Concept data
   * @returns The created concept object
   */
  createConcept(id: string, data: Partial<ConceptContent>): ConceptObject {
    return new ConceptObject(id, data);
  }
  
  /**
   * Creates a resource object
   * @param id Unique resource ID
   * @param data Resource data
   * @returns The created resource object
   */
  createResource(id: string, data: Partial<ResourceContent>): ResourceObject {
    return new ResourceObject(id, data);
  }
  
  /**
   * Creates a topic object
   * @param id Unique topic ID
   * @param data Topic data
   * @returns The created topic object
   */
  createTopic(id: string, data: Partial<TopicContent>): TopicObject {
    return new TopicObject(id, data);
  }
  
  /**
   * Creates a predicate object
   * @param id Unique predicate ID
   * @param data Predicate data
   * @returns The created predicate object
   */
  createPredicate(id: string, data: Partial<PredicateContent>): PredicateObject {
    return new PredicateObject(id, data);
  }
  
  /**
   * Creates a media object
   * @param id Unique media ID
   * @param data Media data
   * @returns The created media object
   */
  createMedia(id: string, data: Partial<MediaContent>): MediaObject {
    return new MediaObject(id, data);
  }
  
  /**
   * Adds content to a media object
   * @param media Media object
   * @param content Base64-encoded content
   * @returns The updated media object
   */
  addMediaContent(media: MediaObject, content: string): MediaObject {
    const chunkSize = 64 * 1024; // 64KB chunks
    for (let i = 0; i < content.length; i += chunkSize) {
      const chunk = content.substring(i, i + chunkSize);
      media.addChunk(chunk);
    }
    
    media.setCanonicalRepresentation(media.computeCanonicalRepresentation());
    media.setPrimeDecomposition(media.computePrimeDecomposition());
    
    return media;
  }
}

export default ContentManager.getInstance();
