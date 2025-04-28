/**
 * UOR Identity and Profile Type Definitions
 * Defines the structure of identity and profile objects in the UOR system
 */

import { UORObject } from '../core/uor-core';

/**
 * Identity verification status
 */
export enum IdentityVerificationStatus {
  UNVERIFIED = 'unverified',
  PENDING = 'pending',
  VERIFIED = 'verified'
}

/**
 * Identity provider types
 */
export enum IdentityProviderType {
  GITHUB = 'github',
}

/**
 * Identity provider information
 */
export interface IdentityProvider {
  type: IdentityProviderType;
  id: string;        // Provider-specific ID (e.g., GitHub user ID)
  username: string;  // Provider-specific username
  verified: boolean; // Whether the identity has been verified with this provider
  verifiedAt?: Date; // When the identity was verified
}

/**
 * Basic profile information
 */
export interface ProfileInfo {
  displayName?: string;
  bio?: string;
  location?: string;
  website?: string;
  email?: string;
  profileImageRef?: string; // UOR reference to profile image
}

/**
 * Custom profile field
 */
export interface CustomProfileField {
  key: string;
  value: any;
  isPublic: boolean;
}

/**
 * Complete identity data structure
 */
export interface IdentityData {
  id: string;                                // Unique identity ID
  providers: IdentityProvider[];             // Identity providers (GitHub, etc.)
  profile: ProfileInfo;                      // Basic profile information
  customFields: CustomProfileField[];        // Custom profile fields
  verificationStatus: IdentityVerificationStatus;
  createdAt: Date;                           // When the identity was created
  updatedAt: Date;                           // When the identity was last updated
}

/**
 * Public identity view (for other users)
 */
export interface PublicIdentityView {
  id: string;                                // Unique identity ID
  providers: Pick<IdentityProvider, 'type' | 'username' | 'verified'>[]; // Limited provider info
  profile: Omit<ProfileInfo, 'email'>;       // Public profile info (no email)
  verificationStatus: IdentityVerificationStatus;
}

/**
 * Identity UOR object interface
 */
export interface IdentityUORObject extends UORObject {
  getIdentityData(): IdentityData;
  getPublicView(): PublicIdentityView;
  updateProfile(profile: Partial<ProfileInfo>): void;
  addCustomField(field: CustomProfileField): void;
  removeCustomField(key: string): void;
  setProfileImage(imageRef: string): void;
  verifyProvider(provider: IdentityProviderType, verified: boolean): void;
}
