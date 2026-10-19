import { useMemo, useState } from 'react';
import { Search, Package, AlertTriangle, XCircle, Settings2, Plus, Truck, Pencil, History, Archive } from 'lucide-react';
import type { Product, ProductCategory } from '@/types';
import { CategoryIcon } from '@/components/CategoryIcon';
import { colorOf } from '@/lib/colors';
import { classNames, formatFCFA, formatQty } from '@/lib/format';
import { useUser } from '@/lib/useUser';

interface Props {
  products: Product[];
  categories: ProductCategory[];
  onArrival: () => void;
  onNewProduct: () => void;
  onEdit: (p: Product) => void;
  onMovements: () => void;
  onShowArchived: () => void;
}

export function StockPage({ products, categories, onArrival, onNewProduct, onEdit, onMovements, onShowArchived }: Props) {
  const { canEditCatalog } = useUser();
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (activeCat && p.category_id !== activeCat && p.category?.slug !== activeCat) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q);
    });
  }, [products, query, activeCat]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Stock & Catalogue</h1>
          <p className="text-sm text-slate-500">{products.length} produits actifs.</p>
        </div>
        <button type="button" onClick={onMovements} className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200">
          <History size={16} /> Mouvements
        </button>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={onArrival} className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-500/20 active:scale-[0.98]">
          <Truck size={20} /> Arrivage
        </button>
        {canEditCatalog ? (
          <button type="button" onClick={onNewProduct} className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3.5 text-base font-bold text-white shadow-lg shadow-orange-500/20 active:scale-[0.98]">
            <Plus size={20} /> Nouveau produit
          </button>
        ) : (
          <button type="button" onClick={onShowArchived} className="flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3.5 text-base font-bold text-slate-700 ring-1 ring-slate-200 active:scale-[0.98]">
            <Archive size={20} /> Archivés
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un produit…"
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm font-medium outline-none focus:border-blue-400"
        />
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button type="button" onClick={() => setActiveCat(null)} className={classNames('shrink-0 rounded-full px-3.5 py-1.5 text-sm font-bold ring-1', activeCat === null ? 'bg-slate-800 text-white ring-transparent' : 'bg-white text-slate-600 ring-slate-200')}>Toutes</button>
        {categories.map((cat) => {
          const c = colorOf(cat.color);
          const active = activeCat === cat.id || activeCat === cat.slug;
          return (
            <button key={cat.id} type="button" onClick={() => setActiveCat(active ? null : cat.id)} className={classNames('shrink-0 rounded-full px-3.5 py-1.5 text-sm font-bold ring-1', active ? classNames(c.bg, 'text-white ring-transparent') : 'bg-white text-slate-600 ring-slate-200')}>{cat.name}</button>
          );
        })}
      </div>

      <ul className="space-y-2">
        {filtered.map((p) => {
          const c = colorOf(p.category?.color);
          const psus = p.sale_units ?? [];
          const unknown = p.stock_qty == null;
          const out = p.stock_qty != null && p.stock_qty <= 0;
          const low = p.stock_qty != null && p.stock_qty > 0 && p.stock_qty <= p.low_stock_threshold;
          return (
            <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200">
              <CategoryIcon slug={p.category?.slug} size={48} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-800">{p.name}</p>
                <p className={classNames('text-xs font-semibold', c.text)}>{p.category?.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  {psus[0]?.price > 0 ? (
                    <span className="font-bold text-slate-700">{formatFCFA(psus[0].price)} / {psus[0].unit}</span>
                  ) : (
                    <span className="font-semibold text-slate-400">Prix à configurer</span>
                  )}
                  {unknown ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600"><Settings2 size={11} /> À configurer</span>
                  ) : out ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 font-semibold text-red-700"><XCircle size={11} /> Épuisé</span>
                  ) : low ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 font-semibold text-yellow-800"><AlertTriangle size={11} /> Faible: {formatQty(p.stock_qty as number)}</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 font-semibold text-green-700"><Package size={11} /> {formatQty(p.stock_qty as number)} {p.stock_unit}</span>
                  )}
                </div>
              </div>
              {canEditCatalog && (
                <button type="button" onClick={() => onEdit(p)} className="rounded-xl bg-slate-100 p-2.5 text-slate-600 hover:bg-slate-200" aria-label="Modifier">
                  <Pencil size={18} />
                </button>
              )}
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="rounded-2xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-100">Aucun produit.</li>
        )}
      </ul>
    </div>
  );
}
