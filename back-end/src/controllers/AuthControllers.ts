import { Request, Response } from 'express';
import authRepository, { SessionUser } from '../repositories/authRepository';
import { clearSessionCookie, currentUser, readSessionCookie, setSessionCookie } from '../middleware/auth';
import { serverError } from './helpers';

const stripSession = (user: SessionUser) => {
  const { sessionId, ...publicUser } = user;
  return publicUser;
};

const login = async (req: Request, res: Response) => {
  try {
    const result = await authRepository.login(req.body.email, req.body.password, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });

    if (!result) {
      return res.status(401).json({ message: 'Nieprawidłowy e-mail lub hasło' });
    }

    setSessionCookie(res, result.session.token);
    return res.status(200).json({ user: result.user });
  } catch (error) {
    return serverError(res, error);
  }
};

const me = async (_req: Request, res: Response) => {
  const user = currentUser(res);
  return user ? res.status(200).json(stripSession(user)) : res.status(401).json({ message: 'Wymagane logowanie' });
};

const logout = async (req: Request, res: Response) => {
  try {
    await authRepository.revokeSession(readSessionCookie(req));
    clearSessionCookie(res);
    return res.status(200).json({ ok: true });
  } catch (error) {
    return serverError(res, error);
  }
};

const changePassword = async (req: Request, res: Response) => {
  try {
    const user = currentUser(res);
    if (!user) {
      return res.status(401).json({ message: 'Wymagane logowanie' });
    }

    const updatedUser = await authRepository.changePassword(
      user._id,
      req.body.currentPassword,
      req.body.newPassword
    );

    if (!updatedUser) {
      return res.status(400).json({ message: 'Aktualne hasło jest nieprawidłowe' });
    }

    return res.status(200).json(updatedUser);
  } catch (error) {
    return serverError(res, error);
  }
};

export default {
  login,
  me,
  logout,
  changePassword
};
