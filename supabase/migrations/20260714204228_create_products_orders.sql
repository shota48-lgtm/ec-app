-- products テーブル
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price integer not null check (price >= 0),
  file_path text,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- orders テーブル
create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'cancelled', 'refunded')),
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  total_amount integer not null check (total_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- order_items テーブル
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) not null,
  product_id uuid references products(id) not null,
  quantity integer not null check (quantity > 0),
  price_at_purchase integer not null check (price_at_purchase >= 0),
  created_at timestamptz not null default now()
);

-- downloads テーブル
create table downloads (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid references order_items(id) not null,
  download_token text unique not null default gen_random_uuid()::text,
  expires_at timestamptz not null,
  downloaded_at timestamptz,
  created_at timestamptz not null default now()
);

-- RLS有効化
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table downloads enable row level security;

-- products: 公開商品は誰でも閲覧可（is_active=trueのみ）
create policy "Anyone can view active products"
  on products for select
  using (is_active = true);

-- products: 管理者は全件閲覧・操作可
create policy "Admins can view all products"
  on products for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can insert products"
  on products for insert
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update products"
  on products for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can delete products"
  on products for delete
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- orders: 本人のみ閲覧可
create policy "Users can view own orders"
  on orders for select
  using (auth.uid() = user_id);

-- orders: 管理者は全件閲覧・更新可
create policy "Admins can view all orders"
  on orders for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update orders"
  on orders for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- order_items: 本人の注文に紐づくもののみ閲覧可
create policy "Users can view own order items"
  on order_items for select
  using (exists (
    select 1 from orders
    where orders.id = order_items.order_id
    and orders.user_id = auth.uid()
  ));

create policy "Admins can view all order items"
  on order_items for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- downloads: 本人の注文に紐づくもののみ閲覧可
create policy "Users can view own downloads"
  on downloads for select
  using (exists (
    select 1 from order_items
    join orders on orders.id = order_items.order_id
    where order_items.id = downloads.order_item_id
    and orders.user_id = auth.uid()
  ));

create policy "Admins can view all downloads"
  on downloads for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- 注: insert/update/deleteの多くはservice_role（サーバー側/Webhook経由）で
-- 行う想定のため、クライアント向けのINSERT/UPDATEポリシーは意図的に絞っている
