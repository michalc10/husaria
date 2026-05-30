import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const fallbackMongoHost = 'husary.xbvzelo.mongodb.net';
const targetMongoDatabase = 'test';

const parsePort = (value: string | undefined, fallback: number): number => {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 ? port : fallback;
};

const required = (name: string, value: string | undefined): string => {
  if (!value?.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
};

const parseCorsOrigin = (value: string | undefined): string[] =>
  (value || 'http://localhost:4200,http://127.0.0.1:4200')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const getMongoDatabaseFromUrl = (mongoUrl: string): string => {
  const withoutQuery = mongoUrl.split('?')[0];
  const withoutScheme = withoutQuery.replace(/^mongodb(\+srv)?:\/\//, '');
  const hostAndPath = withoutScheme.includes('@') ? withoutScheme.split('@').slice(1).join('@') : withoutScheme;
  const slashIndex = hostAndPath.indexOf('/');
  const database = slashIndex >= 0 ? decodeURIComponent(hostAndPath.slice(slashIndex + 1).split('/')[0] || '') : '';

  if (!database) {
    throw new Error(`MONGO_URL must include the /${targetMongoDatabase} database path`);
  }

  return database;
};

const assertTargetMongoDatabase = (database: string, source: string): string => {
  if (database !== targetMongoDatabase) {
    throw new Error(`${source} must be "${targetMongoDatabase}"`);
  }

  return database;
};

const buildMongoConfig = (): { url: string; database: string } => {
  if (process.env.MONGO_URL?.trim()) {
    const url = process.env.MONGO_URL.trim();
    const database = assertTargetMongoDatabase(getMongoDatabaseFromUrl(url), 'MONGO_URL database');

    return { url, database };
  }

  const username = encodeURIComponent(required('MONGO_USERNAME', process.env.MONGO_USERNAME));
  const password = encodeURIComponent(required('MONGO_PASSWORD', process.env.MONGO_PASSWORD));
  const host = (process.env.MONGO_CLUSTER_HOST || fallbackMongoHost).trim();
  const database = assertTargetMongoDatabase(process.env.MONGO_DATABASE?.trim() || targetMongoDatabase, 'MONGO_DATABASE');
  const databasePath = `/${database}`;
  const url = `mongodb+srv://${username}:${password}@${host}${databasePath}?retryWrites=true&w=majority`;

  return { url, database };
};

const SERVER_HOSTNAME = process.env.SERVER_HOSTNAME || 'localhost';
const SERVER_TOKEN_EXPIRETIME = parsePort(process.env.SERVER_TOKEN_EXPIRETIME, 3600);
const SERVER_TOKEN_ISSUER = process.env.SERVER_TOKEN_ISSUER || 'husaria';
const SERVER_REFRESH_TOKEN_SECRET = process.env.SERVER_REFRESH_TOKEN_SECRET || '';
const SERVER_TOKEN_SECRET = process.env.SERVER_TOKEN_SECRET || '';
const SERVER_PORT = parsePort(process.env.SERVER_PORT, 3000);
const SERVER_CORS_ORIGIN = parseCorsOrigin(process.env.SERVER_CORS_ORIGIN);
const POSTGRES_URL = process.env.POSTGRES_URL?.trim() || process.env.DATABASE_URL?.trim() || '';
const PUBLIC_FRONTEND_URL = (process.env.PUBLIC_FRONTEND_URL || 'http://localhost:4200').trim().replace(/\/+$/, '');
const SOCKET_CORS_ORIGIN = parseCorsOrigin(process.env.SOCKET_CORS_ORIGIN || process.env.SERVER_CORS_ORIGIN);
const AUTH_COOKIE_NAME = (process.env.AUTH_COOKIE_NAME || 'husaria_session').trim();
const AUTH_SESSION_DAYS = parsePort(process.env.AUTH_SESSION_DAYS, 14);
const AUTH_COOKIE_SECURE = (process.env.AUTH_COOKIE_SECURE || 'false').trim().toLowerCase() === 'true';
const AUTH_COOKIE_DOMAIN = process.env.AUTH_COOKIE_DOMAIN?.trim() || undefined;
const AUTH_SESSION_SECRET =
  process.env.AUTH_SESSION_SECRET?.trim() ||
  process.env.SERVER_TOKEN_SECRET?.trim() ||
  'dev-session-secret-change-me';
const JUDGE_TOKEN_SECRET =
  process.env.JUDGE_TOKEN_SECRET?.trim() ||
  process.env.SERVER_TOKEN_SECRET?.trim() ||
  'dev-judge-token-secret-change-me';

if (!POSTGRES_URL) {
  throw new Error('POSTGRES_URL or DATABASE_URL is required');
}

export const requireMongoConfig = () => buildMongoConfig();

export const config = {
  database: {
    provider: 'postgres'
  },
  postgres: {
    url: POSTGRES_URL
  },
  server: {
    hostname: SERVER_HOSTNAME,
    port: SERVER_PORT,
    corsOrigin: SERVER_CORS_ORIGIN,
    socketCorsOrigin: SOCKET_CORS_ORIGIN,
    publicFrontendUrl: PUBLIC_FRONTEND_URL
  },
  token: {
    expireTime: SERVER_TOKEN_EXPIRETIME,
    issuer: SERVER_TOKEN_ISSUER,
    refreshsecret: SERVER_REFRESH_TOKEN_SECRET,
    secret: SERVER_TOKEN_SECRET,
    judgeSecret: JUDGE_TOKEN_SECRET
  },
  auth: {
    cookieName: AUTH_COOKIE_NAME,
    sessionDays: AUTH_SESSION_DAYS,
    cookieSecure: AUTH_COOKIE_SECURE,
    cookieDomain: AUTH_COOKIE_DOMAIN,
    sessionSecret: AUTH_SESSION_SECRET
  }
};


