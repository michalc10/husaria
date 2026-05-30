import { Pool, PoolClient, QueryResultRow } from 'pg';
import { config } from '../config/config';

let pool: Pool | undefined;

export const getPostgresPool = () => {
  if (!pool) {
    pool = new Pool({ connectionString: config.postgres.url });
  }

  return pool;
};

export const postgresQuery = <T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) =>
  getPostgresPool().query<T>(text, values);

export const withPostgresTransaction = async <T>(callback: (client: PoolClient) => Promise<T>) => {
  const client = await getPostgresPool().connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const connectPostgres = async () => {
  const result = await postgresQuery<{ database: string }>('SELECT current_database() AS database');
  return result.rows[0].database;
};

export const closePostgres = async () => {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
};

