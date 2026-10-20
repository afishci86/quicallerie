import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { UserProfile } from '@/types';
import { fetchEmployees, isSupabaseConfigured } from '@/lib/supabase';
import type { Employee } from '@/types';

const STORAGE_KEY = 'quincaillerie.activeEmployeeId';

interface UserContextValue {
  profile: UserProfile;
  employees: Employee[];
  loadingEmployees: boolean;
  setActiveEmployee: (id: string | null) => void;
  refreshEmployees: () => Promise<void>;
  isGerant: boolean;
  canEditCatalog: boolean;
}

const GUEST_GERANT: UserProfile = { role: 'gerant', name: 'Gérant', employeeId: null, canEditCatalog: true };

const UserContext = createContext<UserContextValue | null>(null);

function loadStoredId(): string | null {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}
function saveStoredId(id: string | null): void {
  try { if (id) localStorage.setItem(STORAGE_KEY, id); else localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(() => loadStoredId());

  const refreshEmployees = useCallback(async () => {
    if (!isSupabaseConfigured) { setLoadingEmployees(false); return; }
    setLoadingEmployees(true);
    try {
      const data = await fetchEmployees();
      setEmployees(data);
      // If active id no longer exists or is inactive, reset to gérant
      if (activeId && !data.some((e) => e.id === activeId && e.is_active)) {
        setActiveId(null); saveStoredId(null);
      }
    } catch {
      /* keep current state */
    } finally {
      setLoadingEmployees(false);
    }
  }, [activeId]);

  useEffect(() => { refreshEmployees(); }, [refreshEmployees]);

  const setActiveEmployee = useCallback((id: string | null) => {
    setActiveId(id);
    saveStoredId(id);
  }, []);

  const profile = useMemo<UserProfile>(() => {
    if (!activeId) return GUEST_GERANT;
    const emp = employees.find((e) => e.id === activeId && e.is_active);
    if (!emp) return GUEST_GERANT;
    return {
      role: emp.role,
      name: emp.name,
      employeeId: emp.id,
      canEditCatalog: emp.role === 'gerant' || emp.can_edit_catalog,
    };
  }, [activeId, employees]);

  const value = useMemo<UserContextValue>(() => ({
    profile, employees, loadingEmployees,
    setActiveEmployee, refreshEmployees,
    isGerant: profile.role === 'gerant',
    canEditCatalog: profile.role === 'gerant' || profile.canEditCatalog,
  }), [profile, employees, loadingEmployees, setActiveEmployee, refreshEmployees]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
