import { useEffect, useMemo, useState } from 'react';
import { fetchSales, fetchDebtSales, fetchSaleWithItems, cancelSale, recordSalePayment } from '@/lib/supabase';
import type { Sale } from '@/types';
import { classNames, formatFCFA, formatDateTime } from '@/lib/format';
import { Check, AlertTriangle, Loader2, X, Eye, EyeOff, RefreshCw, ChevronRight, Wallet, Users } from 'lucide-react';
import { SaleDetailSheet } from '@/components/SaleDetailSheet';
import { useUser } from '@/lib/useUser';

interface Props {
  supabaseOnline: boolean;
}

type Sub = 'ventes' | 'credits';

export function HistoryPage({ supabaseOnline }: Props) {
  const { isGerant } = useUser();
  const [sub, setSub] = useState<Sub>('ventes');
  const [sales, setSales] = useState<Sale[]>([]);
  const [debts, setDebts] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [openSale, setOpenSale] = useState<Sale | null>(null);
  const [hideAmounts, setHideAmounts] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [s, d] = await Promise.all([fetchSales(100), fetchDebtSales()]);
      setSales(s); setDebts(d);
    } catch { /* ignore */ } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function openDetail(s: Sale) {
    setOpenSale(s); setDetailOpen(true);
    try { const full = await fetchSaleWithItems(s.id); if (full) setOpenSale(full); } catch { /* keep */ }
  }

  async function handlePay(saleId: string, amount: number, note: string) {
    const res = await recordSalePayment(saleId, amount, 'espèces', note || null, isGerant ? 'Gérant' : 'Employé');
    if (!res.ok) return { ok: false, error: res.error };
    await load(); return { ok: true };
  }
  async function handleCancel(saleId: string, reason: string) {
    const res = await cancelSale(saleId, reason || null, 'Gérant');
    if (!res.ok) return { ok: false, error: res.error };
    await load(); return { ok: true };
  }

  const totalEncaisse = useMemo(() => sales.filter((s) => s.status !== 'cancelled').reduce((s, x) => s + x.amount_received, 0), [sales]);
  const totalDebt = useMemo(() => debts.reduce((s, x) => s + x.balance_due, 0), [debts]);
  const fmt = (n: number) => hideAmounts ? '•••• F' : formatFCFA(n);

  if (!supabaseOnline) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-extrabold text-slate-800">Historique</h1>
        <div className="rounded-2xl bg-yellow-50 p-4 text-sm font-semibold text-yellow-800 ring-1 ring-yellow-200">Cloud non connecté. Connecte Supabase pour voir l'historique.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-800">Historique</h1>
        <div className="flex gap-2">
          <button type="button" onClick={() => setHideAmounts((v) => !v)} className="rounded-xl bg-slate-100 p-2.5 text-slate-600" aria-label="Masquer">{hideAmounts ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          <button type="button" onClick={load} className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700 ring-1 ring-blue-200"><RefreshCw size={14} /> Actualiser</button>
        </div>
      </div>

      {/* Two big sub-tabs */}
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => setSub('ventes')} className={classNames('flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-base font-bold transition', sub === 'ventes' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow' : 'bg-white text-slate-600 ring-1 ring-slate-200')}>
          <Check size={20} /> Ventes effectuées
        </button>
        <button type="button" onClick={() => setSub('credits')} className={classNames('flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-base font-bold transition', sub === 'credits' ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow' : 'bg-white text-slate-600 ring-1 ring-slate-200')}>
          <Wallet size={20} /> Crédits clients
        </button>
      </div>

      {sub === 'ventes' && (
        <>
          <div className="rounded-2xl bg-gradient-to-br from-green-400 to-green-600 p-4 text-white shadow">
            <p className="text-xs font-semibold text-white/80">Total encaissé</p>
            <p className="text-xl font-extrabold">{fmt(totalEncaisse)}</p>
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-white p-8 text-slate-500 ring-1 ring-slate-100"><Loader2 className="animate-spin" size={20} /> Chargement…</div>
          ) : sales.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-100">Aucune vente enregistrée.</div>
          ) : (
            <ul className="space-y-2">
              {sales.map((s) => {
                const cancelled = s.status === 'cancelled' || !!s.cancelled_at;
                return (
                  <li key={s.id} className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                    <button type="button" onClick={() => openDetail(s)} className="flex w-full items-center gap-3 p-3 text-left">
                      <span className={classNames('flex h-10 w-10 items-center justify-center rounded-xl', cancelled ? 'bg-red-100 text-red-700' : s.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>
                        {cancelled ? <X size={20} /> : s.status === 'paid' ? <Check size={20} /> : <AlertTriangle size={20} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-800">{s.reference}</p>
                        <p className="text-xs text-slate-500">{formatDateTime(s.created_at)}</p>
                        {s.customer_name && <p className="text-xs text-slate-600">{s.customer_name}</p>}
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
          )}
        </>
      )}

      {sub === 'credits' && (
        <>
          <div className="rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 p-4 text-white shadow">
            <p className="text-xs font-semibold text-white/80">Reste dû total</p>
            <p className="text-xl font-extrabold">{fmt(totalDebt)}</p>
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-white p-8 text-slate-500 ring-1 ring-slate-100"><Loader2 className="animate-spin" size={20} /> Chargement…</div>
          ) : debts.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-100"><Users className="mx-auto mb-2 text-slate-300" size={32} />Aucun crédit en cours. Toutes les ventes sont soldées.</div>
          ) : (
            <ul className="space-y-2">
              {debts.map((s) => (
                <li key={s.id} className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                  <button type="button" onClick={() => openDetail(s)} className="flex w-full items-center gap-3 p-3 text-left">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700"><Wallet size={20} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-800">{s.customer_name ?? s.reference}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(s.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-red-600">{fmt(s.balance_due)}</p>
                      <p className="text-[11px] text-slate-400">reste dû</p>
                    </div>
                    <ChevronRight className="text-slate-300" size={18} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <SaleDetailSheet open={detailOpen} sale={openSale} onClose={() => setDetailOpen(false)} onPay={handlePay} onCancel={handleCancel} isGerant={isGerant} hideAmounts={hideAmounts} onRefresh={load} />
    </div>
  );
}
