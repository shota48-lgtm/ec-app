import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getActiveProducts } from '../lib/products'
import { useCart } from '../contexts/CartContext'

function ProductListPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { addToCart } = useCart()

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

  return (
    <div>
      <h1>商品一覧</h1>
      {error && (
        <p role="alert" className="text-[var(--danger)] mb-4">
          {error}
        </p>
      )}
      {loading && <p className="text-muted">読み込み中...</p>}
      {!loading && !error && products.length === 0 && (
        <p className="text-muted">現在販売中の商品はありません</p>
      )}
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-4 list-none p-0 m-0">
        {products.map((product) => (
          <li key={product.id} className="card flex flex-col overflow-hidden">
            <Link to={`/products/${product.id}`} className="no-underline text-inherit">
              <div className="aspect-square bg-[var(--bg-subtle)] flex items-center justify-center">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-muted">画像なし</span>
                )}
              </div>
              <div className="p-3">
                <p className="text-[var(--text-h)] font-medium text-sm mb-1 truncate">
                  {product.name}
                </p>
                <p className="text-[var(--accent)] font-bold">{product.price}円</p>
              </div>
            </Link>
            <div className="px-3 pb-3 mt-auto">
              <button className="btn-primary w-full" onClick={() => addToCart(product.id, 1)}>
                カートに追加
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ProductListPage
