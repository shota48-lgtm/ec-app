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

## 現在フェーズ
要件定義完了。次: テーブル設計・RLS設計

## 未確定
- テーブル設計（products / orders / order_items / users / downloads等）
- RLSポリシー詳細

## 変更ログ
- 2026-07-14: 仕様確定（D-001〜D-009）、プロジェクト初期化
