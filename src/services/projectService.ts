// src/services/projectService.ts

import { supabase } from './supabaseClient'
import { Project } from '../lib/projectTypes'

export interface ProjectListItem {
  id: string
  title: string
  thumbnail_url?: string | null
  created_at: string
  status?: 'draft' | 'ready'
}

/**
 * Получает список проектов пользователя
 */
export async function getUserProjects(userId: string): Promise<ProjectListItem[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('id, title, thumbnail_url, created_at, status, published')
    .eq('user_id', userId)
    .eq('archived', false)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching projects:', error)
    throw error
  }

  return data || []
}

/**
 * Получает количество опубликованных проектов пользователя
 */
export async function getPublishedProjectsCount(userId: string): Promise<number> {
  const { data, error, count } = await supabase
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('archived', false)
    .or('status.eq.published,published.eq.true')

  if (error) {
    console.error('Error counting published projects:', error)
    // Fallback: получаем все проекты и фильтруем
    try {
      const allProjects = await getUserProjects(userId)
      return allProjects.filter((p: any) => p.status === 'published' || p.published === true).length
    } catch {
      return 0
    }
  }

  return count || 0
}

/**
 * Получает архивные проекты
 */
export async function getArchivedProjects(userId: string): Promise<ProjectListItem[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('id, title, thumbnail_url, created_at')
    .eq('user_id', userId)
    .eq('archived', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching archived projects:', error)
    throw error
  }

  return data || []
}

/**
 * Получает проект по ID
 */
export async function getProjectById(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching project:', error)
    return null
  }

  if (!data || !data.data) {
    return null
  }

  return {
    ...data.data,
    id: data.id,
    title: data.title,
    thumbnail_url: data.thumbnail_url,
    created_at: data.created_at,
  }
}

/**
 * Дублирует проект
 */
export async function duplicateProject(
  projectId: string,
  userId: string
): Promise<string> {
  const project = await getProjectById(projectId)
  if (!project) {
    throw new Error('Project not found')
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      title: `${project.title} (копия)`,
      data: project,
      // Заглушка вместо null
      thumbnail_url: project.thumbnail_url || '',
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error duplicating project:', error)
    throw error
  }

  return data.id
}

/**
 * Перемещает проект в архив
 */
export async function archiveProject(projectId: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ archived: true })
    .eq('id', projectId)

  if (error) {
    console.error('Error archiving project:', error)
    throw error
  }
}

/**
 * Восстанавливает проект из архива
 */
export async function unarchiveProject(projectId: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ archived: false })
    .eq('id', projectId)

  if (error) {
    console.error('Error unarchiving project:', error)
    throw error
  }
}

/**
 * Удаляет проект
 */
export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)

  if (error) {
    console.error('Error deleting project:', error)
    throw error
  }
}

