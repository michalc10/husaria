# Wdrożenie na serwerze

Ten projekt jest przygotowany do uruchomienia jako trzy kontenery:

- `postgres` - baza PostgreSQL z trwałym wolumenem.
- `backend` - API Express + Prisma, z automatycznym `prisma migrate deploy` przy starcie.
- `frontend` - Angular serwowany przez Nginx, z reverse proxy do backendu i Socket.IO.

MongoDB nie jest runtime aplikacji. Zostaje tylko jako archiwum albo źródło importu przez skrypty w backendzie.

## 1. Przygotowanie serwera

Na serwerze zainstaluj Docker Engine i Docker Compose Plugin. Następnie skopiuj repozytorium na serwer, np. do:

```bash
/opt/husaria
```

## 2. Konfiguracja sekretów

Skopiuj przykład konfiguracji:

```bash
cp .env.server.example .env.server
```

Ustaw koniecznie:

- `POSTGRES_PASSWORD` - długie losowe hasło do bazy.
- `AUTH_SESSION_SECRET` - długi losowy sekret sesji.
- `JUDGE_TOKEN_SECRET` - długi losowy sekret tokenów QR.
- `PUBLIC_FRONTEND_URL` - docelowy adres aplikacji, np. `https://husaria.twojadomena.pl`.
- `SERVER_CORS_ORIGIN` i `SOCKET_CORS_ORIGIN` - ten sam adres co frontend.
- `AUTH_COOKIE_SECURE=true` przy HTTPS.

Dla prostego wdrożenia same-origin zostaw:

```env
FRONTEND_API_BASE_URL=
```

Wtedy przeglądarka woła API przez ten sam host, a Nginx przekazuje ruch do backendu.

## 3. Start

```bash
docker compose --env-file .env.server up -d --build
```

Backend przy starcie wykona:

```bash
prisma migrate deploy
```

Jeśli migracje mają być uruchamiane osobno przez pipeline, ustaw:

```env
RUN_PRISMA_MIGRATIONS=false
```

## 4. Pierwszy administrator

Po starcie kontenerów utwórz pierwszego admina:

```bash
docker compose --env-file .env.server exec backend npm run user:create-admin:prod -- --email admin@example.com --password TymczasoweHaslo123 --name "Administrator"
```

Jeśli baza została wyczyszczona, stare konta i sesje nie istnieją. Trzeba wtedy utworzyć admina ponownie w aktualnej bazie.

## 5. Import danych z MongoDB do PostgreSQL

Jeśli dane są jeszcze tylko w MongoDB Atlas, wykonaj import jednorazowo przed pracą produkcyjną. Najbezpieczniej zrobić to lokalnie albo w kontrolowanym środowisku z dostępem do sekretów MongoDB:

```bash
cd back-end
npm ci
npm run prisma:migrate
npm run db:export:mongo
npm run db:migrate:postgres:dry-run
npm run db:migrate:postgres:repair
npm run db:normalize:battles
```

Po imporcie sprawdź liczby lig, turniejów, zawodników i wyniki w aplikacji. Nie usuwaj archiwum MongoDB, dopóki PostgreSQL nie będzie ręcznie zweryfikowany.

## 6. Backup PostgreSQL

Backup:

```bash
docker compose --env-file .env.server exec postgres pg_dump -U husaria -d husaria > husaria-backup.sql
```

Restore do pustej bazy:

```bash
docker compose --env-file .env.server exec -T postgres psql -U husaria -d husaria < husaria-backup.sql
```

## 7. Aktualizacja aplikacji

Po pobraniu nowych zmian:

```bash
git pull
docker compose --env-file .env.server up -d --build
```

Prisma migracje uruchomi backend automatycznie, o ile `RUN_PRISMA_MIGRATIONS=true`.

## 8. Szybka diagnostyka

Status kontenerów:

```bash
docker compose --env-file .env.server ps
```

Logi backendu:

```bash
docker compose --env-file .env.server logs -f backend
```

Ping API:

```bash
curl http://localhost/ping
```

Na serwerze z domeną HTTPS sprawdź:

```bash
curl https://husaria.twojadomena.pl/ping
```
