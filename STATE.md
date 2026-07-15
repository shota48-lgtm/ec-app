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
- D-016: 顧客向け画面のデザイン方針。アクセントカラーはインディゴ#4f46e5（ホバー#4338ca）に統一し、主要ボタン・価格表示・カート件数バッジに一貫使用。フォントはGoogle FontsのNoto Sans JPを追加。ボタンは主要アクション=塗りつぶし角丸(.btn-primary)、補助アクション=アウトライン(.btn-outline)またはテキストリンク(.btn-text)で区別。カード類は.cardユーティリティ（白背景+角丸12px+薄い影）で統一。ヘッダーは全ページ共通でsticky固定
- D-017: 商品画像はSupabase Storageの公開バケット`product-images`に保存し、products.image_url（既存カラム）へ公開URLを保存する方式とする。バケットへのinsert/update/deleteはprofiles.role='admin'のみ許可するRLSポリシーを付与、読み取りは公開バケットのためRLSを介さず公開URLで配信。SQL内容は事前にとーふへ提示し承認を得てからSQL Editorで手動実行する運用

## 現在フェーズ
3本のfeatureブランチ（feature/stripe-webhook・feature/ui-polish・feature/product-images）すべてをmainへマージ完了。

- feature/stripe-webhook → main: マージ済み（--no-ffマージコミット、コンフリクトなし）
- feature/ui-polish → main: マージ済み（--no-ffマージコミット、STATE.mdのみコンフリクトが発生し完全差替版で解消。コードファイルは自動マージ）
- feature/product-images → main: マージ済み（--no-ffマージコミット、STATE.mdのみコンフリクトが発生し完全差替版で解消。コードファイルは自動マージ）

Stripe Webhook・顧客向け画面デザイン統一・商品画像アップロードの3機能がすべてmainに揃った状態。リモートへのpushはまだ実施していない（別途指示待ち）。

## 未確定
- リモートへのpush（別途指示待ち）
- 権利付与（ダウンロードURL発行）・downloadsテーブルへの書き込み・Stripe Refund APIによる返金処理
- モバイル幅でのレスポンシブ表示は、この開発環境ではブラウザ自動リサイズが機能しないため未検証（Tailwindのflex-wrap/gridブレークポイントで対応実装済みだが、とーふによる実機/手動リサイズでの目視確認が必要）
- 管理者用商品CRUD画面（一覧・フォーム）自体はui-polishのデザイン統一の対象外のまま（顧客向け画面のみ実施）

## 変更ログ
- 2026-07-14: 仕様確定（D-001〜D-009）、プロジェクト初期化
- 2026-07-14: 認証基盤構築（feature/auth-role-separationブランチ）。profilesテーブル・RLS・トリガーのマイグレーション作成、src/lib/auth.js（getUserRole/isAdmin）、/login・/register・/admin/login・/admin/*ルーティング、RequireAdminガード実装。SQL EditorでDBマイグレーション適用、Authentication→Usersで管理者アカウント（shota.48@icloud.com）作成しrole='admin'に更新、動作確認済み。D-010追加
- 2026-07-14: 商品・注文スキーマ構築（feature/product-order-schemaブランチ）。products / orders / order_items / downloadsの4テーブル、RLS有効化・ポリシー作成のマイグレーション作成。SQL Editorで適用、information_schema.tablesで4テーブルの存在確認済み。D-011追加
- 2026-07-14: 管理者用商品CRUD画面構築（feature/admin-product-crudブランチ）。src/lib/products.js（getProducts/getProduct/createProduct/updateProduct/deleteProduct）、/admin/products・/admin/products/new・/admin/products/:id/editルーティング、ProductList.jsx・ProductForm.jsx実装、AdminDashboardに商品管理リンク追加。ブラウザで一覧・新規登録・編集・削除の動作確認済み。D-012追加
- 2026-07-14: 顧客向け商品一覧・詳細・カート構築（feature/product-list-cartブランチ）。src/lib/products.jsにgetActiveProducts追加、src/contexts/CartContext.jsx（addToCart/removeFromCart/updateQuantity/clearCart/getCartItems、localStorageキー ec-app-cart）、ProductListPage.jsx・ProductDetailPage.jsx・CartPage.jsx実装、/・/products/:id・/cartルーティング追加、ヘッダーにカート件数表示追加。Viteデフォルト雛形のHome.jsxは削除。ブラウザで一覧・カート追加・数量変更・削除・永続化の動作確認済み。D-013追加
- 2026-07-15: Stripe Checkout Session連携構築（feature/checkout-sessionブランチ）。supabase/functions/create-checkout-session/index.ts実装（サーバー側での価格・is_active再検証、orders/order_items作成、Stripe Checkout Session作成）、src/lib/checkout.js（createCheckoutSession）、CartPageの「レジに進む」有効化、CheckoutSuccessPage.jsx・/checkout/successルーティング追加。npx supabase login・link・secrets set・functions deployを実施しデプロイ完了。とーふがテストカードで決済完了まで動作確認済み。D-014追加
- 2026-07-15: Stripe Webhook受信構築（feature/stripe-webhookブランチ）。supabase/functions/stripe-webhook/index.ts実装（stripe-signatureヘッダーによる署名検証、webhook_eventsテーブルによる冪等性処理、該当orderのstatusをpaidに更新）、supabase/migrations/にwebhook_eventsテーブル作成SQLを作成（SQL Editorで手動実行済み）、supabase/config.tomlでstripe-webhookのverify_jwt=falseを設定。デプロイ後、STRIPE_WEBHOOK_SECRETの署名検証が繰り返し失敗するインシデントが発生。値そのものを出力しない診断用Edge Functionで切り分けた結果、PowerShellの `Read-Host -AsSecureString` へのクリップボード貼り付けで値が1文字に欠損する不具合が原因と判明。`Get-Clipboard` 方式に切り替えて解決し、STRIPE_SECRET_KEY・STRIPE_WEBHOOK_SECRETとも正しい値で再設定済み。実際の決済(session: cs_test_a189R7aVciBp0GGV1qZR1ZjZwQDcdU3GL6YEochFx3OefQ9VpxCKuoyn6o)でordersのstatusがpending→paidに更新されることを確認済み。D-015追加
- 2026-07-15: 顧客向け画面デザイン統一（feature/ui-polishブランチ、mainから分岐）。配色・フォント・ボタンスタイルの方針をとーふに提示し承認取得後に着手。D-016のデザイントークンをsrc/index.cssに追加（アクセントカラーCSS変数、Noto Sans JP、.btn-primary/.btn-outline/.btn-text/.cardユーティリティ、ダークモード対応）。App.jsxのHeaderをsticky化しロゴ・カート件数バッジ追加。ProductListPage（商品カードグリッド、ローディング/空/エラー状態）→CartPage（カード形式のカート行、削除をテキストリンク化、合計・レジに進むをカード化）の順で実装し、とーふに確認を挙げてから残り3ページに展開。ProductDetailPage・LoginPage・CheckoutSuccessPageにも同様のカード/ボタンスタイルを適用。全5ページをブラウザ(Claude in Chrome)でデスクトップ幅の目視確認済み。モバイル幅リサイズがこの開発環境で機能しないため、レスポンシブの実機確認はとーふが別途実施予定
- 2026-07-15: 商品画像アップロード機能構築（feature/product-imagesブランチ、feature/ui-polishから分岐）。products.image_urlカラムは既存のため追加マイグレーション不要と判断。Supabase Storage公開バケット`product-images`作成・admin限定RLSポリシー（insert/update/delete）のSQLをとーふに事前提示し承認を得てからSQL Editorで実行（supabase/migrations/20260715120000_create_product_images_storage.sqlにも保存）。src/lib/storage.js（uploadProductImage）実装、ProductForm.jsxの「画像URL」テキスト欄をファイル選択+アップロード中表示+プレビューに置き換え。ブラウザで実際にファイルをアップロードしStorageへの保存・公開URL取得・商品一覧/詳細ページでの画像表示までとーふ立会いのもと動作確認済み。管理者ログインはとーふが自身で実施（CCはパスワード入力を代行しない運用）。テストで作成した商品データはとーふが削除済み。D-017追加
- 2026-07-15: feature/stripe-webhook・feature/ui-polish・feature/product-imagesの3ブランチをmainへ順次マージ（指示された順序: stripe-webhook→ui-polish→product-images）。各マージとも--no-ffで実施。stripe-webhook→mainはコンフリクトなし。ui-polish→main、product-images→mainはいずれもSTATE.mdのみコンフリクトが発生し、両側の内容（確定事項・現在フェーズ・未確定・変更ログ）を漏れなく反映した完全差替版で解消、コードファイルはすべて自動マージ。リモートへのpushは未実施
