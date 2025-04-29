/**
 * UOR Content Manager
 * Manages content objects in the UOR system
 */

import {
  ContentType,
  ContentBase,
  ConceptContent,
  ResourceContent,
  TopicContent,
  PredicateContent,
  MediaContent,
} from './content-types';
import { ConceptObject } from './concept';
import { ResourceObject } from './resource';
import { TopicObject } from './topic';
import { PredicateObject } from './predicate';
import { MediaObject } from './media';
import { UORObject } from '../core/uor-core';

/**
 * Content Manager class
 * Singleton for managing content objects
 */
class ContentManager {
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
   * Creates a concept object
   * @param id Unique identifier
   * @param data Concept data
   * @returns The created concept object
   */
  createConcept(id: string, data: ConceptContent): ConceptObject {
    return new ConceptObject(id, data);
  }

  /**
   * Creates a resource object
   * @param id Unique identifier
   * @param data Resource data
   * @returns The created resource object
   */
  createResource(id: string, data: ResourceContent): ResourceObject {
    return new ResourceObject(id, data);
  }

  /**
   * Creates a topic object
   * @param id Unique identifier
   * @param data Topic data
   * @returns The created topic object
   */
  createTopic(id: string, data: TopicContent): TopicObject {
    return new TopicObject(id, data);
  }

  /**
   * Creates a predicate object
   * @param id Unique identifier
   * @param data Predicate data
   * @returns The created predicate object
   */
  createPredicate(id: string, data: PredicateContent): PredicateObject {
    return new PredicateObject(id, data);
  }

  /**
   * Creates a media object
   * @param id Unique identifier
   * @param data Media data
   * @returns The created media object
   */
  createMedia(id: string, data: MediaContent): MediaObject {
    return new MediaObject(id, data);
  }

  /**
   * Updates content object
   * @param object Content object to update
   * @param data Updated data
   * @returns The updated object
   */
  updateContent(object: UORObject, data: Partial<ContentBase>): UORObject {
    switch (object.type) {
      case ContentType.CONCEPT:
        (object as ConceptObject).updateContent(data as Partial<ConceptContent>);
        break;
      case ContentType.RESOURCE:
        (object as ResourceObject).updateContent(data as Partial<ResourceContent>);
        break;
      case ContentType.TOPIC:
        (object as TopicObject).updateContent(data as Partial<TopicContent>);
        break;
      case ContentType.PREDICATE:
        (object as PredicateObject).updateContent(data as Partial<PredicateContent>);
        break;
      case ContentType.MEDIA:
        (object as MediaObject).updateContent(data as Partial<MediaContent>);
        break;
      default:
        throw new Error(`Unknown content type: ${object.type}`);
    }

    return object;
  }

  /**
   * Adds a tag to a content object
   * @param object Content object to tag
   * @param tag Tag to add
   * @returns The updated object
   */
  addTag(object: UORObject, tag: string): UORObject {
    switch (object.type) {
      case ContentType.CONCEPT:
      case ContentType.RESOURCE:
      case ContentType.TOPIC:
      case ContentType.PREDICATE:
      case ContentType.MEDIA:
        (object as any).addTag(tag);
        break;
      default:
        throw new Error(`Cannot add tag to object of type: ${object.type}`);
    }

    return object;
  }

  /**
   * Removes a tag from a content object
   * @param object Content object to untag
   * @param tag Tag to remove
   * @returns The updated object
   */
  removeTag(object: UORObject, tag: string): UORObject {
    switch (object.type) {
      case ContentType.CONCEPT:
      case ContentType.RESOURCE:
      case ContentType.TOPIC:
      case ContentType.PREDICATE:
      case ContentType.MEDIA:
        (object as any).removeTag(tag);
        break;
      default:
        throw new Error(`Cannot remove tag from object of type: ${object.type}`);
    }

    return object;
  }

  /**
   * Adds content to a media object
   * @param object Media object
   * @param content Content to add (base64-encoded)
   * @returns The updated media object
   */
  addMediaContent(object: MediaObject, content: string): MediaObject {
    object.addContent(content);
    return object;
  }
}

export default ContentManager.getInstance();
