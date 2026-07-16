import { useEffect, useState } from 'react'
import { listOrders, refundOrder } from '../../lib/adminOrders'

const STATUS_LABELS = {
  pending: '支払い待ち',
  paid: '支払い済み',
  cancelled: 'キャンセル',
  refunded: '返金済み',
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('ja-JP')
}

function AdminOrderList() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [confirmingId, setConfirmingId] = useState(null)
  const [refundingId, setRefundingId] = useState(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await listOrders()
      setOrders(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRefund(orderId) {
    setError(null)
    setRefundingId(orderId)
    try {
      await refundOrder(orderId)
      setConfirmingId(null)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setRefundingId(null)
    }
  }

  return (
    <div>
      <h1>注文管理</h1>
      {error && (
        <p role="alert" className="text-[var(--danger)] mb-4">
          {error}
        </p>
      )}
      {loading && <p className="text-muted">読み込み中...</p>}
      {!loading && orders.length === 0 && <p className="text-muted">注文はありません</p>}
      {!loading && orders.length > 0 && (
        <ul className="flex flex-col gap-3 list-none p-0 m-0">
          {orders.map((order) => (
            <li key={order.id} className="card flex flex-col gap-2 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-muted">{formatDateTime(order.created_at)}</p>
                  <p className="text-[var(--text-h)]">{order.userEmail}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[var(--accent)]">{order.total_amount}円</p>
                  <p className="text-muted">{STATUS_LABELS[order.status] ?? order.status}</p>
                </div>
              </div>
              <p className="text-muted">
                {order.order_items.map((item) => `${item.products?.name}×${item.quantity}`).join('、')}
              </p>
              {order.status === 'paid' && (
                <div className="flex items-center justify-end gap-3">
                  {confirmingId === order.id ? (
                    <>
                      <span className="text-[var(--danger)]">本当に返金しますか？</span>
                      <button
                        type="button"
                        className="btn-text"
                        onClick={() => setConfirmingId(null)}
                        disabled={refundingId === order.id}
                      >
                        キャンセル
                      </button>
                      <button
                        type="button"
                        className="btn-outline"
                        onClick={() => handleRefund(order.id)}
                        disabled={refundingId === order.id}
                      >
                        {refundingId === order.id ? '処理中...' : '返金を実行する'}
                      </button>
                    </>
                  ) : (
                    <button type="button" className="btn-outline" onClick={() => setConfirmingId(order.id)}>
                      返金する
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default AdminOrderList
