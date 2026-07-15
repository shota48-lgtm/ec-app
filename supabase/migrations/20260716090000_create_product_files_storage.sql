-- 商品ファイル本体用Storageバケット作成（非公開バケット）
insert into storage.buckets (id, name, public)
values ('product-files', 'product-files', false)
on conflict (id) do nothing;

-- 管理者のみアップロード可能
create policy "Admins can upload product files"
  on storage.objects for insert
  with check (
    bucket_id = 'product-files'
    and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- 管理者のみ更新可能
create policy "Admins can update product files"
  on storage.objects for update
  using (
    bucket_id = 'product-files'
    and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- 管理者のみ削除可能
create policy "Admins can delete product files"
  on storage.objects for delete
  using (
    bucket_id = 'product-files'
    and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- 注: selectポリシーは意図的に付与しない。非公開バケットのため、
-- 署名URL発行(storage.createSignedUrl)はEdge Functionのservice_role経由
-- (RLSをバイパス)でのみ行う。クライアントに直接read権限を与えない。
