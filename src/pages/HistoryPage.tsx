import { useEffect, useMemo, useState } from 'react';
import { fetchSales, fetchSaleWithItems, cancelSale, recordSalePayment } from '@/lib/supabase';
import type { Sale } from '@/types';
import { classNames, formatFCFA, formatDateTime } from '@/lib/format';
import { Receipt, ChevronRight, Check, AlertTriangle, Loader2, X, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { SaleDetailSheet } from '@/components/SaleDetailSheet';
import { useUser } from '@/lib/useUser';

interface Props {
  supabaseOnline: boolean;
  isGerant: boolean;
}

export function HistoryPage({ supabaseOnline, isGerant }: Props) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [openSale, setOpenSale] = useState<Sale | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [hideAmounts, setHideAmounts] = useState(false);

  async function load() {
    setLoading(true); setError(null);
    try {
      const data = await fetchSales(100);
      setSales(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function openDetail(id: string) {
    setOpenId(id);
    setOpenSale(null);
    setDetailOpen(true);
    setLoadingDetail(true);
    try {
      const s = await fetchSaleWithItems(id);
      setOpenSale(s);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingDetail(false);
    }
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

  const totalRevenue = useMemo(() => sales.filter((s) => s.status !== 'cancelled').reduce((s, x) => s + x.amount_received, 0), [sales]);
  const fmt = (n: number) => hideAmounts ? '•••• F' : formatFCFA(n);

  if (!supabaseOnline) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-extrabold text-slate-800">Historique des ventes</h1>
        <div className="rounded-2xl bg-yellow-50 p-4 text-sm font-semibold text-yellow-800 ring-1 ring-yellow-200">
          Supabase n'est pas connecté. L'historique des ventes apparaîtra ici une fois le cloud configuré.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Historique des ventes</h1>
          <p className="text-sm text-slate-500">{sales.length} vente(s) · Encaissé: {fmt(totalRevenue)}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setHideAmounts((v) => !v)} className="rounded-xl bg-slate-100 p-2.5 text-slate-600" aria-label="Masquer montants">
            {hideAmounts ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <button type="button" onClick={load} className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700 ring-1 ring-blue-200 hover:bg-blue-100">
            <RefreshCw size={14} /> Actualiser
          </button>
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
          Aucune vente pour le moment.
        </div>
      )}

      <ul className="space-y-2">
        {sales.map((s) => {
          const cancelled = s.status === 'cancelled' || !!s.cancelled_at;
          return (
            <li key={s.id} className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
              <button type="button" onClick={() => openDetail(s.id)} className="flex w-full items-center gap-3 p-3 text-left">
                <span className={classNames('flex h-10 w-10 items-center justify-center rounded-xl',
                  cancelled ? 'bg-red-100 text-red-700' : s.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>
                  {cancelled ? <X size={20} /> : s.status === 'paid' ? <Check size={20} /> : <AlertTriangle size={20} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800">{s.reference}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(s.created_at)}</p>
                  {s.customer_name && <p className="text-xs text-slate-600">Client: {s.customer_name}</p>}
                  {cancelled && <p className="text-xs font-bold text-red-600">Annulée</p>}
                </div>
                <div className="text-right">
                  <p className={classNames('text-sm font-extrabold', cancelled ? 'text-slate-400 line-through' : 'text-slate-900')}>{fmt(s.total)}</p>
                  {!cancelled && s.balance_due > 0 && <p className="text-xs font-bold text-red-600">Reste: {fmt(s.balance_due)}</p>}
                </div>
                <ChevronRight className="text-slate-300" size={18} />
              </button>
            </li>
          );
        })}
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
      {loadingDetail && detailOpen && !openSale && (
        <p className="text-sm text-slate-500">Chargement…</p>
      )}
    </div>
  );
}
