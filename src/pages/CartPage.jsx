import { useEffect, useState } from 'react'
import { useCart } from '../contexts/CartContext'
import { getProduct } from '../lib/products'

function CartPage() {
  const { items, updateQuantity, removeFromCart } = useCart()
  const [products, setProducts] = useState({})
  const [error, setError] = useState(null)

  useEffect(() => {
    if (items.length === 0) {
      setProducts({})
      return
    }

    async function load() {
      try {
        const entries = await Promise.all(
          items.map(async (item) => [item.productId, await getProduct(item.productId)]),
        )
        setProducts(Object.fromEntries(entries))
      } catch (err) {
        setError(err.message)
      }
    }

    load()
  }, [items])

  const total = items.reduce((sum, item) => {
    const product = products[item.productId]
    return product ? sum + product.price * item.quantity : sum
  }, 0)

  return (
    <div>
      <h1>カート</h1>
      {error && <p role="alert">{error}</p>}
      {items.length === 0 && <p>カートは空です</p>}
      {items.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>商品名</th>
              <th>単価</th>
              <th>数量</th>
              <th>小計</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const product = products[item.productId]
              if (!product) return null

              return (
                <tr key={item.productId}>
                  <td>{product.name}</td>
                  <td>{product.price}円</td>
                  <td>
                    <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                      -
                    </button>
                    {item.quantity}
                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                      +
                    </button>
                  </td>
                  <td>{product.price * item.quantity}円</td>
                  <td>
                    <button onClick={() => removeFromCart(item.productId)}>削除</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
      <p>合計: {total}円</p>
      <button type="button" disabled>
        レジに進む（準備中）
      </button>
    </div>
  )
}

export default CartPage
