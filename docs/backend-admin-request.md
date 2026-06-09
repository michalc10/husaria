# Prośba do administratora hostingu backendu

Backend aplikacji Husaria działa na Node.js + Express + Prisma i używa PostgreSQL przez `POSTGRES_URL`.

## Wariant preferowany: Docker

W repozytorium jest gotowy `docker-compose.yml`, który uruchamia:

- `postgres` - PostgreSQL,
- `backend` - API Node.js,
- `frontend` - opcjonalny Nginx z frontendem, jeśli serwer ma obsługiwać całość.

Do startu potrzebny jest Docker Compose oraz plik `.env.server` utworzony na podstawie `.env.server.example`.

Najkrócej:

```bash
cp .env.server.example .env.server
# uzupełnić sekrety i domeny w .env.server
./scripts/start-server-docker.sh
```

Albo ręcznie:

```bash
docker compose --env-file .env.server up -d --build
```

## Wymagane zmienne

```env
POSTGRES_PASSWORD=<dlugie-losowe-haslo>
AUTH_SESSION_SECRET=<dlugi-losowy-sekret>
JUDGE_TOKEN_SECRET=<dlugi-losowy-sekret>
PUBLIC_FRONTEND_URL=https://zawody.ligahusarska.pl
SERVER_CORS_ORIGIN=https://zawody.ligahusarska.pl
SOCKET_CORS_ORIGIN=https://zawody.ligahusarska.pl
AUTH_COOKIE_SECURE=true
```

Jeśli PostgreSQL jest zewnętrzny, backend może użyć:

```env
POSTGRES_URL=postgresql://user:password@host:5432/husaria?sslmode=require
```

W obecnym `docker-compose.yml` PostgreSQL działa jako kontener, a `POSTGRES_URL` jest budowany automatycznie z `POSTGRES_USER`, `POSTGRES_PASSWORD` i `POSTGRES_DB`.

## Pierwszy administrator

Po uruchomieniu backendu:

```bash
docker compose --env-file .env.server exec backend npm run user:create-admin:prod -- --email admin@example.com --password TymczasoweHaslo123 --name "Administrator"
```

## Ważne

Zwykłe FTP nie wystarcza do uruchomienia backendu. FTP może służyć do wrzucenia paczki, ale backend wymaga Node.js, Docker/SSH albo panelu aplikacji Node.js.
