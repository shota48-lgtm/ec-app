import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { isAdmin } from '../../lib/auth'

function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      return
    }

    const admin = await isAdmin(data.user.id)
    if (!admin) {
      await supabase.auth.signOut()
      setError('管理者アカウントではありません')
      return
    }

    navigate('/admin')
  }

  return (
    <form onSubmit={handleSubmit} className="card max-w-sm mx-auto p-6 flex flex-col gap-4">
      <h1>管理者ログイン</h1>
      <div>
        <label className="form-label" htmlFor="admin-email">
          メールアドレス
        </label>
        <input
          id="admin-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@example.com"
          required
          className="form-input"
        />
      </div>
      <div>
        <label className="form-label" htmlFor="admin-password">
          パスワード
        </label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="8文字以上"
          required
          className="form-input"
        />
      </div>
      {error && (
        <p role="alert" className="text-[var(--danger)]">
          {error}
        </p>
      )}
      <button type="submit" className="btn-primary">
        ログイン
      </button>
    </form>
  )
}

export default AdminLoginPage
