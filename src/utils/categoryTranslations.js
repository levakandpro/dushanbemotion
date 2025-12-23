// Словарь русских названий категорий для works.category
export const CATEGORY_TRANSLATIONS = {
  // Backgrounds
  'nature': 'Природа',
  'city': 'Город',
  'abstract': 'Абстракция',
  'people': 'Люди',
  'animals': 'Животные',
  'food': 'Еда',
  'technology': 'Технологии',
  'art': 'Искусство',
  'sport': 'Спорт',
  'business': 'Бизнес',
  'education': 'Образование',
  'health': 'Здоровье',
  'travel': 'Путешествия',
  'fashion': 'Мода',
  'music': 'Музыка',
  'background': 'Фон',
  
  // Общие
  'other': 'Другое',
  'misc': 'Разное',
  'default': 'Без категории'
}

// Функция получения русского названия категории
export function getCategoryName(category) {
  if (!category) return 'Без категории'
  const normalized = category.toLowerCase().trim()
  return CATEGORY_TRANSLATIONS[normalized] || category
}

// Функция генерации дефолтного названия work: D {Категория}
export function getDefaultWorkTitle(category) {
  const categoryName = getCategoryName(category)
  return `D ${categoryName}`
}
