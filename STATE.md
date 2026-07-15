# ec-app STATE

## 確定事項（D-xxx）
- D-001: 商品はデジタルコンテンツ限定（PDF/画像/音声等）。理由: 在庫管理という別ドメインを持ち込まず決済フロー習得に集中するため
- D-002: カート機能あり、複数商品・数量変更・ローカル永続化対応。理由: 単品購入のみでは「よくあるECパターン」として薄いため
- D-003: 購入履歴照会はSupabase Authによる会員制。理由: 受託案件で頻出する会員制ECパターンの経験値を積むため
- D-004: 決済はStripe Checkout Session（複数商品対応）
- D-005: Webhookは署名検証＋冪等性処理必須（重複配信対策）
- D-006: 権利付与は決済成功後、期限付き署名URLでダウンロード発行
- D-007: 返金はStripe Refund APIを管理画面から実行
- D-008: スタックはReact/Vite + Supabase(PostgreSQL, RLS, Auth) + Stripe(test mode)
- D-009: 開発体制は予約アプリと同じ三者体制（PO/設計/CC）を流用
- D-010: 管理者アカウントはSupabaseダッシュボードのAuthentication→Usersで「Create new user」を使い手動作成する。自己登録経路は一切存在しない。作成後、SQL Editorで profiles.role を 'admin' に手動更新する運用とする
- D-011: products/orders/order_items/downloadsのテーブル設計完了。price/total_amount/price_at_purchaseは税込・円建ての整数カラムとする。RLSはpublic select（is_active商品のみ）・本人データ閲覧・管理者全件アクセスの3パターンで構成
- D-012: 管理者用商品CRUD画面(/admin/products, /admin/products/new, /admin/products/:id/edit)実装完了。一覧・新規登録・編集・削除の動作確認済み（ブラウザでとーふが目視確認）。ファイルアップロード(Supabase Storage連携)は未実装で次フェーズ
- D-013: 顧客向け商品一覧（/、is_active商品のみ表示）・商品詳細（/products/:id）・カート（/cart）を実装完了。カート状態はReact Context + localStorageで管理（キー名: ec-app-cart）。一覧表示・カート追加・数量変更・削除・リロード後の永続化、全てブラウザでとーふが目視確認済み
- D-014: Stripe Checkout Session作成をSupabase Edge Function（create-checkout-session）で実装。サーバー側で商品価格・is_activeを再取得し改ざん防止。ordersをpending状態で作成後、Checkout Sessionを作成しURLへリダイレクトする流れ。とーふがテストカード(4242...)で実際に決済完了まで動作確認済み。ただし注文ステータスの更新（pending→paid）はWebhook未実装のため反映されない。次フェーズで対応
- D-015: Stripeシークレット(STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)をPowerShellから設定する際は、Read-Host -AsSecureString ではなくGet-Clipboard方式を使う。理由: -AsSecureStringへの貼り付けで値が1文字に欠損する不具合が複数回発生し、署名検証失敗の原因となったため

## 現在フェーズ
Stripe Webhook受信・署名検証・冪等性処理・注文ステータス更新（pending→paid）を実装し、実決済での動作確認まで完了（feature/stripe-webhookブランチ、mainへはマージ待ち）。次は権利付与（downloadsテーブルへの書き込み・期限付き署名URL発行）

## 未確定
- 権利付与（ダウンロードURL発行）・downloadsテーブルへの書き込み・Stripe Refund APIによる返金処理

## 変更ログ
- 2026-07-14: 仕様確定（D-001〜D-009）、プロジェクト初期化
- 2026-07-14: 認証基盤構築（feature/auth-role-separationブランチ）。profilesテーブル・RLS・トリガーのマイグレーション作成、src/lib/auth.js（getUserRole/isAdmin）、/login・/register・/admin/login・/admin/*ルーティング、RequireAdminガード実装。SQL EditorでDBマイグレーション適用、Authentication→Usersで管理者アカウント（shota.48@icloud.com）作成しrole='admin'に更新、動作確認済み。D-010追加
- 2026-07-14: 商品・注文スキーマ構築（feature/product-order-schemaブランチ）。products / orders / order_items / downloadsの4テーブル、RLS有効化・ポリシー作成のマイグレーション作成。SQL Editorで適用、information_schema.tablesで4テーブルの存在確認済み。D-011追加
- 2026-07-14: 管理者用商品CRUD画面構築（feature/admin-product-crudブランチ）。src/lib/products.js（getProducts/getProduct/createProduct/updateProduct/deleteProduct）、/admin/products・/admin/products/new・/admin/products/:id/editルーティング、ProductList.jsx・ProductForm.jsx実装、AdminDashboardに商品管理リンク追加。ブラウザで一覧・新規登録・編集・削除の動作確認済み。D-012追加
- 2026-07-14: 顧客向け商品一覧・詳細・カート構築（feature/product-list-cartブランチ）。src/lib/products.jsにgetActiveProducts追加、src/contexts/CartContext.jsx（addToCart/removeFromCart/updateQuantity/clearCart/getCartItems、localStorageキー ec-app-cart）、ProductListPage.jsx・ProductDetailPage.jsx・CartPage.jsx実装、/・/products/:id・/cartルーティング追加、ヘッダーにカート件数表示追加。Viteデフォルト雛形のHome.jsxは削除。ブラウザで一覧・カート追加・数量変更・削除・永続化の動作確認済み。D-013追加
- 2026-07-15: Stripe Checkout Session連携構築（feature/checkout-sessionブランチ）。supabase/functions/create-checkout-session/index.ts実装（サーバー側での価格・is_active再検証、orders/order_items作成、Stripe Checkout Session作成）、src/lib/checkout.js（createCheckoutSession）、CartPageの「レジに進む」有効化、CheckoutSuccessPage.jsx・/checkout/successルーティング追加。npx supabase login・link・secrets set・functions deployを実施しデプロイ完了。とーふがテストカードで決済完了まで動作確認済み。D-014追加
- 2026-07-15: Stripe Webhook受信構築（feature/stripe-webhookブランチ）。supabase/functions/stripe-webhook/index.ts実装（stripe-signatureヘッダーによる署名検証、webhook_eventsテーブルによる冪等性処理、該当orderのstatusをpaidに更新）、supabase/migrations/にwebhook_eventsテーブル作成SQLを作成（SQL Editorで手動実行済み）、supabase/config.tomlでstripe-webhookのverify_jwt=falseを設定。デプロイ後、STRIPE_WEBHOOK_SECRETの署名検証が繰り返し失敗するインシデントが発生。値そのものを出力しない診断用Edge Functionで切り分けた結果、PowerShellの `Read-Host -AsSecureString` へのクリップボード貼り付けで値が1文字に欠損する不具合が原因と判明。`Get-Clipboard` 方式に切り替えて解決し、STRIPE_SECRET_KEY・STRIPE_WEBHOOK_SECRETとも正しい値で再設定済み。実際の決済(session: cs_test_a189R7aVciBp0GGV1qZR1ZjZwQDcdU3GL6YEochFx3OefQ9VpxCKuoyn6o)でordersのstatusがpending→paidに更新されることを確認済み。D-015追加。mainへは未マージ（マージ待ち）
