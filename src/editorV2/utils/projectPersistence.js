// src/editorV2/utils/projectPersistence.js

/**
 * Сервис для сохранения и загрузки проектов из localStorage
 */

const STORAGE_PREFIX = 'dmotion:project:'
const STORAGE_VERSION = 1

/**
 * Получает ключ для хранения проекта в localStorage
 * @param {string} projectId
 * @returns {string}
 */
function getStorageKey(projectId) {
  return `${STORAGE_PREFIX}${projectId}`
}

/**
 * Мигрирует старый формат проекта в новый
 * @param {Object} oldProject
 * @returns {EditorProject}
 */
function migrateProject(oldProject) {
  // Миграция из старого формата
  const migrated = {
    ...oldProject,
    // Обновляем ID
    projectId: oldProject.projectId || oldProject.id || `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    // Мигрируем фон
    background: oldProject.background || {
      type: oldProject.backgroundType || 'transparent',
      value: oldProject.backgroundType && 
        !['transparent', 'white', 'black'].includes(oldProject.backgroundType)
        ? oldProject.backgroundType
        : undefined,
      alpha: oldProject.backgroundAlpha !== undefined ? oldProject.backgroundAlpha : 1,
      checkerboardIntensity: oldProject.checkerboardIntensity || 'light'
    },
    // Сохраняем старые поля для обратной совместимости
    backgroundType: oldProject.backgroundType || 'transparent',
    backgroundAlpha: oldProject.backgroundAlpha !== undefined ? oldProject.backgroundAlpha : 1,
    checkerboardIntensity: oldProject.checkerboardIntensity || 'light',
    // Обновляем временные метки
    createdAt: oldProject.createdAt || Date.now(),
    updatedAt: oldProject.updatedAt || Date.now(),
    // Убеждаемся, что есть все необходимые поля
    durationMs: oldProject.durationMs || (oldProject.timeline?.projectDuration || 30) * 1000
  }
  
  // Мигрируем клипы: устанавливаем endTime = startTime + 10 для ВСЕХ текстовых и стикерных клипов
  if (migrated.textClips && Array.isArray(migrated.textClips)) {
    migrated.textClips = migrated.textClips.map(clip => {
      const duration = clip.endTime - (clip.startTime || 0)
      // Если клип длиннее 10 секунд - сокращаем до 10 секунд (исправляем старый формат)
      if (duration > 10) {
        return {
          ...clip,
          endTime: (clip.startTime || 0) + 10
        }
      }
      return clip
    })
  }
  
  if (migrated.stickerClips && Array.isArray(migrated.stickerClips)) {
    migrated.stickerClips = migrated.stickerClips.map(clip => {
      const duration = clip.endTime - (clip.startTime || 0)
      // Если клип длиннее 10 секунд - сокращаем до 10 секунд (исправляем старый формат)
      if (duration > 10) {
        return {
          ...clip,
          endTime: (clip.startTime || 0) + 10
        }
      }
      return clip
    })
  }
  
  // Удаляем старый id если он отличается от projectId
  if (migrated.id && migrated.id !== migrated.projectId) {
    delete migrated.id
  }
  
  return migrated
}

/**
 * Загружает проект из localStorage
 * @param {string} projectId
 * @returns {EditorProject | null}
 */
export function loadLocal(projectId) {
  if (!projectId) {
    console.warn('ProjectPersistence.loadLocal: projectId is required')
    return null
  }

  try {
    const key = getStorageKey(projectId)
    const stored = localStorage.getItem(key)
    
    if (!stored) {
      console.log(`📭 ProjectPersistence.loadLocal: No project found for ${projectId}`)
      return null
    }

    const parsed = JSON.parse(stored)
    
    // Проверяем версию формата
    if (parsed._version !== STORAGE_VERSION) {
      console.log(`🔄 ProjectPersistence.loadLocal: Migrating project from version ${parsed._version || 'legacy'} to ${STORAGE_VERSION}`)
    }

    // Удаляем служебные поля
    const { _version, ...project } = parsed
    
    // Мигрируем проект если нужно
    const migratedProject = migrateProject(project)
    
    // ВСЕГДА сбрасываем playhead на 0 при загрузке
    if (migratedProject.timeline) {
      migratedProject.timeline.currentTime = 0
    }
    
    console.log(`ProjectPersistence.loadLocal: Loaded project ${projectId}`)
    return migratedProject
  } catch (error) {
    console.error('ProjectPersistence.loadLocal: Error loading project', error)
    return null
  }
}

/**
 * Сохраняет проект в localStorage
 * @param {EditorProject} project
 * @returns {boolean} Успешно ли сохранено
 */
export function saveLocal(project) {
  if (!project || !project.projectId) {
    console.warn('ProjectPersistence.saveLocal: Invalid project or missing projectId')
    return false
  }

  try {
    const key = getStorageKey(project.projectId)
    
    // Синхронизируем старый и новый формат фона перед сохранением
    const syncedProject = {
      ...project,
      // Обновляем backgroundType из background для обратной совместимости
      backgroundType: project.background?.type === 'color' && project.background?.value
        ? project.background.value
        : project.background?.type === 'gradient' && project.background?.value
        ? project.background.value
        : project.background?.type === 'image' && project.background?.value
        ? `url(${project.background.value})`
        : project.background?.type || project.backgroundType || 'transparent',
      backgroundAlpha: project.background?.alpha !== undefined ? project.background.alpha : (project.backgroundAlpha || 1),
      checkerboardIntensity: project.background?.checkerboardIntensity || project.checkerboardIntensity || 'light'
    }
    
    // Обновляем время последнего изменения
    const projectToSave = {
      ...syncedProject,
      updatedAt: Date.now(),
      _version: STORAGE_VERSION
    }

    const serialized = JSON.stringify(projectToSave)
    
    // Проверяем размер данных (localStorage ограничен ~5-10MB)
    if (serialized.length > 5 * 1024 * 1024) {
      console.warn('ProjectPersistence.saveLocal: Project size exceeds 5MB, may fail')
    }

    localStorage.setItem(key, serialized)
    
    console.log(`💾 ProjectPersistence.saveLocal: Saved project ${project.projectId}`)
    return true
  } catch (error) {
    console.error('ProjectPersistence.saveLocal: Error saving project', error)
    
    // Если ошибка из-за переполнения, пытаемся очистить старые проекты
    if (error.name === 'QuotaExceededError') {
      console.warn('ProjectPersistence.saveLocal: Storage quota exceeded, attempting cleanup...')
      cleanupOldProjects()
      
      // Пытаемся сохранить снова
      try {
        localStorage.setItem(key, serialized)
        return true
      } catch (retryError) {
        console.error('ProjectPersistence.saveLocal: Failed after cleanup', retryError)
        return false
      }
    }
    
    return false
  }
}

/**
 * Удаляет проект из localStorage
 * @param {string} projectId
 * @returns {boolean}
 */
export function deleteLocal(projectId) {
  if (!projectId) {
    return false
  }

  try {
    const key = getStorageKey(projectId)
    localStorage.removeItem(key)
    console.log(`ProjectPersistence.deleteLocal: Deleted project ${projectId}`)
    return true
  } catch (error) {
    console.error('ProjectPersistence.deleteLocal: Error deleting project', error)
    return false
  }
}

/**
 * Получает список всех сохраненных проектов
 * @returns {Array<{projectId: string, name: string, updatedAt: number}>}
 */
export function listLocalProjects() {
  const projects = []
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      
      if (key && key.startsWith(STORAGE_PREFIX)) {
        try {
          const stored = localStorage.getItem(key)
          const parsed = JSON.parse(stored)
          
          projects.push({
            projectId: parsed.projectId,
            name: parsed.name || 'Без названия',
            updatedAt: parsed.updatedAt || 0,
            createdAt: parsed.createdAt || 0
          })
        } catch (error) {
          console.warn(`ProjectPersistence.listLocalProjects: Failed to parse ${key}`, error)
        }
      }
    }
    
    // Сортируем по времени обновления (новые первыми)
    projects.sort((a, b) => b.updatedAt - a.updatedAt)
    
    return projects
  } catch (error) {
    console.error('ProjectPersistence.listLocalProjects: Error listing projects', error)
    return []
  }
}

/**
 * Очищает старые проекты, оставляя только последние N
 * @param {number} keepCount - Количество проектов для сохранения
 */
export function cleanupOldProjects(maxAge = 30 * 24 * 60 * 60 * 1000) {
  // maxAge по умолчанию: 30 дней в миллисекундах
  const projects = listLocalProjects()
  const now = Date.now()
  let deletedCount = 0

  for (const project of projects) {
    const age = now - project.updatedAt
    
    if (age > maxAge) {
      if (deleteLocal(project.projectId)) {
        deletedCount++
      }
    }
  }

  console.log(`🧹 ProjectPersistence.cleanupOldProjects: Deleted ${deletedCount} old projects`)
  return deletedCount
}

/**
 * Очищает все проекты из localStorage
 * @returns {number} Количество удаленных проектов
 */
export function clearAllProjects() {
  const projects = listLocalProjects()
  let deletedCount = 0

  for (const project of projects) {
    if (deleteLocal(project.projectId)) {
      deletedCount++
    }
  }

  console.log(`ProjectPersistence.clearAllProjects: Deleted ${deletedCount} projects`)
  return deletedCount
}

