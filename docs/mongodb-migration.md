# MongoDB To PostgreSQL Migration

MongoDB Atlas database `test` is now an archive/source export. The application
runtime uses PostgreSQL through `POSTGRES_URL`.

Do not commit secrets. Keep `back-end/.env` local or configure variables in the
hosting provider.

## Current Target

- Runtime database: PostgreSQL, target database name `husaria`.
- Source/archive database: MongoDB Atlas `test`.
- ORM/runtime access: Prisma Client.
- Local fallback: `docker-compose.postgres.yml`.

## Pre-Migration Checklist

1. Rotate any MongoDB password that was ever committed or shared.
2. Confirm you can still read Atlas `test` with one local configuration:

```env
MONGO_URL=mongodb+srv://<user>:<password>@<cluster>/test?retryWrites=true&w=majority
```

or:

```env
MONGO_USERNAME=<user>
MONGO_PASSWORD=<password>
MONGO_CLUSTER_HOST=<cluster>.mongodb.net
MONGO_DATABASE=test
```

3. Create a baseline report:

```powershell
cd back-end
npm.cmd run db:report
```

4. Export MongoDB to local JSON backup:

```powershell
cd back-end
npm.cmd run db:export:mongo
```

The export is written to `backups/mongodb/<timestamp>` and is ignored by Git.

## PostgreSQL Import

1. Start local PostgreSQL or point `POSTGRES_URL` to managed Postgres.

```powershell
docker compose -f docker-compose.postgres.yml up -d
```

2. Apply Prisma migrations:

```powershell
cd back-end
npm.cmd run prisma:migrate
```

3. Validate the Mongo backup import:

```powershell
cd back-end
npm.cmd run db:migrate:postgres:dry-run
```

If the dry run reports missing references, use the repair dry run to preserve
historical orphaned rows with placeholder parents:

```powershell
npm.cmd run db:migrate:postgres:repair-dry-run
```

4. Import:

```powershell
npm.cmd run db:migrate:postgres:repair
```

5. Normalize battles and results:

```powershell
npm.cmd run db:normalize:battles:dry-run
npm.cmd run db:normalize:battles
```

The dry run compares legacy totals with projected normalized totals before
writing.

## Verification

After import and normalization, verify:

- Mongo baseline counts match PostgreSQL counts for leagues, players,
  tournaments and participants.
- Number of normalized battles equals non-empty legacy `battle_1...battle_5`
  definitions.
- Legacy total score equals normalized total score.
- API returns:
  - `GET /tournament/:id` without `battle_1...battle_5`.
  - `GET /tournament/:id/battles` with categories, obstacles and penalties.
  - `GET /playerPoints/tournament/:id` with `battleResults[]` and `totalScore`.

Keep MongoDB `test` as an archive until the PostgreSQL app is verified manually.

