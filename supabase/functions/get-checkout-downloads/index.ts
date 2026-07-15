// get-checkout-downloads
//
// /checkout/success 画面から、Stripe Checkout Sessionのsession_idを渡して
// 呼び出す。該当orderに紐づくダウンロードリンク一覧(商品名・download_token・
// 有効期限)を返す。
//
// ログイン状態には依存しない設計(D-006関連の設計方針より):
// checkout自体はログイン必須だが、Stripeの決済画面を経由して戻ってきた
// 時点でブラウザのセッションが必ず生きている保証はできないため、
// session_id(推測困難な値)を知っていることを根拠にservice_role経由で
// 参照する。stripe-webhookの処理が非同期のため、まだdownloadsが
// 生成されていない(status=pendingのまま)場合はprocessing:trueを返し、
// フロント側でのポーリングを促す。

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
    const { sessionId } = await req.json()

    if (!sessionId) {
      return json({ error: 'sessionIdが必要です' }, 400)
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, status')
      .eq('stripe_session_id', sessionId)
      .maybeSingle()

    if (orderError) {
      return json({ error: orderError.message }, 500)
    }
    if (!order) {
      return json({ error: '注文が見つかりません' }, 404)
    }
    if (order.status !== 'paid') {
      return json({ processing: true, downloads: [] }, 200)
    }

    const { data: items, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select('id, products(name), downloads(download_token, expires_at, downloaded_at)')
      .eq('order_id', order.id)

    if (itemsError) {
      return json({ error: itemsError.message }, 500)
    }

    const downloads = items.flatMap((item) =>
      (item.downloads ?? []).map((download) => ({
        productName: item.products?.name ?? '',
        downloadToken: download.download_token,
        expiresAt: download.expires_at,
        downloadedAt: download.downloaded_at,
      })),
    )

    if (downloads.length === 0) {
      return json({ processing: true, downloads: [] }, 200)
    }

    return json({ processing: false, downloads }, 200)
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'unexpected error' }, 500)
  }
})
