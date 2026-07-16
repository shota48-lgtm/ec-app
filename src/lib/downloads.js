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

export async function getCheckoutDownloads(sessionId) {
  return invokeOrThrow('get-checkout-downloads', { sessionId })
}

export async function getDownloadUrl(token) {
  const data = await invokeOrThrow('get-download-url', { token })
  return data.url
}

export async function renewDownload(token) {
  return invokeOrThrow('renew-download', { token })
}
