import { useEffect, useState } from 'react'
import { getMyOrders } from '../lib/orders'
import { getDownloadUrl, renewDownload } from '../lib/downloads'

const STATUS_LABELS = {
  pending: '決済が完了していません',
  paid: '支払い済み',
}

const MAX_RENEWALS = 3

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('ja-JP')
}

function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyToken, setBusyToken] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const data = await getMyOrders()
        if (!cancelled) setOrders(data)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleDownload(token) {
    setError(null)
    setBusyToken(token)
    try {
      const url = await getDownloadUrl(token)
      window.location.href = url
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyToken(null)
    }
  }

  async function handleRenew(orderId, itemId, token) {
    setError(null)
    setBusyToken(token)
    try {
      const result = await renewDownload(token)
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== orderId) return order
          return {
            ...order,
            order_items: order.order_items.map((item) => {
              if (item.id !== itemId) return item
              return {
                ...item,
                downloads: item.downloads.map((download) =>
                  download.download_token === token
                    ? { ...download, expires_at: result.expiresAt, renewal_count: result.renewalCount }
                    : download,
                ),
              }
            }),
          }
        }),
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyToken(null)
    }
  }

  return (
    <div>
      <h1>注文履歴</h1>
      {error && (
        <p role="alert" className="text-[var(--danger)] mb-4">
          {error}
        </p>
      )}
      {loading && <p className="text-muted">読み込み中...</p>}
      {!loading && orders.length === 0 && <p className="text-muted">注文履歴はありません</p>}
      {!loading && orders.length > 0 && (
        <ul className="flex flex-col gap-4 list-none p-0 m-0">
          {orders.map((order) => (
            <li key={order.id} className="card p-4 flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-muted">{formatDateTime(order.created_at)}</p>
                  <p className="font-bold text-[var(--accent)]">{order.total_amount}円</p>
                </div>
                <span className="text-[var(--text-h)] font-medium">
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>

              {order.status === 'paid' && (
                <ul className="flex flex-col gap-2 list-none p-0 m-0">
                  {order.order_items.map((item) => {
                    const download = item.downloads?.[0]
                    const expired = download && new Date(download.expires_at).getTime() < Date.now()
                    const renewalLimitReached = download && download.renewal_count >= MAX_RENEWALS

                    return (
                      <li
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-3 border border-[var(--border)] rounded-lg px-4 py-3"
                      >
                        <span className="text-[var(--text-h)]">{item.products?.name}</span>
                        {!download && <span className="text-muted">準備中です</span>}
                        {download && !expired && (
                          <button
                            type="button"
                            className="btn-outline"
                            disabled={busyToken === download.download_token}
                            onClick={() => handleDownload(download.download_token)}
                          >
                            ダウンロード
                          </button>
                        )}
                        {download && expired && (
                          <div className="flex items-center gap-3">
                            <span className="text-[var(--danger)]">有効期限が切れています</span>
                            {renewalLimitReached ? (
                              <span className="text-muted">
                                再発行の上限に達しました。サポートにお問い合わせください
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="btn-outline"
                                disabled={busyToken === download.download_token}
                                onClick={() => handleRenew(order.id, item.id, download.download_token)}
                              >
                                再発行する
                              </button>
                            )}
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default OrdersPage
