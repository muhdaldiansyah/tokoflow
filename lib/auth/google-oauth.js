// lib/auth/google-oauth.js
import { createClient } from '../database/supabase/client';

/**
 * Sign in with Google OAuth
 * This will redirect the user to Google's OAuth consent screen
 */
export async function signInWithGoogle() {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });

    if (error) {
      console.error('Error during Google OAuth sign in:', error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in Google OAuth:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error during Google authentication')
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = createClient();
  
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error during sign out:', error);
      throw error;
    }

    // Redirect to home page after sign out
    window.location.href = '/';
  } catch (error) {
    console.error('Error in sign out:', error);
    return {
      error: error instanceof Error ? error : new Error('Unknown error during sign out')
    };
  }
}

/**
 * Get the current user session
 */
export async function getSession() {
  const supabase = createClient();
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      throw error;
    }

    return { session, error: null };
  } catch (error) {
    console.error('Error in getSession:', error);
    return {
      session: null,
      error: error instanceof Error ? error : new Error('Unknown error getting session')
    };
  }
}

/**
 * Get the current user
 */
export async function getUser() {
  const supabase = createClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting user:', error);
      throw error;
    }

    return { user, error: null };
  } catch (error) {
    console.error('Error in getUser:', error);
    return {
      user: null,
      error: error instanceof Error ? error : new Error('Unknown error getting user')
    };
  }
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback) {
  const supabase = createClient();
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });

  return subscription;
}