import { useEffect, useMemo, useState } from 'react';
import type { Sale } from '@/types';
import { fetchDebtSales, fetchSaleWithItems } from '@/lib/supabase';
import { classNames, formatFCFA, formatDateTime } from '@/lib/format';
import { SaleDetailSheet } from '@/components/SaleDetailSheet';
import { Wallet, Loader2, Users, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useUser } from '@/lib/useUser';
import { recordSalePayment, cancelSale } from '@/lib/supabase';

interface Props {
  supabaseOnline: boolean;
}

export function CreditsPage({ supabaseOnline }: Props) {
  const { isGerant } = useUser();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openSale, setOpenSale] = useState<Sale | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [hideAmounts, setHideAmounts] = useState(false);

  async function load() {
    setLoading(true); setError(null);
    try {
      const data = await fetchDebtSales();
      setSales(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const totalDebt = useMemo(() => sales.reduce((s, x) => s + x.balance_due, 0), [sales]);
  const totalAdvance = useMemo(() => sales.reduce((s, x) => s + (x.amount_received), 0), [sales]);

  async function openDetail(s: Sale) {
    setOpenSale(s);
    setDetailOpen(true);
    try {
      const full = await fetchSaleWithItems(s.id);
      if (full) setOpenSale(full);
    } catch { /* keep partial */ }
  }

  async function handlePay(saleId: string, amount: number, note: string) {
    const res = await recordSalePayment(saleId, amount, 'espèces', note || null, isGerant ? 'Gérant' : 'Employé');
    if (!res.ok) return { ok: false, error: res.error };
    await load();
    return { ok: true };
  }

  async function handleCancel(saleId: string, reason: string) {
    const res = await cancelSale(saleId, reason || null, 'Gérant');
    if (!res.ok) return { ok: false, error: res.error };
    await load();
    return { ok: true };
  }

  const fmt = (n: number) => hideAmounts ? '•••• F' : formatFCFA(n);

  if (!supabaseOnline) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-extrabold text-slate-800">Crédits clients</h1>
        <div className="rounded-2xl bg-yellow-50 p-4 text-sm font-semibold text-yellow-800 ring-1 ring-yellow-200">
          Supabase n'est pas connecté. Les crédits clients apparaîtront ici une fois le cloud configuré.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="text-yellow-600" size={26} />
          <h1 className="text-2xl font-extrabold text-slate-800">Crédits clients</h1>
        </div>
        <button type="button" onClick={() => setHideAmounts((v) => !v)} className="rounded-xl bg-slate-100 p-2.5 text-slate-600" aria-label="Masquer montants">
          {hideAmounts ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 p-4 text-white shadow">
          <p className="text-xs font-semibold text-white/80">Reste dû total</p>
          <p className="text-xl font-extrabold">{fmt(totalDebt)}</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-green-400 to-green-600 p-4 text-white shadow">
          <p className="text-xs font-semibold text-white/80">Avances encaissées</p>
          <p className="text-xl font-extrabold">{fmt(totalAdvance)}</p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-white p-8 text-slate-500 ring-1 ring-slate-100">
          <Loader2 className="animate-spin" size={20} /> Chargement…
        </div>
      )}
      {error && <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700 ring-1 ring-red-200">{error}</p>}

      {!loading && sales.length === 0 && (
        <div className="rounded-2xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-100">
          <Users className="mx-auto mb-2 text-slate-300" size={32} />
          Aucun crédit en cours. Toutes les ventes sont soldées.
        </div>
      )}

      <ul className="space-y-2">
        {sales.map((s) => (
          <li key={s.id}>
            <button type="button" onClick={() => openDetail(s)} className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-slate-200 hover:ring-slate-300">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700">
                <Wallet size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-800">{s.customer_name ?? s.reference}</p>
                <p className="text-xs text-slate-500">{formatDateTime(s.created_at)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-extrabold text-red-600">{fmt(s.balance_due)}</p>
                <p className="text-[11px] text-slate-400">reste dû</p>
              </div>
              <ArrowRight className="text-slate-300" size={18} />
            </button>
          </li>
        ))}
      </ul>

      <SaleDetailSheet
        open={detailOpen}
        sale={openSale}
        onClose={() => setDetailOpen(false)}
        onPay={handlePay}
        onCancel={handleCancel}
        isGerant={isGerant}
        onRefresh={load}
      />
    </div>
  );
}
