// refund-order
//
// 管理者用注文一覧(/admin/orders)の「返金する」ボタンから呼び出す。
// 処理の流れ:
// 1. Authorizationヘッダーのユーザーjwtで認証し、profiles.roleが
//    adminであることを確認する
// 2. 「statusがpaidの注文だけをrefundedに書き換える」条件付き更新を行う。
//    0件だった場合(既に返金済み等)はその場でエラーを返し停止する。
//    これによりボタンの二重押下や複数管理者による同時操作での
//    二重返金を防ぐ(同じ注文への2回目の更新は対象0件になる)
// 3. 条件付き更新が成功した場合のみStripe Refund APIを呼び出す。
//    Idempotency Key(order.id)を指定し、通信リトライ等で同一リクエストが
//    複数回送信されてもStripe側で1回分の処理に丸められるようにする
// 4. Stripe側が失敗した場合はDBのstatusをpaidへロールバックする
//    (お金が動いていないのにrefunded表示になる食い違いを避けるため)
// 5. Stripeの返金が成功したら、該当order_itemsに紐づくdownloadsの
//    expires_atを即時失効させる

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import Stripe from 'https://esm.sh/stripe@22.3.1?target=deno'

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

    const { orderId } = await req.json()
    if (!orderId) {
      return json({ error: 'orderIdが必要です' }, 400)
    }

    const { data: order, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ status: 'refunded', refunded_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('status', 'paid')
      .select()
      .maybeSingle()

    if (updateError) {
      return json({ error: updateError.message }, 500)
    }
    if (!order) {
      return json({ error: '対象の注文が見つからないか、既に返金済み・支払い未完了です' }, 409)
    }

    if (!order.stripe_payment_intent_id) {
      // ロールバック: 決済情報が無く返金できない
      await supabaseAdmin
        .from('orders')
        .update({ status: 'paid', refunded_at: null })
        .eq('id', order.id)
      return json({ error: '決済情報が見つからないため返金できません' }, 500)
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      httpClient: Stripe.createFetchHttpClient(),
    })

    try {
      await stripe.refunds.create(
        { payment_intent: order.stripe_payment_intent_id },
        { idempotencyKey: `refund-order-${order.id}` },
      )
    } catch (stripeErr) {
      // ロールバック: Stripe側が失敗したのにDB上だけ返金済みになるのを防ぐ
      await supabaseAdmin
        .from('orders')
        .update({ status: 'paid', refunded_at: null })
        .eq('id', order.id)
      const message = stripeErr instanceof Error ? stripeErr.message : 'Stripe refund failed'
      return json({ error: `Stripeでの返金処理に失敗しました: ${message}` }, 500)
    }

    const { data: orderItems, error: orderItemsError } = await supabaseAdmin
      .from('order_items')
      .select('id')
      .eq('order_id', order.id)

    if (orderItemsError) {
      console.error('order_items fetch error:', orderItemsError.message)
    } else {
      const itemIds = orderItems.map((item: { id: string }) => item.id)
      const { error: expireError } = await supabaseAdmin
        .from('downloads')
        .update({ expires_at: new Date().toISOString() })
        .in('order_item_id', itemIds)

      if (expireError) {
        console.error('downloads expire error:', expireError.message)
      }
    }

    return json({ order }, 200)
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'unexpected error' }, 500)
  }
})
