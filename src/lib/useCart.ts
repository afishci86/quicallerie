import { useCallback, useMemo, useState } from 'react';
import type { CartLine, Product, SaleUnitKind } from '@/types';

function lineKey(productId: string, kind: SaleUnitKind): string {
  return `${productId}|${kind}`;
}

export interface UseCart {
  lines: CartLine[];
  add: (product: Product, kind: SaleUnitKind, unitLabel: string, price: number, quantity: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  total: number;
  count: number;
}

export function useCart(): UseCart {
  const [lines, setLines] = useState<CartLine[]>([]);

  const add = useCallback((product: Product, kind: SaleUnitKind, unitLabel: string, price: number, quantity: number) => {
    if (quantity <= 0 || price <= 0) return;
    const key = lineKey(product.id, kind);
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.key === key);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
        return next;
      }
      return [...prev, { key, product, unit: kind, unitLabel, price, quantity }];
    });
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setLines((prev) => prev
      .map((l) => (l.key === key ? { ...l, quantity } : l))
      .filter((l) => l.quantity > 0));
  }, []);

  const remove = useCallback((key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const total = useMemo(() => lines.reduce((s, l) => s + l.price * l.quantity, 0), [lines]);
  const count = useMemo(() => lines.reduce((s, l) => s + l.quantity, 0), [lines]);

  return { lines, add, setQuantity, remove, clear, total, count };
}
