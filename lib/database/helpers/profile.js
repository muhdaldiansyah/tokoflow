// lib/database/helpers/profile.js
/**
 * Database helper functions for profile operations
 */
// Import type definitions from the JavaScript types file
// These are JSDoc typedefs, not actual imports
// @see {@link ../types/database.js}

/**
 * @typedef {Object} ProfilePartial
 * @property {string} id
 * @property {string} user_id
 * @property {number} credits_balance
 * @property {string | null} next_credits_expiry_date
 * @property {string | null} full_name
 */

/**
 * @typedef {Object} Profile
 * @property {string} id
 * @property {string} user_id
 * @property {string | null} full_name
 * @property {string | null} avatar_url
 * @property {number} credits_balance
 * @property {string | null} next_credits_expiry_date
 * @property {string} created_at
 * @property {string | null} updated_at
 * @property {string | null} email
 * @property {string | null} institution
 * @property {string | null} role
 */

/**
 * Safely converts a database profile (which might be partial)
 * to a ProfilePartial type with required fields for credit operations
 * @param {unknown} profile - The profile object to convert
 * @returns {ProfilePartial | null} The converted profile or null if invalid
 */
export function toProfilePartial(profile) {
  if (!profile || typeof profile !== 'object') return null;
  
  const requiredKeys = ['id', 'credits_balance', 'next_credits_expiry_date', 'full_name'];
  
  // Check if all required keys exist
  const hasAllRequired = requiredKeys.every(key => key in profile);
  if (!hasAllRequired) {
    console.warn('Profile is missing required keys for credit operations');
    return null;
  }
  
  // Create a filtered object with only the fields we need
  const p = profile;
  
  // Add type checking for required fields
  if (typeof p.id !== 'string' || 
      typeof p.full_name !== 'string') {
    console.warn('Profile fields have incorrect types');
    return null;
  }

  // Handle next_credits_expiry_date conversion to string
  let expiryDate = null;
  if (p.next_credits_expiry_date) {
    if (p.next_credits_expiry_date instanceof Date) {
      expiryDate = p.next_credits_expiry_date.toISOString();
    } else if (typeof p.next_credits_expiry_date === 'string' || typeof p.next_credits_expiry_date === 'number') {
      expiryDate = new Date(p.next_credits_expiry_date).toISOString();
    }
  }

  return {
    id: p.id,
    user_id: p.id, // In av_profiles, id is the user_id (foreign key to auth.users)
    credits_balance: typeof p.credits_balance === 'number' ? p.credits_balance : 0,
    next_credits_expiry_date: expiryDate,
    full_name: p.full_name
  };
}

/**
 * Safely extends a profile with additional fields
 * @param {ProfilePartial} profile - The base profile
 * @param {Partial<Profile>} additionalFields - Additional fields to add
 * @returns {Partial<Profile>} The extended profile
 */
export function extendProfile(profile, additionalFields) {
  return {
    ...profile,
    ...additionalFields
  };
}
