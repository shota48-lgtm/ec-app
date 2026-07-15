import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getProduct } from '../lib/products'
import { useCart } from '../contexts/CartContext'

function ProductDetailPage() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const { addToCart } = useCart()

  useEffect(() => {
    async function load() {
      try {
        const data = await getProduct(id)
        setProduct(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  if (loading) return <p className="text-muted">読み込み中...</p>
  if (error)
    return (
      <p role="alert" className="text-[var(--danger)]">
        {error}
      </p>
    )
  if (!product) return null

  return (
    <div className="card flex flex-col sm:flex-row gap-6 p-6">
      <div className="w-full sm:w-64 aspect-square bg-[var(--bg-subtle)] rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-muted">画像なし</span>
        )}
      </div>
      <div className="flex-1">
        <h1>{product.name}</h1>
        <p className="text-[var(--text)] mb-4">{product.description}</p>
        <p className="text-[var(--accent)] font-bold text-xl mb-4">{product.price}円</p>
        <label className="flex items-center gap-2 mb-4 text-sm">
          数量
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-20 border border-[var(--border)] rounded-lg px-2 py-1 bg-[var(--bg)] text-[var(--text-h)]"
          />
        </label>
        <button className="btn-primary" onClick={() => addToCart(product.id, quantity)}>
          カートに追加
        </button>
      </div>
    </div>
  )
}

export default ProductDetailPage
