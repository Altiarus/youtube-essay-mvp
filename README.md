# YouTube Essay MVP

MVP веб-сервиса, который принимает ссылку на YouTube-ролик, получает транскрипт через Supadata и делает краткое эссе через OpenRouter.

## Запуск

1. Установите зависимости:

   ```bash
   npm install
   ```

2. Создайте `.env.local` по примеру `.env.example`:

   ```env
   SUPADATA_API_KEY=...
   OPENROUTER_API_KEY=...
   OPENROUTER_MODEL=openrouter/free
   ```

3. Запустите локальный сервер:

   ```bash
   npm run dev
   ```

4. Откройте `http://localhost:3000`.

## Переменные окружения

- `SUPADATA_API_KEY` — ключ Supadata для получения транскрипта.
- `OPENROUTER_API_KEY` — ключ OpenRouter для генерации эссе.
- `OPENROUTER_MODEL` — модель OpenRouter. По умолчанию используется бесплатный роутер `openrouter/free`.

Не публикуйте `.env.local`: файл добавлен в `.gitignore`.

## API

`POST /api/summarize`

```json
{
  "url": "https://www.youtube.com/watch?v=..."
}
```

Успешный ответ:

```json
{
  "essay": "...",
  "source": {
    "url": "https://www.youtube.com/watch?v=..."
  }
}
```

## Публикация

Проект готов к деплою как стандартное Next.js приложение. Для Vercel нужно добавить те же переменные окружения в настройках проекта.
