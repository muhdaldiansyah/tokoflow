// app/context/AuthContext.js
"use client";
 
import { createContext, useContext, useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/database/supabase/client";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const isMountedRef = useRef(true);
  const supabase = createClient();
  
  console.log("[AuthContext] Initial render - loading:", true);

  // Fetch user profile from Supabase with timeout
  const fetchProfile = async (userId) => {
    console.log(`[AuthContext] fetchProfile called for userId: ${userId}`);
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Profile fetch timeout after 5 seconds')), 5000);
    });
    
    try {
      // Race between the actual fetch and timeout
      const result = await Promise.race([
        (async () => {
          const { data, error } = await supabase
            .from('av_profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (error) {
            console.error('[AuthContext] Profile fetch error:', error);
            return null;
          }

          console.log('[AuthContext] Profile fetched successfully');
          return data;
        })(),
        timeoutPromise
      ]);
      
      return result;
    } catch (error) {
      console.error('[AuthContext] fetchProfile error:', error);
      return null;
    }
  };

  useEffect(() => {
    console.log("[AuthContext] useEffect mounted");
    const getUser = async () => {
      console.log("[AuthContext] getUser() called - setting loading to true");
      setLoading(true);
      try {
        // First check if we have a session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        console.log("[AuthContext] Session check result:", {
          hasSession: !!sessionData?.session,
          sessionError: sessionError,
          userId: sessionData?.session?.user?.id
        });
        
        if (sessionError) {
          console.error("[AuthContext] Session error:", sessionError);
          throw sessionError;
        }
        
        if (sessionData?.session) {
          console.log("[AuthContext] Setting user from session:", sessionData.session.user.email);
          setUser(sessionData.session.user);
          
          // Fetch user profile
          console.log("[AuthContext] Fetching profile for user:", sessionData.session.user.id);
          try {
            const userProfile = await fetchProfile(sessionData.session.user.id);
            if (userProfile) {
              console.log("[AuthContext] Profile loaded successfully");
              setProfile(userProfile);
            } else {
              console.log("[AuthContext] No profile found for user");
            }
          } catch (profileError) {
            console.error("[AuthContext] Error fetching profile in getUser:", profileError);
            // Don't fail auth if profile fetch fails
          }
        } else {
          // If no session, clear user state
          console.log("[AuthContext] No session found - clearing user state");
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error("[AuthContext] Error getting authentication state:", error);
        // Clear any invalid tokens
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
      } finally {
        // Always set loading to false after auth check
        console.log("[AuthContext] Finally block - setting loading to false");
        if (isMountedRef.current) {
          setLoading(false);
          console.log("[AuthContext] Loading state after finally:", false);
        }
      }
    };

    console.log("[AuthContext] Calling getUser()");
    
    // Add a global timeout to ensure loading is set to false eventually
    const globalTimeout = setTimeout(() => {
      console.warn("[AuthContext] Global timeout reached - forcing loading to false");
      if (isMountedRef.current) {
        setLoading(false);
      }
    }, 10000); // 10 second global timeout
    
    getUser().finally(() => {
      clearTimeout(globalTimeout);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[AuthContext] onAuthStateChange fired:", {
        event,
        hasSession: !!session,
        userId: session?.user?.id,
        currentLoadingState: loading
      });
      
      if (event === 'SIGNED_OUT') {
        console.log("[AuthContext] SIGNED_OUT event - clearing state");
        setUser(null);
        setProfile(null);
        if (isMountedRef.current) {
          setLoading(false);
          console.log("[AuthContext] Loading set to false after SIGNED_OUT");
        }
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user ?? null);
        
        // Fetch profile when user signs in
        // Important: Use setTimeout to avoid deadlock as per Supabase docs
        if (session?.user) {
          console.log("[AuthContext] Setting loading to true before profile fetch");
          setLoading(true);
          setTimeout(() => {
            console.log("[AuthContext] Fetching profile in setTimeout");
            fetchProfile(session.user.id).then(userProfile => {
              console.log("[AuthContext] Profile fetched in auth state change");
              if (isMountedRef.current) {
                setProfile(userProfile);
                setLoading(false);
                console.log("[AuthContext] Loading set to false after profile fetch");
              }
            }).catch(error => {
              console.error("[AuthContext] Error fetching profile in auth state change:", error);
              if (isMountedRef.current) {
                setLoading(false);
                console.log("[AuthContext] Loading set to false after profile fetch error");
              }
            });
          }, 0);
        } else {
          console.log("[AuthContext] No user in session - setting loading to false");
          if (isMountedRef.current) {
            setLoading(false);
          }
        }
      } else if (event === 'USER_UPDATED') {
        setUser(session?.user ?? null);
        
        // Refresh profile on user update
        // Important: Use setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id).then(userProfile => {
              setProfile(userProfile);
            }).catch(error => {
              console.error("Error updating profile:", error);
            });
          }, 0);
        }
        setLoading(false);
      } else if (event === 'INITIAL_SESSION') {
        // Handle initial session load
        console.log("[AuthContext] INITIAL_SESSION event - setting loading to false");
        if (isMountedRef.current) {
          setLoading(false);
          console.log("[AuthContext] Loading set to false after INITIAL_SESSION");
        }
      }
    });

    return () => {
      console.log("[AuthContext] Cleanup - unsubscribing from auth state changes");
      subscription.unsubscribe();
    };
  }, []);
  
  // Cleanup mounted ref
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const value = {
    user,
    profile,
    loading,
    signUp: async (email, password) => {
      return await supabase.auth.signUp({
        email,
        password,
      });
    },
    signIn: async (email, password) => {
      try {
        const result = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (result.error) {
          console.error("SignIn error:", result.error);
        } else {
          // Explicitly set the user after successful login
          setUser(result.data.user);
          
          // Fetch profile
          if (result.data.user) {
            const userProfile = await fetchProfile(result.data.user.id);
            setProfile(userProfile);
          }
          
          console.log("Sign in successful, user set:", result.data.user?.email);
        }
        
        return result;
      } catch (error) {
        console.error("Unexpected error during sign in:", error);
        // Return a properly shaped error response
        return {
          data: { user: null, session: null },
          error: { message: 'Unknown error', status: 500 }
        };
      }
    },
    signInWithGoogle: async () => {
      // This is the legacy method - our new component uses Google Identity Services directly
      // We keep this for backward compatibility
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    },
    // This function forces immediate logout without waiting for Supabase
    signOut: async () => {
      console.log("Signing out user (AuthContext)");
      try {
        // First clear local state immediately
        setUser(null);
        setProfile(null);
        
        // Force cleanup of all Supabase tokens
        if (typeof window !== 'undefined') {
          console.log("Clearing all Supabase tokens from localStorage");
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('supabase.auth.expires_at');
          localStorage.removeItem('sb-auth-token');
          localStorage.removeItem('sb-refresh-token');
          
          // Remove any other potential Supabase tokens
          Object.keys(localStorage)
            .filter(key => key.startsWith('sb-') || key.includes('supabase'))
            .forEach(key => localStorage.removeItem(key));
            
          // Delete all cookies
          document.cookie.split(';').forEach(cookie => {
            const [name] = cookie.trim().split('=');
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          });
        }
        
        // Don't wait for Supabase - initiate signOut but continue immediately
        supabase.auth.signOut().catch(e => {
          console.error("Error in background Supabase signOut:", e);
          // Errors here don't block logout flow
        });
        
        console.log("Logout forced - redirecting immediately");
        
        // Redirect immediately to login page with clear session parameter
        window.location.href = "/login?redirect=/koreksi&clearSession=true";
      } catch (error) {
        console.error("Error during sign out:", error);
        // Force redirect even if there's an error
        window.location.href = "/login?redirect=/koreksi&clearSession=true";
      }
    },
    createProfile: async (profileData) => {
      try {
        if (!user) {
          return { success: false, error: 'User not authenticated' };
        }
        
        const { data, error } = await supabase
          .from('av_profiles')
          .insert([{ 
            id: user.id,
            ...profileData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();
        
        if (error) {
          console.error('Error creating profile:', error);
          return { success: false, error: error.message };
        }
        
        // Update local profile state
        setProfile(data);
        return { success: true };
      } catch (error) {
        console.error('Unexpected error creating profile:', error);
        return { success: false, error: 'Failed to create profile' };
      }
    },
    updateProfile: async (profileData) => {
      try {
        if (!user) {
          return { success: false, error: 'User not authenticated' };
        }
        
        const { data, error } = await supabase
          .from('av_profiles')
          .update({
            ...profileData,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating profile:', error);
          return { success: false, error: error.message };
        }
        
        // Update local profile state
        setProfile(data);
        return { success: true };
      } catch (error) {
        console.error('Unexpected error updating profile:', error);
        return { success: false, error: 'Failed to update profile' };
      }
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  console.log("[useAuth] Returning context:", {
    hasUser: !!context.user,
    userEmail: context.user?.email || 'null',
    loading: context.loading,
    hasProfile: !!context.profile
  });
  return context;
}