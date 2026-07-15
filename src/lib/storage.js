import { supabase } from './supabaseClient'

export async function uploadProductImage(file) {
  const ext = file.name.split('.').pop()
  const path = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from('product-images').upload(path, file)
  if (error) throw error

  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return data.publicUrl
}
