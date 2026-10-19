import { useEffect, useState } from 'react';
import type { StockMovement } from '@/types';
import { fetchStockMovements } from '@/lib/supabase';
import { classNames, formatDateTime, formatQty } from '@/lib/format';
import { Loader2, ArrowDownCircle, ArrowUpCircle, RotateCcw, ShoppingCart, History } from 'lucide-react';

interface Props {
  supabaseOnline: boolean;
  productId?: string;
  productName?: string;
}

const REASON_META: Record<string, { label: string; icon: typeof ArrowDownCircle; color: string; sign: string }> = {
  arrival:     { label: 'Arrivage',      icon: ArrowDownCircle, color: 'text-green-700 bg-green-100', sign: '+' },
  sale:        { label: 'Vente',         icon: ShoppingCart,    color: 'text-blue-700 bg-blue-100',   sign: '−' },
  cancellation:{ label: 'Annulation',    icon: RotateCcw,       color: 'text-red-700 bg-red-100',     sign: '+' },
  adjustment:  { label: 'Correction',    icon: ArrowUpCircle,   color: 'text-amber-700 bg-amber-100', sign: '±' },
};

export function StockMovementsPage({ supabaseOnline, productId, productName }: Props) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const data = await fetchStockMovements(productId, 200);
      setMovements(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [productId]);

  if (!supabaseOnline) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-extrabold text-slate-800">Mouvements de stock</h1>
        <div className="rounded-2xl bg-yellow-50 p-4 text-sm font-semibold text-yellow-800 ring-1 ring-yellow-200">
          Supabase n'est pas connecté. L'historique des mouvements sera disponible ici une fois le cloud configuré.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Mouvements de stock</h1>
          <p className="text-sm text-slate-500">{productName ? productName : 'Tous les produits'} — {movements.length} mouvement(s).</p>
        </div>
        <button type="button" onClick={load} className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700 ring-1 ring-blue-200">Actualiser</button>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-white p-8 text-slate-500 ring-1 ring-slate-100">
          <Loader2 className="animate-spin" size={20} /> Chargement…
        </div>
      )}
      {error && <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700 ring-1 ring-red-200">{error}</p>}

      {!loading && movements.length === 0 && (
        <div className="rounded-2xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-100">
          <History className="mx-auto mb-2 text-slate-300" size={32} />
          Aucun mouvement enregistré.
        </div>
      )}

      <ul className="space-y-2">
        {movements.map((m) => {
          const meta = REASON_META[m.reason] ?? REASON_META.adjustment;
          const Icon = meta.icon;
          const positive = m.delta >= 0;
          return (
            <li key={m.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200">
              <span className={classNames('flex h-10 w-10 items-center justify-center rounded-xl', meta.color)}>
                <Icon size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-800">
                  {meta.label} — {m.product?.name ?? 'Produit'}
                </p>
                <p className="text-xs text-slate-500">
                  {formatDateTime(m.created_at)}{m.created_by ? ` · ${m.created_by}` : ''}
                  {m.note ? ` · ${m.note}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className={classNames('text-sm font-extrabold', positive ? 'text-green-700' : 'text-blue-700')}>
                  {positive ? '+' : ''}{formatQty(m.delta)} {m.unit}
                </p>
                <p className="text-[11px] text-slate-400">Qté: {formatQty(m.quantity)} {m.unit}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
