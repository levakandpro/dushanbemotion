// src/editorV2/store/useEditorState.js
import { useState, useCallback, useMemo, useEffect } from 'react'

/**
 * Единая модель слоя для всех типов объектов
 * @typedef {Object} Layer
 * @property {string} id - Уникальный идентификатор
 * @property {'background' | 'text' | 'sticker' | 'icon' | 'image' | 'video' | 'audio'} type - Тип слоя
 * @property {number} start - Позиция по времени (секунды)
 * @property {number} duration - Длительность (секунды)
 * @property {number} zIndex - Порядок отображения
 * @property {boolean} visible - Видимость
 * @property {boolean} locked - Заблокирован
 * @property {Object} data - Данные слоя (зависит от типа)
 */

/**
 * Хук для управления единым состоянием редактора
 */
export function useEditorState(project, onChangeProject) {
  // Выбранный слой
  const [selectedLayerId, setSelectedLayerId] = useState(null)

  // Конвертируем существующие слои проекта в единый формат
  const layers = useMemo(() => {
    const result = []

    if (!project) return result

    // Фон (всегда один)
    if (project.backgroundType) {
      result.push({
        id: 'bg',
        type: 'background',
        start: 0,
        duration: project.durationMs ? project.durationMs / 1000 : 30,
        zIndex: -1000,
        visible: true,
        locked: false,
        data: {
          backgroundType: project.backgroundType,
          checkerboardIntensity: project.checkerboardIntensity || 'light'
        }
      })
    }

    // Текстовые слои
    ;(project.textLayers || []).forEach(text => {
      result.push({
        id: text.id,
        type: 'text',
        start: 0,
        duration: project.durationMs ? project.durationMs / 1000 : 30,
        startTime: 0,
        zIndex: text.zIndex || 0,
        visible: text.visible !== false,
        locked: text.locked || false,
        data: text
      })
    })

    // Стикеры
    ;(project.stickerLayers || []).forEach(sticker => {
      result.push({
        id: sticker.id,
        type: 'sticker',
        start: 0,
        duration: project.durationMs ? project.durationMs / 1000 : 30,
        startTime: 0,
        zIndex: sticker.zIndex || 0,
        visible: sticker.visible !== false,
        locked: sticker.locked || false,
        data: sticker
      })
    })

    // Иконки
    ;(project.iconLayers || []).forEach(icon => {
      result.push({
        id: icon.id,
        type: 'icon',
        start: 0,
        duration: project.durationMs ? project.durationMs / 1000 : 30,
        zIndex: icon.zIndex || 0,
        visible: icon.visible !== false,
        locked: icon.locked || false,
        data: icon
      })
    })

    // Видео
    ;(project.videoLayers || []).forEach(video => {
      result.push({
        id: video.id,
        type: 'video',
        start: 0,
        duration: project.durationMs ? project.durationMs / 1000 : 30,
        zIndex: video.zIndex || 0,
        visible: video.visible !== false,
        locked: video.locked || false,
        data: video
      })
    })

    // Рамки
    ;(project.frameLayers || []).forEach(frame => {
      result.push({
        id: frame.id,
        type: 'frame',
        start: 0,
        duration: project.durationMs ? project.durationMs / 1000 : 30,
        zIndex: frame.zIndex || 0,
        visible: frame.visible !== false,
        locked: frame.locked || false,
        data: frame
      })
    })

    // Аудио удалено для v1.0 (нет таймлайна)

    // Сортируем по zIndex (от меньшего к большему)
    return result.sort((a, b) => a.zIndex - b.zIndex)
  }, [project])

  // Синхронизация selectedLayerId с project.selected*Id
  useEffect(() => {
    if (!project) {
      setSelectedLayerId(null)
      return
    }

    // Определяем выбранный слой из project
    let foundId = null
    if (project.selectedTextId) foundId = project.selectedTextId
    else if (project.selectedStickerId) foundId = project.selectedStickerId
    else if (project.selectedIconId) foundId = project.selectedIconId
    else if (project.selectedVideoId) foundId = project.selectedVideoId
    else if (project.selectedFrameId) foundId = project.selectedFrameId

    setSelectedLayerId(foundId)
  }, [
    project?.selectedTextId,
    project?.selectedStickerId,
    project?.selectedIconId,
    project?.selectedVideoId,
    project?.selectedFrameId
  ])

  // Получить выбранный слой
  const selectedLayer = useMemo(() => {
    if (!selectedLayerId) return null
    return layers.find(l => l.id === selectedLayerId) || null
  }, [layers, selectedLayerId])

  // Выбрать слой
  const selectLayer = useCallback((layerId) => {
    if (!onChangeProject || !project) return

    setSelectedLayerId(layerId)

    // Обновляем project с соответствующим selected*Id
    const layer = layers.find(l => l.id === layerId)
    if (!layer) return

    const updates = {
      ...project,
      selectedTextId: null,
      selectedStickerId: null,
      selectedIconId: null,
      selectedVideoId: null,
      selectedFrameId: null
    }

    if (layer.type === 'text') {
      updates.selectedTextId = layerId
    } else if (layer.type === 'sticker') {
      updates.selectedStickerId = layerId
    } else if (layer.type === 'icon') {
      updates.selectedIconId = layerId
    } else if (layer.type === 'video') {
      updates.selectedVideoId = layerId
    } else if (layer.type === 'frame') {
      updates.selectedFrameId = layerId
    }

    onChangeProject(updates)
  }, [project, layers, onChangeProject])

  // Добавить новый слой
  const addLayer = useCallback((layer) => {
    if (!onChangeProject || !project) return

    const newLayer = {
      id: layer.id || `${layer.type}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type: layer.type,
      start: layer.start ?? 0,
      duration: layer.duration ?? (project.durationMs ? project.durationMs / 1000 : 30),
      zIndex: layer.zIndex ?? Math.max(...layers.map(l => l.zIndex), 0) + 1,
      visible: layer.visible !== false,
      locked: layer.locked || false,
      data: layer.data || {}
    }

    // Добавляем слой в соответствующий массив проекта
    const updates = { ...project }

    if (newLayer.type === 'text') {
      updates.textLayers = [...(project.textLayers || []), newLayer.data]
      updates.selectedTextId = newLayer.id
    } else if (newLayer.type === 'sticker') {
      updates.stickerLayers = [...(project.stickerLayers || []), newLayer.data]
      updates.selectedStickerId = newLayer.id
    } else if (newLayer.type === 'icon') {
      updates.iconLayers = [...(project.iconLayers || []), newLayer.data]
      updates.selectedIconId = newLayer.id
    } else if (newLayer.type === 'video') {
      updates.videoLayers = [...(project.videoLayers || []), newLayer.data]
      updates.selectedVideoId = newLayer.id
    } else if (newLayer.type === 'frame') {
      updates.frameLayers = [...(project.frameLayers || []), newLayer.data]
      updates.selectedFrameId = newLayer.id
    }

    onChangeProject(updates)
    setSelectedLayerId(newLayer.id)
  }, [project, layers, onChangeProject])

  // Обновить слой
  const updateLayer = useCallback((layerId, updates) => {
    if (!onChangeProject || !project) return

    const layer = layers.find(l => l.id === layerId)
    if (!layer) return

    const projectUpdates = { ...project }

    // Обновляем данные слоя
    if (layer.type === 'text') {
      // Обновляем данные слоя (если есть поля кроме start/duration/startTime)
      const layerUpdates = { ...updates }
      delete layerUpdates.start
      delete layerUpdates.startTime
      delete layerUpdates.duration
      
      if (Object.keys(layerUpdates).length > 0) {
        projectUpdates.textLayers = (project.textLayers || []).map(l =>
          l.id === layerId ? { ...l, ...layerUpdates } : l
        )
      }
      
    } else if (layer.type === 'sticker') {
      // Обновляем данные слоя (если есть поля кроме start/duration/startTime)
      const layerUpdates = { ...updates }
      delete layerUpdates.start
      delete layerUpdates.startTime
      delete layerUpdates.duration
      
      if (Object.keys(layerUpdates).length > 0) {
        projectUpdates.stickerLayers = (project.stickerLayers || []).map(l =>
          l.id === layerId ? { ...l, ...layerUpdates } : l
        )
      }
      
    } else if (layer.type === 'icon') {
      projectUpdates.iconLayers = (project.iconLayers || []).map(l =>
        l.id === layerId ? { ...l, ...updates } : l
      )
    } else if (layer.type === 'video') {
      projectUpdates.videoLayers = (project.videoLayers || []).map(l =>
        l.id === layerId ? { ...l, ...updates } : l
      )
    } else if (layer.type === 'frame') {
      projectUpdates.frameLayers = (project.frameLayers || []).map(l =>
        l.id === layerId ? { ...l, ...updates } : l
      )
    }

    onChangeProject(projectUpdates)
  }, [project, layers, onChangeProject])

  // Удалить слой
  const deleteLayer = useCallback((layerId) => {
    if (!onChangeProject || !project) return

    const layer = layers.find(l => l.id === layerId)
    if (!layer) return

    const projectUpdates = { ...project }

    // Удаляем слой из соответствующего массива
    if (layer.type === 'text') {
      projectUpdates.textLayers = (project.textLayers || []).filter(l => l.id !== layerId)
      if (projectUpdates.selectedTextId === layerId) {
        projectUpdates.selectedTextId = null
      }
    } else if (layer.type === 'sticker') {
      projectUpdates.stickerLayers = (project.stickerLayers || []).filter(l => l.id !== layerId)
      if (projectUpdates.selectedStickerId === layerId) {
        projectUpdates.selectedStickerId = null
        projectUpdates.selectedStickerClipId = null
        projectUpdates.selectedStickerClipIds = []
      }
    } else if (layer.type === 'icon') {
      projectUpdates.iconLayers = (project.iconLayers || []).filter(l => l.id !== layerId)
      if (projectUpdates.selectedIconId === layerId) {
        projectUpdates.selectedIconId = null
      }
    } else if (layer.type === 'video') {
      projectUpdates.videoLayers = (project.videoLayers || []).filter(l => l.id !== layerId)
      if (projectUpdates.selectedVideoId === layerId) {
        projectUpdates.selectedVideoId = null
      }
    } else if (layer.type === 'frame') {
      projectUpdates.frameLayers = (project.frameLayers || []).filter(l => l.id !== layerId)
      if (projectUpdates.selectedFrameId === layerId) {
        projectUpdates.selectedFrameId = null
      }
    }

    onChangeProject(projectUpdates)
    setSelectedLayerId(null)
  }, [project, layers, onChangeProject])

  // Переключить видимость слоя
  const toggleLayerVisible = useCallback((layerId) => {
    const layer = layers.find(l => l.id === layerId)
    if (!layer) return
    updateLayer(layerId, { visible: !layer.visible })
  }, [layers, updateLayer])

  // Переключить блокировку слоя
  const toggleLayerLocked = useCallback((layerId) => {
    const layer = layers.find(l => l.id === layerId)
    if (!layer) return
    updateLayer(layerId, { locked: !layer.locked })
  }, [layers, updateLayer])

  return {
    layers,
    selectedLayerId,
    selectedLayer,
    selectLayer,
    addLayer,
    updateLayer,
    deleteLayer,
    toggleLayerVisible,
    toggleLayerLocked
  }
}

