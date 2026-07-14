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
      <h1>商品管理</h1>
      {error && <p role="alert">{error}</p>}
      <button onClick={() => navigate('/admin/products/new')}>新規登録</button>
      <table>
        <thead>
          <tr>
            <th>商品名</th>
            <th>価格</th>
            <th>公開状態</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{product.price}</td>
              <td>{product.is_active ? '公開中' : '非公開'}</td>
              <td>
                <Link to={`/admin/products/${product.id}/edit`}>編集</Link>
                <button onClick={() => handleDelete(product.id)}>削除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ProductList
