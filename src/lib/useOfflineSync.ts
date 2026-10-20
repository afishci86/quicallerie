import { useCallback, useEffect, useRef, useState } from 'react';
import type { PendingOperation } from '@/types';
import { registerSale, isSupabaseConfigured, pingSupabase } from '@/lib/supabase';

const STORAGE_KEY = 'quincaillerie.pendingOps';

function loadPending(): PendingOperation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as PendingOperation[];
    return Array.isArray(arr) ? arr.filter((o) => o.type === 'sale') : [];
  } catch { return []; }
}

function savePending(ops: PendingOperation[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ops)); } catch { /* ignore */ }
}

export interface OfflineState {
  online: boolean;
  pending: PendingOperation[];
  syncing: boolean;
  enqueue: (op: Omit<PendingOperation, 'id' | 'createdAt' | 'attempts'>) => void;
  removePending: (id: string) => void;
  syncNow: () => Promise<void>;
}

export function useOfflineSync(): OfflineState {
  const [online, setOnline] = useState<boolean>(() => navigator.onLine);
  const [pending, setPending] = useState<PendingOperation[]>(() => loadPending());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => { savePending(pending); }, [pending]);

  const enqueue = useCallback((op: Omit<PendingOperation, 'id' | 'createdAt' | 'attempts'>) => {
    const item: PendingOperation = {
      id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(), attempts: 0, ...op,
    };
    setPending((prev) => [...prev, item]);
  }, []);

  const removePending = useCallback((id: string) => {
    setPending((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const syncNow = useCallback(async () => {
    if (syncing || !isSupabaseConfigured) return;
    setSyncing(true);
    try {
      const ok = await pingSupabase();
      setOnline(ok);
      if (!ok) { setSyncing(false); return; }
      const ops = loadPending();
      const stillPending: PendingOperation[] = [];
      for (const op of ops) {
        if (op.type === 'sale') {
          const res = await registerSale(op.payload);
          if (!res.ok) stillPending.push({ ...op, attempts: op.attempts + 1, lastError: res.error });
        }
      }
      setPending(stillPending);
    } catch {
      /* network still flaky; keep pending */
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  useEffect(() => {
    const t = useRef<NodeJS.Timeout | null>(null);
    if (online && pending.length > 0 && !syncing) {
      t.current = setTimeout(() => { syncNow(); }, 800) as unknown as NodeJS.Timeout;
    }
    return () => { if (t.current) clearTimeout(t.current); };
  }, [online, pending.length, syncing, syncNow]);

  return { online, pending, syncing, enqueue, removePending, syncNow };
}
