// src/editorV2/components/CollectionModal.jsx
import React, { useState, useEffect } from 'react'
import { getMyCollections, addItemToCollection, createCollection } from '../../services/collectionService'
import './CollectionModal.css'

export default function CollectionModal({ asset, assetType, onClose, onSuccess }) {
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    loadCollections()
  }, [])

  const loadCollections = async () => {
    try {
      setLoading(true)
      const data = await getMyCollections()
      // Сортировка: D COLLECTION всегда первая в списке
      const sorted = (data || []).sort((a, b) => {
        if (a.title === 'D COLLECTION') return -1;
        if (b.title === 'D COLLECTION') return 1;
        return 0;
      });
      setCollections(sorted)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCollection = async (colId) => {
    try {
      await addItemToCollection(colId, asset.id, assetType)
      showNotice("СОХРАНЕНО В ОБЛАКО")
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1000)
    } catch (err) {
      showNotice("ОШИБКА ДОСТУПА")
    }
  }

  const handleCreate = async () => {
    if (!newCollectionName.trim()) return
    try {
      await createCollection(newCollectionName.trim())
      setNewCollectionName('')
      setShowCreateForm(false)
      loadCollections()
    } catch (err) {
      showNotice("ОШИБКА СОЗДАНИЯ")
    }
  }

  const showNotice = (text) => {
    setToast(text)
    setTimeout(() => setToast(null), 2500)
  }

  return (
    <div className="dm-modal-backdrop" onClick={onClose}>
      <div className="dm-modal-card" onClick={e => e.stopPropagation()}>
        
        {/* ФИКСИРОВАННАЯ ШАПКА */}
        <div className="dm-modal-header">
          <div className="dm-header-left">
            {showCreateForm && (
              <button className="dm-nav-btn dm-back-btn" onClick={() => setShowCreateForm(false)} title="Назад">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              </button>
            )}
            <div className="dm-header-title">
               <span className="dm-dot"></span>
               <h3>{showCreateForm ? 'НОВАЯ ПАПКА' : 'СОХРАНЕНИЕ'}</h3>
            </div>
          </div>

          <button className="dm-nav-btn dm-close-btn" onClick={onClose} title="Закрыть">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="dm-modal-body">
          {loading ? (
            <div className="dm-premium-loader"><div className="dm-loader-ring"></div></div>
          ) : (
            <>
              {showCreateForm ? (
                <div className="dm-create-form">
                  <div className="dm-input-group">
                    <input 
                      autoFocus
                      placeholder="Введите название..." 
                      value={newCollectionName}
                      onChange={e => setNewCollectionName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    />
                  </div>
                  <div className="dm-form-actions">
                    <button className="dm-btn-cancel" onClick={() => setShowCreateForm(false)}>ОТМЕНИТЬ</button>
                    <button className="dm-btn-primary" onClick={handleCreate}>ПОДТВЕРДИТЬ</button>
                  </div>
                </div>
              ) : (
                <>
                  {/* СПИСОК ПАПОК СО СКРОЛЛОМ */}
                  <div className="dm-collections-scroll-area">
                    {collections.map(col => {
                      const isSystem = col.title === 'D COLLECTION';
                      return (
                        <div 
                          key={col.id} 
                          className={`dm-collection-item ${isSystem ? 'dm-system-col' : ''}`} 
                          onClick={() => handleAddToCollection(col.id)}
                        >
                          <div className="dm-col-info">
                            {isSystem ? (
                                <span className="dm-icon-star">★</span>
                            ) : (
                                <span className="dm-icon-folder">📁</span>
                            )}
                            <span className="dm-col-name">{col.title}</span>
                          </div>
                          <div className="dm-col-action">
                             {isSystem ? <span className="dm-badge">DEFAULT</span> : <span className="dm-add-plus">+</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* ФИКСИРОВАННЫЙ ПОДВАЛ */}
                  <div className="dm-modal-footer">
                    <button className="dm-add-new-btn" onClick={() => setShowCreateForm(true)}>
                      <span className="dm-plus-icon">+</span> СОЗДАТЬ КОЛЛЕКЦИЮ
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {toast && <div className="dm-mini-toast">{toast}</div>}
      </div>
    </div>
  )
}