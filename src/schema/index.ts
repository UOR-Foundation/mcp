/**
 * Schema Module
 * Exports all schema-related components
 */

export * from './schema-types';
export * from './schema-loader';
export { SchemaValidator } from './schema-validator';
export * from './schema-integration';

import { SchemaIntegration } from './schema-integration';

const initializeSchemaIntegration = async () => {
  try {
    const schemaIntegration = SchemaIntegration.getInstance();
    await schemaIntegration.initialize();
    console.log('Schema integration initialized on module load');
  } catch (error) {
    console.error('Error initializing schema integration on module load:', error);
  }
};

initializeSchemaIntegration();
