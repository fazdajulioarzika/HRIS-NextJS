// contexts/profile-context.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";

export type UserRole = "hr" | "manager" | "employee";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  role: UserRole;
  photo_url?: string | null;
}

interface ProfileContextValue {
  profile: Profile | null;
  loading: boolean;
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  loading: true,
});

export function ProfileProvider({
  children,
  initialProfile,
}: {
  children: ReactNode;
  initialProfile: Profile | null; // data dari server, dipakai sebagai nilai awal
}) {
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [loading, setLoading] = useState(!initialProfile);
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData.user;

      if (!authUser) {
        if (isMounted) {
          setProfile(null);
          setLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, role, avatar_url, employees (photo_url)")
        .eq("id", authUser.id)
        .single();

      if (error) console.error("Gagal memuat profile:", error.message);

      if (isMounted) {
        setProfile({
          id: authUser.id,
          full_name: data?.full_name ?? null,
          email: authUser.email ?? "",
          role: (data?.role as UserRole) ?? "employee",
          photo_url: (data as any)?.employees?.photo_url ?? null,
        });
        setLoading(false);
      }
    }

    // Kalau sudah ada initialProfile dari server, tidak perlu fetch ulang saat mount.
    // Cukup dengarkan perubahan auth state (logout, ganti akun, dsb).
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });

    if (!initialProfile) {
      loadProfile();
    }

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ProfileContext.Provider value={{ profile, loading }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfileContext() {
  return useContext(ProfileContext);
}
