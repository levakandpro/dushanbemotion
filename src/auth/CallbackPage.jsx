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
          window.location.hash = ''
          navigate('/auth/login?error=auth_failed', { replace: true })
          return
        }

        if (!data?.session) {
          // Если нет сессии, но есть access_token в hash, ждем немного и проверяем снова
          if (accessToken) {
            // Ждем обработки hash Supabase
            setTimeout(async () => {
              try {
                const { data: retryData, error: retryError } = await supabase.auth.getSession()
                if (retryError || !retryData?.session) {
                  window.location.hash = ''
                  navigate('/auth/login?error=auth_failed', { replace: true })
                  return
                }
                
                // Очищаем hash после успешной авторизации
                window.location.hash = ''
                
                // Редиректим в зависимости от роли пользователя
                const userProfile = await getCurrentUser()
                if (userProfile) {
                  console.log('[CallbackPage] User logged in via OAuth (retry), sending Telegram notification...', { 
                    userId: retryData.session.user.id, 
                    email: retryData.session.user.email 
                  });
                  
                  // Отправляем уведомление в Telegram о входе пользователя (OAuth)
                  import('../services/telegramService')
                    .then(({ notifyUserLogin }) => {
                      console.log('[CallbackPage] notifyUserLogin function loaded (retry)');
                      const displayName = userProfile.display_name || userProfile.username || retryData.session.user.email?.split('@')[0] || 'Не указано';
                      const username = userProfile.username || null;
                      const email = retryData.session.user.email || 'не указан';
                      
                      console.log('[CallbackPage] Calling notifyUserLogin with (retry):', { displayName, username, email });
                      return notifyUserLogin(displayName, username, email, 'google');
                    })
                    .then((result) => {
                      console.log('[CallbackPage] ✅ Telegram notification result (retry):', result)
                    })
                    .catch((e) => {
                      console.error('[CallbackPage] ❌ Telegram notification error (retry):', e);
                      console.error('[CallbackPage] Error stack (retry):', e.stack);
                    })

                  if (ADMIN_EMAILS.includes(userProfile.email?.toLowerCase())) {
                    navigate('/admin', { replace: true })
                  } else {
                    navigate('/editor', { replace: true })
                  }
                } else {
                  navigate('/auth/login?error=auth_failed', { replace: true })
                }
              } catch (err) {
                console.error('Retry callback error:', err)
                window.location.hash = ''
                navigate('/auth/login?error=auth_failed', { replace: true })
              }
            }, 500)
            return
          }
          window.location.hash = ''
          navigate('/auth/login?error=auth_failed', { replace: true })
          return
        }

        // Очищаем hash после успешной авторизации
        window.location.hash = ''
        
        // Редиректим в зависимости от роли пользователя
        const userProfile = await getCurrentUser()
        if (userProfile) {
          console.log('[CallbackPage] User logged in via OAuth, sending Telegram notification...', { 
            userId: data.session.user.id, 
            email: data.session.user.email 
          });
          
          // Отправляем уведомление в Telegram о входе пользователя (OAuth)
          import('../services/telegramService')
            .then(({ notifyUserLogin }) => {
              console.log('[CallbackPage] notifyUserLogin function loaded');
              const displayName = userProfile.display_name || userProfile.username || data.session.user.email?.split('@')[0] || 'Не указано';
              const username = userProfile.username || null;
              const email = data.session.user.email || 'не указан';
              
              console.log('[CallbackPage] Calling notifyUserLogin with:', { displayName, username, email });
              return notifyUserLogin(displayName, username, email, 'google');
            })
            .then((result) => {
              console.log('[CallbackPage] ✅ Telegram notification result:', result)
            })
            .catch((e) => {
              console.error('[CallbackPage] ❌ Telegram notification error:', e);
              console.error('[CallbackPage] Error stack:', e.stack);
            })

          if (ADMIN_EMAILS.includes(userProfile.email?.toLowerCase())) {
            navigate('/admin', { replace: true })
          } else {
            navigate('/editor', { replace: true })
          }
        } else {
          navigate('/auth/login?error=auth_failed', { replace: true })
        }
      } catch (err) {
        console.error('Callback error:', err)
        window.location.hash = ''
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
