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
  signUp: (
    email: string,
    password: string,
    remember: boolean,
    profile: { firstName: string; lastName: string }
  ) => Promise<boolean>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buildDisplayName = (firstName?: string, lastName?: string) => {
    const parts = [firstName?.trim(), lastName?.trim()].filter(Boolean);
    return parts.length ? parts.join(" ") : null;
  };

  const friendlyAuthError = (message: string) => {
    if (message.toLowerCase().includes("already registered")) {
      return "This email is already registered. Try signing in instead.";
    }
    return message;
  };

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
      async (_event, nextSession) => {
        if (!isMounted) return;
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        if (nextSession?.user) {
          const metadata = nextSession.user.user_metadata ?? {};
          const displayName = buildDisplayName(metadata.first_name, metadata.last_name);
          if (displayName) {
            const { data: existing } = await supabase
              .from("user_profiles")
              .select("display_name")
              .eq("user_id", nextSession.user.id)
              .maybeSingle();
            if (!existing || !existing.display_name) {
              await supabase.from("user_profiles").upsert({
                user_id: nextSession.user.id,
                display_name: displayName,
              });
            }
          }
        }
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
      return;
    }

    const { data } = await supabase.auth.getUser();
    const confirmed =
      data?.user?.email_confirmed_at || (data?.user as any)?.confirmed_at;
    if (!confirmed) {
      await supabase.auth.signOut();
      setError("Please confirm your email before signing in.");
    }
  };

  const signUp = async (
    email: string,
    password: string,
    remember: boolean,
    profile: { firstName: string; lastName: string }
  ) => {
    setError(null);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("mp_remember", remember ? "1" : "0");
      if (!remember) {
        clearSupabaseLocalSessions();
      }
    }
    const siteUrl =
      typeof window !== "undefined"
        ? ((import.meta as any).env?.VITE_SITE_URL as string | undefined) ??
          window.location.origin
        : ((import.meta as any).env?.VITE_SITE_URL as string | undefined);
    const emailRedirectTo = siteUrl ? `${siteUrl}/collection` : undefined;
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: {
          first_name: profile.firstName.trim(),
          last_name: profile.lastName.trim(),
          display_name: buildDisplayName(profile.firstName, profile.lastName),
        },
      },
    });
    if (authError) {
      setError(friendlyAuthError(authError.message));
      return false;
    }
    return true;
  };

  const signOut = async () => {
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signOut();
      if (authError) {
        setError(authError.message);
      }
    } finally {
      if (typeof window !== "undefined") {
        clearSupabaseLocalSessions();
      }
      setSession(null);
      setUser(null);
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
