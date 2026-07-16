// renew-download
//
// 期限切れダウンロードの購入者セルフ再発行。
// /orders はログイン必須の画面のため、Authorizationヘッダーの
// ユーザーJWTで認証したうえで、対象downloadsが認証ユーザー自身の
// 注文(order_items -> orders.user_id)に紐づくものであることを
// 確認してからexpires_atを更新する(get-download-url/get-checkout-downloads
// とは異なり、この関数はログイン状態に依存する設計)。
//
// renewal_countが3以上の場合は再発行を拒否する。

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_RENEWALS = 3
const RENEWAL_PERIOD_MS = 30 * 24 * 60 * 60 * 1000

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

    const { token } = await req.json()

    if (!token) {
      return json({ error: 'tokenが必要です' }, 400)
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: download, error: downloadError } = await supabaseAdmin
      .from('downloads')
      .select('id, renewal_count, order_items(orders(user_id))')
      .eq('download_token', token)
      .maybeSingle()

    if (downloadError) {
      return json({ error: downloadError.message }, 500)
    }
    if (!download) {
      return json({ error: 'リンクが無効です' }, 404)
    }

    const ownerId = download.order_items?.orders?.user_id
    if (ownerId !== user.id) {
      return json({ error: 'この操作は許可されていません' }, 403)
    }

    if (download.renewal_count >= MAX_RENEWALS) {
      return json({ error: '再発行の上限に達しました。サポートにお問い合わせください' }, 403)
    }

    const newExpiresAt = new Date(Date.now() + RENEWAL_PERIOD_MS).toISOString()
    const newRenewalCount = download.renewal_count + 1

    const { error: updateError } = await supabaseAdmin
      .from('downloads')
      .update({ expires_at: newExpiresAt, renewal_count: newRenewalCount })
      .eq('id', download.id)

    if (updateError) {
      return json({ error: updateError.message }, 500)
    }

    return json({ expiresAt: newExpiresAt, renewalCount: newRenewalCount }, 200)
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'unexpected error' }, 500)
  }
})
