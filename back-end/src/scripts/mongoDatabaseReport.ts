import mongoose from 'mongoose';
import { ServerApiVersion } from 'mongodb';
import { requireMongoConfig } from '../config/config';
import { League } from '../models/LeagueModel';
import { Player } from '../models/PlayerModel';
import { PlayerPoints } from '../models/PlayerPointsModel';
import { Tournament } from '../models/TournamentModel';

const collections = [
  { label: 'leagues', name: League.collection.name },
  { label: 'players', name: Player.collection.name },
  { label: 'tournaments', name: Tournament.collection.name },
  { label: 'playerpoints', name: PlayerPoints.collection.name }
];

const run = async () => {
  const mongo = requireMongoConfig();
  await mongoose.connect(mongo.url, {
    dbName: mongo.database,
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true
    }
  });

  const db = mongoose.connection.db;

  if (!db) {
    throw new Error('MongoDB connection did not expose a database handle');
  }

  console.log(`MongoDB database: ${mongo.database}`);
  console.log('Collection document counts:');

  for (const collection of collections) {
    const count = await db.collection(collection.name).countDocuments();
    console.log(`- ${collection.label} (${collection.name}): ${count}`);
  }
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
