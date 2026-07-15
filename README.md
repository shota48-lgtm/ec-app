# ec-app

デジタルコンテンツ（PDF・画像・音声等）を販売するミニECサイトです。クラウドワークス等での受託案件を見据え、決済フロー（カート→Stripe Checkout→Webhookによる注文確定→ダウンロード配信）を一通り実装するポートフォリオとして開発しています。

## プロジェクト概要

- 販売対象はデジタルコンテンツに限定し、在庫管理という別ドメインを持ち込まずに決済フローの実装に集中する構成にしています
- 会員制（Supabase Auth）のECサイトで、購入後は期限付き署名URL経由でコンテンツをダウンロードできます
- 管理者は専用画面から商品の登録・編集・削除、ファイル/画像のアップロードを行います

## 技術スタック

- **フロントエンド**: React + Vite
- **バックエンド**: Supabase
  - PostgreSQL（商品・注文・ダウンロード権利などのデータ）
  - Row Level Security（本人データ閲覧・管理者全件アクセスなどのアクセス制御）
  - Auth（会員ログイン・管理者ログイン）
  - Edge Functions（Deno、決済セッション作成・Webhook受信・署名URL発行）
  - Storage（商品画像・商品ファイル本体の保存）
- **決済**: Stripe Checkout（test mode）

## 主な機能

- 商品管理（管理者用CRUD、画像・ファイルのアップロード）
- カート（複数商品・数量変更、ローカル永続化）
- 決済（Stripe Checkout Session、複数商品対応）
- Webhook経由の注文確定（署名検証・冪等性処理付き）
- デジタルコンテンツのダウンロード配信（決済確定後に発行される期限付き署名URL経由）
- 会員ログイン／管理者ログイン（ロールベースのアクセス制御）

## セットアップ手順

1. 依存パッケージのインストール

   ```bash
   npm install
   ```

2. 環境変数の設定

   `.env.example` を `.env` にコピーし、Supabaseプロジェクトの値を設定してください。

   ```bash
   cp .env.example .env
   ```

   | 変数名 | 内容 |
   | --- | --- |
   | `VITE_SUPABASE_URL` | SupabaseプロジェクトのURL |
   | `VITE_SUPABASE_ANON_KEY` | Supabaseプロジェクトのanon key |

   Stripe関連のシークレット（`STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`）はフロントエンドの`.env`ではなく、Supabase Edge Functions側のsecretとして別途設定します（`npx supabase secrets set` 等）。実際の値は本リポジトリには含まれません。

3. 開発サーバーの起動

   ```bash
   npm run dev
   ```

## ディレクトリ構成

```
src/
  pages/            画面コンポーネント（商品一覧・詳細・カート・決済完了・ログイン等）
  pages/admin/       管理者用画面（商品CRUD・管理者ログイン）
  components/        共通コンポーネント（管理者アクセスガード等）
  contexts/          React Context（カート状態管理）
  lib/               Supabaseクライアント・APIラッパー（商品・決済・ダウンロード等）
supabase/
  migrations/        DBスキーマ・Storageバケット作成のSQLマイグレーション
  functions/         Edge Functions（決済セッション作成・Webhook受信・署名URL発行等）
```
