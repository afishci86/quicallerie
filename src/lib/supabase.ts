import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  Product, ProductCategory, ProductSaleUnit, Sale, SaleItem, StoreInfo,
  RegisterSaleResult,
} from '@/types';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, { auth: { persistSession: false } })
  : null;

export async function pingSupabase(): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('product_categories')
      .select('id', { count: 'exact', head: true });
    return !error;
  } catch {
    return false;
  }
}

// ---------- Products / categories ----------
export async function fetchCategories(): Promise<ProductCategory[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ProductCategory[];
}

export async function fetchProducts(): Promise<Product[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('products')
    .select('*, category:product_categories(*), sale_units:product_sale_units(*)')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Product[];
}

export async function fetchProductsWithUnits(): Promise<Product[]> {
  return fetchProducts();
}

export async function updateProductStock(productId: string, stockQty: number | null): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('products')
    .update({ stock_qty: stockQty })
    .eq('id', productId);
  if (error) throw error;
}

// ---------- Store ----------
export async function fetchStore(): Promise<StoreInfo | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as StoreInfo) ?? null;
}

export async function updateStore(id: string, patch: Partial<Pick<StoreInfo, 'name' | 'phone' | 'address'>>): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('stores').update(patch).eq('id', id);
  if (error) throw error;
}

// ---------- Sales ----------
export async function fetchSales(limit = 100): Promise<Sale[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as Sale[];
}

export async function fetchSaleWithItems(id: string): Promise<Sale | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('sales')
    .select('*, sale_items(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as Sale) ?? null;
}

export interface RegisterSaleInput {
  storeId?: string | null;
  idempotencyKey: string;
  items: Array<{ product_id: string; unit: string; quantity: number; unit_price: number }>;
  amountReceived: number | null;
  customerName?: string | null;
  customerPhone?: string | null;
  note?: string | null;
}

export async function registerSale(input: RegisterSaleInput): Promise<RegisterSaleResult> {
  if (!supabase) {
    return { ok: false, sale_id: '', reference: '', total: 0, amount_received: 0, balance_due: 0, status: 'paid', error: 'Supabase non configuré' };
  }
  const { data, error } = await supabase.rpc('register_sale', {
    p_store_id: input.storeId ?? null,
    p_idempotency_key: input.idempotencyKey,
    p_items: input.items,
    p_amount_received: input.amountReceived,
    p_customer_name: input.customerName ?? null,
    p_customer_phone: input.customerPhone ?? null,
    p_note: input.note ?? null,
  });
  if (error) {
    return { ok: false, sale_id: '', reference: '', total: 0, amount_received: 0, balance_due: 0, status: 'paid', error: error.message };
  }
  return data as unknown as RegisterSaleResult;
}

export type { SaleItem };
