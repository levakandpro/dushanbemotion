// src/editorV2/components/AssetSearchBar.jsx
import React, { useState, useCallback } from 'react'
import './AssetSearchBar.css'

export default function AssetSearchBar({ 
  onSearch, 
  onFilterChange,
  placeholder = 'Найти вдохновение...',
  showPremiumFilter = true
}) {
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  const handleSearch = (text, filter) => {
    onSearch?.(text, { isPremium: filter })
  }

  return (
    <div className="dm-search-container">
      <div className="dm-search-wrapper">
        <span className="dm-search-icon">🔍</span>
        <input 
          type="text" 
          className="dm-search-input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            handleSearch(e.target.value, activeFilter)
          }}
        />
        {query && (
          <button className="dm-search-clear" onClick={() => { setQuery(''); handleSearch('', activeFilter); }}>
            ✕
          </button>
        )}
      </div>

      {showPremiumFilter && (
        <div className="dm-filter-chips">
          <button 
            className={`dm-chip ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => { setActiveFilter('all'); handleSearch(query, 'all'); }}
          >
            Все
          </button>
          <button 
            className={`dm-chip ${activeFilter === true ? 'active' : ''}`}
            onClick={() => { setActiveFilter(true); handleSearch(query, true); }}
          >
            💎 Premium
          </button>
          <button 
            className={`dm-chip ${activeFilter === false ? 'active' : ''}`}
            onClick={() => { setActiveFilter(false); handleSearch(query, false); }}
          >
            Бесплатные
          </button>
        </div>
      )}
    </div>
  )
}