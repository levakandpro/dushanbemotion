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
        // Обрабатываем hash из URL (access_token может быть в hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        
        // Если есть hash с токеном, Supabase должен обработать его автоматически
        // Но сначала проверим текущую сессию
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Auth callback error:', error)
          // Очищаем hash и редиректим на логин
          window.location.hash = ''
          navigate('/auth/login?error=auth_failed')
          return
        }

        if (!data?.session) {
          // Если нет сессии, но есть access_token в hash, ждем немного и проверяем снова
          if (accessToken) {
            // Ждем обработки hash Supabase
            setTimeout(async () => {
              const { data: retryData, error: retryError } = await supabase.auth.getSession()
              if (retryError || !retryData?.session) {
                window.location.hash = ''
                navigate('/auth/login?error=auth_failed')
                return
              }
              await handleSuccess(retryData.session.user)
            }, 500)
            return
          }
          window.location.hash = ''
          navigate('/auth/login?error=auth_failed')
          return
        }

        await handleSuccess(data.session.user)
      } catch (err) {
        console.error('Callback error:', err)
        window.location.hash = ''
        navigate('/auth/login?error=auth_failed')
      }
    }

    async function handleSuccess(user) {
      // Очищаем hash после успешной авторизации
      window.location.hash = ''
      
      // Редиректим в зависимости от роли пользователя
      const userProfile = await getCurrentUser()
      if (userProfile) {
        // Если админ - направляем в админку
        if (ADMIN_EMAILS.includes(userProfile.email?.toLowerCase())) {
          navigate('/admin', { replace: true })
        } else {
          navigate('/editor', { replace: true })
        }
      } else {
        navigate('/auth/login?error=auth_failed', { replace: true })
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
