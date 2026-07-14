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
    <form onSubmit={handleSubmit}>
      <h1>管理者ログイン</h1>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="メールアドレス"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="パスワード"
        required
      />
      {error && <p role="alert">{error}</p>}
      <button type="submit">ログイン</button>
    </form>
  )
}

export default AdminLoginPage
