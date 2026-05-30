import { CookieOptions, NextFunction, Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { config } from '../config/config';
import authRepository, { SessionUser } from '../repositories/authRepository';

const parseCookies = (cookieHeader = ''): Record<string, string> =>
  cookieHeader
    .split(';')
    .map(part => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((cookies, part) => {
      const separatorIndex = part.indexOf('=');
      if (separatorIndex < 0) return cookies;

      const key = part.slice(0, separatorIndex).trim();
      const value = part.slice(separatorIndex + 1).trim();
      cookies[key] = decodeURIComponent(value);
      return cookies;
    }, {});

const cookieOptions = (): CookieOptions => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: config.auth.cookieSecure,
  domain: config.auth.cookieDomain,
  path: '/',
  maxAge: config.auth.sessionDays * 24 * 60 * 60 * 1000
});

export const readSessionCookie = (req: Request): string | undefined =>
  parseCookies(req.headers.cookie)[config.auth.cookieName];

export const setSessionCookie = (res: Response, token: string) => {
  res.cookie(config.auth.cookieName, token, cookieOptions());
};

export const clearSessionCookie = (res: Response) => {
  const { maxAge, ...options } = cookieOptions();
  res.clearCookie(config.auth.cookieName, options);
};

export const currentUser = (res: Response): SessionUser | undefined => res.locals.user as SessionUser | undefined;

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = readSessionCookie(req);
    const user = await authRepository.getSessionUser(token);

    if (!user) {
      return res.status(401).json({ message: 'Wymagane logowanie' });
    }

    res.locals.user = user;
    res.locals.sessionToken = token;
    return next();
  } catch (error) {
    return next(error);
  }
};

export const requireRole = (...roles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => {
  const user = currentUser(res);

  if (!user || !roles.includes(user.role)) {
    return res.status(403).json({ message: 'Brak uprawnień' });
  }

  return next();
};
