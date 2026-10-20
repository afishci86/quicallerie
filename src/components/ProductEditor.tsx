import { useEffect, useState } from 'react';
import type { Product, ProductCategory } from '@/types';
import { classNames, formatFCFA } from '@/lib/format';
import { colorOf } from '@/lib/colors';
import { CategoryIcon } from './CategoryIcon';
import { X, Plus, Check, Loader2, Camera } from 'lucide-react';

export interface ProductFormValue {
  name: string;
  category_id: string | null;
  prixGros: number;
  prixDetail: number;
  stock_qty: number | null;
  low_stock_threshold: number;
  description: string;
  image_url: string | null;
}

interface Props {
  open: boolean;
  product: Product | null;
  categories: ProductCategory[];
  onClose: () => void;
  onSubmit: (value: ProductFormValue, imageFile: File | null) => Promise<{ ok: boolean; error?: string }>;
  onArchive?: (id: string) => Promise<{ ok: boolean; error?: string }>;
}

function blankForm(categories: ProductCategory[]): ProductFormValue {
  return { name: '', category_id: categories[0]?.id ?? null, prixGros: 0, prixDetail: 0, stock_qty: 0, low_stock_threshold: 5, description: '', image_url: null };
}

function fromProduct(p: Product): ProductFormValue {
  const detail = p.sale_units?.find((u) => u.unit === 'detail');
  const gros = p.sale_units?.find((u) => u.unit === 'gros');
  return {
    name: p.name, category_id: p.category_id,
    prixGros: gros?.price ?? 0, prixDetail: detail?.price ?? 0,
    stock_qty: p.stock_qty, low_stock_threshold: p.low_stock_threshold,
    description: p.description ?? '', image_url: p.image_url,
  };
}

export function ProductEditor({ open, product, categories, onClose, onSubmit, onArchive }: Props) {
  const [form, setForm] = useState<ProductFormValue>(() => blankForm(categories));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setForm(product ? fromProduct(product) : blankForm(categories)); setImageFile(null); setError(null); }
  }, [open, product, categories]);

  if (!open) return null;

  const c = colorOf(categories.find((cat) => cat.id === form.category_id)?.color ?? 'blue');

  async function handleSubmit() {
    if (submitting) return;
    if (!form.name.trim()) { setError('Le nom du produit est requis.'); return; }
    if (form.prixDetail <= 0 && form.prixGros <= 0) { setError('Renseigne au moins un prix (détail ou gros).'); return; }
    setSubmitting(true); setError(null);
    try {
      const res = await onSubmit({ ...form, name: form.name.trim() }, imageFile);
      if (!res.ok) { setError(res.error ?? 'Échec'); setSubmitting(false); return; }
      setSubmitting(false); onClose();
    } catch (e) { setError((e as Error).message); setSubmitting(false); }
  }

  async function handleArchive() {
    if (!product || !onArchive) return;
    setSubmitting(true); setError(null);
    try {
      const res = await onArchive(product.id);
      if (!res.ok) { setError(res.error ?? 'Échec'); setSubmitting(false); return; }
      setSubmitting(false); onClose();
    } catch (e) { setError((e as Error).message); setSubmitting(false); }
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
          <h2 className="text-base font-extrabold text-slate-800">{product ? 'Modifier le produit' : 'Nouveau produit'}</h2>
          <button type="button" onClick={onClose} disabled={submitting} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"><X size={20} /></button>
        </div>

        {/* Big "Add new product" button on top (only in edit mode, to jump to new) */}
        {product && (
          <button type="button" onClick={() => { setForm(blankForm(categories)); setImageFile(null); }} className="mx-4 mt-3 flex items-center justify-center gap-2 rounded-2xl bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700 ring-1 ring-orange-200">
            <Plus size={18} /> Ajouter un nouveau produit
          </button>
        )}

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {/* Photo */}
          <div className="flex items-center gap-3">
            <div className={classNames('flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br', c.gradient)}>
              {form.image_url ? <img src={form.image_url} alt="" className="h-full w-full object-cover" /> : <CategoryIcon slug={categories.find((cat) => cat.id === form.category_id)?.slug} size={36} rounded="full" className="bg-white/20" />}
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200">
              <Camera size={18} /> Photo
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pickImage(f); }} />
            </label>
          </div>

          <Field label="Nom du produit">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold outline-none focus:border-blue-400" />
          </Field>

          <Field label="Catégorie">
            <select value={form.category_id ?? ''} onChange={(e) => setForm({ ...form, category_id: e.target.value || null })} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold outline-none focus:border-blue-400">
              {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Prix Détail (F)">
              <input inputMode="numeric" value={form.prixDetail || ''} onChange={(e) => setForm({ ...form, prixDetail: Number(e.target.value.replace(/[^0-9]/g, '')) || 0 })} placeholder="0" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold outline-none focus:border-blue-400" />
            </Field>
            <Field label="Prix Gros (F)">
              <input inputMode="numeric" value={form.prixGros || ''} onChange={(e) => setForm({ ...form, prixGros: Number(e.target.value.replace(/[^0-9]/g, '')) || 0 })} placeholder="0" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold outline-none focus:border-blue-400" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Nouveau stock">
              <input inputMode="numeric" value={form.stock_qty ?? ''} onChange={(e) => { const s = e.target.value.replace(/[^0-9]/g, ''); setForm({ ...form, stock_qty: s === '' ? null : Number(s) }); }} placeholder="0" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold outline-none focus:border-blue-400" />
            </Field>
            <Field label="Seuil stock bas">
              <input inputMode="numeric" value={form.low_stock_threshold || ''} onChange={(e) => setForm({ ...form, low_stock_threshold: Number(e.target.value.replace(/[^0-9]/g, '')) || 0 })} placeholder="0" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold outline-none focus:border-blue-400" />
            </Field>
          </div>

          {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700 ring-1 ring-red-200">{error}</p>}
        </div>

        <div className="space-y-2 border-t border-slate-100 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <button type="button" disabled={submitting} onClick={handleSubmit} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3.5 text-base font-bold text-white shadow transition hover:opacity-95 active:scale-[0.99] disabled:opacity-50">
            {submitting ? <><Loader2 size={20} className="animate-spin" /> Enregistrement…</> : <><Check size={20} /> {product ? 'Enregistrer' : 'Créer le produit'}</>}
          </button>
          {product && onArchive && (
            <button type="button" disabled={submitting} onClick={handleArchive} className="w-full rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 disabled:opacity-50">Archiver le produit</button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<label className="block"><span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>{children}</label>);
}

export { formatFCFA };
