import { Link } from 'react-router-dom'

function CheckoutSuccessPage() {
  return (
    <div className="card max-w-md mx-auto p-8 text-center flex flex-col items-center gap-4">
      <div className="w-14 h-14 rounded-full bg-[var(--accent-bg)] flex items-center justify-center text-[var(--accent)] text-2xl font-bold">
        ✓
      </div>
      <h1>ご購入ありがとうございました</h1>
      <p className="text-[var(--text)]">
        決済が完了しました。注文の確定処理は数分以内に反映されます。
      </p>
      <Link to="/" className="btn-primary no-underline">
        商品一覧に戻る
      </Link>
    </div>
  )
}

export default CheckoutSuccessPage
