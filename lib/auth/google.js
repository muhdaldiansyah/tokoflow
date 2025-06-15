// lib/auth/google.js
import { createClient } from '../database/supabase';

// The GoogleTokenPayload interface is removed as it's a TypeScript construct.
// The decodeJwtToken function will still return an object with a similar shape,
// or null, but without explicit type checking at compile time.

// Function to decode JWT token
function decodeJwtToken(token) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) {
      console.error('Invalid JWT token: Missing payload part.');
      return null;
    }
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error decoding JWT token:', e);
    return null;
  }
}

// Function to sign in with Google ID token directly
export async function signInWithGoogleToken(idToken) {
  try {
    console.log('Signing in with Google token');
    
    const supabase = createClient();

    // Decode the token to get user info
    const decodedToken = decodeJwtToken(idToken);

    if (!decodedToken) {
      throw new Error('Invalid Google token or failed to decode');
    }

    console.log('Token decoded, signing in with Supabase');

    // Use Supabase's sign in with ID token method
    // This bypasses the OAuth redirect flow
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) {
      console.error('Supabase auth error:', error);
      throw error;
    }

    console.log('Successfully signed in with Google token');
    return { data, error: null };
  } catch (error) {
    console.error('Error in Google auth:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error during Google authentication')
    };
  }
}

// Function to handle Google One Tap sign in
export function initializeGoogleOneTap(callback) {
  // Check if window exists (for SSR) and if the Google Identity Services library is loaded
  if (typeof window === 'undefined' || !window.google || !window.google.accounts || !window.google.accounts.id) {
    console.warn('Google Identity Services SDK not loaded yet or window.google.accounts.id is not available.');
    return;
  }

  window.google.accounts.id.initialize({
    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID, // Google OAuth client ID from environment variable
    callback: callback, // This callback will receive the CredentialResponse
    auto_select: false,
    cancel_on_tap_outside: true,
  });

  window.google.accounts.id.prompt((notification) => {
    // You can optionally handle prompt UI status notifications here
    // For example:
    // if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
    //   console.log('Google One Tap prompt was not displayed or was skipped.');
    // }
  });
}