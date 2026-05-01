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

function clearLocal() {
  try { localStorage.removeItem(KEY); } catch {}
}

export function useProfile() {
  const { user, loading: authLoading } = useAuth();
  // Start empty — never leak the previous session's data to a brand-new visitor
  // before we've confirmed who (if anyone) is signed in.
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);
  const [hydrated, setHydrated] = useState(false);
  const saveTimer = useRef<number | null>(null);
  const lastUserId = useRef<string | null>(null);

  // Auth-aware hydration: only restore profile data once we know there's a signed-in user.
  useEffect(() => {
    let cancelled = false;
    if (authLoading) return;

    (async () => {
      if (!user) {
        // Anonymous visitor — wipe any leftover profile from a prior session on this device
        // so the next person who opens the link doesn't see someone else's name/city/etc.
        clearLocal();
        if (cancelled) return;
        setProfile(EMPTY_PROFILE);
        lastUserId.current = null;
        setHydrated(true);
        return;
      }

      // Signed in — pull cloud profile
      lastUserId.current = user.id;
      const { data, error } = await supabase
        .from("profiles")
        .select("data")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.warn("[profile] fetch failed, using empty", error.message);
        setProfile(EMPTY_PROFILE);
        setHydrated(true);
        return;
      }

      const cloud = (data?.data as UserProfile | undefined) ?? {};
      const merged = { ...EMPTY_PROFILE, ...cloud };
      setProfile(merged);
      writeLocal(merged);
      setHydrated(true);
    })();

    return () => { cancelled = true; };
  }, [user?.id, authLoading]);

  // Persist locally + to cloud (debounced) only when signed in
  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      // never persist anonymous edits to disk — keeps the next visitor clean
      return;
    }
    writeLocal(profile);
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
    clearLocal();
    if (user) {
      const { error } = await supabase
        .from("profiles")
        .upsert({ user_id: user.id, data: {} as any });
      if (error) console.warn("[profile] reset failed", error.message);
    }
  };

  return { profile, setProfile, update, reset, hydrated };
}
