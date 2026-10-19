export type CategoryColor =
  | 'orange' | 'blue' | 'yellow' | 'violet' | 'turquoise'
  | 'red' | 'slate' | 'cyan' | 'amber' | 'green';

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
}

export interface Sale {
  id: string;
  reference: string;
  total: number;
  amount_received: number;
  balance_due: number;
  status: 'paid' | 'partial';
  customer_name: string | null;
  customer_phone: string | null;
  note: string | null;
  created_at: string;
  sale_items?: SaleItem[];
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
  status: 'paid' | 'partial';
  replayed?: boolean;
  error?: string;
}
