import { supabase } from './supabaseClient'

export async function getUserRole(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data.role
}

export async function isAdmin(userId) {
  const role = await getUserRole(userId)
  return role === 'admin'
}
