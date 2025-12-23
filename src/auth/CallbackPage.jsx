// src/auth/CallbackPage.jsx
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { getCurrentUser } from '../services/userService'
import { ADMIN_EMAILS } from './adminConfig'

export default function CallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Auth callback error:', error)
          navigate('/auth/login?error=auth_failed')
          return
        }

        if (!data?.session) {
          navigate('/auth/login?error=auth_failed')
          return
        }

        // Редиректим в зависимости от роли пользователя
        const user = await getCurrentUser()
        if (user) {
          // Если админ - направляем в админку
          if (ADMIN_EMAILS.includes(user.email?.toLowerCase())) {
            navigate('/admin')
          } else {
            navigate('/editor')
          }
        } else {
          navigate('/auth/login?error=auth_failed')
        }
      } catch (err) {
        console.error('Callback error:', err)
        navigate('/auth/login?error=auth_failed')
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: 'white',
        background: '#061410',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '24px', marginBottom: '16px' }}>⟳</div>
        <div>Обработка входа...</div>
      </div>
    </div>
  )
}
