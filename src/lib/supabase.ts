import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  Product, ProductCategory, Sale, SalePayment, StoreInfo, StockMovement, Employee,
  RegisterSaleResult, RegisterSaleInput, CancelSaleResult, PaymentInstallmentResult,
  SaleUnitKind,
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
    .eq('is_archived', false)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Product[];
}

export function productPrice(product: Product, kind: SaleUnitKind): { price: number; unitId: string } | null {
  const psu = product.sale_units?.find((u) => u.unit === (kind === 'gros' ? 'gros' : 'detail'));
  if (!psu) return null;
  return { price: psu.price, unitId: psu.id };
}

export async function createProduct(input: {
  name: string;
  category_id: string | null;
  stock_qty: number | null;
  low_stock_threshold: number;
  description?: string | null;
  image_url?: string | null;
  prixGros: number;
  prixDetail: number;
}): Promise<Product | null> {
  if (!supabase) return null;
  const { data: prod, error } = await supabase
    .from('products')
    .insert({
      name: input.name,
      category_id: input.category_id,
      stock_unit: 'pièce',
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
  const rows = [
    { product_id: productId, unit: 'detail', price: input.prixDetail, factor_to_stock: 1, is_default: true, allow_decimal: false },
    { product_id: productId, unit: 'gros', price: input.prixGros, factor_to_stock: 1, is_default: false, allow_decimal: false },
  ];
  const { error: e2 } = await supabase.from('product_sale_units').insert(rows);
  if (e2) throw e2;
  return prod as Product;
}

export async function updateProductFields(
  id: string,
  patch: Partial<Pick<Product, 'name' | 'category_id' | 'description' | 'image_url' | 'stock_qty' | 'low_stock_threshold'>>,
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('products').update(patch).eq('id', id);
  if (error) throw error;
}

export async function setProductPrices(productId: string, prixGros: number, prixDetail: number): Promise<void> {
  if (!supabase) return;
  const { data: units, error } = await supabase
    .from('product_sale_units')
    .select('id, unit')
    .eq('product_id', productId);
  if (error) throw error;
  for (const u of (units ?? []) as Array<{ id: string; unit: string }>) {
    const price = u.unit === 'gros' ? prixGros : u.unit === 'detail' ? prixDetail : null;
    if (price == null) continue;
    const { error: e2 } = await supabase
      .from('product_sale_units')
      .update({ price })
      .eq('id', u.id);
    if (e2) throw e2;
  }
}

export async function archiveProduct(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('products').update({ is_archived: true }).eq('id', id);
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

export async function registerSale(input: RegisterSaleInput): Promise<RegisterSaleResult> {
  if (!supabase) {
    return { ok: false, sale_id: '', reference: '', total: 0, amount_received: 0, balance_due: 0, status: 'paid', error: 'Cloud non configuré' };
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
    return { ok: false, sale_id: '', reference: '', restocked_lines: 0, error: 'Cloud non configuré' };
  }
  const { data, error } = await supabase.rpc('cancel_sale', {
    p_sale_id: saleId, p_reason: reason, p_cancelled_by: cancelledBy,
  });
  if (error) {
    return { ok: false, sale_id: '', reference: '', restocked_lines: 0, error: error.message };
  }
  return data as unknown as CancelSaleResult;
}

export async function recordSalePayment(saleId: string, amount: number, method: string, note: string | null, createdBy: string | null): Promise<PaymentInstallmentResult> {
  if (!supabase) {
    return { ok: false, sale_id: '', amount_received: 0, balance_due: 0, status: 'partial', error: 'Cloud non configuré' };
  }
  const { data, error } = await supabase.rpc('record_sale_payment', {
    p_sale_id: saleId, p_amount: amount, p_method: method, p_note: note, p_created_by: createdBy,
  });
  if (error) {
    return { ok: false, sale_id: '', amount_received: 0, balance_due: 0, status: 'partial', error: error.message };
  }
  return data as unknown as PaymentInstallmentResult;
}

// ---------- Stock movements ----------
export async function fetchStockMovements(limit = 200): Promise<StockMovement[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('stock_movements')
    .select('*, product:products(name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as StockMovement[];
}

// ---------- Stats (Boss) ----------
export async function fetchRevenue(): Promise<number> {
  if (!supabase) return 0;
  const { data, error } = await supabase
    .from('sales')
    .select('amount_received, status, cancelled_at')
    .neq('status', 'cancelled')
    .is('cancelled_at', null);
  if (error) return 0;
  return ((data as Array<{ amount_received: number; status: string; cancelled_at: string | null }>) ?? [])
    .reduce((s, r) => s + (r.amount_received ?? 0), 0);
}

export async function fetchTotalDebt(): Promise<number> {
  if (!supabase) return 0;
  const { data, error } = await supabase
    .from('sales')
    .select('balance_due')
    .eq('status', 'partial')
    .is('cancelled_at', null);
  if (error) return 0;
  return ((data as Array<{ balance_due: number }>) ?? []).reduce((s, r) => s + (r.balance_due ?? 0), 0);
}

export async function fetchLowStockCount(): Promise<number> {
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('is_archived', false)
    .not('stock_qty', 'is', null)
    .lte('stock_qty', 0);
  if (error) return 0;
  return count ?? 0;
}

// ---------- Employees ----------
export async function fetchEmployees(): Promise<Employee[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Employee[];
}

export async function createEmployee(input: { name: string; role: Employee['role']; phone?: string | null }): Promise<Employee | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('employees')
    .insert({ name: input.name, role: input.role, phone: input.phone ?? null, is_active: true, can_edit_catalog: false })
    .select('*')
    .single();
  if (error) throw error;
  return data as unknown as Employee;
}

export async function updateEmployee(id: string, patch: Partial<Pick<Employee, 'name' | 'role' | 'can_edit_catalog' | 'is_active' | 'phone'>>): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('employees').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteEmployee(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('employees').delete().eq('id', id);
  if (error) throw error;
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

export { type RegisterSaleInput, type Employee };
