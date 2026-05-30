import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

const toIssueResponse = (error: z.ZodError) =>
  error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message
  }));

export const validateBody =
  <T extends z.ZodType>(schema: T) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: 'Błąd walidacji',
        errors: toIssueResponse(result.error)
      });
    }

    req.body = result.data;
    return next();
  };

export const validateObjectIdParam =
  (paramName: string) =>
  (req: Request, res: Response, next: NextFunction) => {
    const value = req.params[paramName];

    if (!/^[a-f\d]{24}$/i.test(value)) {
      return res.status(400).json({
        message: `Nieprawidłowy identyfikator: ${paramName}`
      });
    }

    return next();
  };
