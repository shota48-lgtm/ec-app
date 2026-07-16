-- orders.refunded_at
-- 返金が確定した日時を記録する（statusは既存の'refunded'値をそのまま使う。
-- 制約 check (status in ('pending', 'paid', 'cancelled', 'refunded')) は
-- D-011の時点で既に'refunded'を許容しているため、status側の変更は不要）。
alter table orders add column refunded_at timestamptz;
