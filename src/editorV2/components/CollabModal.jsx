// src/editorV2/components/CollabModal.jsx

import React, { useState, useEffect } from 'react'
import { getCurrentUser } from '../../services/userService'
import { supabase } from '../../services/supabaseClient'
import Loader from '../../components/ui/Loader'
import './CollectionModal.css'

export default function CollabModal({ asset, assetType, onClose, onSuccess }) {
  const [collabs, setCollabs] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    loadCollabs()
  }, [])

  const loadCollabs = async () => {
    try {
      setLoading(true)
      const user = await getCurrentUser()
      if (!user) {
        onClose()
        return
      }

      // Загружаем коллабы пользователя
      const { data, error } = await supabase
        .from('collabs')
        .select('*')
        .or(`author1_id.eq.${user.id},author2_id.eq.${user.id}`)
        .in('status', ['active', 'pending'])
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading collabs:', error)
        setCollabs([])
        return
      }

      // Загружаем данные партнёров
      if (data && data.length > 0) {
        const partnerIds = new Set()
        data.forEach(c => {
          if (c.author1_id !== user.id) partnerIds.add(c.author1_id)
          if (c.author2_id !== user.id) partnerIds.add(c.author2_id)
        })

        let partnersMap = {}
        if (partnerIds.size > 0) {
          const { data: partners } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url')
            .in('id', Array.from(partnerIds))

          if (partners) {
            partnersMap = partners.reduce((acc, p) => {
              acc[p.id] = p
              return acc
            }, {})
          }
        }

        // Добавляем данные партнёра к каждому коллабу
        const collabsWithPartners = data.map(collab => {
          const partnerId = collab.author1_id === user.id ? collab.author2_id : collab.author1_id
          const partner = partnersMap[partnerId]
          return {
            ...collab,
            partner_name: partner?.display_name || partner?.username || 'Партнёр',
            partner_avatar: partner?.avatar_url
          }
        })

        setCollabs(collabsWithPartners)
      } else {
        setCollabs([])
      }
    } catch (error) {
      console.error('Error loading collabs:', error)
      setCollabs([])
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  const handleAddToCollab = async (collab) => {
    if (adding) return

    try {
      setAdding(collab.id)
      const user = await getCurrentUser()
      if (!user) return

      // Получаем URL изображения
      const imageUrl = asset?.url || asset?.key || asset
      console.log('Adding to collab:', { asset, imageUrl, collabId: collab.id })

      if (!imageUrl) {
        showToast('Ошибка: URL изображения не найден')
        return
      }

      // Добавляем в collab_materials
      const insertData = {
        collab_id: collab.id,
        owner_id: user.id,
        title: asset?.name || 'Фон',
        preview_url: imageUrl,
        status: 'approved'
      }
      console.log('Insert data:', insertData)
      
      const { data, error } = await supabase
        .from('collab_materials')
        .insert(insertData)
        .select()

      if (error) {
        console.error('Error adding to collab:', error)
        showToast('Ошибка добавления: ' + error.message)
        return
      }
      
      console.log('Successfully added:', data)

      showToast(`Добавлено в коллаб "${collab.title}"`)
      if (onSuccess) {
        onSuccess(collab.id)
      }
      setTimeout(() => onClose(), 1500)
    } catch (error) {
      console.error('Error adding to collab:', error)
      showToast('Ошибка добавления')
    } finally {
      setAdding(null)
    }
  }

  return (
    <div className="dm-collection-modal-backdrop" onClick={onClose}>
      <div className="dm-collection-modal" onClick={e => e.stopPropagation()}>
        <div className="dm-collection-modal-header">
          <h3>Добавить в коллаб</h3>
          <button className="dm-collection-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="dm-collection-modal-content">
          {loading ? (
            <Loader fullscreen={false} size="minimal" showText={false} />
          ) : collabs.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3, marginBottom: '12px' }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0 0 8px' }}>У вас пока нет коллабов</p>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Создайте коллаб в кабинете автора</span>
            </div>
          ) : (
            <div className="dm-collection-modal-list">
              {collabs.map(collab => (
                <div
                  key={collab.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '8px',
                    cursor: adding === collab.id ? 'not-allowed' : 'pointer',
                    opacity: adding === collab.id ? 0.6 : 1
                  }}
                  onClick={() => !adding && handleAddToCollab(collab)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, opacity: 0.7 }}>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <div style={{ flex: 1 }}>
                    <div className="dm-collection-modal-item-name">{collab.title}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '2px' }}>
                      с {collab.partner_name}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: collab.status === 'active' ? 'rgba(0, 255, 180, 0.15)' : 'rgba(255, 193, 7, 0.15)',
                    color: collab.status === 'active' ? 'rgba(0, 255, 180, 0.9)' : 'rgba(255, 193, 7, 0.9)'
                  }}>
                    {collab.status === 'active' ? '✓' : '⏳'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {toast && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(18, 18, 24, 0.95)',
            border: '1px solid rgba(92, 255, 212, 0.3)',
            borderRadius: '8px',
            padding: '12px 20px',
            color: 'rgba(92, 255, 212, 0.9)',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: 10002,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
          }}>
            {toast}
          </div>
        )}
      </div>
    </div>
  )
}
