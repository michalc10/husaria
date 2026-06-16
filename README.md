# Husaria

Aplikacja do obslugi lig, turniejow, zawodnikow i wynikow konkurencji husarskich.

## Struktura

- `back-end` - API Express + TypeScript + Prisma + PostgreSQL.
- `husaria` - frontend Angular + PrimeNG.
- `docs` - notatki migracyjne i pomocnicze schematy SQL.

## Baza danych

Runtime aplikacji uzywa PostgreSQL przez `POSTGRES_URL`. MongoDB Atlas `test`
zostaje tylko jako archiwum i zrodlo importu historycznych danych.

Model konkurencji jest znormalizowany:

- `battles` - dowolna liczba konkurencji w turnieju, sortowana po `order`.
- `battle_categories`, `battle_obstacles`, `battle_penalties` - definicja konkurencji.
- `battle_results`, `obstacle_results`, `penalty_results` - wyniki zawodnikow.

Legacy kolumny `battle_1...battle_5` oraz `battle_N_*` zostaly w PostgreSQL jako
read-only backup do weryfikacji migracji. API i frontend juz ich nie uzywaja.

## Konfiguracja backendu

W katalogu `back-end` utworz lokalny plik `.env` na podstawie `.env.example`.
Nie commituj `.env`.

Lokalny PostgreSQL przez Dockera:

```powershell
# z katalogu glownego repo
docker compose -f docker-compose.postgres.yml up -d
```

Przykladowy `back-end/.env`:

```env
DATABASE_PROVIDER=postgres
POSTGRES_URL=postgresql://husaria:husaria_dev_password@localhost:5432/husaria
SERVER_PORT=3000
SERVER_CORS_ORIGIN=http://localhost:4200,http://127.0.0.1:4200
AUTH_SESSION_SECRET=<dlugi-losowy-sekret>
AUTH_COOKIE_NAME=husaria_session
AUTH_SESSION_DAYS=14
AUTH_COOKIE_SECURE=false
```

Dla managed Postgres ustaw tylko standardowy connection string:

```env
POSTGRES_URL=postgresql://<user>:<password>@<host>:<port>/<database>?sslmode=require
```

## Wdrozenie na serwerze przez Docker

Repo zawiera produkcyjny `docker-compose.yml`:

- `postgres` - PostgreSQL z trwalym wolumenem,
- `backend` - Express + Prisma,
- `frontend` - Angular + Nginx + reverse proxy do API i Socket.IO.

Konfiguracja:

```powershell
Copy-Item .env.server.example .env.server
# uzupelnij POSTGRES_PASSWORD, AUTH_SESSION_SECRET, JUDGE_TOKEN_SECRET i PUBLIC_FRONTEND_URL
docker compose --env-file .env.server up -d --build
```

Pierwszy administrator w kontenerze:

```powershell
docker compose --env-file .env.server exec backend npm run user:create-admin:prod -- --email admin@example.com --password TymczasoweHaslo123 --name "Administrator"
```

Szczegoly wdrozenia, backupu i importu sa w `docs/server-deployment.md`.

Jednopoleceniowy start na serwerze z Dockerem:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-server-docker.ps1 -Build
```

Na Linuxie:

```bash
./scripts/start-server-docker.sh
```

Krotka wiadomosc/instrukcja dla administratora hostingu jest w
`docs/backend-admin-request.md`.

## Frontend przez FTP

Jesli hosting daje tylko FTP, mozna opublikowac tylko frontend Angular:

```powershell
cd husaria
npm.cmd run build:ftp -- -ApiBaseUrl "https://api.twojadomena.pl"
```

Na FTP wrzuc zawartosc katalogu `husaria/dist/husaria`. Instrukcja jest w
`docs/ftp-frontend-deployment.md`.

Sam backend nie uruchomi sie na zwyklym FTP. Do API, logowania, PostgreSQL,
Prisma i WebSocketow potrzebny jest hosting Node.js/Docker/SSH albo osobna
platforma backendowa.

## Uruchomienie

Backend:

```powershell
cd back-end
npm.cmd ci
npm.cmd run prisma:generate
npm.cmd run prisma:migrate
npm.cmd run user:create-admin -- --email admin@example.com --password TymczasoweHaslo123 --name "Administrator"
npm.cmd run dev
```

Po kazdej zmianie `back-end/prisma/schema.prisma` albo po pobraniu nowej wersji
kodu uruchom `npm.cmd run prisma:migrate` przed startem backendu. Jesli baza ma
starszy schemat niz kod, API moze zwracac puste widoki albo bledy, mimo ze dane
nadal istnieja.

Logowanie nie ma publicznej rejestracji. Pierwsze konto administratora utworz
skryptem `user:create-admin`, a kolejne konta dodawaj juz w aplikacji w widoku
`Uzytkownicy`. Nowo utworzone konto dostaje haslo tymczasowe i musi je zmienic
po pierwszym logowaniu.

Skrypt `user:create-admin` sam generuje Prisma Client, wiec po swiezym
`npm.cmd ci` nie powinien juz konczyc sie bledem
`@prisma/client has no exported member PrismaClient`. Jesli baza PostgreSQL
zostala zresetowana albo odtworzona bez tabeli `users`, stare konta i sesje nie
istnieja - utworz pierwszego admina ponownie w aktualnej bazie:

```powershell
cd back-end
npm.cmd run prisma:migrate
npm.cmd run user:create-admin -- --email michalc1101@gmail.com --password TymczasoweHaslo123 --name "Michal"
```

Po imporcie danych z MongoDB albo po pierwszym przejsciu z legacy kolumn
`battle_1...battle_5` uruchom jednorazowo:

```powershell
cd back-end
npm.cmd run db:normalize:battles:dry-run
npm.cmd run db:normalize:battles
```

Nie uruchamiaj normalizacji przy kazdym starcie aplikacji, bo skrypt odtwarza
nowy model konkurencji ze starych kolumn legacy.

Frontend:

```powershell
cd husaria
npm.cmd ci
npm.cmd start
```

Adresy lokalne:

- API: `http://localhost:3000/ping`
- Frontend: `http://localhost:4200`

Na Windowsie `npm.cmd` omija blokade uruchamiania `npm.ps1` w PowerShellu.

## Import z MongoDB

MongoDB jest uzywane tylko w skryptach archiwalnych/importowych. Jesli trzeba
odtworzyc dane z Atlasa `test`, ustaw lokalnie `MONGO_URL` albo
`MONGO_USERNAME`/`MONGO_PASSWORD`/`MONGO_CLUSTER_HOST`/`MONGO_DATABASE=test`,
a potem:

```powershell
cd back-end
npm.cmd run db:export:mongo
npm.cmd run db:migrate:postgres:dry-run
npm.cmd run db:migrate:postgres:repair
npm.cmd run db:normalize:battles
```

Szczegoly sa w `docs/mongodb-migration.md`.

## Weryfikacja

```powershell
cd back-end
npm.cmd run build
npm.cmd test
npm.cmd run prisma:migrate
npm.cmd run db:normalize:battles:dry-run

cd ..\husaria
npm.cmd run build
```

Smoke test API:

- `GET http://localhost:3000/ping`
- `POST http://localhost:3000/auth/login`
- `GET http://localhost:3000/auth/me`
- po zalogowaniu: `GET http://localhost:3000/tournament/<id>/battles`
- po zalogowaniu: `GET http://localhost:3000/playerPoints/tournament/<id>`
- po zalogowaniu: `PUT http://localhost:3000/playerPoints/<participantId>/battle-results/<battleId>`



Terminal 1 (Postgres):
cd /Users/michal/Husaria/husaria
docker compose -f docker-compose.postgres.yml up -d

Terminal 2 (Backend):
cd /Users/michal/Husaria/husaria/back-end
npm.cmd run dev

Terminal 3 (Frontend):
cd /Users/michal/Husaria/husaria/husaria
npm.cmd start

