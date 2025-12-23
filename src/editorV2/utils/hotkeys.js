// GLOBAL HOTKEY SYSTEM FOR DM EDITOR

export function registerHotkeys(actions = {}) {
  const handler = (e) => {
    // zoom in  (Ctrl + = / Ctrl + +)
    if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
      e.preventDefault()
      actions.zoomIn && actions.zoomIn()
      return
    }

    // zoom out (Ctrl + -)
    if ((e.ctrlKey || e.metaKey) && e.key === '-') {
      e.preventDefault()
      actions.zoomOut && actions.zoomOut()
      return
    }

    // fit (Ctrl + 0)
    if ((e.ctrlKey || e.metaKey) && e.key === '0') {
      e.preventDefault()
      actions.fit && actions.fit()
      return
    }

    // 100% (Ctrl + 1)
    if ((e.ctrlKey || e.metaKey) && e.key === '1') {
      e.preventDefault()
      actions.fit && actions.fit()   // можно сделать actions.zoom100 если хочешь
      return
    }

    // toggle grid (G)
    if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === 'g') {
      e.preventDefault()
      actions.toggleGrid && actions.toggleGrid()
      return
    }

    // toggle right panel (Tab)
    if (e.key === 'Tab') {
      e.preventDefault()
      actions.togglePanel && actions.togglePanel()
      return
    }

    // play/pause (Space) - приоритет над панорамированием
    if (e.code === 'Space' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Проверяем, не в поле ввода ли мы
      const target = e.target
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }
      // Предотвращаем событие и останавливаем распространение
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
      // Вызываем play/pause
      if (actions.playPause) {
        actions.playPause()
      }
      return
    }
  }

  // Используем capture phase, чтобы обработать Space до других обработчиков
  window.addEventListener('keydown', handler, true)
  return () => window.removeEventListener('keydown', handler, true)
}
