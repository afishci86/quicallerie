/*
# Correction critique + simplification Gros/Détail + table employés

## 1. CORRECTION BUG register_sale
La fonction register_sale créée en étape 3 avait un INSERT dans `sales`
avec 12 colonnes cibles mais seulement 11 valeurs (la colonne `reference`
était absente des VALUES). Cela provoquait l'erreur PostgreSQL:
"INSERT has more target columns than expressions".
Correction: on DROP + CREATE la fonction avec le bon nombre de valeurs.

## 2. Simplification des unités de vente: GROS + DÉTAIL
L'application n'utilise plus que deux prix par produit: prix Gros et prix Détail.
Pour chaque produit existant, on garantit l'existence de deux sale_units:
- unit='detail' (prix repris du prix par défaut existant, factor_to_stock=1)
- unit='gros'   (prix 0 = à configurer par le boss, factor_to_stock=1)
Si un produit a déjà une unité 'detail' ou 'gros', on ne touche pas.

## 3. Nouvelle table: employees
Stocke les employés de la quincaillerie (single-tenant, pas d'auth Supabase
dans cette étape). Champs:
- id (uuid pk)
- name (text) — nom affiché
- role (text) — 'gerant' | 'employe'
- can_edit_catalog (boolean) — toggle "Autoriser modification produits/prix"
- is_active (boolean) — désactivation à distance
- phone (text) — téléphone pour invitation WhatsApp
- created_at (timestamptz)
RLS activée, politiques anon/authenticated (données partagées single-tenant).

## 4. Sécurité
- RLS sur employees, politiques CRUD anon/authenticated.
- register_sale recréée SECURITY DEFINER, grant execute à anon/authenticated.
- Aucune donnée détruite. Toutes les opérations sont additives ou correctives.
*/

-- ============ 1. CORRECTION register_sale ===============================
drop function if exists register_sale(uuid, text, jsonb, numeric, text, text, text, text);

create or replace function register_sale(
  p_store_id        uuid default null,
  p_idempotency_key text default null,
  p_items           jsonb default null,
  p_amount_received numeric default null,
  p_customer_name   text default null,
  p_customer_phone  text default null,
  p_note            text default null,
  p_created_by      text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale_id        uuid;
  v_reference      text;
  v_total          numeric(14,2) := 0;
  v_received       numeric(14,2);
  v_balance        numeric(14,2);
  v_status         text;
  v_item           jsonb;
  v_prod           products%rowtype;
  v_psu            product_sale_units%rowtype;
  v_line_total     numeric(14,2);
  v_stock_dec      numeric(14,3);
  v_existing       sales%rowtype;
  v_date_part      text;
  v_seq            int;
  v_count_items    int := 0;
begin
  if p_idempotency_key is not null then
    select * into v_existing from sales where idempotency_key = p_idempotency_key limit 1;
    if found then
      return jsonb_build_object(
        'ok', true, 'sale_id', v_existing.id, 'reference', v_existing.reference,
        'total', v_existing.total, 'amount_received', v_existing.amount_received,
        'balance_due', v_existing.balance_due, 'status', v_existing.status, 'replayed', true
      );
    end if;
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Panier vide';
  end if;

  v_date_part := to_char(now(), 'YYYYMMDD');
  select count(*) + 1 into v_seq from sales where reference like 'V-' || v_date_part || '-%';
  v_reference := 'V-' || v_date_part || '-' || lpad(v_seq::text, 5, '0');
  v_sale_id := gen_random_uuid();

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_count_items := v_count_items + 1;
    select * into v_prod from products where id = (v_item->>'product_id')::uuid;
    if not found then raise exception 'Produit introuvable'; end if;
    if v_prod.is_archived then raise exception 'Produit archivé: %', v_prod.name; end if;

    select * into v_psu from product_sale_units
      where product_id = v_prod.id and unit = v_item->>'unit';
    if not found then raise exception 'Prix non configuré pour %', v_prod.name; end if;

    if (v_item->>'unit_price')::numeric <> v_psu.price then
      raise exception 'Prix incohérent pour %', v_prod.name;
    end if;
    if (v_item->>'quantity')::numeric <= 0 then
      raise exception 'Quantité invalide pour %', v_prod.name;
    end if;

    v_line_total := round(v_psu.price * (v_item->>'quantity')::numeric, 2);
    v_total := v_total + v_line_total;
  end loop;

  if v_count_items = 0 then raise exception 'Panier vide'; end if;

  v_received := coalesce(p_amount_received, v_total);
  if v_received < 0 then raise exception 'Montant reçu invalide'; end if;
  v_balance := v_total - v_received;
  if v_balance > 0 then v_status := 'partial';
  else v_status := 'paid'; v_balance := 0; v_received := v_total; end if;

  -- INSERT CORRIGÉ: 12 colonnes, 12 valeurs (v_reference ajouté)
  insert into sales (id, store_id, reference, idempotency_key, total, amount_received, balance_due, status, customer_name, customer_phone, note, created_by)
  values (v_sale_id, p_store_id, v_reference, p_idempotency_key, v_total, v_received, v_balance, v_status, p_customer_name, p_customer_phone, p_note, p_created_by);

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_prod from products where id = (v_item->>'product_id')::uuid;
    select * into v_psu  from product_sale_units where product_id = v_prod.id and unit = v_item->>'unit';

    v_line_total := round(v_psu.price * (v_item->>'quantity')::numeric, 2);
    v_stock_dec  := round(v_psu.factor_to_stock * (v_item->>'quantity')::numeric, 3);

    if v_prod.stock_qty is not null then
      if v_prod.stock_qty - v_stock_dec < 0 then
        raise exception 'Stock insuffisant pour %', v_prod.name;
      end if;
      update products set stock_qty = round(stock_qty - v_stock_dec, 3), updated_at = now()
        where id = v_prod.id;
    end if;

    insert into sale_items (sale_id, product_id, product_name, unit, quantity, unit_price, line_total, factor_to_stock, stock_decrement)
    values (v_sale_id, v_prod.id, v_prod.name, v_psu.unit, (v_item->>'quantity')::numeric, v_psu.price, v_line_total, v_psu.factor_to_stock, v_stock_dec);

    insert into stock_movements (product_id, sale_id, reason, delta, unit, quantity, created_by)
    values (v_prod.id, v_sale_id, 'sale', -v_stock_dec, v_psu.unit, (v_item->>'quantity')::numeric, p_created_by);
  end loop;

  insert into payments (sale_id, method, amount) values (v_sale_id, 'espèces', v_received);

  return jsonb_build_object(
    'ok', true, 'sale_id', v_sale_id, 'reference', v_reference,
    'total', v_total, 'amount_received', v_received,
    'balance_due', v_balance, 'status', v_status, 'replayed', false
  );
end;
$$;

grant execute on function register_sale(uuid, text, jsonb, numeric, text, text, text, text) to anon, authenticated;

-- ============ 2. Simplification unités: gros + detail ===================
-- Pour chaque produit: garantir l'existence d'une unité 'detail' (prix repris
-- du défaut actuel) et d'une unité 'gros' (prix 0 = à configurer).

-- Renommer l'unité par défaut existante en 'detail' si pas déjà fait.
-- On ne touche que les produits qui n'ont pas encore d'unité 'detail'.
update product_sale_units psu
  set unit = 'detail', is_default = true
  from products p
  where psu.product_id = p.id
    and psu.is_default = true
    and psu.unit <> 'detail'
    and not exists (
      select 1 from product_sale_units psu2
      where psu2.product_id = p.id and psu2.unit = 'detail'
    );

-- Pour les produits dont l'unité par défaut portait déjà le nom 'detail',
-- s'assurer qu'elle est is_default=true.
update product_sale_units set is_default = true
  where unit = 'detail'
    and not exists (
      select 1 from product_sale_units psu2
      where psu2.product_id = product_sale_units.product_id
        and psu2.is_default = true and psu2.id <> product_sale_units.id
    );

-- Insérer une unité 'gros' (prix 0) pour chaque produit qui n'en a pas.
insert into product_sale_units (product_id, unit, price, factor_to_stock, is_default, allow_decimal)
select p.id, 'gros', 0, 1, false, false
from products p
where not exists (
  select 1 from product_sale_units psu
  where psu.product_id = p.id and psu.unit = 'gros'
);

-- Si un produit n'a toujours pas d'unité 'detail' (cas extrême), en créer une.
insert into product_sale_units (product_id, unit, price, factor_to_stock, is_default, allow_decimal)
select p.id, 'detail', 0, 1, true, false
from products p
where not exists (
  select 1 from product_sale_units psu
  where psu.product_id = p.id and psu.unit = 'detail'
);

-- ============ 3. Table employees ========================================

create table if not exists employees (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  role             text not null default 'employe',
  can_edit_catalog boolean not null default false,
  is_active        boolean not null default true,
  phone            text,
  created_at       timestamptz not null default now()
);
create index if not exists employees_active_idx on employees(is_active);

alter table employees enable row level security;

drop policy if exists "emp_sel" on employees;
create policy "emp_sel" on employees for select to anon, authenticated using (true);
drop policy if exists "emp_ins" on employees;
create policy "emp_ins" on employees for insert to anon, authenticated with check (true);
drop policy if exists "emp_upd" on employees;
create policy "emp_upd" on employees for update to anon, authenticated using (true) with check (true);
drop policy if exists "emp_del" on employees;
create policy "emp_del" on employees for delete to anon, authenticated using (true);
