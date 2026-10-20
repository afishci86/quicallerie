import { useMemo, useState } from 'react';
import { Search, X, Filter, Pencil, Plus, Package } from 'lucide-react';
import type { Product, ProductCategory, SaleUnitKind } from '@/types';
import { classNames, formatFCFA, vibrate } from '@/lib/format';
import { colorOf } from '@/lib/colors';
import { CategoryIcon } from '@/components/CategoryIcon';
import { useUser } from '@/lib/useUser';

interface Props {
  products: Product[];
  categories: ProductCategory[];
  onSelect: (p: Product, kind: SaleUnitKind) => void;
  onEdit: (p: Product) => void;
  onNewProduct: () => void;
}

function stockState(p: Product): 'ok' | 'low' | 'out' | 'unknown' {
  if (p.stock_qty == null) return 'unknown';
  if (p.stock_qty <= 0) return 'out';
  if (p.stock_qty <= p.low_stock_threshold) return 'low';
  return 'ok';
}

const DOT: Record<string, string> = {
  ok: 'bg-green-500',
  low: 'bg-yellow-400',
  out: 'bg-red-500',
  unknown: 'bg-slate-300',
};

export function VendrePage({ products, categories, onSelect, onEdit, onNewProduct }: Props) {
  const { canEditCatalog } = useUser();
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (activeCat && p.category_id !== activeCat && p.category?.slug !== activeCat) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || (p.category?.name.toLowerCase().includes(q) ?? false);
    });
  }, [products, query, activeCat]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un produit…"
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm font-bold text-slate-800 outline-none focus:border-blue-400"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="absolute right-2 top-2.5 rounded-full p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Effacer">
              <X size={16} />
            </button>
          )}
        </div>
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((p) => {
          const c = colorOf(p.category?.color);
          const psus = p.sale_units ?? [];
          const detailPsu = psus.find((u) => u.unit === 'detail');
          const grosPsu = psus.find((u) => u.unit === 'gros');
          const primary = detailPsu ?? grosPsu ?? psus[0] ?? null;
          const hasTwoPrices = !!grosPsu && grosPsu.price > 0 && !!detailPsu && detailPsu.price > 0;
          const st = stockState(p);
          const configured = primary != null && primary.price > 0;
          const [imgError, setImgError] = useState(false);
          return (
            <div key={p.id} className="relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
              <button type="button" onClick={() => { if (configured) { vibrate(15); onSelect(p, hasTwoPrices ? 'both' as SaleUnitKind : (detailPsu ? 'detail' : 'gros')); } }} className="flex flex-1 flex-col text-left" disabled={!configured}>
                <div className={classNames('relative h-24 w-full bg-gradient-to-br', c.gradient)}>
                  {p.image_url && !imgError ? (
                    <img src={p.image_url} alt={p.name} loading="lazy" onError={() => setImgError(true)} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <CategoryIcon slug={p.category?.slug} size={48} rounded="full" className="bg-white/20" />
                    </div>
                  )}
                  {/* Stock dot indicator */}
                  <span className={classNames('absolute right-2 top-2 h-3 w-3 rounded-full ring-2 ring-white shadow', DOT[st])} />
                </div>
                <div className="flex flex-1 flex-col gap-1 p-3">
                  <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-800">{p.name}</h3>
                  <div className="mt-auto">
                    {configured ? (
                      <>
                        <p className={classNames('text-base font-extrabold', c.textStrong)}>{formatFCFA(primary!.price)}</p>
                        {hasTwoPrices && <p className="text-[11px] font-semibold text-slate-400">Gros / Détail</p>}
                      </>
                    ) : (
                      <p className="flex items-center gap-1 text-sm font-semibold text-slate-400"><Package size={14} /> À configurer</p>
                    )}
                  </div>
                </div>
              </button>
              {canEditCatalog && (
                <button type="button" onClick={() => { vibrate(15); onEdit(p); }} className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-slate-600 shadow ring-1 ring-slate-200 hover:bg-white hover:text-slate-900" aria-label="Modifier">
                  <Pencil size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-100">
          Aucun produit trouvé.
        </div>
      )}

      {canEditCatalog && (
        <button type="button" onClick={onNewProduct} className="fixed bottom-20 right-4 z-20 flex items-center gap-2 rounded-full bg-orange-500 px-5 py-3.5 font-bold text-white shadow-xl shadow-orange-500/30 active:scale-95 pb-[calc(0.875rem+env(safe-area-inset-bottom))] sm:bottom-6">
          <Plus size={22} /> Nouveau produit
        </button>
      )}
    </div>
  );
}
