import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { supabase } from "../../server/config/supabaseClient";

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
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

        const intendedRole = localStorage.getItem("portal_role") || "teacher";

        const { data: userRow, error: userErr } = await supabase
          .from("users")
          .select("*")
          .eq("auth_id", sessionUser.id)
          .maybeSingle();

        if (userErr) {
          console.error("users lookup:", userErr);
        }

        if (!userRow) {
          if (mounted) {
            setProfile({
              publicUserId: null,
              role: intendedRole === "admin" ? "admin" : "unknown",
              name: sessionUser.email?.split("@")[0] || "User",
              email: sessionUser.email,
            });
          }
          return;
        }

        if (intendedRole === "admin" && userRow.role === "admin") {
          if (mounted) {
            setProfile({
              publicUserId: userRow.id,
              id: userRow.id,
              role: "admin",
              name: userRow.name,
              email: userRow.email,
            });
          }
          return;
        }

        if (userRow.role === "teacher") {
          const { data: teacherData } = await supabase
            .from("teachers")
            .select("*")
            .eq("user_id", userRow.id)
            .maybeSingle();

          if (mounted) {
            setProfile({
              publicUserId: userRow.id,
              teacherId: teacherData?.id,
              id: teacherData?.id ?? userRow.id,
              role: "teacher",
              name: userRow.name,
              email: userRow.email,
              /** True when login toggle was Admin but public.users.role is still teacher */
              adminPortalDenied: intendedRole === "admin",
            });
          }
          return;
        }

        if (userRow.role === "student") {
          if (mounted) {
            setProfile({
              publicUserId: userRow.id,
              id: userRow.id,
              role: "student",
              name: userRow.name,
              email: userRow.email,
            });
          }
          return;
        }

        if (mounted) {
          setProfile({
            publicUserId: userRow.id,
            id: userRow.id,
            role: userRow.role,
            name: userRow.name,
            email: userRow.email,
          });
        }
      } catch (err) {
        console.error("AuthContext Profile Error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthState(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      handleAuthState(session?.user ?? null);
    });

    return () => {
      mounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ user, profile, loading, signOut }), [user, profile, loading]);

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}
