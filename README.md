# Лабораторна робота №6
## Сервіс скорочення посилань на Express.js

### Опис проєкту

Сервіс скорочення посилань, реалізований на Express.js
із використанням PostgreSQL, Docker та OpenAPI 3.0.3.

### Функціональність

- Створення коротких посилань.
- Автоматична генерація коду або використання alias.
- Перенаправлення та підрахунок переходів.
- Отримання списку посилань.
- Отримання, оновлення та видалення окремого посилання.

### Вимоги для запуску

- Git
- Docker
- Docker Compose

Перед запуском необхідно запустити Docker.

### Запуск проєкту

```bash
git clone https://github.com/hrr7rr/nodejs-lab6.git
cd nodejs-lab6
cp .env.sample .env
nano .env
```

Налаштувати параметри підключення до бази даних у файлі .env.
Пароль у DATABASE_URL має відповідати POSTGRES_PASSWORD.

Запустити контейнери:

```bash
docker compose up --build -d
```

Перевірити стан контейнерів та сервера:

```bash
docker compose ps
curl http://localhost:8080/health
```

### Документація API

Swagger UI: http://localhost:8080/docs

Специфікація API: openapi.yaml

### Маршрути API

| Метод | Маршрут | Призначення |
|---|---|---|
| GET | /health | Перевірка стану сервера |
| POST | /api/links | Створення посилання |
| GET | /api/links | Отримання всіх посилань |
| GET | /api/links/{code} | Отримання одного посилання |
| PATCH | /api/links/{code} | Оновлення адреси |
| DELETE | /api/links/{code} | Видалення посилання |
| GET | /r/{code} | Перенаправлення |

### Тестування

Тестування здійснюється через Swagger UI.
Команди curl для перевірки API містяться у файлі test.txt.

### Зупинка сервісу

```bash
docker compose down
```

### Повторний запуск

```bash
docker compose up -d
```

Дані PostgreSQL зберігаються у постійному томі Docker.
Файл .env не додається до Git-репозиторію.
