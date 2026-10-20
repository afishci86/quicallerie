import { useEffect, useMemo, useState } from 'react';
import type { Product, SaleUnitKind } from '@/types';
import { classNames, formatFCFA, vibrate, playBeep, normalizeCIphone } from '@/lib/format';
import { colorOf } from '@/lib/colors';
import { CategoryIcon } from './CategoryIcon';
import { Minus, Plus, X, Check, Package, ShoppingBag, Wallet, User, Phone, Loader2, Share2 } from 'lucide-react';
import { productPrice } from '@/lib/supabase';

type Step = 'unit' | 'qty' | 'payment';

export interface SaleResult {
  kind: 'gros' | 'detail';
  price: number;
  quantity: number;
  unitLabel: string;
}

interface Props {
  product: Product | null;
  initialKind: SaleUnitKind | 'both';
  onClose: () => void;
  onConfirm: (result: {
    kind: 'gros' | 'detail';
    price: number;
    quantity: number;
    unitLabel: string;
    payment: 'paid' | 'credit';
    amountReceived: number | null;
    customerName: string | null;
    customerPhone: string | null;
  }) => Promise<void>;
}

export function SellSheet({ product, initialKind, onClose, onConfirm }: Props) {
  const [step, setStep] = useState<Step>('unit');
  const [kind, setKind] = useState<'gros' | 'detail'>('detail');
  const [qty, setQty] = useState(1);
  const [qtyInput, setQtyInput] = useState('1');
  const [payment, setPayment] = useState<'paid' | 'credit' | null>(null);
  const [receivedInput, setReceivedInput] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (product) {
      const detail = product.sale_units?.find((u) => u.unit === 'detail');
      const gros = product.sale_units?.find((u) => u.unit === 'gros');
      if (initialKind === 'both') {
        setStep('unit');
        setKind(detail?.price > 0 ? 'detail' : 'gros');
      } else {
        setKind(initialKind);
        setStep('qty');
      }
      setQty(1); setQtyInput('1'); setPayment(null); setReceivedInput(''); setName(''); setPhone('');
    }
  }, [product, initialKind]);

  const psu = useMemo(() => product?.sale_units?.find((u) => u.unit === kind) ?? null, [product, kind]);
  const price = psu?.price ?? 0;
  const lineTotal = price * qty;

  if (!product) return null;
  const c = colorOf(product.category?.color);

  const detailPsu = product.sale_units?.find((u) => u.unit === 'detail');
  const grosPsu = product.sale_units?.find((u) => u.unit === 'gros');
  const hasTwoPrices = !!grosPsu && grosPsu.price > 0 && !!detailPsu && detailPsu.price > 0;

  function pressDigit(d: string) {
    vibrate(15);
    let s = qtyInput;
    if (d === 'del') s = s.slice(0, -1);
    else s = s + d;
    const num = s === '' ? 0 : parseInt(s, 10);
    setQtyInput(s);
    setQty(Number.isNaN(num) ? 0 : num);
  }

  function commitQty(n: number) { const v = Math.max(0, Math.floor(n)); setQty(v); setQtyInput(v === 0 ? '' : String(v)); }

  const received = receivedInput === '' ? 0 : parseFloat(receivedInput);
  const balance = Math.max(0, lineTotal - (Number.isNaN(received) ? 0 : received));
  const canConfirmCredit = payment === 'credit' && received > 0 && received <= lineTotal + 0.01 && name.trim().length > 0;
  const canConfirm = step === 'payment' && (payment === 'paid' || canConfirmCredit) && qty > 0 && price > 0 && !processing;

  async function handleConfirm() {
    if (!canConfirm || !product || !psu) return;
    setProcessing(true);
    try {
      playBeep(true); vibrate([20, 30, 20]);
      await onConfirm({
        kind, price, quantity: qty, unitLabel: kind === 'gros' ? 'gros' : 'détail',
        payment: payment === 'paid' ? 'paid' : 'credit',
        amountReceived: payment === 'paid' ? null : received,
        customerName: payment === 'credit' ? name.trim() : null,
        customerPhone: phone.trim() ? normalizeCIphone(phone.trim()) : null,
      });
      setProcessing(false);
      onClose();
    } catch {
      setProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={processing ? undefined : onClose} aria-hidden />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-md flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <CategoryIcon slug={product.category?.slug} size={40} />
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-slate-800">{product.name}</h2>
              <p className="text-xs text-slate-500">Stock: {product.stock_qty == null ? '—' : `${product.stock_qty} ${product.stock_unit}`}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={processing} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40" aria-label="Fermer"><X size={20} /></button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {/* STEP: unit choice */}
          {step === 'unit' && hasTwoPrices && (
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => { vibrate(15); setKind('gros'); setStep('qty'); }} className={classNames('flex flex-col items-center gap-2 rounded-2xl p-5 ring-2 transition', kind === 'gros' ? classNames(c.bg, 'text-white ring-transparent') : 'bg-white text-slate-700 ring-slate-200 hover:ring-slate-300')}>
                <Package size={32} />
                <span className="text-xs font-bold uppercase">En Gros</span>
                <span className="text-lg font-extrabold">{formatFCFA(grosPsu!.price)}</span>
              </button>
              <button type="button" onClick={() => { vibrate(15); setKind('detail'); setStep('qty'); }} className={classNames('flex flex-col items-center gap-2 rounded-2xl p-5 ring-2 transition', kind === 'detail' ? classNames(c.bg, 'text-white ring-transparent') : 'bg-white text-slate-700 ring-slate-200 hover:ring-slate-300')}>
                <ShoppingBag size={32} />
                <span className="text-xs font-bold uppercase">En Détail</span>
                <span className="text-lg font-extrabold">{formatFCFA(detailPsu!.price)}</span>
              </button>
            </div>
          )}

          {/* STEP: quantity */}
          {step === 'qty' && (
            <>
              {hasTwoPrices && (
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5">
                  <span className="text-sm font-semibold text-slate-600">Prix {kind === 'gros' ? 'gros' : 'détail'}</span>
                  <button type="button" onClick={() => setStep('unit')} className="text-sm font-bold text-blue-600">Changer</button>
                </div>
              )}
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Quantité</p>
                <p className={classNames('text-sm font-bold', c.textStrong)}>Total: {formatFCFA(lineTotal)}</p>
              </div>
              <div className="flex items-stretch gap-2">
                <button type="button" onClick={() => commitQty(qty - 1)} className="flex w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-700 active:scale-95"><Minus size={22} /></button>
                <input inputMode="numeric" value={qtyInput} onChange={(e) => { const s = e.target.value.replace(/[^0-9]/g, ''); setQtyInput(s); setQty(s === '' ? 0 : parseInt(s, 10)); }} className="min-w-0 flex-1 rounded-xl border-2 border-slate-200 text-center text-2xl font-extrabold text-slate-800 outline-none focus:border-slate-400" />
                <button type="button" onClick={() => commitQty(qty + 1)} className={classNames('flex w-14 items-center justify-center rounded-xl text-white active:scale-95', c.bg)}><Plus size={22} /></button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['1','2','3','4','5','6','7','8','9','','0','del'].map((d, i) => {
                  if (d === '') return <div key={`sp-${i}`} />;
                  const isDel = d === 'del';
                  return <button key={d + i} type="button" onClick={() => pressDigit(d)} className={classNames('h-14 rounded-xl text-xl font-bold transition active:scale-95', isDel ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-slate-50 text-slate-700 ring-1 ring-slate-100 hover:bg-slate-100')} aria-label={isDel ? 'Effacer' : d}>{isDel ? '⌫' : d}</button>;
                })}
              </div>
              <button type="button" disabled={qty <= 0 || price <= 0} onClick={() => { vibrate(15); setStep('payment'); }} className={classNames('flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-base font-bold text-white shadow transition active:scale-[0.99]', qty > 0 && price > 0 ? classNames(c.bg, 'hover:opacity-90') : 'bg-slate-300 cursor-not-allowed')}>
                Suivant · {formatFCFA(lineTotal)}
              </button>
            </>
          )}

          {/* STEP: payment */}
          {step === 'payment' && (
            <>
              <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                <div className="flex justify-between"><span className="text-sm text-slate-600">{qty} × {formatFCFA(price)}</span><span className="text-xl font-extrabold text-slate-900">{formatFCFA(lineTotal)}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => { vibrate(15); setPayment('paid'); }} className={classNames('flex flex-col items-center gap-1 rounded-2xl px-3 py-4 text-sm font-bold ring-2 transition', payment === 'paid' ? 'bg-green-50 text-green-700 ring-green-500' : 'bg-white text-slate-600 ring-slate-200 hover:ring-slate-300')}>
                  <Wallet size={24} className="text-green-600" /> Tout est payé
                </button>
                <button type="button" onClick={() => { vibrate(15); setPayment('credit'); }} className={classNames('flex flex-col items-center gap-1 rounded-2xl px-3 py-4 text-sm font-bold ring-2 transition', payment === 'credit' ? 'bg-yellow-50 text-yellow-700 ring-yellow-500' : 'bg-white text-slate-600 ring-slate-200 hover:ring-slate-300')}>
                  <User size={24} className="text-yellow-600" /> Crédit
                </button>
              </div>
              {payment === 'credit' && (
                <div className="space-y-3 rounded-xl bg-yellow-50 p-3 ring-1 ring-yellow-200">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Avance reçue</label>
                    <input inputMode="decimal" value={receivedInput} onChange={(e) => setReceivedInput(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0" className="w-full rounded-xl border-2 border-yellow-200 px-3 py-3 text-lg font-bold text-slate-800 outline-none focus:border-yellow-400" />
                    <p className="mt-1 flex justify-between text-xs"><span className="text-slate-500">Reste dû</span><span className={balance > 0 ? 'font-bold text-red-600' : 'font-bold text-green-600'}>{formatFCFA(balance)}</span></p>
                  </div>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-3.5 text-slate-400" />
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du client (requis)" className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-yellow-400" />
                  </div>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-3.5 text-slate-400" />
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="Téléphone (ex: 07 07 07 07 07)" className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-yellow-400" />
                  </div>
                </div>
              )}
              <button type="button" disabled={!canConfirm} onClick={handleConfirm} className={classNames('flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-base font-bold text-white shadow transition active:scale-[0.99]', canConfirm ? 'bg-gradient-to-r from-green-500 to-green-600 hover:opacity-95' : 'bg-slate-300 cursor-not-allowed')}>
                {processing ? <><Loader2 size={20} className="animate-spin" /> Enregistrement…</> : <><Check size={20} /> Valider la vente</>}
              </button>
              <button type="button" onClick={() => setStep('qty')} className="w-full text-center text-sm font-bold text-slate-500">Retour</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export { productPrice };
