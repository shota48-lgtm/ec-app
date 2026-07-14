import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getProduct } from '../lib/products'
import { useCart } from '../contexts/CartContext'

function ProductDetailPage() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState(null)
  const { addToCart } = useCart()

  useEffect(() => {
    async function load() {
      try {
        const data = await getProduct(id)
        setProduct(data)
      } catch (err) {
        setError(err.message)
      }
    }

    load()
  }, [id])

  if (error) return <p role="alert">{error}</p>
  if (!product) return null

  return (
    <div>
      {product.image_url && <img src={product.image_url} alt="" width="200" />}
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p>{product.price}円</p>
      <label>
        数量
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />
      </label>
      <button onClick={() => addToCart(product.id, quantity)}>カートに追加</button>
    </div>
  )
}

export default ProductDetailPage
