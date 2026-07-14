-- profiles テーブル
create table profiles (
  id uuid references auth.users(id) primary key,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

-- RLS有効化
alter table profiles enable row level security;

-- 本人は自分のprofileを閲覧可能
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

-- 更新用ポリシーは意図的に作成しない
-- （更新はSupabase管理画面またはservice_role経由のみ許可）

-- 新規ユーザー登録時に自動でprofilesレコードを作成するトリガー
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'customer');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
