// app/actions/auth.js
'use server';

import { createClient } from '../../lib/database/supabase/server';

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

    // 2. Create the profile in av_profiles table
    const { error: profileError } = await supabase
      .from('av_profiles')
      .insert({
        id: authData.user.id,
        full_name: metadata.full_name || null,
        company: metadata.business_name || null,
        credits_balance: 0,
        is_verified: false,
        country: 'Indonesia',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Note: User is already created in auth.users at this point
      // You might want to handle this differently in production
    }

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