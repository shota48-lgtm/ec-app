import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createProduct, getProduct, updateProduct } from '../../lib/products'
import { uploadProductFile, uploadProductImage } from '../../lib/storage'

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
  const [uploading, setUploading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

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

  async function handleImageChange(e) {
    const file = e.target.files[0]
    if (!file) return

    setError(null)
    setUploading(true)
    try {
      const url = await uploadProductImage(file)
      handleChange('image_url', url)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return

    setError(null)
    setUploadingFile(true)
    try {
      const path = await uploadProductFile(file)
      handleChange('file_path', path)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploadingFile(false)
      e.target.value = ''
    }
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
          商品ファイル（購入者向けダウンロード対象）
          <input type="file" onChange={handleFileChange} disabled={uploadingFile} />
        </label>
        {uploadingFile && <p>アップロード中...</p>}
        {form.file_path && !uploadingFile && <p className="text-muted">登録済み: {form.file_path}</p>}
        <label>
          商品画像
          <input type="file" accept="image/*" onChange={handleImageChange} disabled={uploading} />
        </label>
        {uploading && <p>アップロード中...</p>}
        {form.image_url && !uploading && (
          <img src={form.image_url} alt="" width="120" height="120" style={{ objectFit: 'cover' }} />
        )}
        <label>
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => handleChange('is_active', e.target.checked)}
          />
          公開する
        </label>
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={uploading || uploadingFile}>
          保存
        </button>
      </form>
    </div>
  )
}

export default ProductForm
