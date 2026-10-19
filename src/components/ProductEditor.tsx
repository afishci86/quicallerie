import { useEffect, useState } from 'react';
import type { Product, ProductCategory, ProductSaleUnit } from '@/types';
import { classNames, formatFCFA } from '@/lib/format';
import { colorOf } from '@/lib/colors';
import { CategoryIcon } from './CategoryIcon';
import { X, Plus, Trash2, Check, Loader2, Camera, Archive } from 'lucide-react';

export interface ProductFormValue {
  name: string;
  category_id: string | null;
  stock_unit: string;
  stock_qty: number | null;
  low_stock_threshold: number;
  description: string;
  image_url: string | null;
  saleUnits: Array<{
    id?: string;
    unit: string;
    price: number;
    factor_to_stock: number;
    is_default: boolean;
    allow_decimal: boolean;
  }>;
}

interface Props {
  open: boolean;
  product: Product | null; // null = create mode
  categories: ProductCategory[];
  onClose: () => void;
  onSubmit: (value: ProductFormValue, imageFile: File | null) => Promise<{ ok: boolean; error?: string }>;
  onArchive?: (id: string) => Promise<{ ok: boolean; error?: string }>;
}

function blankForm(categories: ProductCategory[]): ProductFormValue {
  return {
    name: '',
    category_id: categories[0]?.id ?? null,
    stock_unit: 'pièce',
    stock_qty: 0,
    low_stock_threshold: 0,
    description: '',
    image_url: null,
    saleUnits: [{ unit: 'pièce', price: 0, factor_to_stock: 1, is_default: true, allow_decimal: false }],
  };
}

function fromProduct(p: Product): ProductFormValue {
  return {
    name: p.name,
    category_id: p.category_id,
    stock_unit: p.stock_unit,
    stock_qty: p.stock_qty,
    low_stock_threshold: p.low_stock_threshold,
    description: p.description ?? '',
    image_url: p.image_url,
    saleUnits: (p.sale_units ?? []).map((u) => ({
      id: u.id, unit: u.unit, price: u.price, factor_to_stock: u.factor_to_stock,
      is_default: u.is_default, allow_decimal: u.allow_decimal,
    })),
  };
}

export function ProductEditor({ open, product, categories, onClose, onSubmit, onArchive }: Props) {
  const [form, setForm] = useState<ProductFormValue>(() => blankForm(categories));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(product ? fromProduct(product) : blankForm(categories));
      setImageFile(null); setError(null);
    }
  }, [open, product, categories]);

  if (!open) return null;

  const isEdit = !!product;
  const c = colorOf(categories.find((cat) => cat.id === form.category_id)?.color ?? 'blue');

  function updateUnit(idx: number, patch: Partial<ProductFormValue['saleUnits'][number]>) {
    setForm((f) => {
      const next = [...f.saleUnits];
      next[idx] = { ...next[idx], ...patch };
      // Only one default
      if (patch.is_default === true) {
        next.forEach((u, i) => { if (i !== idx) u.is_default = false; });
      }
      return { ...f, saleUnits: next };
    });
  }
  function addUnit() {
    setForm((f) => ({ ...f, saleUnits: [...f.saleUnits, { unit: '', price: 0, factor_to_stock: 1, is_default: false, allow_decimal: false }] }));
  }
  function removeUnit(idx: number) {
    setForm((f) => ({ ...f, saleUnits: f.saleUnits.filter((_, i) => i !== idx) }));
  }

  async function handleSubmit() {
    if (submitting) return;
    if (!form.name.trim()) { setError('Le nom du produit est requis.'); return; }
    if (form.saleUnits.length === 0) { setError('Au moins une unité de vente est requise.'); return; }
    if (!form.saleUnits.some((u) => u.is_default)) {
      // Ensure one default
      form.saleUnits[0].is_default = true;
    }
    for (const u of form.saleUnits) {
      if (!u.unit.trim()) { setError('Chaque unité doit avoir un nom.'); return; }
    }
    setSubmitting(true); setError(null);
    try {
      const res = await onSubmit({ ...form, name: form.name.trim() }, imageFile);
      if (!res.ok) { setError(res.error ?? 'Échec'); setSubmitting(false); return; }
      setSubmitting(false);
      onClose();
    } catch (e) {
      setError((e as Error).message); setSubmitting(false);
    }
  }

  async function handleArchive() {
    if (!product || !onArchive || archiving) return;
    setArchiving(true); setError(null);
    try {
      const res = await onArchive(product.id);
      if (!res.ok) { setError(res.error ?? 'Échec'); setArchiving(false); return; }
      setArchiving(false);
      onClose();
    } catch (e) {
      setError((e as Error).message); setArchiving(false);
    }
  }

  function pickImage(file: File) {
    setImageFile(file);
    setForm((f) => ({ ...f, image_url: URL.createObjectURL(file) }));
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={submitting ? undefined : onClose} aria-hidden />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-md flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-base font-extrabold text-slate-800">{isEdit ? 'Modifier le produit' : 'Nouveau produit'}</h2>
          <button type="button" onClick={onClose} disabled={submitting} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40" aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {/* Image */}
          <div className="flex items-center gap-3">
            <div className={classNames('flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br', c.gradient)}>
              {form.image_url ? (
                <img src={form.image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <CategoryIcon slug={categories.find((cat) => cat.id === form.category_id)?.slug} size={36} rounded="full" className="bg-white/20" />
              )}
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200">
              <Camera size={18} /> Photo
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pickImage(f); }} />
            </label>
          </div>

          <Field label="Nom du produit">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
          </Field>

          <Field label="Catégorie">
            <select value={form.category_id ?? ''} onChange={(e) => setForm({ ...form, category_id: e.target.value || null })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400">
              {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Unité de stock">
              <input value={form.stock_unit} onChange={(e) => setForm({ ...form, stock_unit: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
            </Field>
            <Field label="Stock initial">
              <input inputMode="numeric" value={form.stock_qty ?? ''} onChange={(e) => { const s = e.target.value; setForm({ ...form, stock_qty: s === '' ? null : Number(s) }); }} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
            </Field>
          </div>

          <Field label="Seuil d'alerte (stock bas)">
            <input inputMode="numeric" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: Number(e.target.value) || 0 })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
          </Field>

          <Field label="Description (facultatif)">
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
          </Field>

          {/* Sale units */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Unités de vente</p>
              <button type="button" onClick={addUnit} className="flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                <Plus size={14} /> Ajouter
              </button>
            </div>
            <div className="space-y-2">
              {form.saleUnits.map((u, idx) => (
                <div key={idx} className="rounded-xl bg-slate-50 p-2.5 ring-1 ring-slate-100">
                  <div className="flex items-center gap-2">
                    <input value={u.unit} placeholder="unité" onChange={(e) => updateUnit(idx, { unit: e.target.value })} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400" />
                    {form.saleUnits.length > 1 && (
                      <button type="button" onClick={() => removeUnit(idx)} className="rounded-lg bg-red-50 p-1.5 text-red-600" aria-label="Supprimer unité">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <label className="text-xs text-slate-500">
                      Prix (F)
                      <input inputMode="numeric" value={u.price} onChange={(e) => updateUnit(idx, { price: Number(e.target.value) || 0 })} className="mt-0.5 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400" />
                    </label>
                    <label className="text-xs text-slate-500">
                      1 unité = ? stock
                      <input inputMode="decimal" value={u.factor_to_stock} onChange={(e) => updateUnit(idx, { factor_to_stock: Number(e.target.value) || 1 })} className="mt-0.5 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400" />
                    </label>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs">
                    <label className="flex items-center gap-1.5 font-semibold text-slate-600">
                      <input type="checkbox" checked={u.is_default} onChange={(e) => updateUnit(idx, { is_default: e.target.checked })} />
                      Unité par défaut
                    </label>
                    <label className="flex items-center gap-1.5 font-semibold text-slate-600">
                      <input type="checkbox" checked={u.allow_decimal} onChange={(e) => updateUnit(idx, { allow_decimal: e.target.checked })} />
                      Décimales autorisées
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700 ring-1 ring-red-200">{error}</p>}
        </div>

        <div className="space-y-2 border-t border-slate-100 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3.5 text-base font-bold text-white shadow transition hover:opacity-95 active:scale-[0.99] disabled:opacity-50"
          >
            {submitting ? <><Loader2 size={20} className="animate-spin" /> Enregistrement…</> : <><Check size={20} /> {isEdit ? 'Enregistrer' : 'Créer le produit'}</>}
          </button>
          {isEdit && onArchive && (
            <button
              type="button"
              disabled={archiving}
              onClick={handleArchive}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
            >
              {archiving ? <Loader2 size={16} className="animate-spin" /> : <Archive size={16} />} Archiver le produit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}

export function formatPriceShort(u: ProductSaleUnit): string {
  return u.price > 0 ? formatFCFA(u.price) : '—';
}
