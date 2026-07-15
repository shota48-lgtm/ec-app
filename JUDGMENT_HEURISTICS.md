# ec-app JUDGMENT_HEURISTICS

作業判断の指針（J-xxx）。CCはタスク開始前に目を通すこと。

## J10: ハードコードパス禁止
スクリプトやコマンド内でユーザーのホームディレクトリパスを直書きしない。必ず `$env:USERPROFILE` を使用すること。

## J-XX: シークレット値を扱う際は非表示入力を使う（Get-Clipboard方式）
シークレット値(APIキー・Webhook Secret等)をコマンドに渡す際は、値がターミナル画面やチャット履歴に表示・残留しない方式を使う。

**理由**: ターミナル画面がスクリーンショットで共有され、値がチャット履歴に残留する事故が複数回発生したため。

**標準手順(Get-Clipboard方式)**:
```powershell
# 1. 対象の値をコピー元(ダッシュボード等)でコピーしておく
# 2. 以下を実行(値は画面にもチャットにも表示されない)
$secretsFile = "<一時ファイルパス。リポジトリ外のスクラッチパッド等を推奨>"
$plain = Get-Clipboard
Set-Content -Path $secretsFile -Value "KEY_NAME=$plain" -Encoding utf8 -NoNewline
Set-Clipboard -Value ""
Remove-Variable plain
```
その後、値を読み込まずにファイルパスだけを渡して設定する:
```powershell
npx supabase secrets set --env-file $secretsFile
Remove-Item $secretsFile -Force
```

**避けるべき方式**: `Read-Host -AsSecureString` を経由した貼り付けは、この環境で値が1文字に欠損する不具合が複数回(STRIPE_SECRET_KEY・STRIPE_WEBHOOK_SECRETの両方で)再現し、Stripe Webhookの署名検証failureの直接原因となった。`PtrToStringAuto`/`PtrToStringUni` への変更でも解消せず、貼り付け自体がこの環境のマスク入力プロンプトで正しく機能していないと判断。**`Read-Host -AsSecureString` への値貼り付けは使用しないこと。**

**値の破損有無を確認したい場合**: 値そのものを返さず、文字数・プレフィックス一致・前後空白の有無のみを返す一時的な診断用Edge Function(認証必須=`verify_jwt`はデフォルトのtrueのまま、確認後は必ず削除)で切り分ける。`verify_jwt = false` の公開エンドポイントとして診断Functionを作らないこと(第三者からシークレットのメタ情報が取得可能になってしまうため)。
