import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createProduct, getProduct, updateProduct } from '../../lib/products'

const emptyForm = {
  name: '',
  description: '',
  price: '',
  file_path: '',
  image_url: '',
  is_active: true,
}

function ProductForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isEdit) return

    async function load() {
      try {
        const product = await getProduct(id)
        setForm({
          name: product.name ?? '',
          description: product.description ?? '',
          price: String(product.price ?? ''),
          file_path: product.file_path ?? '',
          image_url: product.image_url ?? '',
          is_active: product.is_active,
        })
      } catch (err) {
        setError(err.message)
      }
    }

    load()
  }, [id, isEdit])

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    const price = Number(form.price)
    if (!Number.isInteger(price) || price < 0) {
      setError('価格は0以上の整数で入力してください')
      return
    }

    const payload = {
      name: form.name,
      description: form.description,
      price,
      file_path: form.file_path,
      image_url: form.image_url,
      is_active: form.is_active,
    }

    try {
      if (isEdit) {
        await updateProduct(id, payload)
      } else {
        await createProduct(payload)
      }
      navigate('/admin/products')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <h1>{isEdit ? '商品編集' : '商品新規登録'}</h1>
      <form onSubmit={handleSubmit}>
        <label>
          商品名
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
          />
        </label>
        <label>
          説明
          <textarea
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
          />
        </label>
        <label>
          価格（円）
          <input
            type="number"
            min="0"
            step="1"
            value={form.price}
            onChange={(e) => handleChange('price', e.target.value)}
            required
          />
        </label>
        <label>
          ファイルパス
          <input
            type="text"
            value={form.file_path}
            onChange={(e) => handleChange('file_path', e.target.value)}
            placeholder="Storage連携は次フェーズで実装予定"
          />
        </label>
        <label>
          画像URL
          <input
            type="text"
            value={form.image_url}
            onChange={(e) => handleChange('image_url', e.target.value)}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => handleChange('is_active', e.target.checked)}
          />
          公開する
        </label>
        {error && <p role="alert">{error}</p>}
        <button type="submit">保存</button>
      </form>
    </div>
  )
}

export default ProductForm
