import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext({ user: null, profile: null, loading: true });

export function useAuth() {
  const ctx = useContext(AuthContext);
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const getProfile = async (authId) => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("id, name, email, role, is_active")
          .eq("auth_id", authId)
          .maybeSingle();
        if (error) return null;
        return data;
      } catch {
        return null;
      }
    };

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const p = await getProfile(session.user.id);
        if (p?.is_active !== false) setProfile(p);
        else setProfile(null);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        const p = await getProfile(session.user.id);
        if (p?.is_active !== false) setProfile(p);
        else setProfile(null);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const value = { user, profile, loading };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
