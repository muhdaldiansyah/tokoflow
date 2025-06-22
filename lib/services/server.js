// lib/services/server.js
/**
 * Server-only services wrapper
 * This file ensures services are only used in server contexts
 */

// This will throw an error if imported in client components
import '../server-only';

// Re-export all services
export * from './inventory';
export * from './composition';
export * from './sales';
export * from './incoming-goods';
