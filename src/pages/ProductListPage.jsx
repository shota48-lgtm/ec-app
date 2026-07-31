import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getActiveProducts } from '../lib/products'
import { useCart } from '../contexts/CartContext'

function ProductListPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [addedId, setAddedId] = useState(null)
  const { addToCart } = useCart()
  const timerRef = useRef(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await getActiveProducts()
        setProducts(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  function handleAdd(productId) {
    addToCart(productId, 1)
    setAddedId(productId)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setAddedId(null), 1600)
  }

  return (
    <div>
      <section className="hero">
        <p className="hero__title">すぐ使える写真素材</p>
        <p className="hero__lead">
          商用利用可・クレジット表記は不要です。購入後すぐにダウンロードできます。
        </p>
      </section>
      <div className="page-head">
        <h1>商品一覧</h1>
        {!loading && !error && products.length > 0 && (
          <p className="page-count">{products.length}件の商品</p>
        )}
      </div>
      {error && (
        <p role="alert" className="text-[var(--danger)] mb-4">
          {error}
        </p>
      )}
      {loading && <p className="text-muted">読み込み中...</p>}
      {!loading && !error && products.length === 0 && (
        <p className="text-muted">現在販売中の商品はありません</p>
      )}
      <ul className="product-grid">
        {products.map((product) => (
          <li key={product.id} className="product-card">
            <Link to={`/products/${product.id}`} className="product-card__link">
              <div className="product-card__media">
                {product.image_url ? (
                  <img src={product.image_url} alt="" />
                ) : (
                  <span className="product-card__noimage">画像なし</span>
                )}
              </div>
              <div className="product-card__body">
                <p className="product-card__name">{product.name}</p>
                <p className="product-card__price">
                  {Number(product.price).toLocaleString()}
                  <span className="yen">円</span>
                </p>
              </div>
            </Link>
            <div className="product-card__actions">
              {addedId === product.id ? (
                <span className="btn-added" role="status">
                  カートに追加しました
                </span>
              ) : (
                <button
                  className="btn-primary w-full"
                  onClick={() => handleAdd(product.id)}
                >
                  カートに追加
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ProductListPage
