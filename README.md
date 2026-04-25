# MicroLearn

MicroLearn — дипломный MVP LMS-платформы для коротких практических курсов. Проект показывает полный учебный сценарий: пользователь находит курс, регистрируется, записывается, проходит уроки, отслеживает прогресс и получает сертификат. Преподаватель может создавать и публиковать курсы, а администратор — смотреть состояние платформы и модерацию.

Проект рассчитан на локальную демонстрацию перед комиссией колледжа. Внешние интеграции, которые не являются главной целью LMS, заменены безопасными mock/stub-слоями.

## Возможности проекта

- Регистрация, вход, refresh token и выход из аккаунта.
- Роли `STUDENT`, `TEACHER`, `ADMIN`.
- Главная страница, тарифы, поиск, страницы курса и публичные профили.
- Каталог курсов с категориями, ценой, рейтингом и преподавателем.
- Запись студента на курс, избранное, отзывы и прогресс по урокам.
- Кабинет студента: активные курсы, расписание, прогресс, профиль.
- Кабинет преподавателя: статистика, список курсов, создание курса, модули и уроки.
- Admin-панель: пользователи, курсы, жалобы, общая статистика.
- Генерация сертификатов и хранение файлов.
- Socket.IO-уведомления.
- Prometheus/Grafana для демонстрации мониторинга backend.
- Docker Compose для локального запуска backend-инфраструктуры.

## Роли пользователей

| Роль      | Что может делать                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------- |
| `STUDENT` | Смотреть курсы, записываться, проходить уроки, видеть прогресс, оставлять отзывы, получать сертификаты. |
| `TEACHER` | Создавать курсы, публиковать/снимать курсы, добавлять модули и уроки, смотреть статистику.              |
| `ADMIN`   | Смотреть пользователей, курсы, жалобы и общую сводку платформы.                                         |

## Технологический стек

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS, Radix UI-паттерны.
- Backend: Express, TypeScript, Prisma, Socket.IO.
- Database: PostgreSQL.
- Auth: JWT access token и httpOnly refresh cookie.
- Files: Multer uploads, PDF certificates.
- Monitoring: Prometheus, Grafana, `prom-client`.
- Tests: Vitest, Supertest, Playwright smoke test.
- Package manager: npm.

## Требования для запуска

- Node.js 22+.
- npm 10+.
- Docker Desktop, если запускается полный backend-контур через `docker compose`.
- Свободные порты: `7865`, `7666`, `8765`, `8997`, `9855`.

В проекте используется npm. Основные lockfile: `package-lock.json` и `backend/package-lock.json`. Не смешивайте npm с pnpm/yarn при подготовке демо.

## Установка

Frontend:

```bash
npm install
```

Backend, если запускается отдельно без Docker:

```bash
cd backend
npm install
```

## Запуск frontend

```bash
npm run dev
```

Frontend откроется на:

```text
http://localhost:7865
```

Для production-сборки:

```bash
npm run build
npm run start
```

## Запуск backend / Docker

Рекомендуемый способ для защиты — Docker Compose. Он запускает PostgreSQL, backend, pgAdmin, Prometheus и Grafana.

```bash
cp .env.example .env
docker compose up --build
```

Сервисы:

| Сервис      | URL                                         |
| ----------- | ------------------------------------------- |
| Frontend    | `http://localhost:7865` после `npm run dev` |
| Backend API | `http://localhost:7666`                     |
| pgAdmin     | `http://localhost:8765`                     |
| Prometheus  | `http://localhost:8997`                     |
| Grafana     | `http://localhost:9855`                     |

Backend health-check:

```text
http://localhost:7666/health
```

Docker entrypoint backend выполняет `prisma db push`, seed demo-данных и запуск сервера. Это удобно для дипломной демонстрации. Для production вместо `db push` лучше использовать Prisma migrations.

Если backend запускается вручную:

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed
npm run dev
```

## Demo-аккаунты

Все seed-пользователи используют пароль:

```text
Password123!
```

| Роль      | Email                   |
| --------- | ----------------------- |
| `ADMIN`   | `admin@microlearn.io`   |
| `TEACHER` | `aigerim@microlearn.io` |
| `TEACHER` | `daniyar@microlearn.io` |
| `TEACHER` | `saule@microlearn.io`   |
| `STUDENT` | `temir@microlearn.io`   |
| `STUDENT` | `madina@microlearn.io`  |

## Mock/stub оплата

В дипломном MVP реальная платёжная система заменена mock/stub-слоем. Это сделано для безопасной локальной демонстрации без обработки банковских данных. Бизнес-логика тарифов и подписок при этом демонстрируется.

Endpoint:

```text
POST /api/plans/subscribe
```

Он обновляет тариф пользователя напрямую и показывает, как тариф влияет на ограничения и возможности. Реального списания денег нет.

## Почему нет реальной платёжной системы

Цель проекта — показать LMS-функциональность: роли, курсы, уроки, прогресс, кабинеты и администрирование. Подключение банка или платёжного провайдера усложнило бы локальный запуск и потребовало бы обработки банковских данных, что не нужно для колледжного MVP. Реальную оплату можно добавить позже отдельным integration/service layer.

## Почему Google/OAuth вход не входит в MVP

Вход через Google/OAuth не входит в текущий MVP, потому что основная цель проекта — демонстрация LMS-функциональности: курсы, роли, обучение, прогресс и администрирование. OAuth можно добавить как дальнейшее развитие проекта. Сейчас реализован вход по email/password, JWT access token и httpOnly refresh cookie.

## Сценарий демонстрации для защиты

1. Запустить backend-инфраструктуру:

```bash
docker compose up --build
```

2. Запустить frontend:

```bash
npm run dev
```

3. Открыть `http://localhost:7865` и показать главную страницу.
4. Показать поиск по курсам: например `/search?q=react`.
5. Открыть страницу курса и объяснить программу, цену, отзывы и прогресс.
6. Войти как студент `temir@microlearn.io` / `Password123!`.
7. Показать кабинет студента, список курсов и продолжение обучения.
8. Войти как преподаватель `aigerim@microlearn.io` / `Password123!`.
9. Показать кабинет преподавателя, создание курса, модули и уроки.
10. Войти как администратор `admin@microlearn.io` / `Password123!`.
11. Показать admin-панель: пользователи, курсы, жалобы и статистику.
12. Открыть `/pricing` и объяснить, что оплата реализована как mock/stub.
13. Коротко объяснить, что Google/OAuth не входит в MVP и может быть добавлен позже.

## Проверка качества

Frontend:

```bash
npm run format
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Backend:

```bash
cd backend
npm run lint
npm run test
npm run build
```

## Известные ограничения demo-версии

- Оплата работает как mock/stub, без реального платёжного провайдера.
- Google/OAuth вход не реализован в MVP.
- Email отправляется через SMTP только если он настроен; иначе используется stub-логирование.
- В demo-окружении используются seed-данные и `prisma db push`; для production нужны миграции.
- Demo-секреты в `.env.example` предназначены только для локального запуска.
- `npm audit` может показывать предупреждения по зависимостям:
  - frontend: умеренные предупреждения из цепочки Next/PostCSS/@vercel analytics; безопасное patch-обновление Next.js выполнено, `npm audit fix --force` не используется, потому что npm предлагает breaking-изменения;
  - backend: предупреждение по `nodemailer`; исправление требует major-обновления через force, поэтому для MVP оно задокументировано как ограничение. В demo-режиме email может работать через stub без отправки реальной почты.

Эти ограничения не блокируют защиту, потому что не мешают показать основную LMS-логику проекта.

## Troubleshooting / частые проблемы запуска

### Порт занят

Если `7865` или `7666` уже заняты, остановите старый процесс или измените порт в npm script / `.env`.

### Backend не отвечает

Проверьте:

```bash
docker compose ps
docker logs microlearn-backend
```

И откройте:

```text
http://localhost:7666/health
```

### Нет demo-данных

Перезапустите seed:

```bash
cd backend
npm run prisma:seed
```

При Docker-запуске seed выполняется автоматически в entrypoint backend.

### Frontend не видит backend

Проверьте `.env.local`:

```text
NEXT_PUBLIC_API_URL=http://localhost:7666/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:7666
```

### Ошибка зависимостей

Используйте npm:

```bash
npm install
cd backend
npm install
```

Не используйте одновременно pnpm/yarn и npm в одной рабочей копии.

## Дальнейшее развитие

- Подключить реальный платёжный провайдер.
- Добавить Google/OAuth как альтернативный вход.
- Расширить e2e-тесты.
- Перейти с `prisma db push` на миграции.
- Добавить больше типов уроков, заданий и модерации.
