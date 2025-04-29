/**
 * UOR Profile Schema
 * Defines validation schemas for profile and identity data
 */

/**
 * Identity schema for validation
 */
export const IdentitySchema = {
  type: 'object',
  required: ['id', 'providers', 'profile', 'customFields', 'verificationStatus', 'createdAt', 'updatedAt'],
  properties: {
    id: { type: 'string' },
    providers: {
      type: 'array',
      items: {
        type: 'object',
        required: ['type', 'id', 'username', 'verified'],
        properties: {
          type: { type: 'string', enum: ['github'] },
          id: { type: 'string' },
          username: { type: 'string' },
          verified: { type: 'boolean' },
          verifiedAt: { type: 'string', format: 'date-time' }
        }
      }
    },
    profile: {
      type: 'object',
      properties: {
        displayName: { type: 'string' },
        bio: { type: 'string' },
        location: { type: 'string' },
        website: { type: 'string', format: 'uri' },
        email: { type: 'string', format: 'email' },
        profileImageRef: { type: 'string' }
      }
    },
    customFields: {
      type: 'array',
      items: {
        type: 'object',
        required: ['key', 'value', 'isPublic'],
        properties: {
          key: { type: 'string', pattern: '^[a-zA-Z0-9_-]+$', maxLength: 50 },
          value: { type: 'string' },
          isPublic: { type: 'boolean' }
        }
      }
    },
    verificationStatus: { type: 'string', enum: ['unverified', 'pending', 'verified'] },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

/**
 * Profile schema for validation
 */
export const ProfileSchema = {
  type: 'object',
  properties: {
    displayName: { type: 'string', maxLength: 100 },
    bio: { type: 'string', maxLength: 500 },
    location: { type: 'string', maxLength: 100 },
    website: { type: 'string', format: 'uri', maxLength: 200 },
    email: { type: 'string', format: 'email', maxLength: 100 },
    profileImageRef: { type: 'string' }
  }
};

/**
 * Custom field schema for validation
 */
export const CustomFieldSchema = {
  type: 'object',
  required: ['key', 'value', 'isPublic'],
  properties: {
    key: { type: 'string', pattern: '^[a-zA-Z0-9_-]+$', maxLength: 50 },
    value: { type: 'string', maxLength: 500 },
    isPublic: { type: 'boolean' }
  }
};

/**
 * Profile image schema for validation
 */
export const ProfileImageSchema = {
  type: 'object',
  required: ['id', 'mimeType', 'size'],
  properties: {
    id: { type: 'string' },
    mimeType: { 
      type: 'string', 
      enum: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] 
    },
    size: { type: 'number', maximum: 5242880 }, // 5MB max
    chunks: { 
      type: 'array',
      items: { type: 'string' }
    }
  }
};
