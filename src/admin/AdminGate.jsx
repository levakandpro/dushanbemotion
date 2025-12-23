import { useAuth } from '../auth/AuthProvider'
import { Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import AdminApp from './AdminApp'
import { supabase } from '../lib/supabaseClient'

// Владелец - всегда имеет доступ
const OWNER_EMAIL = 'levakandproduction@gmail.com'

export default function AdminGate() {
  const { user, loading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkAdminAccess() {
      if (!user) {
        setIsAdmin(false)
        setChecking(false)
        return
      }

      const email = user.email?.toLowerCase()

      // Владелец всегда админ
      if (email === OWNER_EMAIL) {
        setIsAdmin(true)
        setChecking(false)
        return
      }

      // Проверяем в таблице admin_users
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('id, role')
          .eq('email', email)
          .single()

        if (error || !data) {
          setIsAdmin(false)
        } else {
          setIsAdmin(true)
        }
      } catch (e) {
        setIsAdmin(false)
      }

      setChecking(false)
    }

    if (!loading) {
      checkAdminAccess()
    }
  }, [user, loading])

  if (loading || checking) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#f5f5f7',
        color: '#86868b',
        fontSize: '14px'
      }}>
        Проверка доступа...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <AdminApp />
}
