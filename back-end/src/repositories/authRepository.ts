import crypto from 'crypto';
import argon2 from 'argon2';
import { UserRole } from '@prisma/client';
import { config } from '../config/config';
import { prisma } from '../database/prisma';
import { createObjectId } from './ids';

export interface PublicUser {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  mustChangePassword: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionUser extends PublicUser {
  sessionId: string;
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const hashSessionToken = (token: string) =>
  crypto
    .createHmac('sha256', config.auth.sessionSecret)
    .update(token)
    .digest('hex');

const publicUser = (user: {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  mustChangePassword: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): PublicUser => ({
  _id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  active: user.active,
  mustChangePassword: user.mustChangePassword,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const hashPassword = (password: string) => argon2.hash(password);

const verifyPassword = (hash: string, password: string) => argon2.verify(hash, password);

const createSession = async (
  userId: string,
  context: { userAgent?: string; ipAddress?: string }
) => {
  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.auth.sessionDays * 24 * 60 * 60 * 1000);

  await prisma.userSession.create({
    data: {
      id: createObjectId(),
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt,
      userAgent: context.userAgent || '',
      ipAddress: context.ipAddress || ''
    }
  });

  return { token, expiresAt };
};

const login = async (
  email: string,
  password: string,
  context: { userAgent?: string; ipAddress?: string }
) => {
  const user = await prisma.user.findUnique({ where: { email: normalizeEmail(email) } });

  if (!user || !user.active) {
    return null;
  }

  const isValidPassword = await verifyPassword(user.passwordHash, password);
  if (!isValidPassword) {
    return null;
  }

  const session = await createSession(user.id, context);
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  return { user: publicUser(updatedUser), session };
};

const getSessionUser = async (token: string | undefined): Promise<SessionUser | null> => {
  if (!token) return null;

  const session = await prisma.userSession.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: true }
  });

  if (!session || session.revokedAt || session.expiresAt <= new Date() || !session.user.active) {
    return null;
  }

  await prisma.userSession.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() }
  });

  return {
    ...publicUser(session.user),
    sessionId: session.id
  };
};

const revokeSession = async (token: string | undefined) => {
  if (!token) return;

  await prisma.userSession.updateMany({
    where: {
      tokenHash: hashSessionToken(token),
      revokedAt: null
    },
    data: { revokedAt: new Date() }
  });
};

const changePassword = async (userId: string, currentPassword: string, newPassword: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.active) return null;

  const isValidPassword = await verifyPassword(user.passwordHash, currentPassword);
  if (!isValidPassword) return null;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: await hashPassword(newPassword),
      mustChangePassword: false
    }
  });

  return publicUser(updatedUser);
};

export default {
  hashPassword,
  publicUser,
  login,
  getSessionUser,
  revokeSession,
  changePassword
};
