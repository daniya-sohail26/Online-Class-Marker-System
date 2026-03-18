import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext({ user: null, profile: null, loading: true, signOut: () => {} });

export function useAuth() {
  const ctx = useContext(AuthContext);
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- NUCLEAR SIGN OUT ---
  // This clears Supabase AND wipes the browser storage to fix "Lock" errors
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      
      // Clear storage to reset the "Lock broken" bug
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear IndexedDB (where the lock lives)
      const dbs = await window.indexedDB.databases();
      dbs.forEach(db => window.indexedDB.deleteDatabase(db.name));

      setUser(null);
      setProfile(null);
      window.location.href = "/login"; // Force reload to clean memory
    } catch (err) {
      console.error("Signout Error:", err);
      localStorage.clear();
      window.location.reload();
    }
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const fetchProfileData = async (authUser) => {
      if (!authUser) return null;
      try {
        const { data, error } = await supabase
          .from("users")
          .select("id, name, email, role, is_active")
          .eq("auth_id", authUser.id)
          .maybeSingle();
        if (error) return null;
        return data;
      } catch {
        return null;
      }
    };

    const handleAuthState = async (sessionUser) => {
      if (sessionUser) {
        setUser(sessionUser);
        const p = await fetchProfileData(sessionUser);
        if (p?.is_active !== false) setProfile(p);
        else setProfile(null);
      } else {
        setUser(null);
        setProfile(null);
      }
    };

    const setupAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await handleAuthState(session?.user || null);
      } catch (err) {
        console.error("Auth Init Error:", err);
      } finally {
        setLoading(false);
      }
    };

    setupAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      await handleAuthState(session?.user || null);
      setLoading(false);
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const value = { user, profile, loading, signOut };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}