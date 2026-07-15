import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getCheckoutDownloads, getDownloadUrl } from '../lib/downloads'

const POLL_INTERVAL_MS = 2000
const MAX_POLL_ATTEMPTS = 15

function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [downloads, setDownloads] = useState([])
  const [processing, setProcessing] = useState(Boolean(sessionId))
  const [error, setError] = useState(null)
  const [downloadingToken, setDownloadingToken] = useState(null)
  const attemptsRef = useRef(0)

  useEffect(() => {
    if (!sessionId) return

    let cancelled = false

    async function poll() {
      try {
        const data = await getCheckoutDownloads(sessionId)
        if (cancelled) return

        if (data.processing) {
          attemptsRef.current += 1
          if (attemptsRef.current < MAX_POLL_ATTEMPTS) {
            setTimeout(poll, POLL_INTERVAL_MS)
          } else {
            setProcessing(false)
            setError('ダウンロードの準備に時間がかかっています。しばらくしてから画面を再読み込みしてください')
          }
          return
        }

        setDownloads(data.downloads)
        setProcessing(false)
      } catch (err) {
        if (!cancelled) {
          setError(err.message)
          setProcessing(false)
        }
      }
    }

    poll()

    return () => {
      cancelled = true
    }
  }, [sessionId])

  async function handleDownload(token) {
    setError(null)
    setDownloadingToken(token)
    try {
      const url = await getDownloadUrl(token)
      window.location.href = url
    } catch (err) {
      setError(err.message)
    } finally {
      setDownloadingToken(null)
    }
  }

  return (
    <div className="card max-w-md mx-auto p-8 flex flex-col items-center gap-4">
      <div className="w-14 h-14 rounded-full bg-[var(--accent-bg)] flex items-center justify-center text-[var(--accent)] text-2xl font-bold">
        ✓
      </div>
      <h1 className="text-center">ご購入ありがとうございました</h1>
      <p className="text-[var(--text)] text-center">
        決済が完了しました。注文の確定処理は数分以内に反映されます。
      </p>

      {sessionId && (
        <div className="w-full flex flex-col gap-2">
          {processing && <p className="text-muted text-center">ダウンロードの準備中です...</p>}
          {error && (
            <p role="alert" className="text-[var(--danger)] text-center">
              {error}
            </p>
          )}
          {!processing &&
            downloads.map((download) => {
              const expired = new Date(download.expiresAt).getTime() < Date.now()
              return (
                <div
                  key={download.downloadToken}
                  className="flex items-center justify-between gap-3 border border-[var(--border)] rounded-lg px-4 py-3"
                >
                  <span className="text-[var(--text-h)]">{download.productName}</span>
                  <button
                    type="button"
                    className="btn-outline"
                    disabled={expired || downloadingToken === download.downloadToken}
                    onClick={() => handleDownload(download.downloadToken)}
                  >
                    {expired ? '期限切れ' : 'ダウンロード'}
                  </button>
                </div>
              )
            })}
        </div>
      )}

      <Link to="/" className="btn-primary no-underline">
        商品一覧に戻る
      </Link>
    </div>
  )
}

export default CheckoutSuccessPage
