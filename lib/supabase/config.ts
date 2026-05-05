/**
 * Supabase Configuration
 *
 * Tokoflow uses 'public' schema on dedicated Supabase instance (yhwjvdwmwboasehznlfv).
 */

export const APP_SCHEMA = process.env.NEXT_PUBLIC_APP_SCHEMA || 'public';
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Tokoflow';
