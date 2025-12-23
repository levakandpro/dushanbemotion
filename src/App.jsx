// src/App.jsx
import React from 'react'
import AppRouter from './app/router'
import { ThemeProvider } from './components/ui/ThemeSwitcher'

function App() {
  return (
    <ThemeProvider>
      <div className="dm-root">
        <AppRouter />
      </div>
    </ThemeProvider>
  )
}

export default App
