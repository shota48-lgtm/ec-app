import { supabase } from './supabaseClient'

export async function createCheckoutSession(cartItems) {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: {
      items: cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    },
  })

  if (error) {
    const body = await error.context?.json().catch(() => null)
    throw new Error(body?.error ?? error.message)
  }

  if (!data?.url) {
    throw new Error('Checkout URLの取得に失敗しました')
  }

  window.location.href = data.url
}
