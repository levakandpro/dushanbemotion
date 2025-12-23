# Система FX эффектов

Единая система применения эффектов ко всем типам слоев (видео, фото, фон, стикеры, текст, иконки).

## Архитектура

### 1. Реестр эффектов (`fxRegistry.ts`)
- Централизованный реестр всех эффектов
- Категории: popular, premium, cinematic, color, retro, neon, blur, lens
- Параметры эффектов (int/float/bool)
- Поддержка типов слоев

### 2. Типы (`fxTypes.ts`)
- `FxInstance` - экземпляр эффекта на слое
- `FxStack` - массив эффектов слоя
- Утилиты для работы со стеком

### 3. Движок применения (`fxEngine.ts`)
- `applyFxStack()` - единая функция применения эффектов
- Последовательное применение эффектов из стека
- Поддержка canvas операций и CSS фильтров

### 4. UI панель (`FxPanel.jsx`)
- Категории эффектов
- Грид пресетов
- Применение/снятие эффектов
- Premium-логика

## Использование

### Применение эффекта к слою

```javascript
import { createFxInstance, addFxToStack } from '../fx/fxTypes'
import { getFxById } from '../fx/fxRegistry'

const fxDef = getFxById('mysticPamirGlow')
const fxInstance = createFxInstance(fxDef)
const newFxStack = addFxToStack(layer.fxStack || [], fxInstance)

// Обновляем слой
layer.fxStack = newFxStack
```

### Применение при рендеринге

```javascript
import { applyFxStack } from '../fx/fxEngine'

const frameCtx = {
  canvas: outputCanvas,
  ctx: outputCtx,
  width: canvasWidth,
  height: canvasHeight
}

const result = applyFxStack(sourceCanvas, frameCtx, layer.fxStack)
```

## Добавление нового эффекта

1. Добавить в `fxRegistry.ts`:
```typescript
{
  id: 'newEffect',
  label: 'Новый эффект',
  category: 'popular',
  supports: ['video', 'image', 'background', 'sticker'],
  params: [
    { id: 'intensity', label: 'Интенсивность', type: 'float', min: 0, max: 1, default: 0.5 }
  ]
}
```

2. Реализовать в `fxEngine.ts` в функции `applyFxEffect()`

## Premium эффекты

Пометить эффект как премиум:
```typescript
{
  id: 'premiumEffect',
  // ...
  isPremium: true
}
```

UI автоматически покажет затемнение и замок для премиум-эффектов.

