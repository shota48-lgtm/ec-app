import { supabase } from './supabaseClient'

export async function getMyOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, status, total_amount, created_at, order_items(id, quantity, price_at_purchase, products(name), downloads(download_token, expires_at, downloaded_at, renewal_count))',
    )
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
