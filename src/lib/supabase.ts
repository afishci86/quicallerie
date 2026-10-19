import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  Product, ProductCategory, Sale, SalePayment, StoreInfo, StockMovement,
  RegisterSaleResult, RegisterSaleInput, ArrivalResult,
  PaymentInstallmentResult, CancelSaleResult,
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

export async function fetchProducts(includeArchived = false): Promise<Product[]> {
  if (!supabase) return [];
  let q = supabase
    .from('products')
    .select('*, category:product_categories(*), sale_units:product_sale_units(*)')
    .order('name', { ascending: true });
  if (!includeArchived) q = q.eq('is_archived', false);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as Product[];
}

export async function createProduct(input: {
  name: string;
  category_id: string | null;
  stock_unit: string;
  stock_qty: number | null;
  low_stock_threshold: number;
  description?: string | null;
  image_url?: string | null;
  saleUnits: Array<{ unit: string; price: number; factor_to_stock: number; is_default: boolean; allow_decimal: boolean }>;
}): Promise<Product | null> {
  if (!supabase) return null;
  const { data: prod, error } = await supabase
    .from('products')
    .insert({
      name: input.name,
      category_id: input.category_id,
      stock_unit: input.stock_unit,
      stock_qty: input.stock_qty,
      low_stock_threshold: input.low_stock_threshold,
      description: input.description ?? null,
      image_url: input.image_url ?? null,
      is_active: true,
      is_archived: false,
    })
    .select('*')
    .single();
  if (error) throw error;
  const productId = (prod as Product).id;
  if (input.saleUnits.length > 0) {
    const rows = input.saleUnits.map((u) => ({
      product_id: productId,
      unit: u.unit,
      price: u.price,
      factor_to_stock: u.factor_to_stock,
      is_default: u.is_default,
      allow_decimal: u.allow_decimal,
    }));
    const { error: e2 } = await supabase.from('product_sale_units').insert(rows);
    if (e2) throw e2;
  }
  return prod as Product;
}

export async function updateProduct(
  id: string,
  patch: Partial<Pick<Product, 'name' | 'category_id' | 'description' | 'image_url' | 'stock_unit' | 'stock_qty' | 'low_stock_threshold'>>,
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('products').update(patch).eq('id', id);
  if (error) throw error;
}

export async function upsertSaleUnit(unit: { id?: string; product_id: string; unit: string; price: number; factor_to_stock: number; is_default: boolean; allow_decimal: boolean }): Promise<void> {
  if (!supabase) return;
  if (unit.id) {
    const { error } = await supabase
      .from('product_sale_units')
      .update({
        unit: unit.unit, price: unit.price, factor_to_stock: unit.factor_to_stock,
        is_default: unit.is_default, allow_decimal: unit.allow_decimal,
      })
      .eq('id', unit.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('product_sale_units')
      .insert({
        product_id: unit.product_id, unit: unit.unit, price: unit.price,
        factor_to_stock: unit.factor_to_stock, is_default: unit.is_default, allow_decimal: unit.allow_decimal,
      });
    if (error) throw error;
  }
}

export async function deleteSaleUnit(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('product_sale_units').delete().eq('id', id);
  if (error) throw error;
}

export async function archiveProduct(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('products').update({ is_archived: true }).eq('id', id);
  if (error) throw error;
}

export async function unarchiveProduct(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('products').update({ is_archived: false }).eq('id', id);
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
    .select('*, sale_items(*), sale_payments(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as Sale) ?? null;
}

export async function fetchDebtSales(): Promise<Sale[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('status', 'partial')
    .is('cancelled_at', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Sale[];
}

export async function fetchSalePayments(saleId: string): Promise<SalePayment[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('sale_payments')
    .select('*')
    .eq('sale_id', saleId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as SalePayment[];
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
    p_created_by: input.createdBy ?? null,
  });
  if (error) {
    return { ok: false, sale_id: '', reference: '', total: 0, amount_received: 0, balance_due: 0, status: 'paid', error: error.message };
  }
  return data as unknown as RegisterSaleResult;
}

export async function cancelSale(saleId: string, reason: string | null, cancelledBy: string | null): Promise<CancelSaleResult> {
  if (!supabase) {
    return { ok: false, sale_id: '', reference: '', restocked_lines: 0, error: 'Supabase non configuré' };
  }
  const { data, error } = await supabase.rpc('cancel_sale', {
    p_sale_id: saleId,
    p_reason: reason,
    p_cancelled_by: cancelledBy,
  });
  if (error) {
    return { ok: false, sale_id: '', reference: '', restocked_lines: 0, error: error.message };
  }
  return data as unknown as CancelSaleResult;
}

export async function recordSalePayment(saleId: string, amount: number, method: string, note: string | null, createdBy: string | null): Promise<PaymentInstallmentResult> {
  if (!supabase) {
    return { ok: false, sale_id: '', amount_received: 0, balance_due: 0, status: 'partial', error: 'Supabase non configuré' };
  }
  const { data, error } = await supabase.rpc('record_sale_payment', {
    p_sale_id: saleId,
    p_amount: amount,
    p_method: method,
    p_note: note,
    p_created_by: createdBy,
  });
  if (error) {
    return { ok: false, sale_id: '', amount_received: 0, balance_due: 0, status: 'partial', error: error.message };
  }
  return data as unknown as PaymentInstallmentResult;
}

// ---------- Arrivals ----------
export async function recordArrival(productId: string, quantity: number, note: string | null, createdBy: string | null): Promise<ArrivalResult> {
  if (!supabase) {
    return { ok: false, product_id: productId, new_stock_qty: 0, unit: '', error: 'Supabase non configuré' };
  }
  const { data, error } = await supabase.rpc('record_arrival', {
    p_product_id: productId,
    p_quantity: quantity,
    p_note: note,
    p_created_by: createdBy,
  });
  if (error) {
    return { ok: false, product_id: productId, new_stock_qty: 0, unit: '', error: error.message };
  }
  return data as unknown as ArrivalResult;
}

// ---------- Stock movements ----------
export async function fetchStockMovements(productId?: string, limit = 200): Promise<StockMovement[]> {
  if (!supabase) return [];
  let q = supabase
    .from('stock_movements')
    .select('*, product:products(name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (productId) q = q.eq('product_id', productId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as StockMovement[];
}

// ---------- Storage (product images) ----------
export async function uploadProductImage(file: File, productId: string): Promise<string | null> {
  if (!supabase) return null;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `products/${productId}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('product-images').upload(path, file, {
    cacheControl: '3600', upsert: false, contentType: file.type || `image/${ext}`,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl ?? null;
}

export { type RegisterSaleInput };
