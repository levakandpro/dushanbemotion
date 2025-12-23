// src/editorV2/utils/projectShareService.js

/**
 * Сервис для создания share-ссылок проектов
 */

const SHARE_API_URL = import.meta.env.VITE_SHARE_API_URL || 
  'https://stickers-manifest.natopchane.workers.dev/api/share'

/**
 * Сериализует проект в JSON строку
 * @param {EditorProject} project
 * @returns {string}
 */
export function serialize(project) {
  if (!project) {
    throw new Error('Project is required for serialization')
  }

  try {
    // Удаляем служебные поля перед сериализацией
    const { _version, ...cleanProject } = project
    
    return JSON.stringify(cleanProject, null, 2)
  } catch (error) {
    console.error('ProjectShareService.serialize: Error serializing project', error)
    throw new Error('Failed to serialize project')
  }
}

/**
 * Загружает сериализованный проект на сервер и получает shareId
 * @param {string} serializedProject - JSON строка проекта
 * @returns {Promise<{shareId: string, url: string}>}
 */
export async function upload(serializedProject) {
  if (!serializedProject) {
    throw new Error('Serialized project is required')
  }

  try {
    const response = await fetch(`${SHARE_API_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: serializedProject
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Upload failed: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    
    if (!data.shareId) {
      throw new Error('Invalid response: shareId is missing')
    }

    // Формируем URL для просмотра
    const baseUrl = window.location.origin
    const viewUrl = `${baseUrl}/view/${data.shareId}`

    console.log(`ProjectShareService.upload: Project shared with ID ${data.shareId}`)
    
    return {
      shareId: data.shareId,
      url: viewUrl
    }
  } catch (error) {
    console.error('ProjectShareService.upload: Error uploading project', error)
    throw error
  }
}

/**
 * Загружает проект по shareId
 * @param {string} shareId
 * @returns {Promise<EditorProject>}
 */
export async function loadShared(shareId) {
  if (!shareId) {
    throw new Error('ShareId is required')
  }

  try {
    const response = await fetch(`${SHARE_API_URL}/${shareId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Shared project not found')
      }
      throw new Error(`Failed to load shared project: ${response.status}`)
    }

    const project = await response.json()
    
    console.log(`ProjectShareService.loadShared: Loaded project ${shareId}`)
    
    return project
  } catch (error) {
    console.error('ProjectShareService.loadShared: Error loading shared project', error)
    throw error
  }
}

/**
 * Создает share-ссылку для проекта
 * @param {EditorProject} project
 * @returns {Promise<{shareId: string, url: string}>}
 */
export async function createShareLink(project) {
  if (!project) {
    throw new Error('Project is required')
  }

  const serialized = serialize(project)
  return await upload(serialized)
}






