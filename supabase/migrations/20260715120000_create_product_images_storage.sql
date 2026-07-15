-- 商品画像用Storageバケット作成（公開バケット）
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- 管理者のみアップロード可能
create policy "Admins can upload product images"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- 管理者のみ更新可能
create policy "Admins can update product images"
  on storage.objects for update
  using (
    bucket_id = 'product-images'
    and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- 管理者のみ削除可能
create policy "Admins can delete product images"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
