// lib/server-only.js
/**
 * This module ensures that server-only code is not imported in client components
 */

if (typeof window !== 'undefined') {
  throw new Error(
    'This module can only be imported in server components. ' +
    'Please ensure you are not importing server-only code in client components.'
  );
}

module.exports = {};
