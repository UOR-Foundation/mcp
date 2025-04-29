/**
 * UOR Profile Schema
 * Defines the schema for profile data validation
 */

/**
 * Profile schema definition
 */
export const ProfileSchema = {
  type: 'object',
  properties: {
    displayName: {
      type: 'string',
      maxLength: 100,
      description: 'Display name for the user'
    },
    bio: {
      type: 'string',
      maxLength: 500,
      description: 'Short biography or description'
    },
    location: {
      type: 'string',
      maxLength: 100,
      description: 'Geographic location'
    },
    website: {
      type: 'string',
      format: 'uri',
      maxLength: 200,
      description: 'Personal website URL'
    },
    email: {
      type: 'string',
      format: 'email',
      maxLength: 100,
      description: 'Contact email address'
    },
    profileImageRef: {
      type: 'string',
      pattern: '^uor://.+$',
      description: 'UOR reference to profile image'
    }
  },
  additionalProperties: false
};

/**
 * Custom field schema definition
 */
export const CustomFieldSchema = {
  type: 'object',
  properties: {
    key: {
      type: 'string',
      pattern: '^[a-zA-Z0-9_-]+$',
      maxLength: 50,
      description: 'Custom field key (alphanumeric, underscore, hyphen)'
    },
    value: {
      type: ['string', 'number', 'boolean', 'object', 'array'],
      description: 'Custom field value'
    },
    isPublic: {
      type: 'boolean',
      description: 'Whether the field is publicly visible'
    }
  },
  required: ['key', 'value', 'isPublic'],
  additionalProperties: false
};

/**
 * Identity schema definition
 */
export const IdentitySchema = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      pattern: '^[a-zA-Z0-9_-]+$',
      description: 'Unique identity ID'
    },
    providers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['github'],
            description: 'Identity provider type'
          },
          id: {
            type: 'string',
            description: 'Provider-specific ID'
          },
          username: {
            type: 'string',
            description: 'Provider-specific username'
          },
          verified: {
            type: 'boolean',
            description: 'Whether the identity is verified with this provider'
          },
          verifiedAt: {
            type: 'string',
            format: 'date-time',
            description: 'When the identity was verified'
          }
        },
        required: ['type', 'id', 'username', 'verified'],
        additionalProperties: false
      }
    },
    profile: ProfileSchema,
    customFields: {
      type: 'array',
      items: CustomFieldSchema
    },
    verificationStatus: {
      type: 'string',
      enum: ['unverified', 'pending', 'verified'],
      description: 'Overall verification status'
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      description: 'When the identity was created'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      description: 'When the identity was last updated'
    }
  },
  required: ['id', 'providers', 'profile', 'customFields', 'verificationStatus', 'createdAt', 'updatedAt'],
  additionalProperties: false
};
