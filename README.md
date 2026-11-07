# MemeHub

MemeHub — это fullstack-приложение для публикации мемов. 
Стек: фронтенд на Vanilla JS, API на Node.js/Express, база данных PostgreSQL.

## Запуск

Откройте терминал в VS Code в корневой папке проекта и выполните:

```powershell
docker compose up --build
```

Чтобы запустить в фоновом режиме и освободить терминал:

```powershell
docker compose up --build -d
```

API будет доступно по адресу: `http://localhost:3000`  
База данных PostgreSQL работает внутри контейнера на порту `5432`.

## Проверка контейнеров

Убедитесь, что оба сервиса (api и db) запущены и работают:

```powershell
docker compose ps
```

## Остановка

Остановить и удалить контейнеры и сеть, сохранив данные базы в volume:

```powershell
docker compose down
```

Чтобы также удалить данные базы и начать с чистого листа:

```powershell
docker compose down -v
```

## API и CRUD-запросы

Команды ниже используют нативный PowerShell (`Invoke-RestMethod`), что гарантирует корректную работу с JSON в VS Code на Windows без ошибок экранирования кавычек.

### 1. Регистрация пользователя (Create User)

```powershell
$body = @{ username = "demo_user"; password = "demo-pass-123" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method Post -Body $body -ContentType "application/json"
```

### 2. Вход и получение токена (Login)

```powershell
$body = @{ username = "demo_user"; password = "demo-pass-123" } | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $body -ContentType "application/json"
$env:TOKEN = $response.token
Write-Host "Токен успешно сохранён в переменной `$env:TOKEN"
```

### 3. Создать мем (Create)

```powershell
$memeBody = @{ title = "Первый мем"; imageUrl = "https://cataas.com/cat"; caption = "Проверка Docker" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/memes" -Method Post -Body $memeBody -ContentType "application/json" -Headers @{ Authorization = "Bearer $env:TOKEN" }
```
*Запомните `id` созданного мема из ответа (например, `1`), он понадобится далее.*

### 4. Получить список мемов (Read)

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/memes" -Method Get
```

### 5. Обновить мем (Update)
*Замените `1` на реальный ID вашего мема:*

```powershell
$updateBody = @{ title = "Обновлённый мем"; caption = "Новая подпись" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/memes/1" -Method Put -Body $updateBody -ContentType "application/json" -Headers @{ Authorization = "Bearer $env:TOKEN" }
```

### 6. Удалить мем (Delete)
*Замените `1` на реальный ID вашего мема:*

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/memes/1" -Method Delete -Headers @{ Authorization = "Bearer $env:TOKEN" }
```

> **Примечание:** Операции создания, изменения и удаления требуют JWT-авторизации и прав автора мема.

## Проверка сохранения данных (Persistence)

Чтобы доказать, что данные сохраняются после перезапуска контейнеров:

1. Зарегистрируйте пользователя и создайте мем (шаги 1 и 3 выше).
2. Убедитесь, что мем отображается:
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:3000/api/memes" -Method Get
   ```
3. Остановите контейнеры:
   ```powershell
   docker compose down
   ```
4. Запустите их заново:
   ```powershell
   docker compose up -d
   ```
5. Подождите 10-15 секунд и снова запросите мемы:
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:3000/api/memes" -Method Get
   ```

**Результат:** Данные успешно вернулись, так как они хранятся в именованном volume `db_data`, который не удаляется при обычной команде `docker compose down`.

## Просмотр логов

Просмотр последних строк логов всех сервисов:

```powershell
docker compose logs --tail=20
```

Следить за логами в реальном времени (для выхода нажмите `Ctrl+C`):

```powershell
docker compose logs -f
```

Логи только API или только базы данных:

```powershell
docker compose logs api
docker compose logs db
```