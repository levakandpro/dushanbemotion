// src/components/PromoModal/usePromoModal.js
// Хук для управления показом промо-окна

import { useState, useCallback } from 'react'

export function usePromoModal() {
  const [isOpen, setIsOpen] = useState(false)

  // Показать промо — ВСЕГДА показываем
  const showPromo = useCallback(() => {
    setIsOpen(true)
  }, [])

  // Закрыть промо
  const closePromo = useCallback(() => {
    setIsOpen(false)
  }, [])

  // Показать при первом входе (mount)
  const showOnMount = useCallback(() => {
    // Небольшая задержка чтобы страница успела загрузиться
    setTimeout(() => {
      showPromo()
    }, 1500)
  }, [showPromo])

  return {
    isOpen,
    showPromo,
    closePromo,
    showOnMount
  }
}

export default usePromoModal
