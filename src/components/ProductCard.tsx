import { useState } from 'react';
import type { Product } from '@/types';
import { CategoryIcon } from './CategoryIcon';
import { colorOf } from '@/lib/colors';
import { classNames, formatFCFA, formatQty } from '@/lib/format';
import { Package, AlertTriangle, XCircle, ChevronRight } from 'lucide-react';

interface Props {
  product: Product;
  categorySlug?: string | null;
  onSelect: (product: Product) => void;
}

function stockState(p: Product): 'ok' | 'low' | 'out' | 'unknown' {
  if (p.stock_qty == null) return 'unknown';
  if (p.stock_qty <= 0) return 'out';
  if (p.stock_qty <= p.low_stock_threshold) return 'low';
  return 'ok';
}

export function ProductCard({ product, categorySlug, onSelect }: Props) {
  const [imgError, setImgError] = useState(false);
  const c = colorOf(product.category?.color);
  const psus = product.sale_units ?? [];
  const defaultPsu = psus.find((u) => u.is_default) ?? psus[0] ?? null;
  const st = stockState(product);
  const configured = defaultPsu != null && defaultPsu.price > 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className={classNames(
        'group relative flex w-full flex-col overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-slate-200 transition-all',
        'hover:shadow-md hover:ring-slate-300 active:scale-[0.99] focus:outline-none focus:ring-2',
        c.ring,
      )}
    >
      <div className={classNames('relative h-28 w-full bg-gradient-to-br', c.gradient)}>
        {product.image_url && !imgError ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <CategoryIcon slug={categorySlug} size={56} rounded="full" className="bg-white/20 backdrop-blur" />
          </div>
        )}
        <span className={classNames(
          'absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold text-white shadow',
          st === 'ok' ? 'bg-green-500' :
          st === 'low' ? 'bg-yellow-500' :
          st === 'out' ? 'bg-red-500' :
          'bg-slate-700/80',
        )}>
          {st === 'ok' && <Package size={12} />}
          {st === 'low' && <AlertTriangle size={12} />}
          {st === 'out' && <XCircle size={12} />}
          {st === 'unknown' ? 'À configurer' :
            st === 'out' ? 'Épuisé' :
            st === 'low' ? `Stock faible` :
            `Stock: ${formatQty(product.stock_qty as number)} ${product.stock_unit}`}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-800">
            {product.name}
          </h3>
          <ChevronRight className="mt-0.5 shrink-0 text-slate-300 group-hover:text-slate-500" size={18} />
        </div>

        <div className="mt-auto flex items-end justify-between pt-1">
          <div>
            {configured ? (
              <p className={classNames('text-base font-extrabold', c.textStrong)}>
                {formatFCFA(defaultPsu!.price)}
                <span className="ml-1 text-xs font-medium text-slate-500">/{defaultPsu!.unit}</span>
              </p>
            ) : (
              <p className="text-sm font-semibold text-slate-400">Prix à configurer</p>
            )}
            {psus.length > 1 && (
              <p className="text-[11px] text-slate-400">{psus.length} unités de vente</p>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
