import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      return
    }

    navigate(location.state?.from ?? '/')
  }

  return (
    <form onSubmit={handleSubmit} className="card max-w-sm mx-auto p-6 flex flex-col gap-3">
      <h1>ログイン</h1>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="メールアドレス"
        required
        className="border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--bg)] text-[var(--text-h)]"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="パスワード"
        required
        className="border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--bg)] text-[var(--text-h)]"
      />
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

export default LoginPage
