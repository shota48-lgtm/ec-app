// list-orders
//
// 管理者用注文一覧(/admin/orders)から呼び出す。全注文(status問わず)を
// 新しい順に、購入商品・購入者のメールアドレスと合わせて返す。
//
// 購入者のメールアドレスはauth.usersにあり、profilesにも複製していない
// ため、クライアントから直接RLS経由で取得することはできない。
// このFunctionがservice_role経由でauth.admin.listUsers()を呼び、
// user_idからメールアドレスを引き当てる。
//
// 呼び出しにはprofiles.role=adminであることが必要(refund-order Functionと
// 同じ管理者チェックのパターン)。

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'ログインが必要です' }, 401)
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser()

    if (userError || !user) {
      return json({ error: 'ログインが必要です' }, 401)
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      return json({ error: profileError.message }, 500)
    }
    if (!profile || profile.role !== 'admin') {
      return json({ error: 'この操作には管理者権限が必要です' }, 403)
    }

    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select(
        'id, user_id, status, total_amount, created_at, refunded_at, order_items(id, quantity, price_at_purchase, products(name))',
      )
      .order('created_at', { ascending: false })

    if (ordersError) {
      return json({ error: ordersError.message }, 500)
    }

    const {
      data: { users },
      error: listUsersError,
    } = await supabaseAdmin.auth.admin.listUsers()

    if (listUsersError) {
      return json({ error: listUsersError.message }, 500)
    }

    const emailByUserId = new Map(users.map((u: { id: string; email?: string }) => [u.id, u.email ?? '']))

    const result = orders.map((order: { user_id: string }) => ({
      ...order,
      userEmail: emailByUserId.get(order.user_id) ?? '',
    }))

    return json({ orders: result }, 200)
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'unexpected error' }, 500)
  }
})
