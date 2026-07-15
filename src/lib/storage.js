import { supabase } from './supabaseClient'

export async function uploadProductImage(file) {
  const ext = file.name.split('.').pop()
  const path = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from('product-images').upload(path, file)
  if (error) throw error

  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return data.publicUrl
}

// product-filesは非公開バケットのため、公開URLではなくバケット内パスを返す。
// 実際の署名URLはEdge Function(get-download-url)がservice_role経由で発行する
export async function uploadProductFile(file) {
  const ext = file.name.split('.').pop()
  const path = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from('product-files').upload(path, file)
  if (error) throw error

  return path
}
