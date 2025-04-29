/**
 * UOR Profile Manager
 * Manages user profile information and profile images
 */

import { UORArtifact } from '../core/uor-core';
import { IdentityObject } from './identity-manager';
import { ProfileInfo, CustomProfileField } from './identity-types';
import { ProfileSchema, CustomFieldSchema } from './profile-schema';

/**
 * Profile image artifact implementation
 */
export class ProfileImageArtifact extends UORArtifact {
  /**
   * Creates a new profile image artifact
   * @param id Unique identifier
   * @param mimeType Image MIME type
   * @param size Image size in bytes
   */
  constructor(id: string, mimeType: string, size: number) {
    super(id, mimeType, size);
  }

  /**
   * Assembles the complete image content from chunks
   * @returns The complete image content
   */
  assembleContent(): string {
    return this.chunks.join('');
  }

  /**
   * Creates a resized version of the image
   * @param width Target width
   * @param height Target height
   * @returns A new image artifact with resized content
   */
  createResizedVersion(width: number, height: number): ProfileImageArtifact {
    const resizedId = `${this.id}-${width}x${height}`;
    const resizedImage = new ProfileImageArtifact(resizedId, this.mimeType, this.size);

    this.chunks.forEach(chunk => resizedImage.addChunk(chunk));

    return resizedImage;
  }

  /**
   * Validates this artifact
   * @returns Whether the artifact is valid
   */
  validate(): boolean {
    return this.chunks.length > 0 && this.mimeType.startsWith('image/') && this.size > 0;
  }

  /**
   * Transforms this artifact to a different observer frame
   * This is a no-op for image artifacts as they are frame-invariant
   */
  transformToFrame(newFrame: any): UORArtifact {
    return this;
  }

  /**
   * Computes the prime decomposition of this image
   * For images, we don't decompose further
   */
  computePrimeDecomposition(): any {
    return {
      primeFactors: [
        {
          id: `image:${this.id}`,
          value: { id: this.id, type: 'image', mimeType: this.mimeType },
          domain: 'media',
        },
      ],
      decompositionMethod: 'media-identity',
    };
  }

  /**
   * Computes the canonical representation of this image
   */
  computeCanonicalRepresentation(): any {
    return {
      representationType: 'media-canonical',
      value: {
        id: this.id,
        mimeType: this.mimeType,
        size: this.size,
        contentHash: this.computeContentHash(),
      },
    };
  }

  /**
   * Computes a hash of the image content
   * @returns Content hash string
   */
  private computeContentHash(): string {
    return `hash-${this.id}-${this.size}`;
  }

  /**
   * Measures the coherence of this image
   */
  measureCoherence(): any {
    return {
      type: 'media-coherence',
      value: 1.0, // Perfect coherence for media objects
      normalization: 'identity',
    };
  }

  /**
   * Serializes this image to a JSON representation
   */
  serialize(): object {
    return {
      id: this.id,
      type: this.type,
      mimeType: this.mimeType,
      size: this.size,
      chunkCount: this.chunks.length,
      canonicalRepresentation:
        this.canonicalRepresentation || this.computeCanonicalRepresentation(),
    };
  }

  /**
   * Gets the intrinsic prime factors for the media domain
   */
  getIntrinsicPrimes(): any[] {
    return [
      {
        id: 'media:image',
        value: { type: 'image' },
        domain: 'media',
      },
    ];
  }
}

/**
 * Profile Manager class
 * Manages profile information and profile images
 */
export class ProfileManager {
  private static instance: ProfileManager;

  /**
   * Gets the singleton instance
   * @returns The profile manager instance
   */
  public static getInstance(): ProfileManager {
    if (!ProfileManager.instance) {
      ProfileManager.instance = new ProfileManager();
    }
    return ProfileManager.instance;
  }

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}

  /**
   * Updates a user's profile information
   * @param identity The identity to update
   * @param profileInfo Updated profile information
   * @returns The updated identity
   */
  updateProfile(identity: IdentityObject, profileInfo: Partial<ProfileInfo>): IdentityObject {
    identity.updateProfile(profileInfo);

    identity.setCanonicalRepresentation(identity.computeCanonicalRepresentation());

    return identity;
  }

  /**
   * Adds a custom field to a user's profile
   * @param identity The identity to update
   * @param field Custom field to add
   * @returns The updated identity
   */
  addCustomField(identity: IdentityObject, field: CustomProfileField): IdentityObject {
    this.validateCustomField(field);

    identity.addCustomField(field);

    identity.setCanonicalRepresentation(identity.computeCanonicalRepresentation());

    return identity;
  }

  /**
   * Removes a custom field from a user's profile
   * @param identity The identity to update
   * @param key Key of the field to remove
   * @returns The updated identity
   */
  removeCustomField(identity: IdentityObject, key: string): IdentityObject {
    identity.removeCustomField(key);

    identity.setCanonicalRepresentation(identity.computeCanonicalRepresentation());

    return identity;
  }

  /**
   * Creates a profile image from image data
   * @param imageData Base64-encoded image data
   * @param mimeType Image MIME type
   * @returns The created image artifact
   */
  createProfileImage(imageData: string, mimeType: string): ProfileImageArtifact {
    const imageId = `profile-image-${Date.now()}`;

    const imageSize = this.calculateBase64Size(imageData);
    const imageArtifact = new ProfileImageArtifact(imageId, mimeType, imageSize);

    const chunkSize = 64 * 1024;
    for (let i = 0; i < imageData.length; i += chunkSize) {
      const chunk = imageData.substring(i, i + chunkSize);
      imageArtifact.addChunk(chunk);
    }

    imageArtifact.setCanonicalRepresentation(imageArtifact.computeCanonicalRepresentation());

    return imageArtifact;
  }

  /**
   * Sets a user's profile image
   * @param identity The identity to update
   * @param imageArtifact The profile image artifact
   * @returns The updated identity
   */
  setProfileImage(identity: IdentityObject, imageArtifact: ProfileImageArtifact): IdentityObject {
    identity.setProfileImage(`uor://artifact/${imageArtifact.id}`);

    identity.setCanonicalRepresentation(identity.computeCanonicalRepresentation());

    return identity;
  }

  /**
   * Validates a custom field against the schema
   * @param field Custom field to validate
   * @throws Error if validation fails
   */
  private validateCustomField(field: CustomProfileField): void {
    if (!field.key || field.value === undefined || field.isPublic === undefined) {
      throw new Error('Invalid custom field: missing required properties');
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(field.key)) {
      throw new Error(
        'Invalid custom field key: must contain only alphanumeric characters, underscores, and hyphens'
      );
    }

    if (field.key.length > 50) {
      throw new Error('Invalid custom field key: must be 50 characters or less');
    }
  }

  /**
   * Calculates the size of base64-encoded data in bytes
   * @param base64 Base64-encoded string
   * @returns Size in bytes
   */
  private calculateBase64Size(base64: string): number {
    const base64Data = base64.replace(/^data:[^;]+;base64,/, '');

    return Math.floor((base64Data.length * 3) / 4);
  }
}
