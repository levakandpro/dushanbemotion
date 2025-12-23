import React, { createContext, useContext, useState } from 'react'

const TextPanelTabsContext = createContext(null)

export function TextPanelTabsProvider({ children }) {
  const [activeSection, setActiveSection] = useState('text')
  
  return (
    <TextPanelTabsContext.Provider value={{ activeSection, setActiveSection }}>
      {children}
    </TextPanelTabsContext.Provider>
  )
}

export function useTextPanelTabs() {
  const context = useContext(TextPanelTabsContext)
  if (!context) {
    // Fallback для случаев когда контекст не используется
    return { activeSection: 'text', setActiveSection: () => {} }
  }
  return context
}

