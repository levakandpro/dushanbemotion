// src/admin/store/adminStore.js
import React, { createContext, useContext, useState } from 'react'

const AdminContext = createContext(null)

export function AdminProvider({ children }) {
  const [currentScreen, setCurrentScreen] = useState('dashboard')

  const value = {
    currentScreen,
    setScreen: setCurrentScreen,
  }

  // без JSX, чтобы не было ошибки Vite
  return React.createElement(AdminContext.Provider, { value }, children)
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) {
    throw new Error('useAdmin must be used inside AdminProvider')
  }
  return ctx
}
