import { useMemo, useState } from 'react';
import { Search, Package, AlertTriangle, XCircle, Settings2 } from 'lucide-react';
import type { Product, ProductCategory } from '@/types';
import { CategoryIcon } from '@/components/CategoryIcon';
import { colorOf } from '@/lib/colors';
import { classNames, formatFCFA, formatQty } from '@/lib/format';

interface Props {
  products: Product[];
  categories: ProductCategory[];
}

export function CatalogPage({ products, categories }: Props) {
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

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
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">Catalogue & Stock</h1>
        <p className="text-sm text-slate-500">{products.length} références dans la base.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher dans le catalogue…"
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm font-medium outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => setActiveCat(null)}
          className={classNames(
            'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-bold ring-1',
            activeCat === null ? 'bg-slate-800 text-white ring-transparent' : 'bg-white text-slate-600 ring-slate-200',
          )}
        >
          Toutes
        </button>
        {categories.map((cat) => {
          const c = colorOf(cat.color);
          const active = activeCat === cat.id || activeCat === cat.slug;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCat(active ? null : cat.id)}
              className={classNames(
                'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-bold ring-1',
                active ? classNames(c.bg, 'text-white ring-transparent') : 'bg-white text-slate-600 ring-slate-200',
              )}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      <ul className="space-y-2">
        {filtered.map((p) => {
          const c = colorOf(p.category?.color);
          const open = openId === p.id;
          const psus = p.sale_units ?? [];
          const unknown = p.stock_qty == null;
          const out = p.stock_qty != null && p.stock_qty <= 0;
          const low = p.stock_qty != null && p.stock_qty > 0 && p.stock_qty <= p.low_stock_threshold;
          return (
            <li key={p.id} className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : p.id)}
                className="flex w-full items-center gap-3 p-3 text-left"
              >
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
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
                        <Settings2 size={11} /> À configurer
                      </span>
                    ) : out ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 font-semibold text-red-700">
                        <XCircle size={11} /> Épuisé
                      </span>
                    ) : low ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 font-semibold text-yellow-800">
                        <AlertTriangle size={11} /> Faible: {formatQty(p.stock_qty as number)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 font-semibold text-green-700">
                        <Package size={11} /> {formatQty(p.stock_qty as number)} {p.stock_unit}
                      </span>
                    )}
                  </div>
                </div>
              </button>
              {open && (
                <div className="border-t border-slate-100 bg-slate-50 p-3">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Unités de vente ({psus.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {psus.map((u) => (
                      <div key={u.id} className={classNames('rounded-xl bg-white px-3 py-2 text-xs ring-1', c.border)}>
                        <p className="font-bold text-slate-800">{u.unit}</p>
                        <p className="text-slate-600">{u.price > 0 ? formatFCFA(u.price) : 'Prix à configurer'}</p>
                        <p className="text-slate-400">1 {u.unit} = {u.factor_to_stock} {p.stock_unit}{u.allow_decimal ? ' · décimales' : ''}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] text-slate-400">
                    Les arrivages, seuils d'alerte et la modification des produits seront disponibles dans une étape ultérieure.
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
