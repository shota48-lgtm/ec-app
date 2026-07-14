import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getActiveProducts } from '../lib/products'
import { useCart } from '../contexts/CartContext'

function ProductListPage() {
  const [products, setProducts] = useState([])
  const [error, setError] = useState(null)
  const { addToCart } = useCart()

  useEffect(() => {
    async function load() {
      try {
        const data = await getActiveProducts()
        setProducts(data)
      } catch (err) {
        setError(err.message)
      }
    }

    load()
  }, [])

  return (
    <div>
      <h1>商品一覧</h1>
      {error && <p role="alert">{error}</p>}
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            {product.image_url && (
              <img src={product.image_url} alt="" width="80" height="80" />
            )}
            <Link to={`/products/${product.id}`}>{product.name}</Link>
            <span>{product.price}円</span>
            <button onClick={() => addToCart(product.id, 1)}>カートに追加</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ProductListPage
