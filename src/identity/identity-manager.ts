/**
 * UOR Identity Manager
 * Manages user identities in the UOR system
 */

import {
  UORObject,
  CanonicalRepresentation,
  PrimeDecomposition,
  ObserverFrame,
  CoherenceMeasure,
  PrimeFactor,
} from '../core/uor-core';
import {
  IdentityData,
  IdentityUORObject,
  ProfileInfo,
  CustomProfileField,
  PublicIdentityView,
  IdentityProviderType,
  IdentityVerificationStatus,
} from './identity-types';
import { IdentitySchema } from './profile-schema';

/**
 * Implementation of UOR Identity Object
 */
export class IdentityObject extends UORObject implements IdentityUORObject {
  private data: IdentityData;

  /**
   * Creates a new identity object
   * @param id Unique identity ID
   * @param data Initial identity data
   */
  constructor(id: string, data: Partial<IdentityData>) {
    super(id, 'identity');

    this.data = {
      id: id,
      providers: [],
      profile: {},
      customFields: [],
      verificationStatus: IdentityVerificationStatus.UNVERIFIED,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };
  }

  /**
   * Gets the complete identity data
   * @returns The identity data
   */
  getIdentityData(): IdentityData {
    return { ...this.data };
  }

  /**
   * Gets the public view of this identity
   * @returns Public identity view
   */
  getPublicView(): PublicIdentityView {
    const { id, verificationStatus } = this.data;

    const providers = this.data.providers.map(provider => ({
      type: provider.type,
      username: provider.username,
      verified: provider.verified,
    }));

    const { email, ...publicProfile } = this.data.profile;

    return {
      id,
      providers,
      profile: publicProfile,
      verificationStatus,
    };
  }

  /**
   * Updates profile information
   * @param profile Updated profile data
   */
  updateProfile(profile: Partial<ProfileInfo>): void {
    this.data.profile = {
      ...this.data.profile,
      ...profile,
    };
    this.data.updatedAt = new Date();
  }

  /**
   * Adds a custom profile field
   * @param field Custom field to add
   */
  addCustomField(field: CustomProfileField): void {
    this.removeCustomField(field.key);

    this.data.customFields.push(field);
    this.data.updatedAt = new Date();
  }

  /**
   * Removes a custom profile field
   * @param key Key of the field to remove
   */
  removeCustomField(key: string): void {
    this.data.customFields = this.data.customFields.filter(field => field.key !== key);
    this.data.updatedAt = new Date();
  }

  /**
   * Sets the profile image reference
   * @param imageRef UOR reference to profile image
   */
  setProfileImage(imageRef: string): void {
    this.data.profile.profileImageRef = imageRef;
    this.data.updatedAt = new Date();
  }

  /**
   * Updates the verification status for a provider
   * @param provider Provider type
   * @param verified Whether the provider is verified
   */
  verifyProvider(provider: IdentityProviderType, verified: boolean): void {
    const providerIndex = this.data.providers.findIndex(p => p.type === provider);

    if (providerIndex >= 0) {
      this.data.providers[providerIndex].verified = verified;

      if (verified) {
        this.data.providers[providerIndex].verifiedAt = new Date();
      }

      this.updateVerificationStatus();
    }

    this.data.updatedAt = new Date();
  }

  /**
   * Updates the overall verification status based on providers
   */
  private updateVerificationStatus(): void {
    const hasVerifiedProviders = this.data.providers.some(p => p.verified);

    if (hasVerifiedProviders) {
      this.data.verificationStatus = IdentityVerificationStatus.VERIFIED;
    } else if (this.data.providers.length > 0) {
      this.data.verificationStatus = IdentityVerificationStatus.PENDING;
    } else {
      this.data.verificationStatus = IdentityVerificationStatus.UNVERIFIED;
    }
  }

  /**
   * Transforms this identity to a different observer frame
   * @param newFrame The new observer frame
   * @returns A new identity object in the new frame
   */
  transformToFrame(newFrame: ObserverFrame): UORObject {
    const newIdentity = new IdentityObject(this.id, this.data);
    newIdentity.setObserverFrame(newFrame);
    return newIdentity;
  }

  /**
   * Computes the prime decomposition of this identity
   * @returns The prime decomposition
   */
  computePrimeDecomposition(): PrimeDecomposition {
    const primeFactors: PrimeFactor[] = [
      {
        id: `identity:${this.id}`,
        value: { id: this.id, type: 'identity' },
        domain: 'identity',
      },

      ...this.data.providers.map(provider => ({
        id: `provider:${provider.type}:${provider.username}`,
        value: {
          type: provider.type,
          username: provider.username,
          verified: provider.verified,
        },
        domain: 'identity.provider',
      })),

      ...Object.entries(this.data.profile)
        .filter(([_, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => ({
          id: `profile:${key}`,
          value: { [key]: value },
          domain: 'identity.profile',
        })),
    ];

    return {
      primeFactors,
      decompositionMethod: 'identity-decomposition',
    };
  }

  /**
   * Computes the canonical representation of this identity
   * @returns The canonical representation
   */
  computeCanonicalRepresentation(): CanonicalRepresentation {
    const canonicalData = {
      id: this.data.id,
      providers: [...this.data.providers].sort((a, b) =>
        `${a.type}:${a.username}`.localeCompare(`${b.type}:${b.username}`)
      ),
      profile: { ...this.data.profile },
      customFields: [...this.data.customFields].sort((a, b) => a.key.localeCompare(b.key)),
      verificationStatus: this.data.verificationStatus,
      createdAt: this.data.createdAt.toISOString(),
      updatedAt: this.data.updatedAt.toISOString(),
    };

    return {
      representationType: 'identity-canonical',
      value: canonicalData,
      coherenceNorm: 1.0, // Perfect coherence for canonical form
    };
  }

  /**
   * Measures the coherence of this identity representation
   * @returns The coherence measure
   */
  measureCoherence(): CoherenceMeasure {
    let verificationScore = 0;
    switch (this.data.verificationStatus) {
      case IdentityVerificationStatus.VERIFIED:
        verificationScore = 0.5;
        break;
      case IdentityVerificationStatus.PENDING:
        verificationScore = 0.25;
        break;
      default:
        verificationScore = 0;
    }

    const profileFields = ['displayName', 'bio', 'location', 'website', 'email', 'profileImageRef'];
    const filledFields = profileFields.filter(
      field =>
        this.data.profile[field as keyof ProfileInfo] !== undefined &&
        this.data.profile[field as keyof ProfileInfo] !== null &&
        this.data.profile[field as keyof ProfileInfo] !== ''
    );

    const profileScore = (filledFields.length / profileFields.length) * 0.5;

    const coherenceValue = verificationScore + profileScore;

    return {
      type: 'identity-coherence',
      value: coherenceValue,
      normalization: 'linear-sum',
    };
  }

  /**
   * Serializes this identity to a JSON representation
   * @returns Serialized identity object
   */
  serialize(): object {
    return {
      id: this.id,
      type: this.type,
      data: this.data,
      canonicalRepresentation:
        this.canonicalRepresentation || this.computeCanonicalRepresentation(),
      primeDecomposition: this.primeDecomposition || this.computePrimeDecomposition(),
      observerFrame: this.observerFrame,
    };
  }

  /**
   * Validates this identity against its schema
   * @returns Whether the identity is valid
   */
  validate(): boolean {
    if (!this.data.id || this.data.id !== this.id) {
      return false;
    }

    for (const provider of this.data.providers) {
      if (!provider.type || !provider.username || provider.verified === undefined) {
        return false;
      }
    }

    for (const field of this.data.customFields) {
      if (!field.key || field.value === undefined || field.isPublic === undefined) {
        return false;
      }
    }

    return true;
  }

  /**
   * Gets the intrinsic prime factors for the identity domain
   * @returns Array of intrinsic prime factors
   */
  getIntrinsicPrimes(): PrimeFactor[] {
    return [
      {
        id: 'identity:core',
        value: { type: 'identity' },
        domain: 'identity',
      },
    ];
  }
}

/**
 * Identity Manager class
 * Manages identity creation, retrieval, and verification
 */
export class IdentityManager {
  private static instance: IdentityManager;

  /**
   * Gets the singleton instance
   * @returns The identity manager instance
   */
  public static getInstance(): IdentityManager {
    if (!IdentityManager.instance) {
      IdentityManager.instance = new IdentityManager();
    }
    return IdentityManager.instance;
  }

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}

  /**
   * Creates a new identity linked to a GitHub account
   * @param githubUser GitHub user information
   * @returns The created identity object
   */
  async createIdentity(githubUser: {
    id: string;
    login: string;
    name?: string;
    email?: string;
  }): Promise<IdentityObject> {
    const identityId = `identity-${githubUser.login}-${Date.now()}`;

    const identityData: Partial<IdentityData> = {
      providers: [
        {
          type: IdentityProviderType.GITHUB,
          id: githubUser.id,
          username: githubUser.login,
          verified: false,
        },
      ],
      profile: {
        displayName: githubUser.name,
        email: githubUser.email,
      },
      verificationStatus: IdentityVerificationStatus.PENDING,
    };

    const identity = new IdentityObject(identityId, identityData);

    identity.setCanonicalRepresentation(identity.computeCanonicalRepresentation());
    identity.setPrimeDecomposition(identity.computePrimeDecomposition());

    return identity;
  }

  /**
   * Verifies an identity with GitHub
   * @param identity The identity to verify
   * @param githubToken Valid GitHub token
   * @returns Whether verification was successful
   */
  async verifyIdentityWithGitHub(identity: IdentityObject, githubToken: string): Promise<boolean> {
    try {
      const githubProvider = identity
        .getIdentityData()
        .providers.find(p => p.type === IdentityProviderType.GITHUB);

      if (!githubProvider) {
        return false;
      }

      identity.verifyProvider(IdentityProviderType.GITHUB, true);

      return true;
    } catch (error) {
      console.error('Error verifying identity with GitHub:', error);
      return false;
    }
  }

  /**
   * Updates an identity with the latest GitHub information
   * @param identity The identity to update
   * @param githubUser Updated GitHub user information
   * @returns The updated identity
   */
  updateIdentityFromGitHub(
    identity: IdentityObject,
    githubUser: { name?: string; email?: string; location?: string; bio?: string; blog?: string }
  ): IdentityObject {
    identity.updateProfile({
      displayName: githubUser.name,
      email: githubUser.email,
      location: githubUser.location,
      bio: githubUser.bio,
      website: githubUser.blog,
    });

    identity.setCanonicalRepresentation(identity.computeCanonicalRepresentation());
    identity.setPrimeDecomposition(identity.computePrimeDecomposition());

    return identity;
  }
}
