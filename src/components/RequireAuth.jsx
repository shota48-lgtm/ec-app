import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

function RequireAuth({ children }) {
  const [status, setStatus] = useState('checking')
  const location = useLocation()

  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) setStatus(session ? 'allowed' : 'denied')
    })

    return () => {
      cancelled = true
    }
  }, [])

  if (status === 'checking') return null
  if (status === 'denied') return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

export default RequireAuth
