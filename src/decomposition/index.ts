/**
 * Decomposition Algorithms Module
 * Exports all decomposition algorithms and the decomposition manager
 */

export * from './decomposition-types';

export * from './text-decomposition';
export * from './structured-data-decomposition';
export * from './media-decomposition';
export * from './linked-data-decomposition';
export * from './domain-specific-decomposition';

export * from './decomposition-manager';

import { DecompositionManager } from './decomposition-manager';
DecompositionManager.getInstance().initialize();
