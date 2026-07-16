-- downloads.renewal_count
-- 購入者セルフ再発行（期限切れダウンロードの有効期限延長）の回数を記録する。
-- renew-download Edge Functionが、この値が3以上の場合は再発行を拒否する。
alter table downloads add column renewal_count integer not null default 0;
