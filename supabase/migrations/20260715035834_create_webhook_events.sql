-- webhook_events テーブル（冪等性処理用）
create table webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text unique not null,
  event_type text not null,
  processed_at timestamptz not null default now()
);

alter table webhook_events enable row level security;
-- クライアントからのアクセスは一切想定しない（service_role経由のみ）ため
-- SELECT/INSERT等のポリシーは作成しない（デフォルトで全拒否）
