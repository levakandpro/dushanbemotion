import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import EditorShell from './layout/EditorShell'
import BazaView from './screens/BazaView'
import ErrorDisplay from './components/ErrorDisplay'
import { StickerPreviewProvider } from './context/StickerPreviewContext'
import { ToastProvider } from './context/ToastContext'
import { createEmptyProject } from './types/projectTypes'

// Стили
import './styles/editorV2-global.css'
import './styles/editorV2-shell.css'
import './styles/editorV2-toolbar.css'
import './styles/editorV2-panels.css'
import './styles/editorV2-canvas.css'
import './styles/sticker-animations.css'
import './styles/editorV2-mobile.css' // МОБИЛЬНЫЕ СТИЛИ - ДОЛЖНЫ БЫТЬ ПОСЛЕДНИМИ
import './styles/editorV2-canon.css' // КАНОНИЧЕСКИЕ РАЗМЕРЫ ДЛЯ ДЕСКТОПА - ПОСЛЕ МОБИЛЬНЫХ

// Theme + Fonts
import './theme/colors'
import './fonts/fontRegistry'

export default function EditorV2Screen() {
  const navigate = useNavigate()
  
  // Состояния интерфейса
  const [activeTool, setActiveTool] = useState('background')
  const [isCleanView, setIsCleanView] = useState(false)
  const [screen, setScreen] = useState('editor')
  
  // Состояние сцены (инициализируем один раз при загрузке)
  const [scene, setScene] = useState(() => 
    createEmptyProject({
      backgroundType: 'white',
      aspectRatio: '16:9',
      name: 'Preview'
    })
  )

  // Обновление сцены через useCallback, чтобы не пересоздавать функцию при каждом рендере
  const handleUpdateScene = useCallback((next) => {
    setScene(prev => ({
      ...prev,
      ...next,
      updatedAt: Date.now()
    }))
  }, [])

  // Отладочные логи
  React.useEffect(() => {
    console.log('EditorV2Screen render:', { screen, isCleanView, activeTool, hasScene: !!scene })
  }, [screen, isCleanView, activeTool, scene])

  return (
    <ToastProvider>
      <StickerPreviewProvider>
        <div className="dm-editor-root">
          <div style={{ display: screen === 'editor' ? 'block' : 'none' }}>
            {screen === 'editor' && (
            <EditorShell
              project={scene}
              activeTool={activeTool}
              onChangeTool={setActiveTool}
              onChangeProject={handleUpdateScene}
              onAccount={() => navigate('/account')}
              onOpenBaza={() => setScreen('baza')}
              isCleanView={isCleanView}
              onToggleCleanView={() => setIsCleanView(v => !v)}
            />
            )}
          </div>

          <div style={{ display: screen === 'baza' ? 'block' : 'none' }}>
            {screen === 'baza' && <BazaView onBack={() => setScreen('editor')} />}
          </div>

          {/* Глобальный компонент ошибок */}
          <ErrorDisplay />
        </div>
      </StickerPreviewProvider>
    </ToastProvider>
  )
}
