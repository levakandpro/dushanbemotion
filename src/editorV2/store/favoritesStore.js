// src/editorV2/store/favoritesStore.js
/**
 * Хранилище избранных эффектов FX
 */

const STORAGE_KEY = 'dm_fx_favorites'

class FavoritesStore {
  constructor() {
    this.favorites = this.loadFavorites()
    this.listeners = []
  }

  loadFavorites() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (e) {
      console.warn('Failed to load favorites:', e)
      return []
    }
  }

  saveFavorites() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.favorites))
      this.notifyListeners()
    } catch (e) {
      console.warn('Failed to save favorites:', e)
    }
  }

  addFavorite(fxId) {
    if (!this.favorites.includes(fxId)) {
      this.favorites.push(fxId)
      this.saveFavorites()
    }
  }

  removeFavorite(fxId) {
    this.favorites = this.favorites.filter(id => id !== fxId)
    this.saveFavorites()
  }

  toggleFavorite(fxId) {
    if (this.isFavorite(fxId)) {
      this.removeFavorite(fxId)
    } else {
      this.addFavorite(fxId)
    }
  }

  isFavorite(fxId) {
    return this.favorites.includes(fxId)
  }

  getFavorites() {
    return [...this.favorites]
  }

  clearFavorites() {
    this.favorites = []
    this.saveFavorites()
  }

  subscribe(listener) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.favorites))
  }
}

// Singleton
const favoritesStore = new FavoritesStore()
export default favoritesStore

