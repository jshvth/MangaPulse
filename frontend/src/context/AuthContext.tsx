import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

type AuthContextValue = {
  isAuthed: boolean;
  loading: boolean;
  user: User | null;
  session: Session | null;
  error: string | null;
  signIn: (email: string, password: string, remember: boolean) => Promise<void>;
  signUp: (email: string, password: string, remember: boolean) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isMounted) return;
        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!isMounted) return;
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
      }
    );

    return () => {
      isMounted = false;
      subscription?.subscription.unsubscribe();
    };
  }, []);

  const clearSupabaseLocalSessions = () => {
    if (typeof window === "undefined") return;
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => window.localStorage.removeItem(key));
  };

  const signIn = async (email: string, password: string, remember: boolean) => {
    setError(null);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("mp_remember", remember ? "1" : "0");
      if (!remember) {
        clearSupabaseLocalSessions();
      }
    }
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError) {
      setError(authError.message);
    }
  };

  const signUp = async (email: string, password: string, remember: boolean) => {
    setError(null);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("mp_remember", remember ? "1" : "0");
      if (!remember) {
        clearSupabaseLocalSessions();
      }
    }
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (authError) {
      setError(authError.message);
    }
  };

  const signOut = async () => {
    setError(null);
    const { error: authError } = await supabase.auth.signOut();
    if (authError) {
      setError(authError.message);
    }
  };

  const value = useMemo(
    () => ({
      isAuthed: !!session,
      loading,
      user,
      session,
      error,
      signIn,
      signUp,
      signOut,
    }),
    [session, loading, user, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
