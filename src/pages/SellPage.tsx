import { useMemo, useState } from 'react';
import { Mic, Search, X, Filter } from 'lucide-react';
import type { Product, ProductCategory } from '@/types';
import { ProductCard } from '@/components/ProductCard';
import { colorOf } from '@/lib/colors';
import { classNames } from '@/lib/format';

interface Props {
  products: Product[];
  categories: ProductCategory[];
  onSelect: (p: Product) => void;
}

export function SellPage({ products, categories, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [recognitionSupported] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (activeCat && p.category_id !== activeCat && p.category?.slug !== activeCat) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || (p.category?.name.toLowerCase().includes(q) ?? false);
    });
  }, [products, query, activeCat]);

  function toggleVoice() {
    if (!recognitionSupported) return;
    const SR = (window as unknown as { SpeechRecognition?: typeof window.SpeechRecognition; webkitSpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition
      ?? (window as unknown as { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'fr-FR';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    setListening(true);
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const txt = e.results[0]?.[0]?.transcript ?? '';
      setQuery(txt);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    try { rec.start(); } catch { setListening(false); }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">Nouvelle vente</h1>
        <p className="text-sm text-slate-500">Choisissez un produit pour l'ajouter au panier.</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un produit…"
            inputMode="search"
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm font-medium text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-2.5 rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
              aria-label="Effacer"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {recognitionSupported && (
          <button
            type="button"
            onClick={toggleVoice}
            className={classNames(
              'flex h-12 w-12 items-center justify-center rounded-2xl ring-1 transition',
              listening ? 'bg-red-500 text-white ring-transparent' : 'bg-white text-blue-600 ring-slate-200 hover:ring-slate-300',
            )}
            aria-label="Recherche vocale"
          >
            <Mic size={20} className={listening ? 'animate-pulse' : ''} />
          </button>
        )}
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => setActiveCat(null)}
          className={classNames(
            'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-bold ring-1 transition',
            activeCat === null ? 'bg-slate-800 text-white ring-transparent' : 'bg-white text-slate-600 ring-slate-200 hover:ring-slate-300',
          )}
        >
          <Filter size={14} className="mr-1 inline" /> Toutes
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
                'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-bold ring-1 transition',
                active ? classNames(c.bg, 'text-white ring-transparent') : 'bg-white text-slate-600 ring-slate-200 hover:ring-slate-300',
              )}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-100">
          Aucun produit trouvé.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              categorySlug={p.category?.slug}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Minimal ambient types for SpeechRecognition (not in TS lib by default)
interface SpeechRecognitionEvent extends Event {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
