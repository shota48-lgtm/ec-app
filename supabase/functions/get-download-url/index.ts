// get-download-url
//
// download_tokenを受け取り、有効期限内であればproduct-filesバケットの
// 該当ファイルに対して短時間(60秒)の署名URLを都度発行して返す。
//
// download_token自体がdownloadsテーブルの権利(エンタイトルメント、
// 有効期限30日)を表し、ここで発行する署名URLはその都度使い捨ての
// 実ファイル転送用URL(60秒)という2段構成。ログイン状態には依存しない
// (get-checkout-downloadsと同じ設計方針)。
//
// 初回アクセス時にdownloads.downloaded_atを記録する。

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
      .select('id, expires_at, downloaded_at, order_items(products(file_path, name))')
      .eq('download_token', token)
      .maybeSingle()

    if (downloadError) {
      return json({ error: downloadError.message }, 500)
    }
    if (!download) {
      return json({ error: 'リンクが無効です' }, 404)
    }
    if (new Date(download.expires_at).getTime() < Date.now()) {
      return json({ error: 'ダウンロード期限が切れています' }, 403)
    }

    const filePath = download.order_items?.products?.file_path
    if (!filePath) {
      return json({ error: '商品ファイルが登録されていません' }, 404)
    }

    const { data: signed, error: signError } = await supabaseAdmin.storage
      .from('product-files')
      .createSignedUrl(filePath, 60)

    if (signError) {
      return json({ error: signError.message }, 500)
    }

    if (!download.downloaded_at) {
      await supabaseAdmin.from('downloads').update({ downloaded_at: new Date().toISOString() }).eq('id', download.id)
    }

    return json({ url: signed.signedUrl }, 200)
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'unexpected error' }, 500)
  }
})
