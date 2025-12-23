// src/editorV2/store/errorStore.js

/**
 * Единый модуль обработки ошибок редактора
 */

const ERROR_TYPES = {
  MANIFEST_LOAD_FAILED: 'MANIFEST_LOAD_FAILED',
  PROJECT_LOAD_FAILED: 'PROJECT_LOAD_FAILED',
  EXPORT_FAILED: 'EXPORT_FAILED',
  SHARE_FAILED: 'SHARE_FAILED',
  ASSET_LOAD_FAILED: 'ASSET_LOAD_FAILED',
  SAVE_FAILED: 'SAVE_FAILED',
  UNKNOWN: 'UNKNOWN'
}

const ERROR_MESSAGES = {
  [ERROR_TYPES.MANIFEST_LOAD_FAILED]: 'Не удалось загрузить список ассетов. Проверьте подключение к интернету.',
  [ERROR_TYPES.PROJECT_LOAD_FAILED]: 'Не удалось загрузить проект. Возможно, файл поврежден.',
  [ERROR_TYPES.EXPORT_FAILED]: 'Ошибка при экспорте проекта. Попробуйте еще раз.',
  [ERROR_TYPES.SHARE_FAILED]: 'Не удалось создать ссылку для просмотра. Попробуйте еще раз.',
  [ERROR_TYPES.ASSET_LOAD_FAILED]: 'Не удалось загрузить ассет. Проверьте подключение к интернету.',
  [ERROR_TYPES.SAVE_FAILED]: 'Не удалось сохранить проект. Проверьте доступное место в хранилище.',
  [ERROR_TYPES.UNKNOWN]: 'Произошла неизвестная ошибка.'
}

class ErrorStore {
  constructor() {
    this.errors = []
    this.listeners = new Set()
  }

  /**
   * Добавляет ошибку
   * @param {string} type - Тип ошибки из ERROR_TYPES
   * @param {Error|string} error - Объект ошибки или сообщение
   * @param {Object} [options] - Дополнительные опции
   * @param {boolean} [options.retryable] - Можно ли повторить действие
   * @param {Function} [options.onRetry] - Функция для повтора
   */
  addError(type, error, options = {}) {
    const message = error?.message || error || ERROR_MESSAGES[type] || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN]
    const errorData = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      timestamp: Date.now(),
      retryable: options.retryable !== false,
      onRetry: options.onRetry,
      originalError: error
    }

    this.errors.push(errorData)

    // Ограничиваем количество ошибок (последние 50)
    if (this.errors.length > 50) {
      this.errors = this.errors.slice(-50)
    }

    // Уведомляем слушателей
    this.notifyListeners()

    // Логируем в консоль
    console.error(`❌ ErrorStore: [${type}]`, message, error)

    return errorData
  }

  /**
   * Удаляет ошибку
   * @param {string} errorId
   */
  removeError(errorId) {
    this.errors = this.errors.filter(e => e.id !== errorId)
    this.notifyListeners()
  }

  /**
   * Очищает все ошибки
   */
  clearErrors() {
    this.errors = []
    this.notifyListeners()
  }

  /**
   * Получает все ошибки
   * @returns {Array}
   */
  getErrors() {
    return [...this.errors]
  }

  /**
   * Получает последнюю ошибку
   * @returns {Object|null}
   */
  getLastError() {
    return this.errors.length > 0 ? this.errors[this.errors.length - 1] : null
  }

  /**
   * Подписывается на изменения ошибок
   * @param {Function} listener
   * @returns {Function} Функция для отписки
   */
  subscribe(listener) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Уведомляет всех слушателей
   * @private
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.errors)
      } catch (error) {
        console.error('❌ ErrorStore: Error in listener', error)
      }
    })
  }

  /**
   * Обрабатывает ошибку и добавляет её в store
   * @param {Error|string} error
   * @param {string} [type] - Тип ошибки
   * @param {Object} [options]
   */
  handleError(error, type = ERROR_TYPES.UNKNOWN, options = {}) {
    return this.addError(type, error, options)
  }
}

// Создаем singleton экземпляр
let errorStoreInstance = null

/**
 * Получает экземпляр ErrorStore (singleton)
 * @returns {ErrorStore}
 */
export function getErrorStore() {
  if (!errorStoreInstance) {
    errorStoreInstance = new ErrorStore()
  }
  return errorStoreInstance
}

// Экспортируем также класс и константы для тестирования
export { ErrorStore, ERROR_TYPES, ERROR_MESSAGES }

