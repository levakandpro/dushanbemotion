// src/editorV2/screens/ProjectsListScreen.jsx

import React, { useState, useEffect } from 'react'
import { loadProjectList, deleteProject } from '../../lib/projectStorage'
import { useAuth } from '../../lib/useAuth'
import Loader from '../../components/ui/Loader'
import './ProjectsListScreen.css'

export default function ProjectsListScreen({ onSelectProject, onNewProject }) {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user) {
      loadProjects()
    } else {
      setLoading(false)
    }
  }, [user])

  const loadProjects = async () => {
    if (!user) return

    try {
      setLoading(true)
      const data = await loadProjectList(user.id)
      setProjects(data || [])
      setError(null)
    } catch (err) {
      console.error('Error loading projects:', err)
      setError('Ошибка загрузки проектов')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (projectId, e) => {
    e.stopPropagation()
    
    if (!confirm('Удалить этот проект?')) {
      return
    }

    try {
      await deleteProject(projectId)
      await loadProjects()
    } catch (err) {
      console.error('Error deleting project:', err)
      alert('Ошибка при удалении проекта')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getProjectDate = (project) => {
    return project.updated_at || project.created_at || ''
  }

  if (loading) {
    return <Loader />
  }

  return (
    <div className="projects-list-screen">
      <div className="projects-list-header">
        <h1 className="projects-list-title">Панель автора</h1>
        <button
          className="projects-list-new-btn"
          onClick={onNewProject}
        >
          + Новый проект
        </button>
      </div>

      {error && (
        <div className="projects-list-error">
          <p>{error}</p>
          <button onClick={loadProjects}>Повторить</button>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="projects-list-empty">
          <p>У вас пока нет проектов</p>
          <button
            className="projects-list-new-btn"
            onClick={onNewProject}
          >
            Создать первый проект
          </button>
        </div>
      ) : (
        <div className="projects-list-grid">
          {projects.map((project) => (
            <div
              key={project.id}
              className="projects-list-item"
              onClick={() => onSelectProject(project.id)}
            >
              {project.thumbnail_url ? (
                <div
                  className="projects-list-thumbnail"
                  style={{ backgroundImage: `url(${project.thumbnail_url})` }}
                />
              ) : (
                <div className="projects-list-thumbnail-placeholder">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
              )}
              <div className="projects-list-item-content">
                <h3 className="projects-list-item-title">{project.title}</h3>
                <p className="projects-list-item-date">
                  {formatDate(getProjectDate(project))}
                </p>
              </div>
              <button
                className="projects-list-item-delete"
                onClick={(e) => handleDelete(project.id, e)}
                title="Удалить проект"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

