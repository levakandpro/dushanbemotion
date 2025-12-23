// src/stickers/worker/registry.js

export const DEFAULT_MALE_CATEGORY = 'aralash';
export const DEFAULT_FEMALE_CATEGORY = 'aralash';

/* -----------------------------------------------------
   МУЖСКИЕ КАТЕГОРИИ
----------------------------------------------------- */
export const maleCategories = [
  // === БЕСПЛАТНЫЕ (корневые папки stickers/) ===
  { id: 'aralash', label: 'Аралаш', description: 'Всё бесплатное подряд', order: 1, prefix: 'aralash/' },
  { id: 'animals', label: 'Животные', description: 'Хищники, птицы и животные', order: 2, prefix: 'animals/' },
  { id: 'avto', label: 'Авто', description: 'Транспорт от земли до воздуха', order: 3, prefix: 'avto/' },
  { id: 'boznes', label: 'Бизнес', description: 'Профессии, ремесло и труд', order: 4, prefix: 'boznes/' },
  { id: 'eda', label: 'Еда', description: 'Дастархан и традиции', order: 5, prefix: 'eda/' },
  { id: 'game', label: 'Игры', description: 'Геймерская атрибутика', order: 6, prefix: 'game/' },
  { id: 'history', label: 'История', description: 'Культура и великие эпохи', order: 7, prefix: 'history/' },
  { id: 'islam', label: 'Ислам', description: 'Исламские надписи и символы', order: 8, prefix: 'islam/' },
  { id: 'love', label: 'Любовь', description: 'Сердца и эмоции', order: 9, prefix: 'love/' },
  { id: 'm_name', label: 'Имена', description: 'Именные стикеры', order: 10, prefix: 'm_name/' },
  { id: 'medic', label: 'Медицина', description: 'Медицинская тематика', order: 11, prefix: 'medic/' },
  { id: 'minimalism', label: 'Минимализм', description: 'Простые формы', order: 12, prefix: 'minimalism/' },
  { id: 'patriot', label: 'Патриот', description: 'Образы родины', order: 13, prefix: 'patriot/' },
  { id: 'prazdniki', label: 'Праздники', description: 'Праздничная атмосфера', order: 14, prefix: 'prazdniki/' },
  { id: 'priroda', label: 'Природа', description: 'Пейзажи Таджикистана', order: 15, prefix: 'priroda/' },
  { id: 'soc', label: 'Соцсети', description: 'Социальные сети', order: 16, prefix: 'soc/' },
  { id: 'sport', label: 'Спорт', description: 'Спортивный настрой', order: 17, prefix: 'sport/' },
  { id: 'uzori', label: 'Узоры', description: 'Национальный орнамент', order: 18, prefix: 'uzori/' },
  
  // === M_PRO PREMIUM (папки внутри m_pro/) ===
  { id: 'm_pro_animals', label: 'Животные', description: 'Premium', order: 100, prefix: 'm_pro/animals/', isPremium: true },
  { id: 'm_pro_avto', label: 'Авто', description: 'Premium', order: 101, prefix: 'm_pro/avto/', isPremium: true },
  { id: 'm_pro_eda', label: 'Еда', description: 'Premium', order: 102, prefix: 'm_pro/eda/', isPremium: true },
  { id: 'm_pro_history', label: 'История', description: 'Premium', order: 103, prefix: 'm_pro/history/', isPremium: true },
  { id: 'm_pro_love', label: 'Любовь', description: 'Premium', order: 104, prefix: 'm_pro/love/', isPremium: true },
  { id: 'm_pro_maski', label: 'Маски', description: 'Premium', order: 105, prefix: 'm_pro/maski/', isPremium: true },
  { id: 'm_pro_medic', label: 'Медицина', description: 'Premium', order: 106, prefix: 'm_pro/medic/', isPremium: true },
  { id: 'm_pro_patriot', label: 'Патриот', description: 'Premium', order: 107, prefix: 'm_pro/patriot/', isPremium: true },
  { id: 'm_pro_prazdiniki', label: 'Праздники', description: 'Premium', order: 108, prefix: 'm_pro/prazdiniki/', isPremium: true },
  { id: 'm_pro_priroda', label: 'Природа', description: 'Premium', order: 109, prefix: 'm_pro/priroda/', isPremium: true },
  { id: 'm_pro_smile', label: 'Смайлы', description: 'Premium', order: 110, prefix: 'm_pro/smile/', isPremium: true },
  { id: 'm_pro_soc', label: 'Соцсети', description: 'Premium', order: 111, prefix: 'm_pro/soc/', isPremium: true },
  { id: 'm_pro_sport', label: 'Спорт', description: 'Premium', order: 112, prefix: 'm_pro/sport/', isPremium: true },
];

/* -----------------------------------------------------
   ЖЕНСКИЕ КАТЕГОРИИ
----------------------------------------------------- */
export const femaleCategories = [
  // Аралаш первый (Jenskie/free/)
  { id: 'aralash', label: 'Аралаш', description: 'Женский каталог', order: 1, prefix: 'Jenskie/free/' },
  // Остальные бесплатные категории по алфавиту
  { id: 'chakchak', label: 'Чак-чак', description: 'Женский жаргон', order: 2, prefix: 'Jenskie/chakchak/' },
  { id: 'cveti', label: 'Цветы', description: 'Символ женственности', order: 3, prefix: 'Jenskie/cveti/' },
  { id: 'decor', label: 'Декор', description: 'Элементы оформления', order: 4, prefix: 'Jenskie/decor/' },
  { id: 'emocii', label: 'Эмоции', description: 'Женские реакции', order: 5, prefix: 'Jenskie/emocii/' },
  { id: 'imena', label: 'Имена', description: 'Именные стикеры', order: 6, prefix: 'Jenskie/imena/' },
  { id: 'kariera', label: 'Карьера', description: 'Профессии и уверенность', order: 7, prefix: 'Jenskie/kariera/' },
  { id: 'love', label: 'Любовь', description: 'Сердца и вайб', order: 8, prefix: 'Jenskie/love/' },
  { id: 'lux', label: 'Люкс', description: 'Исламская эстетика', order: 9, prefix: 'Jenskie/lux/' },
  { id: 'makeup', label: 'Мейкап', description: 'Макияж и бьюти', order: 10, prefix: 'Jenskie/makeup/' },
  { id: 'moda', label: 'Мода', description: 'Таджичка на стиле', order: 11, prefix: 'Jenskie/moda/' },
  { id: 'nasledie', label: 'Наследие', description: 'Исторические', order: 12, prefix: 'Jenskie/nasledie/' },
  { id: 'patriotka', label: 'Патриотка', description: 'Таджичка в образе', order: 13, prefix: 'Jenskie/patriotka/' },
  { id: 'peyzaji', label: 'Пейзажи', description: 'Горы, небо и свет', order: 14, prefix: 'Jenskie/peyzaji/' },
  { id: 'tadjichka', label: 'Таджичка', description: 'Национальные образы', order: 15, prefix: 'Jenskie/tadjichka/' },
  { id: 'techno', label: 'Техно', description: 'High-tech', order: 16, prefix: 'Jenskie/techno/' },
  // Premium последний
  { id: 'premium', label: 'Premium', description: 'Эксклюзив', order: 100, prefix: 'Jenskie/pro/', isPremium: true },
];

export const ALL_CATEGORY_DEFS = [...maleCategories, ...femaleCategories];
