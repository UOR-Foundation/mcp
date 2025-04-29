/**
 * UOR Reference Utilities
 * Provides tools for working with UOR references
 */

/**
 * Structure of a UOR Reference
 */
export interface UORReference {
  /** Full UOR reference string */
  reference: string;

  /** Namespace component (usually username) */
  namespace: string;

  /** Type component (concepts, resources, etc.) */
  type: string;

  /** Identifier component */
  id: string;
}

/**
 * UOR Reference utilities class
 */
export class UORReferenceUtil {
  /**
   * Creates a UOR reference from components
   * @param namespace The namespace component
   * @param type The type component
   * @param id The identifier component
   * @returns Full UOR reference string
   */
  static create(namespace: string, type: string, id: string): string {
    return `uor://${namespace}/${type}/${id}`;
  }

  /**
   * Parses a UOR reference string
   * @param reference The UOR reference string
   * @returns Parsed reference components
   * @throws Error if the reference is invalid
   */
  static parse(reference: string): UORReference {
    try {
      // Validate and parse the UOR reference
      if (!reference.startsWith('uor://')) {
        throw new Error('Invalid UOR reference scheme');
      }

      const url = new URL(reference);
      const parts = url.pathname.split('/').filter(part => part.length > 0);

      if (parts.length < 2) {
        throw new Error('Invalid UOR reference path');
      }

      return {
        reference,
        namespace: url.hostname,
        type: parts[0],
        id: parts[1],
      };
    } catch (err) {
      const error = err as Error;
      throw new Error(`Invalid UOR reference: ${error.message}`);
    }
  }

  /**
   * Converts a GitHub URL to a UOR reference
   * @param githubUrl GitHub URL for content in a uordb repository
   * @returns UOR reference
   * @throws Error if the URL is not a valid GitHub uordb URL
   */
  static fromGitHubUrl(githubUrl: string): UORReference {
    try {
      const url = new URL(githubUrl);

      // Check if it's a GitHub URL
      if (!url.hostname.includes('github.com') && !url.hostname.includes('githubusercontent.com')) {
        throw new Error('Not a GitHub URL');
      }

      // Parse path components
      const pathParts = url.pathname.split('/').filter(part => part.length > 0);

      // GitHub raw content URLs
      if (url.hostname.includes('githubusercontent.com')) {
        // Format: raw.githubusercontent.com/username/uordb/branch/type/id.json
        if (pathParts.length < 5 || pathParts[1] !== 'uordb') {
          throw new Error('Not a valid uordb path');
        }

        const namespace = pathParts[0];
        const type = pathParts[3];
        let id = pathParts[4];

        // Remove file extension if present
        if (id.endsWith('.json')) {
          id = id.substring(0, id.length - 5);
        }

        return {
          reference: UORReferenceUtil.create(namespace, type, id),
          namespace,
          type,
          id,
        };
      }

      // GitHub repository URLs
      if (pathParts.length < 4 || pathParts[1] !== 'uordb') {
        throw new Error('Not a valid uordb path');
      }

      const namespace = pathParts[0];
      const type = pathParts[3];
      let id = pathParts[4] || '';

      // Remove file extension if present
      if (id.endsWith('.json')) {
        id = id.substring(0, id.length - 5);
      }

      return {
        reference: UORReferenceUtil.create(namespace, type, id),
        namespace,
        type,
        id,
      };
    } catch (err) {
      const error = err as Error;
      throw new Error(`Cannot convert GitHub URL to UOR reference: ${error.message}`);
    }
  }

  /**
   * Converts a UOR reference to a GitHub raw content URL
   * @param reference UOR reference or parsed reference object
   * @param branch Git branch name (default: main)
   * @returns GitHub raw content URL
   */
  static toGitHubUrl(reference: string | UORReference, branch: string = 'main'): string {
    let ref: UORReference;

    if (typeof reference === 'string') {
      ref = UORReferenceUtil.parse(reference);
    } else {
      ref = reference;
    }

    return `https://raw.githubusercontent.com/${ref.namespace}/uordb/${branch}/${ref.type}/${ref.id}.json`;
  }

  /**
   * Converts a UOR reference to a GitHub repository URL
   * @param reference UOR reference or parsed reference object
   * @returns GitHub repository URL
   */
  static toGitHubRepoUrl(reference: string | UORReference): string {
    let ref: UORReference;

    if (typeof reference === 'string') {
      ref = UORReferenceUtil.parse(reference);
    } else {
      ref = reference;
    }

    return `https://github.com/${ref.namespace}/uordb/blob/main/${ref.type}/${ref.id}.json`;
  }

  /**
   * Validates a UOR reference
   * @param reference UOR reference string
   * @returns Whether the reference is valid
   */
  static isValid(reference: string): boolean {
    try {
      UORReferenceUtil.parse(reference);
      return true;
    } catch (error) {
      return false;
    }
  }
}
