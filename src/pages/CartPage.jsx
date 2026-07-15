import { useEffect, useState } from 'react'
import { useCart } from '../contexts/CartContext'
import { getProduct } from '../lib/products'
import { createCheckoutSession } from '../lib/checkout'

function CartPage() {
  const { items, updateQuantity, removeFromCart } = useCart()
  const [products, setProducts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [checkingOut, setCheckingOut] = useState(false)

  useEffect(() => {
    if (items.length === 0) {
      setProducts({})
      setLoading(false)
      return
    }

    async function load() {
      setLoading(true)
      try {
        const entries = await Promise.all(
          items.map(async (item) => [item.productId, await getProduct(item.productId)]),
        )
        setProducts(Object.fromEntries(entries))
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [items])

  const total = items.reduce((sum, item) => {
    const product = products[item.productId]
    return product ? sum + product.price * item.quantity : sum
  }, 0)

  async function handleCheckout() {
    setError(null)
    setCheckingOut(true)
    try {
      await createCheckoutSession(items)
    } catch (err) {
      setError(err.message)
      setCheckingOut(false)
    }
  }

  return (
    <div>
      <h1>カート</h1>
      {error && (
        <p role="alert" className="text-[var(--danger)] mb-4">
          {error}
        </p>
      )}
      {loading && <p className="text-muted">読み込み中...</p>}
      {!loading && items.length === 0 && (
        <p className="text-muted">カートは空です</p>
      )}
      {!loading && items.length > 0 && (
        <ul className="flex flex-col gap-3 list-none p-0 m-0">
          {items.map((item) => {
            const product = products[item.productId]
            if (!product) return null

            return (
              <li
                key={item.productId}
                className="card flex flex-wrap items-center gap-4 p-4"
              >
                <div className="flex-1 min-w-[140px]">
                  <p className="text-[var(--text-h)] font-medium truncate">{product.name}</p>
                  <p className="text-muted">単価 {product.price}円</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="btn-outline px-2 py-1"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  >
                    -
                  </button>
                  <span className="w-6 text-center">{item.quantity}</span>
                  <button
                    className="btn-outline px-2 py-1"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <p className="w-20 text-right font-bold text-[var(--accent)]">
                  {product.price * item.quantity}円
                </p>
                <button className="btn-text" onClick={() => removeFromCart(item.productId)}>
                  削除
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <div className="card p-4 mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-lg">
          合計: <span className="font-bold text-[var(--accent)]">{total}円</span>
        </p>
        <button
          type="button"
          className="btn-primary"
          onClick={handleCheckout}
          disabled={items.length === 0 || checkingOut}
        >
          {checkingOut ? '処理中...' : 'レジに進む'}
        </button>
      </div>
    </div>
  )
}

export default CartPage
