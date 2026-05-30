import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { Client } from 'pg';
import { createStableObjectId } from '../repositories/ids';

dotenv.config({ quiet: true });

type MongoDocument = Record<string, unknown>;

const collectionFiles = {
  leagues: 'leagues.json',
  players: 'players.json',
  tournaments: 'tournaments.json',
  playerpoints: 'playerpoints.json'
};

const referenceErrorPreviewLimit = 50;

type BackupData = Record<keyof typeof collectionFiles, MongoDocument[]>;
type RepairSummary = {
  leagues: Array<{ id: string; tournamentCount: number; year: string }>;
  players: Array<{ id: string; name: string; playerPointCount: number }>;
};

const backupRoot = () => path.resolve(process.cwd(), '..', 'backups', 'mongodb');

const findLatestBackupDir = async (): Promise<string> => {
  const entries = await fs.readdir(backupRoot(), { withFileTypes: true });
  const directories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  if (!directories.length) {
    throw new Error('No MongoDB backup directories found. Run npm.cmd run db:export:mongo first.');
  }

  return path.join(backupRoot(), directories[directories.length - 1]);
};

const readJsonArray = async (backupDir: string, fileName: string): Promise<MongoDocument[]> => {
  const raw = await fs.readFile(path.join(backupDir, fileName), 'utf8');
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error(`${fileName} must contain a JSON array`);
  }

  return parsed;
};

const id = (document: MongoDocument): string => String(document._id);
const text = (value: unknown, fallback = ''): string => (value === undefined || value === null ? fallback : String(value));
const bannerName = (value: unknown): string => text(value).trim() || 'Bez chorągwi';
const bannerId = (value: unknown): string => createStableObjectId('banner', bannerName(value), '');
const numberOrZero = (value: unknown): number => {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
};
const intOrZero = (value: unknown): number => {
  const result = Number(value);
  return Number.isInteger(result) ? result : 0;
};
const firstNonEmptyText = (values: unknown[], fallback = ''): string => {
  const result = values.map((value) => text(value).trim()).find(Boolean);
  return result || fallback;
};
const dateOrThrow = (value: unknown, label: string): Date => {
  if (!(value instanceof Date || typeof value === 'string' || typeof value === 'number')) {
    throw new Error(`${label} has an invalid date value`);
  }

  const result = new Date(value);

  if (Number.isNaN(result.getTime())) {
    throw new Error(`${label} has an invalid date value`);
  }

  return result;
};
const yearFromDate = (value: unknown): string => {
  if (!(value instanceof Date || typeof value === 'string' || typeof value === 'number')) {
    return '';
  }

  const result = new Date(value);
  return Number.isNaN(result.getTime()) ? '' : String(result.getUTCFullYear());
};

const collectReferenceErrors = (data: BackupData): string[] => {
  const leagueIds = new Set(data.leagues.map(id));
  const playerIds = new Set(data.players.map(id));
  const tournamentIds = new Set(data.tournaments.map(id));
  const errors: string[] = [];
  const tournamentPlayerPairs = new Set<string>();

  for (const tournament of data.tournaments) {
    if (!leagueIds.has(text(tournament.leagueId))) {
      errors.push(
        `Tournament ${id(tournament)} (${text(tournament.city, 'no city')}, ${text(
          tournament.date,
          'no date'
        )}) points to missing league ${text(tournament.leagueId)}`
      );
    }
  }

  for (const playerPoints of data.playerpoints) {
    const pair = `${text(playerPoints.tournamentId)}:${text(playerPoints.playerId)}`;

    if (tournamentPlayerPairs.has(pair)) {
      errors.push(`Duplicate tournament/player pair ${pair}`);
    }

    tournamentPlayerPairs.add(pair);

    if (!tournamentIds.has(text(playerPoints.tournamentId))) {
      errors.push(
        `PlayerPoints ${id(playerPoints)} (${text(playerPoints.playerName, 'no player name')}) points to missing tournament ${text(
          playerPoints.tournamentId
        )}`
      );
    }

    if (!playerIds.has(text(playerPoints.playerId))) {
      errors.push(
        `PlayerPoints ${id(playerPoints)} (${text(playerPoints.playerName, 'no player name')}) points to missing player ${text(
          playerPoints.playerId
        )}`
      );
    }
  }

  return errors;
};

const applyOrphanRepairs = (data: BackupData): RepairSummary => {
  const leagueIds = new Set(data.leagues.map(id));
  const playerIds = new Set(data.players.map(id));
  const missingLeagueTournaments = new Map<string, MongoDocument[]>();
  const missingPlayerPoints = new Map<string, MongoDocument[]>();

  for (const tournament of data.tournaments) {
    const leagueId = text(tournament.leagueId);

    if (leagueId && !leagueIds.has(leagueId)) {
      missingLeagueTournaments.set(leagueId, [...(missingLeagueTournaments.get(leagueId) || []), tournament]);
    }
  }

  for (const playerPoints of data.playerpoints) {
    const playerId = text(playerPoints.playerId);

    if (playerId && !playerIds.has(playerId)) {
      missingPlayerPoints.set(playerId, [...(missingPlayerPoints.get(playerId) || []), playerPoints]);
    }
  }

  const summary: RepairSummary = { leagues: [], players: [] };

  for (const [leagueId, tournaments] of missingLeagueTournaments) {
    const year = firstNonEmptyText(tournaments.map((tournament) => yearFromDate(tournament.date)), 'unknown');

    data.leagues.push({
      _id: leagueId,
      name: `Odzyskana liga ${year}`,
      year
    });
    leagueIds.add(leagueId);
    summary.leagues.push({ id: leagueId, tournamentCount: tournaments.length, year });
  }

  for (const [playerId, playerPointRows] of missingPlayerPoints) {
    const firstRow = playerPointRows[0];
    const name = firstNonEmptyText(
      playerPointRows.map((row) => row.playerName),
      `Odzyskany zawodnik ${playerId}`
    );

    data.players.push({
      _id: playerId,
      name,
      horse: text(firstRow?.horse),
      flag: text(firstRow?.flag)
    });
    playerIds.add(playerId);
    summary.players.push({ id: playerId, name, playerPointCount: playerPointRows.length });
  }

  return summary;
};

const printReferenceErrors = (errors: string[]) => {
  console.log(`Reference issues found: ${errors.length}`);
  errors.slice(0, referenceErrorPreviewLimit).forEach((error) => console.log(`- ${error}`));

  if (errors.length > referenceErrorPreviewLimit) {
    console.log(`- ...and ${errors.length - referenceErrorPreviewLimit} more`);
  }
};

const upsert = async (client: Client, table: string, columns: string[], values: unknown[]) => {
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
  const updates = columns
    .filter((column) => column !== 'id')
    .map((column) => `${column} = EXCLUDED.${column}`)
    .join(', ');

  await client.query(
    `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})
     ON CONFLICT (id) DO UPDATE SET ${updates}`,
    values
  );
};

const run = async () => {
  const postgresUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  const isDryRun = process.argv.includes('--dry-run');
  const shouldRepairOrphans = process.argv.includes('--repair-orphans');
  const backupArg = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
  const backupDir = backupArg ? path.resolve(backupArg) : await findLatestBackupDir();
  const schemaPath = path.resolve(process.cwd(), '..', 'docs', 'postgres-initial-schema.sql');
  const schemaSql = await fs.readFile(schemaPath, 'utf8');
  const data = {
    leagues: await readJsonArray(backupDir, collectionFiles.leagues),
    players: await readJsonArray(backupDir, collectionFiles.players),
    tournaments: await readJsonArray(backupDir, collectionFiles.tournaments),
    playerpoints: await readJsonArray(backupDir, collectionFiles.playerpoints)
  };

  const repairSummary = shouldRepairOrphans ? applyOrphanRepairs(data) : { leagues: [], players: [] };
  const referenceErrors = collectReferenceErrors(data);

  if (isDryRun) {
    console.log(`Validated backup: ${backupDir}`);
    console.log('MongoDB backup counts:');
    console.log(`- leagues: ${data.leagues.length}`);
    console.log(`- players: ${data.players.length}`);
    console.log(`- tournaments: ${data.tournaments.length}`);
    console.log(`- playerpoints: ${data.playerpoints.length}`);

    if (shouldRepairOrphans) {
      console.log('In-memory orphan repair:');
      console.log(`- added leagues: ${repairSummary.leagues.length}`);
      repairSummary.leagues.forEach((league) =>
        console.log(`  - ${league.id}: ${league.tournamentCount} tournaments, year ${league.year}`)
      );
      console.log(`- added players: ${repairSummary.players.length}`);
      repairSummary.players.forEach((player) =>
        console.log(`  - ${player.id}: ${player.name}, ${player.playerPointCount} playerpoints`)
      );
    }

    if (referenceErrors.length) {
      printReferenceErrors(referenceErrors);
      console.log('PostgreSQL import dry run failed. No data was written.');
      process.exitCode = 1;
      return;
    }

    console.log('PostgreSQL import dry run passed. No data was written.');
    return;
  }

  if (referenceErrors.length) {
    printReferenceErrors(referenceErrors);
    throw new Error('Backup cannot be imported safely until reference issues are fixed or --repair-orphans is used');
  }

  if (shouldRepairOrphans) {
    console.log('Applying in-memory orphan repair before PostgreSQL import:');
    console.log(`- added leagues: ${repairSummary.leagues.length}`);
    console.log(`- added players: ${repairSummary.players.length}`);
  }

  if (!postgresUrl) {
    throw new Error('POSTGRES_URL or DATABASE_URL is required for PostgreSQL import');
  }

  const client = new Client({ connectionString: postgresUrl });
  await client.connect();

  try {
    await client.query('BEGIN');
    await client.query(schemaSql);

    for (const league of data.leagues) {
      await upsert(client, 'leagues', ['id', 'name', 'year'], [id(league), text(league.name), text(league.year)]);
    }

    const bannerNames = new Set<string>(['Bez chorągwi']);
    data.players.forEach((player) => bannerNames.add(bannerName(player.flag)));
    data.playerpoints.forEach((playerPoints) => bannerNames.add(bannerName(playerPoints.flag)));

    for (const name of bannerNames) {
      await upsert(client, 'banners', ['id', 'name', 'city'], [bannerId(name), name, '']);
    }

    for (const player of data.players) {
      await upsert(client, 'players', ['id', 'name', 'horse', 'flag', 'banner_id'], [
        id(player),
        text(player.name),
        text(player.horse),
        bannerName(player.flag),
        bannerId(player.flag)
      ]);
    }

    for (const tournament of data.tournaments) {
      await upsert(
        client,
        'tournaments',
        ['id', 'league_id', 'city', 'date', 'battle_1', 'battle_2', 'battle_3', 'battle_4', 'battle_5'],
        [
          id(tournament),
          text(tournament.leagueId),
          text(tournament.city),
          dateOrThrow(tournament.date, `Tournament ${id(tournament)}`),
          text(tournament.battle_1),
          text(tournament.battle_2),
          text(tournament.battle_3),
          text(tournament.battle_4),
          text(tournament.battle_5)
        ]
      );
    }

    const playerPointColumns = [
      'id',
      'tournament_id',
      'player_id',
      'player_name',
      'horse',
      'flag',
      'banner_id',
      'battle_1_points',
      'battle_1_extra_points',
      'battle_1_time',
      'battle_1_score',
      'battle_2_points',
      'battle_2_extra_points',
      'battle_2_time',
      'battle_2_score',
      'battle_3_points',
      'battle_3_extra_points',
      'battle_3_time',
      'battle_3_score',
      'battle_4_points',
      'battle_4_extra_points',
      'battle_4_time',
      'battle_4_score',
      'battle_5_points',
      'battle_5_extra_points',
      'battle_5_time',
      'battle_5_score',
      'penalty',
      'score',
      'start_order'
    ];

    for (const playerPoints of data.playerpoints) {
      await upsert(client, 'tournament_players', playerPointColumns, [
        id(playerPoints),
        text(playerPoints.tournamentId),
        text(playerPoints.playerId),
        text(playerPoints.playerName),
        text(playerPoints.horse),
        bannerName(playerPoints.flag),
        bannerId(playerPoints.flag),
        text(playerPoints.battle_1_points, '0'),
        numberOrZero(playerPoints.battle_1_extraPoints),
        numberOrZero(playerPoints.battle_1_time),
        numberOrZero(playerPoints.battle_1_score),
        text(playerPoints.battle_2_points, '0'),
        numberOrZero(playerPoints.battle_2_extraPoints),
        numberOrZero(playerPoints.battle_2_time),
        numberOrZero(playerPoints.battle_2_score),
        text(playerPoints.battle_3_points, '0'),
        numberOrZero(playerPoints.battle_3_extraPoints),
        numberOrZero(playerPoints.battle_3_time),
        numberOrZero(playerPoints.battle_3_score),
        text(playerPoints.battle_4_points, '0'),
        numberOrZero(playerPoints.battle_4_extraPoints),
        numberOrZero(playerPoints.battle_4_time),
        numberOrZero(playerPoints.battle_4_score),
        text(playerPoints.battle_5_points, '0'),
        numberOrZero(playerPoints.battle_5_extraPoints),
        numberOrZero(playerPoints.battle_5_time),
        numberOrZero(playerPoints.battle_5_score),
        numberOrZero(playerPoints.penalty),
        numberOrZero(playerPoints.score),
        intOrZero(playerPoints.order)
      ]);
    }

    await client.query('COMMIT');

    console.log(`Imported backup: ${backupDir}`);
    console.log('PostgreSQL table counts:');
    for (const table of ['leagues', 'banners', 'players', 'tournaments', 'tournament_players']) {
      const result = await client.query<{ count: string }>(`SELECT COUNT(*) AS count FROM ${table}`);
      console.log(`- ${table}: ${result.rows[0].count}`);
    }
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
};

run().catch((error: Error) => {
  console.error(error.message);
  process.exitCode = 1;
});
