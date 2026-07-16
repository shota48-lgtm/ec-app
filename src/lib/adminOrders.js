import { supabase } from './supabaseClient'

async function invokeOrThrow(name, body) {
  const { data, error } = await supabase.functions.invoke(name, { body })
  if (error) {
    const errorBody =
      typeof error.context?.json === 'function' ? await error.context.json().catch(() => null) : null
    throw new Error(errorBody?.error ?? error.message)
  }
  return data
}

export async function listOrders() {
  const data = await invokeOrThrow('list-orders', {})
  return data.orders
}

export async function refundOrder(orderId) {
  const data = await invokeOrThrow('refund-order', { orderId })
  return data.order
}
