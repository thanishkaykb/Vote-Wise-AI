import { useEffect, useState } from "react";
import { EMPTY_PROFILE, UserProfile } from "@/lib/civicEngine";

const KEY = "votewise.profile.v1";

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? { ...EMPTY_PROFILE, ...JSON.parse(raw) } : EMPTY_PROFILE;
    } catch {
      return EMPTY_PROFILE;
    }
  });

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(profile)); } catch {}
  }, [profile]);

  const update = (patch: Partial<UserProfile>) =>
    setProfile((p) => ({ ...p, ...patch }));

  const reset = () => setProfile(EMPTY_PROFILE);

  return { profile, setProfile, update, reset };
}
