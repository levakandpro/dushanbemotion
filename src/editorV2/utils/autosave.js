import { useEffect, useState, useRef } from 'react'

/*
 AUTOSAVE STATES:
  - idle        → ничего не происходит
  - saving      → идет сохранение (точка мигает)
  - saved       → успешно сохранено
*/

/**
 * Хук для отслеживания состояния автосохранения проекта
 * Теперь работает с новой системой ProjectPersistence
 * @param {EditorProject} project
 * @returns {{autosaveState: string}}
 */
export function useAutosave(project) {
  const [autosaveState, setAutosaveState] = useState('saved')
  const lastProjectIdRef = useRef(null)
  const lastUpdatedAtRef = useRef(null)

  useEffect(() => {
    if (!project || !project.projectId) {
      setAutosaveState('idle')
      return
    }

    // Если проект изменился (новый проект или загружен другой)
    if (lastProjectIdRef.current !== project.projectId) {
      lastProjectIdRef.current = project.projectId
      lastUpdatedAtRef.current = project.updatedAt
      setAutosaveState('saved')
      return
    }

    // Если проект обновился (updatedAt изменился)
    if (lastUpdatedAtRef.current !== project.updatedAt) {
      lastUpdatedAtRef.current = project.updatedAt
      
      // Показываем состояние "сохранение" на короткое время
      setAutosaveState('saving')
      
      // Через небольшую задержку показываем "сохранено"
      const timeout = setTimeout(() => {
        setAutosaveState('saved')
      }, 500)
      
      return () => clearTimeout(timeout)
    }
  }, [project?.projectId, project?.updatedAt])

  return {
    autosaveState
  }
}
