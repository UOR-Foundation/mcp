/**
 * UOR Factory
 * Provides factory methods for creating UOR objects
 */
import { UORObject, PrimeDecomposition, CanonicalRepresentation, ObserverFrame } from './uor-core';
import {
  BaseUORObject,
  SimpleUORSchema,
  TextArtifact,
  GitHubNamespaceResolver,
} from './uor-implementations';
import { UORReferenceUtil } from './uor-reference';

/**
 * UOR Object Factory
 * Creates and manages UOR objects
 */
export class UORFactory {
  /** Default observer frame */
  private static defaultFrame: ObserverFrame = {
    id: 'default-frame',
    type: 'StandardFrame',
    invariantProperties: ['id', 'type'],
  };

  /**
   * Creates a UOR object from data
   * @param type Object type
   * @param data Object data
   * @param namespace Namespace for the object
   * @param domain Domain for the object
   * @returns The created UOR object
   */
  static createObject(
    type: string,
    data: any,
    namespace: string,
    domain: string = 'generic'
  ): UORObject {
    // Generate a unique ID
    const id = `${namespace}:${type}:${this.generateId()}`;

    // Create appropriate object based on type
    let obj: UORObject;

    switch (type) {
      case 'schema':
        obj = new SimpleUORSchema(id, data);
        break;

      case 'text':
        const textArtifact = new TextArtifact(
          id,
          'text/plain',
          typeof data === 'string' ? data.length : 0
        );

        // Add content as a single chunk
        if (typeof data === 'string') {
          textArtifact.addChunk(btoa(unescape(encodeURIComponent(data))));
        }

        obj = textArtifact;
        break;

      case 'resolver':
        if (typeof data !== 'object' || !data.targetNamespace) {
          throw new Error('Resolver requires targetNamespace property');
        }

        obj = new GitHubNamespaceResolver(id, namespace, data.targetNamespace);
        break;

      default:
        obj = new BaseUORObject(id, type, data, domain);
    }

    // Compute and set canonical representation
    const canonicalRep = obj.computeCanonicalRepresentation();
    obj.setCanonicalRepresentation(canonicalRep);

    // Compute and set prime decomposition
    const decomposition = obj.computePrimeDecomposition();
    obj.setPrimeDecomposition(decomposition);

    // Set default observer frame if none provided
    obj.setObserverFrame(this.defaultFrame);

    return obj;
  }

  /**
   * Creates a UOR object from a serialized form
   * @param serialized Serialized UOR object
   * @returns The deserialized UOR object
   */
  static fromSerialized(serialized: any): UORObject {
    // Validate minimal required properties
    if (!serialized.id || !serialized.type) {
      throw new Error('Invalid serialized UOR object');
    }

    // Extract namespace from ID if not provided
    let namespace = serialized.namespace;
    if (!namespace && serialized.id.includes(':')) {
      namespace = serialized.id.split(':')[0];
    }

    // Extract data based on object type
    let data: any;
    switch (serialized.type) {
      case 'UORSchema':
        data = serialized.schema;
        break;

      case 'UORArtifact':
        data = serialized.chunks;
        break;

      case 'UORResolver':
        data = {
          targetNamespace: serialized.targetNamespace,
          resolutionMethod: serialized.resolutionMethod,
        };
        break;

      default:
        // For generic objects, extract data from canonical representation
        data = serialized.canonicalRepresentation?.value?.data || serialized.data || {};
    }

    // Create the object
    const obj = this.createObject(
      serialized.type,
      data,
      namespace || 'unknown',
      serialized.domain || 'generic'
    );

    // Override the generated ID with the serialized one
    (obj as any).id = serialized.id;

    // Restore decomposition if provided
    if (serialized.primeDecomposition) {
      obj.setPrimeDecomposition(serialized.primeDecomposition as PrimeDecomposition);
    }

    // Restore canonical representation if provided
    if (serialized.canonicalRepresentation) {
      obj.setCanonicalRepresentation(serialized.canonicalRepresentation as CanonicalRepresentation);
    }

    // Restore observer frame if provided
    if (serialized.observerFrame) {
      obj.setObserverFrame(serialized.observerFrame as ObserverFrame);
    }

    return obj;
  }

  /**
   * Creates a UOR object from a UOR reference and data
   * @param reference UOR reference string
   * @param data Object data
   * @returns The created UOR object
   */
  static fromReference(reference: string, data: any): UORObject {
    const ref = UORReferenceUtil.parse(reference);

    // Create object using components from reference
    return this.createObject(ref.type, data, ref.namespace);
  }

  /**
   * Sets the default observer frame
   * @param frame The frame to set as default
   */
  static setDefaultFrame(frame: ObserverFrame): void {
    this.defaultFrame = frame;
  }

  /**
   * Gets the default observer frame
   * @returns The default observer frame
   */
  static getDefaultFrame(): ObserverFrame {
    return this.defaultFrame;
  }

  /**
   * Generates a unique identifier
   * @returns A unique ID string
   */
  private static generateId(): string {
    // Generate a random ID with timestamp for uniqueness
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return `${timestamp}-${random}`;
  }
}
