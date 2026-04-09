-- ============================================================================
-- Tokoflow schema (rebuilt 2026-04-08 from code references)
-- Project: yhwjvdwmwboasehznlfv
--
-- This file is the single source of truth for the database. Apply with:
--   curl -s -X POST "https://api.supabase.com/v1/projects/yhwjvdwmwboasehznlfv/database/query" \
--     -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
--     -H "Content-Type: application/json" \
--     -d "{\"query\": $(jq -Rs . db/schema.sql)}"
--
-- Naming prefixes used by the app code:
--   tf_*  Tokoflow inventory/sales tables
--   kn_*  Membership/billing tables (legacy prefix from sibling product)
--   av_*  Profile table (legacy prefix from sibling product)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Extensions and text-search config
-- ---------------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists unaccent;

-- The products API does:
--   .textSearch('search_tsv', search, { config: 'public.simple_unaccent' })
-- so we need a TS config in the public schema that strips diacritics.
do $$
begin
  if not exists (select 1 from pg_ts_config where cfgname = 'simple_unaccent') then
    create text search configuration public.simple_unaccent (copy = pg_catalog.simple);
    alter text search configuration public.simple_unaccent
      alter mapping for hword, hword_part, word with unaccent, simple;
  end if;
end$$;

-- ---------------------------------------------------------------------------
-- av_profiles — user profile (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.av_profiles (
  id                       uuid primary key references auth.users(id) on delete cascade,
  email                    text,
  full_name                text,
  business_name            text,
  phone_number             text,
  institution_name         text,
  job_title                text,
  role                     text not null default 'staff'
                           check (role in ('owner','staff')),
  credits_balance          integer default 0,
  next_credits_expiry_date timestamptz,
  is_verified              boolean default false,
  subscription_plan        text,
  subscription_status      text,
  subscription_end_date    timestamptz,
  created_at               timestamptz default now(),
  updated_at               timestamptz default now()
);

-- Idempotent migration for installs predating RBAC
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='av_profiles' and column_name='role'
  ) then
    alter table public.av_profiles
      add column role text not null default 'staff'
      check (role in ('owner','staff'));
  end if;
end$$;

-- ---------------------------------------------------------------------------
-- tf_warehouses — physical / logical stock locations
--
-- Minimum viable multi-warehouse: each product belongs to ONE warehouse via
-- tf_products.warehouse_id. A merchant can model "cabang Jakarta" vs
-- "cabang Surabaya" with separate SKUs per cabang. True per-warehouse-stock-
-- per-product (one SKU, multiple stock counts) is a Tier 4 follow-up — it
-- requires a tf_product_inventory pivot table and rewriting every inventory
-- query in the codebase.
-- ---------------------------------------------------------------------------
create table if not exists public.tf_warehouses (
  id          bigserial primary key,
  name        text not null,
  address     text,
  is_default  boolean not null default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Ensure exactly one default warehouse exists at any time. The partial unique
-- index lets us upsert/flip the default cleanly.
create unique index if not exists tf_warehouses_one_default
  on public.tf_warehouses (is_default)
  where is_default = true;

-- Seed a default warehouse so existing products have somewhere to belong.
insert into public.tf_warehouses (name, is_default)
select 'Gudang Utama', true
where not exists (select 1 from public.tf_warehouses);

-- ---------------------------------------------------------------------------
-- tf_products — master product catalog
--
-- stock_status is a generated column so the inventory list/dashboard can
-- filter on it directly without N+1 column comparisons. Buckets:
--   negative → stock < 0           (oversold / data issue)
--   zero     → stock = 0           (out of stock)
--   low      → 0 < stock <= low_stock_threshold
--   normal   → stock > low_stock_threshold
-- ---------------------------------------------------------------------------
create table if not exists public.tf_products (
  id                    bigserial primary key,
  sku                   text unique not null,
  name                  text not null,
  stock                 integer default 0,            -- can go negative; allowed by design
  low_stock_threshold   integer not null default 10,
  warehouse_id          bigint references public.tf_warehouses(id) on delete set null,
  stock_status          text generated always as (
                          case
                            when stock < 0 then 'negative'
                            when stock = 0 then 'zero'
                            when stock <= low_stock_threshold then 'low'
                            else 'normal'
                          end
                        ) stored,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- Idempotent migration for existing installs that pre-date these columns.
do $$
declare
  default_wh_id bigint;
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='tf_products' and column_name='low_stock_threshold'
  ) then
    alter table public.tf_products
      add column low_stock_threshold integer not null default 10;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='tf_products' and column_name='stock_status'
  ) then
    alter table public.tf_products
      add column stock_status text generated always as (
        case
          when stock < 0 then 'negative'
          when stock = 0 then 'zero'
          when stock <= low_stock_threshold then 'low'
          else 'normal'
        end
      ) stored;
  end if;

  -- warehouse_id: add column, then backfill all existing products to the
  -- default warehouse so nothing has a NULL location.
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='tf_products' and column_name='warehouse_id'
  ) then
    alter table public.tf_products
      add column warehouse_id bigint references public.tf_warehouses(id) on delete set null;

    select id into default_wh_id from public.tf_warehouses where is_default = true limit 1;
    if default_wh_id is not null then
      update public.tf_products set warehouse_id = default_wh_id where warehouse_id is null;
    end if;
  end if;
end$$;

create index if not exists tf_products_updated_at_idx
  on public.tf_products (updated_at desc, id);
create index if not exists tf_products_stock_status_idx
  on public.tf_products (stock_status);
create index if not exists tf_products_warehouse_idx
  on public.tf_products (warehouse_id);

-- ---------------------------------------------------------------------------
-- tf_product_costs — modal/packing/affiliate per SKU
-- Cardinality is 1:1 with tf_products via sku (with FK + unique)
-- ---------------------------------------------------------------------------
create table if not exists public.tf_product_costs (
  id                    bigserial primary key,
  product_id            bigint references public.tf_products(id) on delete cascade,
  sku                   text unique not null
                        references public.tf_products(sku) on update cascade on delete cascade,
  modal_cost            numeric(14,2) default 0,
  packing_cost          numeric(14,2) default 0,
  affiliate_percentage  numeric(6,2)  default 0,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);
-- The composition API uses:
--   tf_products!tf_product_compositions_component_sku_fkey(...)
-- and the costs API uses:
--   tf_products!tf_product_costs_sku_fkey(...)
-- The unique index above provides the FK target; the constraint name is
-- generated automatically by Postgres and PostgREST infers the alias.

-- ---------------------------------------------------------------------------
-- tf_marketplace_fees — fee % per channel
-- ---------------------------------------------------------------------------
create table if not exists public.tf_marketplace_fees (
  id              bigserial primary key,
  channel         text unique not null,        -- normalized lowercase
  fee_percentage  numeric(6,2) default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- tf_marketplace_connections — per-channel OAuth connection state
--
-- Stores the credentials Tokoflow needs to call Shopee / Tokopedia / TikTok
-- Shop Open APIs on behalf of a merchant. The actual OAuth dance happens in
-- /api/marketplace/connect/[provider] (TODO: real implementation requires a
-- Shopee partner account + sandbox app id/secret in env).
--
-- One row per (channel, shop_id). last_sync_at + last_sync_status let the UI
-- show "synced 5 min ago" / "sync failed: token expired".
-- ---------------------------------------------------------------------------
create table if not exists public.tf_marketplace_connections (
  id                bigserial primary key,
  channel           text not null,                  -- 'shopee' | 'tokopedia' | 'tiktok-shop'
  shop_id           text,                           -- platform-side shop identifier
  shop_name         text,
  access_token      text,                           -- encrypted at rest by Supabase
  refresh_token     text,
  token_expires_at  timestamptz,
  scope             text,                           -- granted OAuth scopes
  last_sync_at      timestamptz,
  last_sync_status  text,                           -- 'idle' | 'running' | 'success' | 'failed'
  last_sync_error   text,
  is_active         boolean not null default true,
  created_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),
  unique (channel, shop_id)
);
create index if not exists tf_marketplace_connections_channel_idx
  on public.tf_marketplace_connections (channel);

-- ---------------------------------------------------------------------------
-- tf_alert_acks — per-user acknowledgement of stock alerts.
--
-- We don't store alerts as rows; alerts are derived live from
-- tf_products.stock_status (the generated column from Phase 4). This table
-- only records "user X already saw the alert for SKU Y at threshold version Z".
-- A row is upserted when the user clicks "acknowledge" in the bell dropdown.
--
-- The acked_status snapshots the status the user saw, so if a product flips
-- from 'low' → 'normal' → 'low' again the new state shows up unacknowledged.
-- ---------------------------------------------------------------------------
create table if not exists public.tf_alert_acks (
  user_id       uuid not null references auth.users(id) on delete cascade,
  sku           text not null,
  acked_status  text not null,        -- snapshot of stock_status at ack time
  acked_at      timestamptz default now(),
  primary key (user_id, sku)
);
create index if not exists tf_alert_acks_user_idx
  on public.tf_alert_acks (user_id);

-- ---------------------------------------------------------------------------
-- tf_customers — lightweight customer directory
-- Just enough to attribute sales for "who's our best customer" reports.
-- Lifetime stats are computed on read via JOIN to tf_sales_transactions —
-- no triggers, no denormalization. Cheap for UMKM-scale data.
-- ---------------------------------------------------------------------------
create table if not exists public.tf_customers (
  id          bigserial primary key,
  name        text not null,
  phone       text,
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index if not exists tf_customers_name_idx
  on public.tf_customers (lower(name));
create index if not exists tf_customers_phone_idx
  on public.tf_customers (phone);

-- ---------------------------------------------------------------------------
-- tf_sales_input — staging table for sales (pending → ok → processed)
-- ---------------------------------------------------------------------------
create table if not exists public.tf_sales_input (
  id                bigserial primary key,
  transaction_date  date not null,
  sku               text not null,
  product_name      text,
  selling_price     numeric(14,2) not null,
  quantity          integer,                   -- nullable; cleared after processing
  channel           text not null,
  customer_id       bigint references public.tf_customers(id) on delete set null,
  status            text default 'pending',    -- pending | ok | processed
  created_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz default now(),
  processed_at      timestamptz
);
create index if not exists tf_sales_input_status_idx
  on public.tf_sales_input (status, created_at desc);

-- Idempotent migration for installs predating customer attribution
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='tf_sales_input' and column_name='customer_id'
  ) then
    alter table public.tf_sales_input
      add column customer_id bigint references public.tf_customers(id) on delete set null;
  end if;
end$$;

-- ---------------------------------------------------------------------------
-- tf_sales_transactions — finalized sales with full financial breakdown
-- ---------------------------------------------------------------------------
create table if not exists public.tf_sales_transactions (
  id                bigserial primary key,
  transaction_date  date not null,
  sku               text not null,
  product_name      text,
  selling_price     numeric(14,2) not null,
  quantity          integer not null,
  channel           text not null,
  customer_id       bigint references public.tf_customers(id) on delete set null,
  modal_cost        numeric(14,2) default 0,
  packing_cost      numeric(14,2) default 0,
  affiliate_cost    numeric(14,2) default 0,
  marketplace_fee   numeric(14,2) default 0,
  revenue           numeric(14,2) default 0,
  net_profit        numeric(14,2) default 0,
  created_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz default now()
);
create index if not exists tf_sales_transactions_date_idx
  on public.tf_sales_transactions (transaction_date desc);
create index if not exists tf_sales_transactions_sku_idx
  on public.tf_sales_transactions (sku);
create index if not exists tf_sales_transactions_channel_idx
  on public.tf_sales_transactions (channel);

-- Idempotent migration for installs predating customer attribution.
-- Must run BEFORE the customer_id index creation below.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='tf_sales_transactions' and column_name='customer_id'
  ) then
    alter table public.tf_sales_transactions
      add column customer_id bigint references public.tf_customers(id) on delete set null;
  end if;
end$$;

create index if not exists tf_sales_transactions_customer_idx
  on public.tf_sales_transactions (customer_id);

-- ---------------------------------------------------------------------------
-- tf_incoming_goods_input — staging for incoming goods
-- ---------------------------------------------------------------------------
create table if not exists public.tf_incoming_goods_input (
  id                bigserial primary key,
  transaction_date  date not null,
  sku               text not null,
  product_name      text,
  quantity          integer,
  status            text default 'pending',
  created_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz default now(),
  processed_at      timestamptz
);
create index if not exists tf_incoming_goods_input_status_idx
  on public.tf_incoming_goods_input (status, created_at desc);

-- ---------------------------------------------------------------------------
-- tf_incoming_goods — finalized incoming goods
-- ---------------------------------------------------------------------------
create table if not exists public.tf_incoming_goods (
  id                bigserial primary key,
  transaction_date  date not null,
  sku               text not null,
  product_name      text,
  quantity          integer not null,
  created_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz default now()
);
create index if not exists tf_incoming_goods_date_idx
  on public.tf_incoming_goods (transaction_date desc);

-- ---------------------------------------------------------------------------
-- tf_stock_adjustments — manual stock corrections with audit trail
-- ---------------------------------------------------------------------------
create table if not exists public.tf_stock_adjustments (
  id               bigserial primary key,
  sku              text not null,
  quantity_change  integer not null,
  new_balance      integer not null,
  reason           text,
  notes            text,
  adjustment_date  timestamptz default now(),
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz default now()
);
create index if not exists tf_stock_adjustments_sku_idx
  on public.tf_stock_adjustments (sku, adjustment_date desc);

-- ---------------------------------------------------------------------------
-- tf_product_compositions — bundle/parent → component decomposition
-- ---------------------------------------------------------------------------
create table if not exists public.tf_product_compositions (
  id              bigserial primary key,
  parent_sku      text not null,
  component_sku   text not null
                  references public.tf_products(sku) on update cascade on delete cascade,
  quantity        integer not null,            -- units of component per 1 parent
  source_channel  text default 'semua',        -- 'semua' | <channel name>
  status          text default 'aktif',        -- 'aktif' | 'nonaktif'
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index if not exists tf_product_compositions_parent_idx
  on public.tf_product_compositions (parent_sku, status);

-- ---------------------------------------------------------------------------
-- v_products_with_costs — materialized view used by /api/products and the
-- products page. Includes a generated tsvector for full-text search.
-- ---------------------------------------------------------------------------
drop view if exists public.v_products_with_costs;
create view public.v_products_with_costs as
select
  p.id,
  p.sku,
  p.name,
  p.stock,
  p.low_stock_threshold,
  p.stock_status,
  p.warehouse_id,
  w.name                                        as warehouse_name,
  p.created_at,
  greatest(
    p.updated_at,
    coalesce(c.updated_at, p.updated_at)
  )                                             as updated_at,
  coalesce(c.modal_cost, 0)                     as modal_cost,
  coalesce(c.packing_cost, 0)                   as packing_cost,
  coalesce(c.affiliate_percentage, 0)           as affiliate_percentage,
  to_tsvector(
    'public.simple_unaccent',
    coalesce(p.sku, '') || ' ' || coalesce(p.name, '')
  )                                             as search_tsv
from public.tf_products p
left join public.tf_product_costs c on c.sku = p.sku
left join public.tf_warehouses w on w.id = p.warehouse_id;

-- ---------------------------------------------------------------------------
-- kn_membership_plans — subscription/credit plans (read by /plans, /checkout)
-- ---------------------------------------------------------------------------
create table if not exists public.kn_membership_plans (
  id              bigserial primary key,
  plan_code       text unique not null,
  name            text not null,
  description     text,
  price_idr       integer default 0,
  credits_amount  integer default 0,
  validity_days   integer default 30,
  features        jsonb default '[]'::jsonb,
  billing_period  text default 'monthly',      -- 'monthly' | 'annual' | 'addon'
  is_active       boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- kn_transactions — payment transaction log (used by /admin/transactions)
-- ---------------------------------------------------------------------------
create table if not exists public.kn_transactions (
  id            bigserial primary key,
  user_id       uuid references auth.users(id) on delete cascade,
  plan_code     text,
  order_id      text unique,
  amount        integer default 0,
  status        text default 'pending',         -- pending | success | failed | expired
  payment_type  text,
  raw_response  jsonb,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists kn_transactions_user_idx
  on public.kn_transactions (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.tf_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

do $$
declare t text;
begin
  for t in
    select unnest(array[
      'av_profiles',
      'tf_products',
      'tf_product_costs',
      'tf_marketplace_fees',
      'tf_product_compositions',
      'tf_customers',
      'tf_warehouses',
      'tf_marketplace_connections',
      'kn_membership_plans',
      'kn_transactions'
    ])
  loop
    execute format(
      'drop trigger if exists trg_touch_updated_at on public.%I; '
      'create trigger trg_touch_updated_at before update on public.%I '
      'for each row execute function public.tf_touch_updated_at();',
      t, t
    );
  end loop;
end$$;

-- ---------------------------------------------------------------------------
-- Auto-create av_profiles row when a new auth.users row is inserted.
-- The first user to sign up is auto-promoted to 'owner' so a fresh install
-- has someone with full access. All subsequent signups default to 'staff'.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  is_first boolean;
begin
  select not exists (select 1 from public.av_profiles) into is_first;

  insert into public.av_profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case when is_first then 'owner' else 'staff' end
  )
  on conflict (id) do nothing;
  return new;
end$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- For v0.1 we keep policies permissive: any authenticated user can read/write
-- the operational tables (multi-tenancy is a Tier 2 follow-up). Profile and
-- transaction tables are scoped to the owning user.
-- ---------------------------------------------------------------------------
alter table public.av_profiles            enable row level security;
alter table public.tf_products            enable row level security;
alter table public.tf_product_costs       enable row level security;
alter table public.tf_marketplace_fees    enable row level security;
alter table public.tf_sales_input         enable row level security;
alter table public.tf_sales_transactions  enable row level security;
alter table public.tf_incoming_goods_input enable row level security;
alter table public.tf_incoming_goods      enable row level security;
alter table public.tf_stock_adjustments   enable row level security;
alter table public.tf_product_compositions enable row level security;
alter table public.tf_customers           enable row level security;
alter table public.tf_warehouses          enable row level security;
alter table public.tf_marketplace_connections enable row level security;
alter table public.tf_alert_acks          enable row level security;
alter table public.kn_membership_plans    enable row level security;
alter table public.kn_transactions        enable row level security;

-- Helper to (re)create a policy idempotently. Postgres rules:
--   SELECT/DELETE → only USING
--   INSERT        → only WITH CHECK
--   UPDATE        → USING + WITH CHECK
do $$
declare
  tbl text;
  op  text;
  clause text;
begin
  -- operational tables: any authenticated user can do everything
  for tbl in select unnest(array[
    'tf_products','tf_product_costs','tf_marketplace_fees',
    'tf_sales_input','tf_sales_transactions',
    'tf_incoming_goods_input','tf_incoming_goods',
    'tf_stock_adjustments','tf_product_compositions',
    'tf_customers','tf_warehouses','tf_marketplace_connections'
  ])
  loop
    foreach op in array array['select','insert','update','delete'] loop
      execute format(
        'drop policy if exists "auth_%s_%s" on public.%I;',
        tbl, op, tbl
      );
      clause := case op
                  when 'select' then 'using (true)'
                  when 'delete' then 'using (true)'
                  when 'insert' then 'with check (true)'
                  when 'update' then 'using (true) with check (true)'
                end;
      execute format(
        'create policy "auth_%s_%s" on public.%I for %s to authenticated %s;',
        tbl, op, tbl, op, clause
      );
    end loop;
  end loop;

  -- av_profiles: user can only see/modify their own row
  execute 'drop policy if exists "profile_select_own" on public.av_profiles';
  execute 'create policy "profile_select_own" on public.av_profiles for select to authenticated using (auth.uid() = id)';
  execute 'drop policy if exists "profile_insert_own" on public.av_profiles';
  execute 'create policy "profile_insert_own" on public.av_profiles for insert to authenticated with check (auth.uid() = id)';
  execute 'drop policy if exists "profile_update_own" on public.av_profiles';
  execute 'create policy "profile_update_own" on public.av_profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id)';

  -- tf_alert_acks: per-user, only see/modify own acks
  execute 'drop policy if exists "alert_acks_select_own" on public.tf_alert_acks';
  execute 'create policy "alert_acks_select_own" on public.tf_alert_acks for select to authenticated using (auth.uid() = user_id)';
  execute 'drop policy if exists "alert_acks_insert_own" on public.tf_alert_acks';
  execute 'create policy "alert_acks_insert_own" on public.tf_alert_acks for insert to authenticated with check (auth.uid() = user_id)';
  execute 'drop policy if exists "alert_acks_update_own" on public.tf_alert_acks';
  execute 'create policy "alert_acks_update_own" on public.tf_alert_acks for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)';
  execute 'drop policy if exists "alert_acks_delete_own" on public.tf_alert_acks';
  execute 'create policy "alert_acks_delete_own" on public.tf_alert_acks for delete to authenticated using (auth.uid() = user_id)';

  -- kn_membership_plans: anyone authenticated can read
  execute 'drop policy if exists "plans_select_all" on public.kn_membership_plans';
  execute 'create policy "plans_select_all" on public.kn_membership_plans for select to authenticated using (true)';

  -- kn_transactions: user sees their own transactions
  execute 'drop policy if exists "tx_select_own" on public.kn_transactions';
  execute 'create policy "tx_select_own" on public.kn_transactions for select to authenticated using (auth.uid() = user_id)';
  execute 'drop policy if exists "tx_insert_own" on public.kn_transactions';
  execute 'create policy "tx_insert_own" on public.kn_transactions for insert to authenticated with check (auth.uid() = user_id)';
end$$;

-- ---------------------------------------------------------------------------
-- Grants (PostgREST needs these even with RLS)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.kn_membership_plans to anon;
grant usage, select on all sequences in schema public to authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;
