import { useEffect, useMemo, useState } from 'react';
import type { Product } from '@/types';
import { CategoryIcon } from './CategoryIcon';
import { classNames, formatFCFA, formatQty, vibrate, playBeep } from '@/lib/format';
import { colorOf } from '@/lib/colors';
import { Minus, Plus, X, Check, ShoppingBasket } from 'lucide-react';

interface Props {
  product: Product | null;
  onClose: () => void;
  onAdd: (product: Product, unit: string, quantity: number) => void;
}

export function AddToCartSheet({ product, onClose, onAdd }: Props) {
  const [unit, setUnit] = useState<string>('');
  const [qty, setQty] = useState<number>(1);
  const [qtyInput, setQtyInput] = useState<string>('1');

  const psus = product?.sale_units ?? [];
  const selectedPsu = useMemo(() => psus.find((u) => u.unit === unit) ?? null, [psus, unit]);

  useEffect(() => {
    if (product) {
      const def = product.sale_units?.find((u) => u.is_default) ?? product.sale_units?.[0];
      setUnit(def?.unit ?? '');
      setQty(1);
      setQtyInput('1');
    }
  }, [product]);

  if (!product) return null;

  const c = colorOf(product.category?.color);

  function commitQty(n: number) {
    const psu = psus.find((u) => u.unit === unit);
    const allowDecimal = psu?.allow_decimal ?? false;
    let v = n;
    if (!allowDecimal) v = Math.floor(v);
    if (v < 0) v = 0;
    setQty(v);
    setQtyInput(v === 0 ? '' : String(v));
  }

  function pressDigit(d: string) {
    vibrate(15);
    const psu = psus.find((u) => u.unit === unit);
    const allowDecimal = psu?.allow_decimal ?? false;
    let s = qtyInput;
    if (d === 'del') {
      s = s.slice(0, -1);
    } else if (d === '.') {
      if (!allowDecimal) return;
      if (s.includes('.')) return;
      if (s === '') s = '0.';
    } else {
      s = s + d;
    }
    const num = s === '' || s === '.' ? 0 : parseFloat(s);
    setQtyInput(s);
    setQty(Number.isNaN(num) ? 0 : num);
  }

  const lineTotal = selectedPsu ? selectedPsu.price * qty : 0;
  const canAdd = !!selectedPsu && qty > 0 && selectedPsu.price > 0;

  function handleAdd() {
    if (!product || !selectedPsu || !canAdd) return;
    playBeep(true);
    vibrate([20, 30, 20]);
    onAdd(product, selectedPsu.unit, qty);
    onClose();
  }

  const allowDecimal = selectedPsu?.allow_decimal ?? false;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur">
          <div className="flex min-w-0 items-center gap-3">
            <CategoryIcon slug={product.category?.slug} size={40} />
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-slate-800">{product.name}</h2>
              <p className="truncate text-xs text-slate-500">
                Stock : {product.stock_qty == null ? 'À configurer' : `${formatQty(product.stock_qty)} ${product.stock_unit}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 p-4">
          {psus.length === 0 ? (
            <p className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
              Aucune unité de vente configurée pour ce produit.
            </p>
          ) : (
            <>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Unité de vente</p>
                <div className="flex flex-wrap gap-2">
                  {psus.map((u) => {
                    const active = u.unit === unit;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => { setUnit(u.unit); commitQty(qty || 1); }}
                        className={classNames(
                          'rounded-xl px-3 py-2 text-sm font-bold ring-1 transition',
                          active
                            ? classNames(c.bg, 'text-white ring-transparent shadow')
                            : 'bg-white text-slate-700 ring-slate-200 hover:ring-slate-300',
                        )}
                      >
                        {u.unit}
                        <span className="ml-1 text-xs font-medium opacity-80">
                          {u.price > 0 ? formatFCFA(u.price) : '—'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedPsu && selectedPsu.price === 0 && (
                <p className="rounded-lg bg-yellow-50 p-3 text-xs font-semibold text-yellow-800">
                  Prix non configuré pour cette unité. La vente est bloquée tant que le prix n'est pas renseigné.
                </p>
              )}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Quantité</p>
                  <p className={classNames('text-sm font-bold', c.textStrong)}>
                    Total : {formatFCFA(lineTotal)}
                  </p>
                </div>

                <div className="flex items-stretch gap-2">
                  <button
                    type="button"
                    onClick={() => commitQty(qty - 1)}
                    className="flex w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95"
                    aria-label="Diminuer"
                  >
                    <Minus size={22} />
                  </button>
                  <input
                    inputMode={allowDecimal ? 'decimal' : 'numeric'}
                    pattern={allowDecimal ? '[0-9]*\\.?[0-9]*' : '[0-9]*'}
                    value={qtyInput}
                    onChange={(e) => {
                      const s = e.target.value;
                      setQtyInput(s);
                      const n = s === '' ? 0 : parseFloat(s);
                      setQty(Number.isNaN(n) ? 0 : n);
                    }}
                    className={classNames(
                      'min-w-0 flex-1 rounded-xl border-2 text-center text-2xl font-extrabold text-slate-800 outline-none',
                      qty > 0 ? 'border-slate-200 focus:border-slate-400' : 'border-yellow-300',
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => commitQty(qty + 1)}
                    className={classNames(
                      'flex w-14 items-center justify-center rounded-xl text-white active:scale-95',
                      c.bg,
                    )}
                    aria-label="Augmenter"
                  >
                    <Plus size={22} />
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', allowDecimal ? '.' : '', '0', 'del'].map((d, i) => {
                    if (d === '') return <div key={`sp-${i}`} />;
                    const isDel = d === 'del';
                    return (
                      <button
                        key={d + i}
                        type="button"
                        onClick={() => pressDigit(d)}
                        className={classNames(
                          'h-12 rounded-xl text-lg font-bold transition active:scale-95',
                          isDel
                            ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 ring-1 ring-slate-100',
                        )}
                        aria-label={isDel ? 'Effacer' : d}
                      >
                        {isDel ? '⌫' : d}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="sticky bottom-0 border-t border-slate-100 bg-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            disabled={!canAdd}
            onClick={handleAdd}
            className={classNames(
              'flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-base font-bold text-white shadow transition active:scale-[0.99]',
              canAdd ? classNames(c.bg, 'hover:opacity-90') : 'bg-slate-300 cursor-not-allowed',
            )}
          >
            <ShoppingBasket size={20} />
            Ajouter au panier
            {canAdd && <Check size={18} className="ml-1 opacity-80" />}
          </button>
        </div>
      </div>
    </div>
  );
}
