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

        const { data: userRow, error: userErr } = await supabase
          .from("users")
          .select("id, name, email, role, is_active")
          .eq("auth_id", sessionUser.id)
          .maybeSingle();

        if (userErr) {
          console.error("[AuthContext] users lookup failed:", userErr.message);
        }

        const resolvedName  = userRow?.name  ?? sessionUser.email.split("@")[0];
        const resolvedEmail = userRow?.email ?? sessionUser.email;
        const usersId       = userRow?.id;

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

        if (intendedRole === "admin") {
          if (userRow.role === "admin") {
            if (mounted) {
              setProfile({
                publicUserId: userRow.id,
                id: userRow.id,
                user_id: userRow.id,
                role: "admin",
                name: resolvedName,
                email: resolvedEmail,
                is_active: userRow.is_active ?? true,
              });
            }
            return;
          }
          if (userRow.role === "teacher") {
            const { data: teacherData } = await supabase
              .from("teachers")
              .select("id")
              .eq("user_id", userRow.id)
              .maybeSingle();

            if (mounted) {
              setProfile({
                publicUserId: userRow.id,
                teacherId: teacherData?.id,
                id: teacherData?.id ?? userRow.id,
                user_id: userRow.id,
                role: "teacher",
                name: resolvedName,
                email: resolvedEmail,
                is_active: userRow.is_active ?? true,
                adminPortalDenied: true,
              });
            }
            return;
          }
          if (userRow.role === "student") {
            if (mounted) {
              setProfile({
                publicUserId: userRow.id,
                id: userRow.id,
                user_id: userRow.id,
                role: "student",
                name: resolvedName,
                email: resolvedEmail,
                is_active: userRow.is_active ?? true,
              });
            }
            return;
          }
        }

        if (intendedRole === "student") {
          const { data: studentRow, error: studentErr } = await supabase
            .from("students")
            .select("id, enrollment_number, course_id")
            .eq("user_id", usersId)
            .maybeSingle();

          if (studentErr) {
            console.error("[AuthContext] students lookup failed:", studentErr.message);
          }

          if (mounted) {
            setProfile({
              id:                usersId ?? sessionUser.id,
              user_id:           usersId ?? sessionUser.id,
              role:              "student",
              name:              resolvedName,
              email:             resolvedEmail,
              is_active:         userRow.is_active ?? true,
              student_record_id: studentRow?.id,
              enrollment_number: studentRow?.enrollment_number ?? "",
              course_id:         studentRow?.course_id ?? "",
            });
          }
          return;
        }

        const { data: teacherRow, error: teacherErr } = await supabase
          .from("teachers")
          .select("id, course_id")
          .eq("user_id", usersId)
          .maybeSingle();

        if (teacherErr) {
          console.error("[AuthContext] teachers lookup failed:", teacherErr.message);
        }

        if (mounted) {
          setProfile({
            id:           teacherRow?.id ?? usersId ?? sessionUser.id,
            user_id:      usersId ?? sessionUser.id,
            role:         "teacher",
            name:         resolvedName,
            email:        resolvedEmail,
            is_active:    userRow.is_active ?? true,
            course_id:    teacherRow?.course_id ?? "",
            teacherId:    teacherRow?.id,
            publicUserId: userRow.id,
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
