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

## 現在フェーズ
認証基盤構築完了（profilesテーブル・RLS・トリガー・ルーティング・RequireAdminガード）。管理者アカウント1件作成済み・動作確認済み

## 未確定
- テーブル設計（products / orders / order_items / downloads等）
- RLSポリシー詳細（products / orders / order_items / downloads等）

## 変更ログ
- 2026-07-14: 仕様確定（D-001〜D-009）、プロジェクト初期化
- 2026-07-14: 認証基盤構築（feature/auth-role-separationブランチ）。profilesテーブル・RLS・トリガーのマイグレーション作成、src/lib/auth.js（getUserRole/isAdmin）、/login・/register・/admin/login・/admin/*ルーティング、RequireAdminガード実装。SQL EditorでDBマイグレーション適用、Authentication→Usersで管理者アカウント（shota.48@icloud.com）作成しrole='admin'に更新、動作確認済み。D-010追加
