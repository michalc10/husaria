import { QueryResultRow } from 'pg';

export const toNumber = (value: unknown): number => {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
};

export const hasField = (body: Record<string, unknown>, field: string) =>
  Object.prototype.hasOwnProperty.call(body, field);

export const buildUpdate = (
  body: Record<string, unknown>,
  fields: Record<string, string>,
  firstParameterIndex = 2
) => {
  const entries = Object.entries(fields).filter(([field]) => hasField(body, field));

  if (!entries.length) {
    return null;
  }

  return {
    setSql: entries.map(([, column], index) => `${column} = $${index + firstParameterIndex}`).join(', '),
    values: entries.map(([field]) => body[field])
  };
};

export type Mapper<T> = (row: QueryResultRow) => T;

