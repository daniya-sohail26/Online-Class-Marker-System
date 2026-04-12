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
  const [user, setUser]       = useState(null);
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
        if (mounted) { setUser(null); setProfile(null); setLoading(false); }
        return;
      }

      try {
        if (mounted) setUser(sessionUser);

        const intendedRole = localStorage.getItem("portal_role") || "teacher";

        // ── Step 1: Always fetch the users row via auth_id ──────────────────
        // auth.users.id → users.auth_id → users.id
        const { data: userRow, error: userErr } = await supabase
          .from("users")
          .select("id, name, email, role, is_active")
          .eq("auth_id", sessionUser.id)   // auth.users.id matches users.auth_id
          .maybeSingle();

        if (userErr) {
          console.error("[AuthContext] users lookup failed:", userErr.message);
        }

        const resolvedName  = userRow?.name  ?? sessionUser.email.split("@")[0];
        const resolvedEmail = userRow?.email ?? sessionUser.email;
        const usersId       = userRow?.id;   // users.id — needed for student/teacher lookup

        // ── Admin ────────────────────────────────────────────────────────────
        if (intendedRole === "admin") {
          if (mounted) {
            setProfile({
              id:        usersId ?? sessionUser.id,
              user_id:   sessionUser.id,
              role:      "admin",
              name:      resolvedName,
              email:     resolvedEmail,
              is_active: userRow?.is_active ?? true,
            });
          }
          return;
        }

        // ── Student ──────────────────────────────────────────────────────────
        if (intendedRole === "student") {
          // students.user_id = users.id  (NOT auth.users.id)
          const { data: studentRow, error: studentErr } = await supabase
            .from("students")
            .select("id, enrollment_number, course_id")
            .eq("user_id", usersId)          // users.id ← correct FK
            .maybeSingle();

          if (studentErr) {
            console.error("[AuthContext] students lookup failed:", studentErr.message);
          }

          if (mounted) {
            setProfile({
              // users table
              id:                usersId ?? sessionUser.id,
              user_id:           usersId ?? sessionUser.id,   // used in attempts.student_id
              role:              "student",
              name:              resolvedName,
              email:             resolvedEmail,
              is_active:         userRow?.is_active ?? true,
              // students table
              student_record_id: studentRow?.id,              // students.id (if needed)
              enrollment_number: studentRow?.enrollment_number ?? "",
              course_id:         studentRow?.course_id ?? "",
            });
          }
          return;
        }

        // ── Teacher ──────────────────────────────────────────────────────────
        const { data: teacherRow, error: teacherErr } = await supabase
          .from("teachers")
          .select("id, course_id")
          .eq("user_id", usersId)            // users.id ← correct FK
          .maybeSingle();

        if (teacherErr) {
          console.error("[AuthContext] teachers lookup failed:", teacherErr.message);
        }

        if (mounted) {
          setProfile({
            id:        usersId ?? sessionUser.id,
            user_id:   usersId ?? sessionUser.id,
            role:      "teacher",
            name:      resolvedName,
            email:     resolvedEmail,
            is_active: userRow?.is_active ?? true,
            course_id: teacherRow?.course_id ?? "",
          });
        }
      } catch (err) {
        console.error("[AuthContext] profile build error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthState(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        handleAuthState(session?.user ?? null);
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({ user, profile, loading, signOut }),
    [user, profile, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}