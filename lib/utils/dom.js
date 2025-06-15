// lib/utils/dom.js

/**
 * Generates a random ID for use with elements that need unique identifiers
 * @param {string} prefix - Prefix for the ID
 * @returns {string} Generated ID
 */
export function generateId(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}
