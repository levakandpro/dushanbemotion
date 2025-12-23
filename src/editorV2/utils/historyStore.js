// src/editorV2/utils/historyStore.js

/**
 * Единый store для управления историей изменений проекта (Undo/Redo)
 */

const MAX_HISTORY_DEPTH = 150 // Максимальная глубина стека

/**
 * Класс для управления историей изменений проекта
 */
export class HistoryStore {
  constructor(maxDepth = MAX_HISTORY_DEPTH) {
    this.maxDepth = maxDepth
    this.undoStack = []
    this.redoStack = []
  }

  /**
   * Добавляет состояние проекта в историю
   * Очищает redoStack при новом действии
   * @param {EditorProject} project
   */
  push(project) {
    if (!project) {
      console.warn('HistoryStore.push: Invalid project')
      return
    }

    // Добавляем в undoStack
    this.undoStack.push(this.cloneProject(project))

    // Ограничиваем размер стека
    if (this.undoStack.length > this.maxDepth) {
      this.undoStack.shift() // Удаляем самый старый элемент
    }

    // Очищаем redoStack при новом действии
    this.redoStack = []

    console.log(`📚 HistoryStore.push: Stack size = ${this.undoStack.length}`)
  }

  /**
   * Отменяет последнее действие
   * @param {EditorProject} currentProject
   * @returns {EditorProject | null}
   */
  undo(currentProject) {
    if (this.undoStack.length === 0) {
      console.log('📚 HistoryStore.undo: Nothing to undo')
      return null
    }

    // Берем последнее состояние из undoStack
    const previous = this.undoStack.pop()

    // Текущее состояние добавляем в redoStack
    if (currentProject) {
      this.redoStack.push(this.cloneProject(currentProject))
      
      // Ограничиваем размер redoStack
      if (this.redoStack.length > this.maxDepth) {
        this.redoStack.shift()
      }
    }

    console.log(`HistoryStore.undo: Undo stack = ${this.undoStack.length}, Redo stack = ${this.redoStack.length}`)
    return previous
  }

  /**
   * Повторяет отмененное действие
   * @param {EditorProject} currentProject
   * @returns {EditorProject | null}
   */
  redo(currentProject) {
    if (this.redoStack.length === 0) {
      console.log('📚 HistoryStore.redo: Nothing to redo')
      return null
    }

    // Берем последнее состояние из redoStack
    const next = this.redoStack.pop()

    // Текущее состояние добавляем в undoStack
    if (currentProject) {
      this.undoStack.push(this.cloneProject(currentProject))
      
      // Ограничиваем размер undoStack
      if (this.undoStack.length > this.maxDepth) {
        this.undoStack.shift()
      }
    }

    console.log(`HistoryStore.redo: Undo stack = ${this.undoStack.length}, Redo stack = ${this.redoStack.length}`)
    return next
  }

  /**
   * Проверяет, можно ли отменить действие
   * @returns {boolean}
   */
  canUndo() {
    return this.undoStack.length > 0
  }

  /**
   * Проверяет, можно ли повторить действие
   * @returns {boolean}
   */
  canRedo() {
    return this.redoStack.length > 0
  }

  /**
   * Очищает всю историю
   */
  clear() {
    this.undoStack = []
    this.redoStack = []
    console.log('HistoryStore.clear: History cleared')
  }

  /**
   * Получает размер undoStack
   * @returns {number}
   */
  getUndoStackSize() {
    return this.undoStack.length
  }

  /**
   * Получает размер redoStack
   * @returns {number}
   */
  getRedoStackSize() {
    return this.redoStack.length
  }

  /**
   * Клонирует проект для безопасного хранения в истории
   * @param {EditorProject} project
   * @returns {EditorProject}
   */
  cloneProject(project) {
    // Глубокое клонирование через JSON (для простоты)
    // В продакшене можно использовать более эффективные методы
    try {
      return JSON.parse(JSON.stringify(project))
    } catch (error) {
      console.error('HistoryStore.cloneProject: Error cloning project', error)
      // Fallback: поверхностное клонирование
      return { ...project }
    }
  }
}

/**
 * Создает новый экземпляр HistoryStore
 * @param {number} maxDepth
 * @returns {HistoryStore}
 */
export function createHistoryStore(maxDepth = MAX_HISTORY_DEPTH) {
  return new HistoryStore(maxDepth)
}






