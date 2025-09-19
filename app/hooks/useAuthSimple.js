// app/hooks/useAuthSimple.js
"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/database/supabase/client";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch (error) {
      console.error("Unable to initialise Supabase client:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) {
      return;
    }

    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;
    let subscription;

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        if (error) {
          console.warn("Supabase session lookup failed:", error.message);
        }

        setUser(session?.user ?? null);
        setLoading(false);

        const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
          if (!mounted) {
            return;
          }

          if (nextSession?.user) {
            setUser(nextSession.user);
          } else {
            setUser(null);
          }

          if (event === "SIGNED_OUT") {
            router.replace("/login");
          }

          setLoading(false);
        });

        subscription = data.subscription;
      } catch (err) {
        if (!mounted) {
          return;
        }
        console.error("Auth initialization failed:", err);
        setUser(null);
        setLoading(false);
      }
    };

    const fallback = setTimeout(() => {
      if (!mounted) {
        return;
      }
      setLoading(false);
    }, 1200);

    initializeAuth();

    return () => {
      mounted = false;
      clearTimeout(fallback);
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [supabase, router, isClient]);

  const signIn = useCallback(
    async (email, password) => {
      if (!supabase) {
        return {
          data: null,
          error: new Error("Supabase client not available"),
        };
      }

      try {
        setLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setLoading(false);
          return { data: null, error };
        }

        if (data?.user) {
          setUser(data.user);
          try {
            await supabase.auth.getSession();
          } catch (sessionError) {
            console.warn("Supabase session sync failed:", sessionError);
          }
        }

        setLoading(false);
        return { data, error: null };
      } catch (error) {
        setLoading(false);
        return { data: null, error };
      }
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    if (!supabase) {
      setUser(null);
      router.replace("/login");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      setUser(null);
      router.replace("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  const value = {
    user,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
