# ⚡ Быстрый старт - Деплой на Cloudflare Pages

## 🚀 За 5 минут

### Шаг 1: Создайте репозиторий на GitHub

1. Откройте https://github.com/new
2. Название: `dushanbemotion`
3. Приватность: Public или Private (на ваш выбор)
4. **НЕ** создавайте README, .gitignore, license
5. Нажмите **Create repository**

### Шаг 2: Запушьте код

Скопируйте команды из GitHub (они будут показаны после создания репозитория):

```bash
git remote add origin https://github.com/YOUR_USERNAME/dushanbemotion.git
git branch -M main
git push -u origin main
```

Или если у вас уже есть remote:
```bash
git push -u origin main
```

### Шаг 3: Подключите Cloudflare Pages

1. Откройте https://dash.cloudflare.com/
2. Перейдите в **Pages**
3. Нажмите **Create a project**
4. Выберите **Connect to Git**
5. Авторизуйте GitHub
6. Выберите репозиторий `dushanbemotion`

### Шаг 4: Настройте Build

В форме настройки введите:

```
Project name: dushanbemotion
Production branch: main
Framework preset: Vite
Build command: npm run build
Build output directory: dist
```

### Шаг 5: Deploy!

Нажмите **Save and Deploy** и ждите ~2-3 минуты.

## ✅ Готово!

После деплоя вы получите URL вида:
```
https://dushanbemotion.pages.dev
```

## 🔄 Автоматические обновления

Теперь при каждом `git push` в ветку `main` Cloudflare автоматически обновит сайт.

```bash
# Внесите изменения
git add .
git commit -m "Update something"
git push

# Cloudflare автоматически задеплоит изменения
```

## 🌐 Custom Domain (опционально)

1. В Cloudflare Pages → Ваш проект → **Custom domains**
2. Нажмите **Set up a custom domain**
3. Введите домен (например, `dushanbemotion.com`)
4. Следуйте инструкциям

## 📞 Нужна помощь?

- [Подробная инструкция](./CLOUDFLARE_DEPLOY.md)
- [Сводка подготовки](./DEPLOY_SUMMARY.md)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)

---

**Время деплоя**: ~5 минут  
**Сложность**: Легко  
**Стоимость**: Бесплатно (Cloudflare Pages Free tier)

