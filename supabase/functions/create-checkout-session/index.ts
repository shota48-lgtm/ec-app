// create-checkout-session
//
// フロントエンド(CartPage)から { items: [{ productId, quantity }] } を受け取り、
// 1. Supabaseから商品の現在価格を取得し直す(フロントエンドの価格は信用しない)
// 2. orders / order_items を status='pending' で作成
// 3. Stripe Checkout Session を作成し、そのURLを返す
//
// 環境変数:
// - SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY は
//   Supabase Edge Functionsに自動的に注入されるため、追加設定は不要
// - STRIPE_SECRET_KEY は自動注入されないため、
//   `npx supabase secrets set STRIPE_SECRET_KEY=...` で
//   Supabase側にも別途secretとして設定する必要がある(.envの値とは別管理)

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

    // ユーザー認証確認用(anonキー + ユーザーのJWT)
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

    const { items } = await req.json()

    if (!Array.isArray(items) || items.length === 0) {
      return json({ error: 'カートが空です' }, 400)
    }

    for (const item of items) {
      if (!item.productId || !Number.isInteger(item.quantity) || item.quantity <= 0) {
        return json({ error: 'カートの内容が不正です' }, 400)
      }
    }

    // DB書き込み・商品価格の取得し直し用(service role、RLSをバイパス)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const productIds = items.map((item: { productId: string }) => item.productId)

    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('*')
      .in('id', productIds)

    if (productsError) {
      return json({ error: productsError.message }, 500)
    }

    const productMap = new Map(products.map((p: { id: string }) => [p.id, p]))

    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) {
        return json({ error: `商品が見つかりません: ${item.productId}` }, 400)
      }
      if (!product.is_active) {
        return json({ error: `購入できない商品が含まれています: ${product.name}` }, 400)
      }
    }

    const totalAmount = items.reduce((sum: number, item: { productId: string; quantity: number }) => {
      const product = productMap.get(item.productId)
      return sum + product.price * item.quantity
    }, 0)

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: user.id,
        status: 'pending',
        total_amount: totalAmount,
      })
      .select()
      .single()

    if (orderError) {
      return json({ error: orderError.message }, 500)
    }

    const orderItems = items.map((item: { productId: string; quantity: number }) => {
      const product = productMap.get(item.productId)
      return {
        order_id: order.id,
        product_id: product.id,
        quantity: item.quantity,
        price_at_purchase: product.price,
      }
    })

    const { error: orderItemsError } = await supabaseAdmin.from('order_items').insert(orderItems)

    if (orderItemsError) {
      return json({ error: orderItemsError.message }, 500)
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      httpClient: Stripe.createFetchHttpClient(),
    })

    const origin = req.headers.get('origin') ?? ''

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: items.map((item: { productId: string; quantity: number }) => {
        const product = productMap.get(item.productId)
        return {
          price_data: {
            currency: 'jpy',
            product_data: { name: product.name },
            unit_amount: product.price,
          },
          quantity: item.quantity,
        }
      }),
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
    })

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id)

    if (updateError) {
      return json({ error: updateError.message }, 500)
    }

    return json({ url: session.url }, 200)
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'unexpected error' }, 500)
  }
})
