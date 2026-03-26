import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { supabase } from "../../server/config/supabaseClient";

const AuthContext = createContext({ 
  user: null, 
  profile: null, 
  loading: true, 
  signOut: async () => {} 
});

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      setUser(null);
      setProfile(null);
      window.location.replace("/login"); 
    } catch (err) {
      console.error("Signout Error:", err);
      window.location.href = "/login";
    }
  };

  useEffect(() => {
    let mounted = true;

    const handleAuthState = async (sessionUser) => {
      if (!sessionUser) {
        if (mounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
        return;
      }

      try {
        if (mounted) setUser(sessionUser);

        // 🌟 THE FIX: Read the exact role they clicked on the Login screen!
        const intendedRole = localStorage.getItem("portal_role") || "teacher";

        if (intendedRole === "admin") {
          if (mounted) {
            setProfile({
              id: sessionUser.user_id,
              role: "admin", // This forces the router to let you into the Admin dashboard
              name: "Admin User",
              email: sessionUser.email,
              is_active: true
            });
          }
          return;
        }

        // Normal Teacher Flow
        const { data: teacherData } = await supabase
          .from("teachers")
          .select("*")
          .eq("user_id", sessionUser.id)
          .maybeSingle();

        if (mounted) {
          setProfile({
            id: teacherData?.id || sessionUser.id,
            user_id: sessionUser.id,
            role: "teacher",
            name: sessionUser.email.split('@')[0], 
            email: sessionUser.email,
            is_active: true
          });
        }
      } catch (err) {
        console.error("AuthContext Profile Error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthState(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      handleAuthState(session?.user || null);
    });

    return () => {
      mounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ 
    user, profile, loading, signOut 
  }), [user, profile, loading]);
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}