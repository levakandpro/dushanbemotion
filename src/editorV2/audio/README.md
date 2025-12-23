# Аудио-таймлайн для DushanbeMotion

## Обзор

Полнофункциональный аудио-таймлайн с одной дорожкой, синхронизированный с Canvas. Поддерживает базовые и премиум-эффекты, как в CapCut.

## Структура файлов

```
audio/
в”њв”Ђв”Ђ audioTypes.js         # Модель данных и утилиты
в”њв”Ђв”Ђ audioEngine.js        # Движок воспроизведения
в”њв”Ђв”Ђ AudioTimeline.jsx     # Основной компонент
в”њв”Ђв”Ђ TimeRuler.jsx         # Линейка времени с playhead
в”њв”Ђв”Ђ AudioClipItem.jsx     # Компонент клипа на дорожке
в”њв”Ђв”Ђ AudioClipEditor.jsx   # Панель редактирования клипа
в””в”Ђв”Ђ README.md            # Эта документация
```

## Основные возможности

### Базовый функционал

1. **Добавление аудио**
   - Кнопка "Добавить аудио"
   - Поддержка любых аудио-форматов
   - Автоматическое размещение клипов

2. **Редактирование клипов**
   - **Trim** - обрезка краёв (потянуть за край)
   - **Move** - перемещение по дорожке (drag & drop)
   - **Split** - разрезание клипа (кнопка ✂️ Split)
   - **Delete** - удаление клипа (кнопка Г-)

3. **Основные параметры**
   - **Volume** - громкость 0-200%
   - **Mute** - выключение звука
   - **Fade In/Out** - плавное появление/исчезновение
   - **Speed** - скорость 0.5x, 1x, 1.5x, 2x
   - **Loop** - зацикливание клипа
   - **Normalize** - выравнивание громкости

### в­ђ Премиум-функции

1. **Pitch** - изменение высоты тона (-12...+12 полутонов)
2. **EQ** - пресеты эквалайзера (bass, noise_cut, bright)
3. **Reverb** - эффекты реверберации (small, hall, space)

> Премиум-функции отображаются с замком 🔒 для бесплатных пользователей

## Горячие клавиши

- `Space` - Play/Pause
- `Ctrl+Z` - Отмена
- `Ctrl+Shift+Z` / `Ctrl+Y` - Повтор

## Синхронизация с Canvas

- Один общий курсор времени для Canvas и аудио
- Play/Pause синхронизирован
- Автоматический расчёт длины проекта:
  ```
  projectDuration = max(
    maxEndTimeFromClips,
    animationMaxDuration,
    minDuration (3 сек)
  )
  ```

## Автоматическое раскрытие

Таймлайн автоматически разворачивается когда:
- Добавлен хотя бы один аудио-клип, ИЛИ
- Есть анимации длительностью > 0.5 сек

## Модель данных

### AudioClip

```javascript
{
  id: string,
  audioSourceId: string,      // URL или путь к файлу
  audioSourceName: string,     // Имя для отображения
  startTime: number,           // Позиция на дорожке (сек)
  duration: number,            // Длина клипа (сек)
  offsetInSource: number,      // Смещение в источнике (сек)
  sourceDuration: number,      // Полная длина источника
  
  // Базовые параметры
  volume: number,              // 0-2.0 (1.0 = 100%)
  muted: boolean,
  
  // Эффекты
  fadeIn: number,              // 0-1 сек
  fadeOut: number,             // 0-1 сек
  speed: number,               // 0.5, 1, 1.5, 2
  loop: boolean,
  normalize: boolean,
  
  // Премиум
  pitch: number,               // -12...+12
  eqPreset: string,            // 'none' | 'bass' | 'noise_cut' | 'bright'
  reverbPreset: string,        // 'none' | 'small' | 'hall' | 'space'
  isPremiumEffectUsed: boolean
}
```

### TimelineState

```javascript
{
  clips: AudioClip[],
  projectDuration: number,
  minDuration: number,
  animationMaxDuration: number,
  currentTime: number,
  isPlaying: boolean,
  isTimelineExpanded: boolean,
  pixelsPerSecond: number,
  selectedClipId: string | null
}
```

## Использование

### В проекте

```javascript
import AudioTimeline from './audio/AudioTimeline'

<AudioTimeline
  timeline={project.timeline}
  onUpdateTimeline={(newTimeline) => {
    updateProject({ timeline: newTimeline })
  }}
  isPremium={false}
/>
```

### Добавление к проекту

```javascript
import { createInitialTimelineState } from './audio/audioTypes'

const newProject = {
  // ... другие поля
  timeline: createInitialTimelineState()
}
```

## Аудио-движок

`AudioEngine` управляет воспроизведением всех клипов:

- Автоматическая синхронизация
- Поддержка fade in/out
- Изменение скорости
- Громкость по клипам
- Цикличное воспроизведение

## Будущие улучшения

- [ ] Визуализация waveform
- [ ] Несколько аудио-дорожек
- [ ] Snap to grid
- [ ] Markers и метки
- [ ] Экспорт аудио-микса
- [ ] Реальное применение премиум-эффектов (pitch, EQ, reverb)

## Примечания

- Все времена в секундах
- Координаты на дорожке = `time * pixelsPerSecond`
- Минимальная длина клипа = 0.1 сек
- Автосохранение работает со всем состоянием таймлайна

