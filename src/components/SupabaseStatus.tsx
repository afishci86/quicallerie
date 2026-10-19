import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, pingSupabase } from '@/lib/supabase';
import { classNames } from '@/lib/format';

interface Props {
  className?: string;
  compact?: boolean;
}

export function SupabaseStatus({ className, compact }: Props) {
  const [state, setState] = useState<'checking' | 'online' | 'offline' | 'unconfigured'>(
    isSupabaseConfigured ? 'checking' : 'unconfigured',
  );

  useEffect(() => {
    let alive = true;
    if (!isSupabaseConfigured) {
      setState('unconfigured');
      return;
    }
    pingSupabase().then((ok) => {
      if (alive) setState(ok ? 'online' : 'offline');
    });
    return () => { alive = false; };
  }, []);

  const dot =
    state === 'online' ? 'bg-green-500' :
    state === 'checking' ? 'bg-yellow-400 animate-pulse' :
    state === 'offline' ? 'bg-red-500' :
    'bg-slate-400';

  const label =
    state === 'online' ? (compact ? 'Cloud' : 'Supabase connecté') :
    state === 'checking' ? (compact ? 'Vérification…' : 'Vérification du cloud…') :
    state === 'offline' ? (compact ? 'Hors ligne' : 'Cloud indisponible') :
    (compact ? 'Démo' : 'Mode démo (Supabase non configuré)');

  return (
    <span
      className={classNames(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
        state === 'online' ? 'bg-green-50 text-green-700 ring-1 ring-green-200' :
        state === 'offline' ? 'bg-red-50 text-red-700 ring-1 ring-red-200' :
        state === 'unconfigured' ? 'bg-slate-100 text-slate-600 ring-1 ring-slate-200' :
        'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200',
        className,
      )}
      title={state === 'online' ? 'Les ventes sont enregistrées dans Supabase.' : undefined}
    >
      <span className={classNames('h-2 w-2 rounded-full', dot)} />
      {label}
    </span>
  );
}

export { supabase };
