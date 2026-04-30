import { useEffect, useRef, useState } from "react";
import { EMPTY_PROFILE, UserProfile } from "@/lib/civicEngine";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const KEY = "votewise.profile.v1";

function readLocal(): UserProfile {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...EMPTY_PROFILE, ...JSON.parse(raw) } : EMPTY_PROFILE;
  } catch {
    return EMPTY_PROFILE;
  }
}

function writeLocal(p: UserProfile) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(() => readLocal());
  const [hydrated, setHydrated] = useState(false);
  const saveTimer = useRef<number | null>(null);
  const lastUserId = useRef<string | null>(null);

  // On sign-in: pull cloud profile. If empty, push local up. If both, cloud wins.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) {
        // Signed out: revert to local-only
        if (lastUserId.current) {
          // Came from a signed-in session — clear in-memory to avoid leaking between accounts
          setProfile(readLocal());
        }
        lastUserId.current = null;
        setHydrated(true);
        return;
      }

      lastUserId.current = user.id;
      const { data, error } = await supabase
        .from("profiles")
        .select("data")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.warn("[profile] fetch failed, using local", error.message);
        setHydrated(true);
        return;
      }

      const cloud = (data?.data as UserProfile | undefined) ?? {};
      const local = readLocal();
      const cloudHasData = Object.keys(cloud).length > 0;

      if (cloudHasData) {
        const merged = { ...EMPTY_PROFILE, ...local, ...cloud }; // cloud wins
        setProfile(merged);
        writeLocal(merged);
      } else {
        // First time on this device — seed cloud with whatever is local
        setProfile({ ...EMPTY_PROFILE, ...local });
        if (Object.keys(local).length > 0) {
          await supabase.from("profiles").upsert({ user_id: user.id, data: local });
        }
      }
      setHydrated(true);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  // Persist locally always, and to cloud (debounced) when signed in
  useEffect(() => {
    writeLocal(profile);
    if (!user || !hydrated) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      const { error } = await supabase
        .from("profiles")
        .upsert({ user_id: user.id, data: profile as any });
      if (error) console.warn("[profile] save failed", error.message);
    }, 500);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [profile, user?.id, hydrated]);

  const update = (patch: Partial<UserProfile>) =>
    setProfile((p) => ({ ...p, ...patch }));

  const reset = async () => {
    setProfile(EMPTY_PROFILE);
    writeLocal(EMPTY_PROFILE);
    if (user) {
      await supabase.from("profiles").upsert({ user_id: user.id, data: {} as any });
    }
  };

  return { profile, setProfile, update, reset, hydrated };
}
