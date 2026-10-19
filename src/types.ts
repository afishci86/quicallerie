export type CategoryColor =
  | 'orange' | 'blue' | 'yellow' | 'violet' | 'turquoise'
  | 'red' | 'slate' | 'cyan' | 'amber' | 'green';

export type UserRole = 'gerant' | 'employe';

export interface UserProfile {
  role: UserRole;
  name: string;
  canEditCatalog: boolean;
}

export interface ProductCategory {
  id: string;
  slug: string;
  name: string;
  color: CategoryColor;
  icon: string | null;
  sort_order: number;
}

export interface ProductSaleUnit {
  id: string;
  product_id: string;
  unit: string;
  price: number;
  factor_to_stock: number;
  is_default: boolean;
  allow_decimal: boolean;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  stock_unit: string;
  stock_qty: number | null;
  low_stock_threshold: number;
  is_active: boolean;
  is_archived: boolean;
  category?: ProductCategory | null;
  sale_units?: ProductSaleUnit[];
}

export interface CartLine {
  key: string;
  product: Product;
  unit: string;
  price: number;
  factorToStock: number;
  allowDecimal: boolean;
  quantity: number;
}

export interface SaleItem {
  id: string;
  product_id: string;
  product_name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  factor_to_stock: number;
  stock_decrement: number;
  restocked: boolean;
}

export type SaleStatus = 'paid' | 'partial' | 'cancelled';

export interface SalePayment {
  id: string;
  sale_id: string;
  amount: number;
  method: string;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Sale {
  id: string;
  reference: string;
  total: number;
  amount_received: number;
  balance_due: number;
  status: SaleStatus;
  customer_name: string | null;
  customer_phone: string | null;
  note: string | null;
  created_at: string;
  created_by: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancel_reason: string | null;
  sale_items?: SaleItem[];
  sale_payments?: SalePayment[];
}

export interface StockMovement {
  id: string;
  product_id: string;
  sale_id: string | null;
  reason: 'sale' | 'arrival' | 'cancellation' | 'adjustment';
  delta: number;
  unit: string;
  quantity: number;
  created_by: string | null;
  note: string | null;
  created_at: string;
  product?: { name: string } | null;
}

export interface StoreInfo {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  is_demo: boolean;
}

export interface RegisterSaleResult {
  ok: boolean;
  sale_id: string;
  reference: string;
  total: number;
  amount_received: number;
  balance_due: number;
  status: SaleStatus;
  replayed?: boolean;
  error?: string;
}

export interface ArrivalResult {
  ok: boolean;
  product_id: string;
  new_stock_qty: number;
  unit: string;
  error?: string;
}

export interface PaymentInstallmentResult {
  ok: boolean;
  sale_id: string;
  amount_received: number;
  balance_due: number;
  status: SaleStatus;
  error?: string;
}

export interface CancelSaleResult {
  ok: boolean;
  sale_id: string;
  reference: string;
  restocked_lines: number;
  error?: string;
}

export interface PendingOperation {
  id: string;
  type: 'sale' | 'arrival';
  payload: unknown;
  createdAt: number;
  attempts: number;
  lastError?: string;
}
