-- ============================================
-- CanteenX – Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================

-- 1. Profiles (standalone — no auth.users dependency for custom JWT auth)
create table if not exists profiles (
  id uuid default gen_random_uuid() primary key,
  name text not null default '',
  email text not null default '',
  phone text default '',
  role text default 'student' check (role in ('student', 'admin', 'staff')),
  student_id text default '',
  avatar_url text default '',
  wallet_balance numeric(10,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- If upgrading from Supabase Auth → custom JWT, drop the old FK:
alter table profiles drop constraint if exists profiles_id_fkey;

-- Auto-create profile when a new user signs up (supports email OR phone)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, phone, name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.phone, ''),
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Categories
create table if not exists categories (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  icon text default 'restaurant',
  color text default '#f97415',
  image_url text default '',
  sort_order int default 0,
  is_active boolean default true,
  item_count int default 0,
  created_at timestamptz default now()
);

-- 3. Menu Items
create table if not exists menu_items (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text default '',
  price numeric(10,2) not null,
  category_id uuid references categories(id),
  category_name text default '',
  image_url text default '',
  available boolean default true,
  stock_qty int default 100,
  min_stock_qty int default 10,
  prep_time int default 10,
  calories int default 0,
  rating numeric(3,2) default 4.0,
  rating_count int default 0,
  is_veg boolean default true,
  is_popular boolean default false,
  is_todays_special boolean default false,
  special_label text default '',
  addons jsonb default '[]'::jsonb,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Orders
create table if not exists orders (
  id uuid default gen_random_uuid() primary key,
  order_number text unique,
  token_number int,
  user_id uuid references profiles(id),
  customer_name text default 'Student',
  subtotal numeric(10,2) not null,
  tax numeric(10,2) default 0,
  delivery_fee numeric(10,2) default 0,
  discount numeric(10,2) default 0,
  total numeric(10,2) not null,
  status text default 'placed' check (status in ('placed','confirmed','preparing','ready','collected','cancelled')),
  status_history jsonb default '[]'::jsonb,
  payment_method text default 'wallet' check (payment_method in ('wallet','card','upi','cash')),
  payment_status text default 'paid' check (payment_status in ('pending','paid','refunded')),
  pickup_time text default '',
  order_type text default 'takeaway' check (order_type in ('dine-in','takeaway')),
  estimated_ready_time timestamptz,
  special_instructions text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-generate order number
create or replace function generate_order_number()
returns trigger as $$
declare
  count_orders int;
begin
  select count(*) into count_orders from orders;
  new.order_number := 'ORD-' || lpad((count_orders + 1001)::text, 4, '0');
  new.token_number := (count_orders % 99) + 1;
  if new.status_history is null or new.status_history = '[]'::jsonb then
    new.status_history := jsonb_build_array(
      jsonb_build_object('status', 'placed', 'timestamp', now()::text, 'note', 'Order placed')
    );
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists before_order_insert on orders;
create trigger before_order_insert
  before insert on orders
  for each row execute function generate_order_number();

-- 5. Order Items
create table if not exists order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id),
  name text not null,
  price numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  addons jsonb default '[]'::jsonb,
  special_instructions text default ''
);

-- 6. Inventory Alerts
create table if not exists inventory_alerts (
  id uuid default gen_random_uuid() primary key,
  menu_item_id uuid references menu_items(id),
  item_name text not null,
  current_stock int not null,
  min_stock int not null,
  severity text default 'low' check (severity in ('low','critical','out')),
  resolved boolean default false,
  resolved_at timestamptz,
  created_at timestamptz default now()
);

-- 7. OTP Codes (custom phone OTP — no paid SMS provider needed)
create table if not exists otp_codes (
  id uuid default gen_random_uuid() primary key,
  phone text not null,
  code text not null,
  expires_at timestamptz not null,
  verified boolean default false,
  created_at timestamptz default now()
);

-- ============================================
--  RLS: Disabled for demo (anon key full access)
-- ============================================
alter table profiles disable row level security;
alter table categories disable row level security;
alter table menu_items disable row level security;
alter table orders disable row level security;
alter table order_items disable row level security;
alter table inventory_alerts disable row level security;
alter table otp_codes disable row level security;

-- ============================================
--  Indexes
-- ============================================
create index if not exists idx_menu_items_category on menu_items(category_id);
create index if not exists idx_menu_items_available on menu_items(available);
create index if not exists idx_orders_status on orders(status, created_at desc);
create index if not exists idx_orders_user on orders(user_id, created_at desc);
create index if not exists idx_order_items_order on order_items(order_id);
create index if not exists idx_inventory_alerts_unresolved on inventory_alerts(resolved, severity);
create index if not exists idx_otp_phone on otp_codes(phone);
create index if not exists idx_otp_expires on otp_codes(expires_at);
