// lib/database/index.js
// Re-export database modules - only client-safe exports
export { createClient, supabase } from './supabase/client';
export * from './helpers';