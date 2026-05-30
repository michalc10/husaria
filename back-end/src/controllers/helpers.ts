import { Response } from 'express';
import Logging from '../library/Logging';
import { ConflictError } from '../repositories/errors';

export const notFound = (res: Response) => res.status(404).json({ message: 'Nie znaleziono' });

export const conflict = (res: Response, message: string) => res.status(409).json({ message });

export const serverError = (res: Response, error: unknown) => {
  if (error instanceof ConflictError) {
    return conflict(res, error.message);
  }

  Logging.error(error);
  return res.status(500).json({ message: 'Wewnętrzny błąd serwera' });
};
