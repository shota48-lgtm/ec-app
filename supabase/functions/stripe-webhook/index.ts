// stripe-webhook
//
// Stripeからの checkout.session.completed イベントを受信し、
// 1. stripe-signature ヘッダーで署名検証(不正リクエストは400で拒否)
// 2. webhook_eventsテーブルへのinsertでevent idの重複を検出し、
//    重複時(unique制約違反)は200を返して早期リターン(Stripe側の再送を止めるため)
// 3. 該当order(stripe_session_id一致)のstatusを'pending'から'paid'に更新
//
// 環境変数:
// - SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY は
//   Supabase Edge Functionsに自動的に注入されるため、追加設定は不要
// - STRIPE_SECRET_KEY は既にsecret設定済み(create-checkout-sessionと共用)
// - STRIPE_WEBHOOK_SECRET は今回新たに参照する。Stripe Webhook設定時に
//   発行される値のため、このCANONの時点ではまだ値を持っていない。
//   `npx supabase secrets set STRIPE_WEBHOOK_SECRET=...` で
//   Supabase側に別途secretとして設定する必要がある(.envの値とは別管理)
//
// 注: このFunctionはStripeサーバーから直接呼ばれるため、Supabaseの
// JWT検証を無効化する必要がある(supabase/config.tomlでverify_jwt=falseを設定)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import Stripe from 'https://esm.sh/stripe@22.3.1?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  httpClient: Stripe.createFetchHttpClient(),
})

// DenoランタイムにはNode版cryptoが無いため、SubtleCrypto経由の
// CryptoProviderを使って署名検証を行う(Stripe公式のDeno向け実装方式)
const cryptoProvider = Stripe.createSubtleCryptoProvider()

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  if (!signature) {
    return json({ error: 'stripe-signature header missing' }, 400)
  }

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '',
      undefined,
      cryptoProvider,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'signature verification failed'
    return json({ error: `signature verification failed: ${message}` }, 400)
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  // 冪等性処理: 同じevent idを二重に処理しない
  const { error: insertError } = await supabaseAdmin.from('webhook_events').insert({
    stripe_event_id: event.id,
    event_type: event.type,
  })

  if (insertError) {
    if (insertError.code === '23505') {
      // unique制約違反 = 処理済みのイベント。200を返しStripeの再送を止める
      return json({ received: true, duplicate: true }, 200)
    }
    console.error('webhook_events insert error:', insertError.message)
    return json({ error: insertError.message }, 500)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as { id: string }

    const { data: order, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ status: 'paid' })
      .eq('stripe_session_id', session.id)
      .select()
      .maybeSingle()

    if (updateError) {
      console.error('order update error:', updateError.message)
    } else if (!order) {
      console.error(`order not found for stripe_session_id: ${session.id}`)
    }
  }

  return json({ received: true }, 200)
})
