import { useEffect, useMemo, useState } from 'react';
import type { Product } from '@/types';
import { CategoryIcon } from './CategoryIcon';
import { classNames, formatQty, vibrate, playBeep } from '@/lib/format';
import { colorOf } from '@/lib/colors';
import { Minus, Plus, X, Check, PackagePlus, Loader2, Search, Truck } from 'lucide-react';

interface Props {
  open: boolean;
  products: Product[];
  onClose: () => void;
  onConfirm: (productId: string, quantity: number, note: string) => Promise<{ ok: boolean; error?: string }>;
}

export function ArrivalSheet({ open, products, onClose, onConfirm }: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Product | null>(null);
  const [qty, setQty] = useState<number>(1);
  const [qtyInput, setQtyInput] = useState<string>('1');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSelected(null); setQty(1); setQtyInput('1'); setNote(''); setError(null); setQuery('');
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 50);
    return products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 50);
  }, [products, query]);

  if (!open) return null;

  function commitQty(n: number) {
    let v = Math.floor(n);
    if (v < 0) v = 0;
    setQty(v); setQtyInput(v === 0 ? '' : String(v));
  }

  function pressDigit(d: string) {
    vibrate(15);
    let s = qtyInput;
    if (d === 'del') s = s.slice(0, -1);
    else s = s + d;
    const num = s === '' ? 0 : parseInt(s, 10);
    setQtyInput(s);
    setQty(Number.isNaN(num) ? 0 : num);
  }

  async function handleConfirm() {
    if (!selected || qty <= 0 || submitting) return;
    setSubmitting(true); setError(null);
    try {
      const res = await onConfirm(selected.id, qty, note.trim() || '');
      if (!res.ok) { setError(res.error ?? 'Échec'); setSubmitting(false); return; }
      playBeep(true); vibrate([20, 30, 20]);
      setSubmitting(false);
      onClose();
    } catch (e) {
      setError((e as Error).message); setSubmitting(false);
    }
  }

  const c = selected ? colorOf(selected.category?.color) : colorOf('blue');

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={submitting ? undefined : onClose} aria-hidden />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-md flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <Truck className="text-blue-600" size={22} />
            <h2 className="text-base font-extrabold text-slate-800">Enregistrer un arrivage</h2>
          </div>
          <button type="button" onClick={onClose} disabled={submitting} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40" aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {!selected && (
            <>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher un produit…"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm font-medium outline-none focus:border-blue-400"
                />
              </div>
              <ul className="space-y-2">
                {filtered.map((p) => {
                  const cc = colorOf(p.category?.color);
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => { setSelected(p); vibrate(15); }}
                        className="flex w-full items-center gap-3 rounded-2xl bg-slate-50 p-2.5 text-left ring-1 ring-slate-100 hover:ring-slate-300"
                      >
                        <CategoryIcon slug={p.category?.slug} size={44} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-800">{p.name}</p>
                          <p className="text-xs text-slate-500">
                            Stock actuel : {p.stock_qty == null ? 'À configurer' : `${formatQty(p.stock_qty)} ${p.stock_unit}`}
                          </p>
                        </div>
                        <Plus className={classNames('text-white rounded-full p-1', cc.bg)} size={22} />
                      </button>
                    </li>
                  );
                })}
                {filtered.length === 0 && (
                  <li className="py-8 text-center text-sm text-slate-500">Aucun produit.</li>
                )}
              </ul>
            </>
          )}

          {selected && (
            <>
              <button type="button" onClick={() => setSelected(null)} className="mb-3 text-sm font-bold text-blue-600">
                ← Changer de produit
              </button>
              <div className="mb-4 flex items-center gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                <CategoryIcon slug={selected.category?.slug} size={44} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-800">{selected.name}</p>
                  <p className="text-xs text-slate-500">
                    Stock actuel : {selected.stock_qty == null ? 'À configurer' : `${formatQty(selected.stock_qty)} ${selected.stock_unit}`}
                  </p>
                </div>
              </div>

              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Quantité reçue ({selected.stock_unit})</p>
              <div className="flex items-stretch gap-2">
                <button type="button" onClick={() => commitQty(qty - 1)} className="flex w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95" aria-label="Diminuer">
                  <Minus size={22} />
                </button>
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={qtyInput}
                  onChange={(e) => { const s = e.target.value.replace(/[^0-9]/g, ''); setQtyInput(s); setQty(s === '' ? 0 : parseInt(s, 10)); }}
                  className="min-w-0 flex-1 rounded-xl border-2 border-slate-200 text-center text-2xl font-extrabold text-slate-800 outline-none focus:border-blue-400"
                />
                <button type="button" onClick={() => commitQty(qty + 1)} className={classNames('flex w-14 items-center justify-center rounded-xl text-white active:scale-95', c.bg)} aria-label="Augmenter">
                  <Plus size={22} />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((d, i) => {
                  if (d === '') return <div key={`sp-${i}`} />;
                  const isDel = d === 'del';
                  return (
                    <button key={d + i} type="button" onClick={() => pressDigit(d)}
                      className={classNames('h-12 rounded-xl text-lg font-bold transition active:scale-95',
                        isDel ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 ring-1 ring-slate-100')}
                      aria-label={isDel ? 'Effacer' : d}>
                      {isDel ? '⌫' : d}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4">
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Note (facultatif)</p>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ex: camion du 19/10, facture…"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                />
              </div>

              {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700 ring-1 ring-red-200">{error}</p>}
            </>
          )}
        </div>

        {selected && (
          <div className="border-t border-slate-100 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <button
              type="button"
              disabled={qty <= 0 || submitting}
              onClick={handleConfirm}
              className={classNames(
                'flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-base font-bold text-white shadow transition active:scale-[0.99]',
                qty > 0 && !submitting ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:opacity-95' : 'bg-slate-300 cursor-not-allowed',
              )}
            >
              {submitting ? <><Loader2 size={20} className="animate-spin" /> Enregistrement…</> : <><PackagePlus size={20} /> Confirmer l'arrivage</>}
              {qty > 0 && !submitting && <Check size={18} className="ml-1 opacity-80" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
