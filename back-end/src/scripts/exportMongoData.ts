import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import { ServerApiVersion } from 'mongodb';
import { requireMongoConfig } from '../config/config';
import { League } from '../models/LeagueModel';
import { Player } from '../models/PlayerModel';
import { PlayerPoints } from '../models/PlayerPointsModel';
import { Tournament } from '../models/TournamentModel';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

const collections: Array<{ label: string; model: mongoose.Model<any> }> = [
  { label: 'leagues', model: League },
  { label: 'players', model: Player },
  { label: 'tournaments', model: Tournament },
  { label: 'playerpoints', model: PlayerPoints }
];

const normalizeForJson = (value: unknown): JsonValue => {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalizeForJson);
  if (typeof value === 'object') {
    const maybeObjectId = value as { toHexString?: () => string };

    if (typeof maybeObjectId.toHexString === 'function') {
      return maybeObjectId.toHexString();
    }

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, normalizeForJson(entry)])
    );
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;

  return String(value);
};

const timestamp = () => new Date().toISOString().replace(/[:.]/g, '-');

const run = async () => {
  const mongo = requireMongoConfig();
  const backupRoot = process.env.MONGO_BACKUP_DIR
    ? path.resolve(process.env.MONGO_BACKUP_DIR)
    : path.resolve(process.cwd(), '..', 'backups', 'mongodb');
  const backupDir = path.join(backupRoot, timestamp());

  await fs.mkdir(backupDir, { recursive: true });
  await mongoose.connect(mongo.url, {
    dbName: mongo.database,
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true
    }
  });

  const counts: Record<string, number> = {};

  for (const collection of collections) {
    const documents = await collection.model.find().lean().exec();
    const normalized = documents.map((document: unknown) => normalizeForJson(document));
    counts[collection.label] = documents.length;
    await fs.writeFile(path.join(backupDir, `${collection.label}.json`), `${JSON.stringify(normalized, null, 2)}\n`);
  }

  await fs.writeFile(
    path.join(backupDir, 'metadata.json'),
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        sourceDatabase: mongo.database,
        collections: counts
      },
      null,
      2
    )}\n`
  );

  console.log(`MongoDB database: ${mongo.database}`);
  console.log(`Backup directory: ${backupDir}`);
  console.log('Exported collections:');
  Object.entries(counts).forEach(([label, count]) => console.log(`- ${label}: ${count}`));
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
