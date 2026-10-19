import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { UserProfile } from '@/types';

const STORAGE_KEY = 'quincaillerie.userProfile';

const DEFAULT_GERANT: UserProfile = { role: 'gerant', name: 'Gérant', canEditCatalog: true };
const DEFAULT_EMPLOYE: UserProfile = { role: 'employe', name: 'Employé', canEditCatalog: false };

interface UserContextValue {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  setRole: (role: UserProfile['role']) => void;
  setName: (name: string) => void;
  setCanEditCatalog: (v: boolean) => void;
  isGerant: boolean;
  canEditCatalog: boolean;
}

const UserContext = createContext<UserContextValue | null>(null);

function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as UserProfile;
      if (p && (p.role === 'gerant' || p.role === 'employe')) return p;
    }
  } catch { /* ignore */ }
  return DEFAULT_GERANT;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile>(() => loadProfile());

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)); } catch { /* ignore */ }
  }, [profile]);

  const setProfile = useCallback((p: UserProfile) => setProfileState(p), []);
  const setRole = useCallback((role: UserProfile['role']) =>
    setProfileState((prev) => ({
      ...prev,
      role,
      canEditCatalog: role === 'gerant' ? prev.canEditCatalog : prev.canEditCatalog,
    })), []);
  const setName = useCallback((name: string) => setProfileState((prev) => ({ ...prev, name })), []);
  const setCanEditCatalog = useCallback((v: boolean) => setProfileState((prev) => ({ ...prev, canEditCatalog: v })), []);

  const value = useMemo<UserContextValue>(() => ({
    profile,
    setProfile,
    setRole,
    setName,
    setCanEditCatalog,
    isGerant: profile.role === 'gerant',
    canEditCatalog: profile.role === 'gerant' || profile.canEditCatalog,
  }), [profile, setProfile, setRole, setName, setCanEditCatalog]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}

export { DEFAULT_GERANT, DEFAULT_EMPLOYE };
