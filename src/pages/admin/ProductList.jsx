import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { deleteProduct, getProducts } from '../../lib/products'

function ProductList() {
  const [products, setProducts] = useState([])
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const data = await getProducts()
      setProducts(data)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm('この商品を削除しますか？')) return

    try {
      await deleteProduct(id)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-4">
        <h1 className="mb-0">商品管理</h1>
        <button type="button" className="btn-primary" onClick={() => navigate('/admin/products/new')}>
          新規登録
        </button>
      </div>
      {error && (
        <p role="alert" className="text-[var(--danger)] mb-4">
          {error}
        </p>
      )}
      {products.length === 0 && <p className="text-muted">商品が登録されていません</p>}
      {products.length > 0 && (
        <ul className="flex flex-col gap-3 list-none p-0 m-0">
          {products.map((product) => (
            <li key={product.id} className="card flex flex-wrap items-center gap-4 p-4">
              <div className="flex-1 min-w-[160px]">
                <p className="text-[var(--text-h)] font-medium truncate">{product.name}</p>
                <p className="text-muted">
                  {product.price}円 ・ {product.is_active ? '公開中' : '非公開'}
                </p>
              </div>
              <Link to={`/admin/products/${product.id}/edit`} className="btn-outline no-underline">
                編集
              </Link>
              <button type="button" className="btn-text" onClick={() => handleDelete(product.id)}>
                削除
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ProductList
