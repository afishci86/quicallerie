import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Home, ShoppingCart, BookOpen, History, Crown, Plus, Store as StoreIcon,
  Pencil, Check, X, Wallet, Boxes,
} from 'lucide-react';
import { classNames, formatFCFA, vibrate } from '@/lib/format';
import { SupabaseStatus } from '@/components/SupabaseStatus';
import { SellPage } from '@/pages/SellPage';
import { StockPage } from '@/pages/StockPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { BossPage } from '@/pages/BossPage';
import { CreditsPage } from '@/pages/CreditsPage';
import { StockMovementsPage } from '@/pages/StockMovementsPage';
import { AddToCartSheet } from '@/components/AddToCartSheet';
import { CartSheet } from '@/components/CartSheet';
import { PaymentSheet, type PaymentResult } from '@/components/PaymentSheet';
import { ReceiptSheet } from '@/components/ReceiptSheet';
import { ArrivalSheet } from '@/components/ArrivalSheet';
import { ProductEditor, type ProductFormValue } from '@/components/ProductEditor';
import { OfflineBanner } from '@/components/OfflineBanner';
import { useCart } from '@/lib/useCart';
import { useUser } from '@/lib/useUser';
import { useOfflineSync } from '@/lib/useOfflineSync';
import {
  fetchCategories, fetchProducts, fetchStore, updateStore, registerSale, fetchSaleWithItems,
  isSupabaseConfigured, pingSupabase, recordArrival, createProduct, updateProduct,
  archiveProduct, upsertSaleUnit, deleteSaleUnit, uploadProductImage,
} from '@/lib/supabase';
import type { Product, ProductCategory, StoreInfo, Sale } from '@/types';

type Tab = 'home' | 'sell' | 'stock' | 'history' | 'credits' | 'boss';
type SubPage = { kind: 'movements' } | null;

const DEMO_STORE: StoreInfo = {
  id: 'demo',
  name: 'Quincaillerie Démo',
  phone: '+225 07 00 00 00 00',
  address: 'Abidjan, Côte d\'Ivoire',
  is_demo: true,
};

export default function App() {
  const { profile, isGerant, canEditCatalog } = useUser();
  const offline = useOfflineSync();

  const [tab, setTab] = useState<Tab>('home');
  const [subPage, setSubPage] = useState<SubPage>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [store, setStore] = useState<StoreInfo | null>(DEMO_STORE);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [online, setOnline] = useState<boolean>(isSupabaseConfigured);

  const [selected, setSelected] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [processing, setProcessing] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const [arrivalOpen, setArrivalOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const cart = useCart();
  const sellerName = profile.role === 'gerant' ? 'Gérant' : (profile.name || 'Employé');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const ok = await pingSupabase();
      setOnline(ok);
      if (!ok || !isSupabaseConfigured) { setLoading(false); return; }
      const [cats, prods, st] = await Promise.all([
        fetchCategories(), fetchProducts(false), fetchStore(),
      ]);
      setCategories(cats);
      setProducts(prods);
      if (st) setStore(st);
    } catch (e) {
      setLoadError((e as Error).message);
      setOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const go = useCallback((t: Tab) => {
    vibrate(15);
    setTab(t);
    setSubPage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  async function handleAdd(product: Product, unit: string, quantity: number) {
    cart.add(product, unit, quantity);
    setCartOpen(true);
  }

  async function handleConfirmPayment(result: PaymentResult) {
    if (processing) return;
    setProcessing(true);
    setPayError(null);
    try {
      const items = cart.lines.map((l) => ({
        product_id: l.product.id,
        unit: l.unit,
        quantity: l.quantity,
        unit_price: l.price,
      }));
      const idempotencyKey = `sale-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const payload = {
        storeId: store?.id && store.id !== 'demo' ? store.id : null,
        idempotencyKey,
        items,
        amountReceived: result.status === 'paid' ? null : result.amountReceived,
        customerName: result.customerName,
        customerPhone: result.customerPhone,
        createdBy: sellerName,
      };

      // Offline path: enqueue and show a local receipt-less confirmation
      if (!offline.online || !isSupabaseConfigured) {
        offline.enqueue({ type: 'sale', payload });
        setProcessing(false);
        setPayOpen(false);
        setReceiptOpen(false);
        cart.clear();
        alert('Vente enregistrée hors-ligne. Elle sera synchronisée au retour du réseau.');
        go('history');
        return;
      }

      const res = await registerSale(payload);
      if (!res.ok) {
        setPayError(res.error ?? 'Échec de l\'enregistrement');
        setProcessing(false);
        return;
      }
      const full = await fetchSaleWithItems(res.sale_id);
      setLastSale(full);
      cart.clear();
      setPayOpen(false);
      setReceiptOpen(true);
      setProcessing(false);
      // Refresh products to reflect stock changes
      loadAll();
    } catch (e) {
      setPayError((e as Error).message);
      setProcessing(false);
    }
  }

  function startNewSale() {
    setReceiptOpen(false);
    setLastSale(null);
    setCartOpen(false);
    setPayOpen(false);
    go('sell');
  }

  function startEditName() {
    setNameDraft(store?.name ?? '');
    setEditingName(true);
  }
  async function saveName() {
    if (!store || !nameDraft.trim()) { setEditingName(false); return; }
    const prev = store;
    setStore({ ...store, name: nameDraft.trim() });
    setEditingName(false);
    if (store.id !== 'demo') {
      try { await updateStore(store.id, { name: nameDraft.trim() }); }
      catch { setStore(prev); }
    }
  }

  async function handleArrivalConfirm(productId: string, quantity: number, note: string) {
    if (!offline.online || !isSupabaseConfigured) {
      offline.enqueue({ type: 'arrival', payload: { productId, quantity, note, createdBy: sellerName } });
      loadAll();
      return { ok: true };
    }
    const res = await recordArrival(productId, quantity, note || null, sellerName);
    if (!res.ok) return { ok: false, error: res.error };
    await loadAll();
    return { ok: true };
  }

  function openNewProduct() {
    setEditingProduct(null);
    setEditorOpen(true);
  }
  function openEditProduct(p: Product) {
    setEditingProduct(p);
    setEditorOpen(true);
  }

  async function handleProductSubmit(value: ProductFormValue, imageFile: File | null) {
    try {
      if (editingProduct) {
        // Update existing
        let imageUrl = value.image_url;
        if (imageFile) {
          // Use existing product id for upload
          const url = await uploadProductImage(imageFile, editingProduct.id);
          if (url) imageUrl = url;
        }
        await updateProduct(editingProduct.id, {
          name: value.name, category_id: value.category_id, description: value.description || null,
          image_url: imageUrl, stock_unit: value.stock_unit, stock_qty: value.stock_qty,
          low_stock_threshold: value.low_stock_threshold,
        });
        // Sync sale units: simple approach — delete removed, upsert kept
        const existing = editingProduct.sale_units ?? [];
        const keptIds = new Set(value.saleUnits.filter((u) => u.id).map((u) => u.id));
        for (const old of existing) {
          if (!keptIds.has(old.id)) await deleteSaleUnit(old.id);
        }
        for (const u of value.saleUnits) {
          await upsertSaleUnit({ ...u, product_id: editingProduct.id });
        }
      } else {
        // Create new
        const prod = await createProduct({
          name: value.name, category_id: value.category_id, stock_unit: value.stock_unit,
          stock_qty: value.stock_qty, low_stock_threshold: value.low_stock_threshold,
          description: value.description || null, image_url: null,
          saleUnits: value.saleUnits,
        });
        if (prod && imageFile) {
          const url = await uploadProductImage(imageFile, prod.id);
          if (url) await updateProduct(prod.id, { image_url: url });
        }
      }
      await loadAll();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  async function handleArchive(id: string) {
    try {
      await archiveProduct(id);
      await loadAll();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  const cartCount = cart.count;
  const effectiveOnline = offline.online && online;

  const navItems: Array<{ id: Tab; label: string; icon: typeof Home }> = useMemo(() => [
    { id: 'home', label: 'Accueil', icon: Home },
    { id: 'sell', label: 'Vendre', icon: ShoppingCart },
    { id: 'stock', label: 'Stock', icon: Boxes },
    { id: 'history', label: 'Historique', icon: History },
    { id: 'boss', label: 'Boss', icon: Crown },
  ], []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <button type="button" onClick={() => go('home')} className="flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow">
              <StoreIcon size={20} />
            </span>
            <div className="min-w-0 text-left">
              {editingName ? (
                <div className="flex items-center gap-1">
                  <input autoFocus value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }} className="w-40 rounded-lg border border-slate-300 px-2 py-1 text-sm font-bold outline-none focus:border-orange-400" />
                  <button onClick={saveName} className="text-green-600" aria-label="Valider"><Check size={18} /></button>
                  <button onClick={() => setEditingName(false)} className="text-slate-400" aria-label="Annuler"><X size={18} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <h1 className="truncate text-base font-extrabold text-slate-800">{store?.name ?? 'Quincaillerie'}</h1>
                  {tab === 'home' && (
                    <button onClick={startEditName} className="text-slate-300 hover:text-slate-500" aria-label="Modifier le nom"><Pencil size={14} /></button>
                  )}
                </div>
              )}
              <p className="truncate text-[11px] text-slate-500">{profile.role === 'gerant' ? 'Gérant' : profile.name || 'Employé'} · Côte d'Ivoire</p>
            </div>
          </button>
          <SupabaseStatus compact />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-28 pt-4">
        <OfflineBanner
          online={offline.online}
          pendingCount={offline.pending.length}
          syncing={offline.syncing}
          error={offline.lastSyncError}
          onSync={offline.syncNow}
        />

        {loadError && (
          <div className="mb-3 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700 ring-1 ring-red-200">
            Erreur de chargement: {loadError}.
          </div>
        )}

        {subPage?.kind === 'movements' ? (
          <StockMovementsPage supabaseOnline={effectiveOnline} />
        ) : tab === 'home' ? (
          <HomeView
            online={effectiveOnline}
            loading={loading}
            store={store}
            productCount={products.length}
            categoryCount={categories.length}
            cartCount={cartCount}
            pendingCount={offline.pending.length}
            onGo={go}
            onNewSale={startNewSale}
          />
        ) : tab === 'sell' ? (
          loading ? <LoadingBlock /> : (
            <SellPage products={products} categories={categories} onSelect={setSelected} />
          )
        ) : tab === 'stock' ? (
          loading ? <LoadingBlock /> : (
            <StockPage
              products={products}
              categories={categories}
              onArrival={() => setArrivalOpen(true)}
              onNewProduct={openNewProduct}
              onEdit={openEditProduct}
              onMovements={() => setSubPage({ kind: 'movements' })}
              onShowArchived={() => setSubPage({ kind: 'movements' })}
            />
          )
        ) : tab === 'history' ? (
          <HistoryPage supabaseOnline={effectiveOnline} isGerant={isGerant} />
        ) : tab === 'credits' ? (
          <CreditsPage supabaseOnline={effectiveOnline} />
        ) : tab === 'boss' ? (
          <BossPage supabaseOnline={effectiveOnline} onGo={go} />
        ) : null}
      </main>

      {tab === 'sell' && cartCount > 0 && !cartOpen && !payOpen && !receiptOpen && (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="fixed bottom-20 right-4 z-20 flex items-center gap-2 rounded-full bg-orange-500 px-5 py-3.5 font-bold text-white shadow-xl shadow-orange-500/30 transition hover:bg-orange-600 active:scale-95 pb-[calc(0.875rem+env(safe-area-inset-bottom))] sm:bottom-6"
        >
          <ShoppingCart size={20} />
          <span>{cartCount} article{cartCount > 1 ? 's' : ''}</span>
          <span className="rounded-full bg-white/25 px-2 py-0.5 text-sm">{formatFCFA(cart.total)}</span>
        </button>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto grid max-w-4xl grid-cols-5 pb-[env(safe-area-inset-bottom)]">
          {navItems.map((n) => {
            const active = tab === n.id;
            const Icon = n.icon;
            return (
              <button key={n.id} type="button" onClick={() => go(n.id)} className={classNames('relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold transition', active ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600')}>
                <span className="relative">
                  <Icon size={22} strokeWidth={active ? 2.6 : 2} />
                  {n.id === 'sell' && cartCount > 0 && (
                    <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">{cartCount}</span>
                  )}
                </span>
                {n.label}
                {active && <span className="absolute -top-px h-0.5 w-8 rounded-full bg-orange-500" />}
              </button>
            );
          })}
        </div>
      </nav>

      <AddToCartSheet product={selected} onClose={() => setSelected(null)} onAdd={handleAdd} />
      <CartSheet
        open={cartOpen}
        lines={cart.lines}
        total={cart.total}
        onClose={() => setCartOpen(false)}
        onSetQty={cart.setQuantity}
        onRemove={cart.remove}
        onCheckout={() => { setCartOpen(false); setPayOpen(true); }}
        onContinueShopping={() => setCartOpen(false)}
      />
      <PaymentSheet
        open={payOpen}
        lines={cart.lines}
        total={cart.total}
        processing={processing}
        error={payError}
        onClose={() => setPayOpen(false)}
        onConfirm={handleConfirmPayment}
      />
      <ReceiptSheet
        open={receiptOpen}
        sale={lastSale}
        store={store}
        onClose={() => setReceiptOpen(false)}
        onNewSale={startNewSale}
      />
      <ArrivalSheet
        open={arrivalOpen}
        products={products}
        onClose={() => setArrivalOpen(false)}
        onConfirm={handleArrivalConfirm}
      />
      <ProductEditor
        open={editorOpen}
        product={editingProduct}
        categories={categories}
        onClose={() => setEditorOpen(false)}
        onSubmit={handleProductSubmit}
        onArchive={isGerant ? handleArchive : undefined}
      />
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="flex items-center justify-center gap-2 rounded-2xl bg-white p-12 text-slate-500 ring-1 ring-slate-100">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-orange-500" />
      Chargement…
    </div>
  );
}

interface HomeViewProps {
  online: boolean;
  loading: boolean;
  store: StoreInfo | null;
  productCount: number;
  categoryCount: number;
  cartCount: number;
  pendingCount: number;
  onGo: (t: Tab) => void;
  onNewSale: () => void;
}

function HomeView({ online, loading, store, productCount, categoryCount, cartCount, pendingCount, onGo, onNewSale }: HomeViewProps) {
  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-500 to-amber-500 p-6 text-white shadow-lg">
        <p className="text-sm font-semibold text-white/80">Bienvenue à</p>
        <h2 className="text-3xl font-extrabold leading-tight">{store?.name ?? 'Quincaillerie'}</h2>
        <p className="mt-1 text-sm text-white/90">{store?.address}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={onNewSale} className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-base font-extrabold text-orange-600 shadow transition hover:bg-orange-50 active:scale-95">
            <Plus size={22} /> Nouvelle vente
          </button>
          {cartCount > 0 && (
            <button type="button" onClick={() => onGo('sell')} className="flex items-center gap-2 rounded-2xl bg-white/20 px-4 py-3 text-base font-bold text-white backdrop-blur transition hover:bg-white/30">
              <ShoppingCart size={20} /> Panier ({cartCount})
            </button>
          )}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <SupabaseStatus />
        {!loading && online && (
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">{productCount} produits · {categoryCount} catégories</span>
        )}
        {pendingCount > 0 && (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">{pendingCount} en attente</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Tile icon={ShoppingCart} title="Vendre" subtitle="Encaisser une vente" color="orange" onClick={() => onGo('sell')} />
        <Tile icon={Boxes} title="Stock" subtitle="Produits & arrivages" color="blue" onClick={() => onGo('stock')} />
        <Tile icon={History} title="Historique" subtitle="Ventes & reçus" color="green" onClick={() => onGo('history')} />
        <Tile icon={Wallet} title="Crédits" subtitle="Restes dûs clients" color="amber" onClick={() => onGo('credits')} />
        <Tile icon={Crown} title="Espace Boss" subtitle="Gestion & rôle" color="violet" onClick={() => onGo('boss')} />
      </div>

      {!online && (
        <div className="rounded-2xl bg-yellow-50 p-4 text-sm font-semibold text-yellow-800 ring-1 ring-yellow-200">
          Mode démo : Supabase n'est pas connecté. Configurez les variables pour activer l'enregistrement des ventes.
        </div>
      )}
    </div>
  );
}

import type { LucideIcon } from 'lucide-react';
import { colorOf } from '@/lib/colors';

function Tile({ icon: Icon, title, subtitle, color, onClick }: {
  icon: LucideIcon; title: string; subtitle: string; color: string; onClick: () => void;
}) {
  const c = colorOf(color);
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-start gap-2 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200 transition hover:shadow-md hover:ring-slate-300 active:scale-[0.98]">
      <span className={classNames('inline-flex rounded-xl p-2.5 text-white shadow-sm', c.bg)}>
        <Icon size={24} />
      </span>
      <div>
        <p className="text-base font-extrabold text-slate-800">{title}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </button>
  );
}
