// app/actions/auth.js
'use server';

import { createClient } from '../../lib/database/supabase-server/index.js';

export async function signUp(email, password, metadata = {}) {
  const supabase = await createClient();
  
  try {
    // 1. Create the user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: metadata.full_name,
          business_name: metadata.business_name,
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed');

    return { data: authData, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: {
        message: error.message || 'Registration failed'
      }
    };
  }
}

export async function signIn(email, password) {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: {
        message: error.message || 'Login failed'
      }
    };
  }
}

export async function signOut() {
  const supabase = await createClient();
  
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
}