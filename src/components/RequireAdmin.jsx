import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { isAdmin } from '../lib/auth'

function RequireAdmin({ children }) {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    let cancelled = false

    async function check() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user

      if (!user) {
        if (!cancelled) setStatus('denied')
        return
      }

      const admin = await isAdmin(user.id)
      if (!cancelled) setStatus(admin ? 'allowed' : 'denied')
    }

    check()

    return () => {
      cancelled = true
    }
  }, [])

  if (status === 'checking') return null
  if (status === 'denied') return <Navigate to="/admin/login" replace />
  return children
}

export default RequireAdmin
