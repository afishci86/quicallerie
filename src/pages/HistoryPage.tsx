import { useEffect, useState } from 'react';
import { fetchSales, fetchSaleWithItems } from '@/lib/supabase';
import type { Sale } from '@/types';
import { classNames, formatFCFA, formatDateTime } from '@/lib/format';
import { Receipt, ChevronRight, X, Check, AlertTriangle, Loader2 } from 'lucide-react';

interface Props {
  supabaseOnline: boolean;
}

export function HistoryPage({ supabaseOnline }: Props) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [openSale, setOpenSale] = useState<Sale | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
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

  async function openSaleDetail(id: string) {
    if (openId === id) { setOpenId(null); setOpenSale(null); return; }
    setOpenId(id);
    setOpenSale(null);
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

  if (!supabaseOnline) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Historique des ventes</h1>
          <p className="text-sm text-slate-500">Ventes enregistrées dans Supabase.</p>
        </div>
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
          <p className="text-sm text-slate-500">{sales.length} vente(s) enregistrée(s).</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700 ring-1 ring-blue-200 hover:bg-blue-100"
        >
          Actualiser
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-white p-8 text-slate-500 ring-1 ring-slate-100">
          <Loader2 className="animate-spin" size={20} /> Chargement…
        </div>
      )}
      {error && (
        <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700 ring-1 ring-red-200">{error}</p>
      )}

      {!loading && sales.length === 0 && (
        <div className="rounded-2xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-100">
          Aucune vente pour le moment. Lancez une « Nouvelle vente » depuis l'accueil.
        </div>
      )}

      <ul className="space-y-2">
        {sales.map((s) => {
          const open = openId === s.id;
          return (
            <li key={s.id} className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
              <button
                type="button"
                onClick={() => openSaleDetail(s.id)}
                className="flex w-full items-center gap-3 p-3 text-left"
              >
                <span className={classNames(
                  'flex h-10 w-10 items-center justify-center rounded-xl',
                  s.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700',
                )}>
                  {s.status === 'paid' ? <Check size={20} /> : <AlertTriangle size={20} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800">{s.reference}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(s.created_at)}</p>
                  {s.customer_name && <p className="text-xs text-slate-600">Client: {s.customer_name}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold text-slate-900">{formatFCFA(s.total)}</p>
                  {s.balance_due > 0 && (
                    <p className="text-xs font-bold text-red-600">Reste: {formatFCFA(s.balance_due)}</p>
                  )}
                </div>
                <ChevronRight className={classNames('text-slate-300 transition', open && 'rotate-90')} size={18} />
              </button>
              {open && (
                <div className="border-t border-slate-100 bg-slate-50 p-3">
                  {loadingDetail ? (
                    <p className="flex items-center gap-2 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" /> Chargement…</p>
                  ) : openSale ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                        <Receipt size={14} /> Articles
                      </div>
                      <ul className="space-y-1 text-sm">
                        {(openSale.sale_items ?? []).map((it) => (
                          <li key={it.id} className="flex justify-between gap-2">
                            <span className="min-w-0 flex-1 truncate text-slate-700">
                              {it.product_name} · {it.quantity} {it.unit} × {formatFCFA(it.unit_price)}
                            </span>
                            <span className="font-bold text-slate-800">{formatFCFA(it.line_total)}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex justify-between border-t border-dashed border-slate-300 pt-2 text-sm">
                        <span className="text-slate-600">Total</span><b>{formatFCFA(openSale.total)}</b>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Reçu</span><span>{formatFCFA(openSale.amount_received)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Reste dû</span>
                        <span className={openSale.balance_due > 0 ? 'font-bold text-red-600' : ''}>{formatFCFA(openSale.balance_due)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Vente introuvable.</p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
