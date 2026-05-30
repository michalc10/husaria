import { Prisma, UserRole } from '@prisma/client';
import { prisma } from '../database/prisma';
import authRepository, { PublicUser } from './authRepository';
import { ConflictError } from './errors';
import { createObjectId } from './ids';

interface CreateUserInput {
  email: string;
  name: string;
  role: UserRole;
  temporaryPassword: string;
}

interface UpdateUserInput {
  email?: string;
  name?: string;
  role?: UserRole;
  active?: boolean;
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const handleUniqueError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    throw new ConflictError('Użytkownik z takim adresem e-mail już istnieje');
  }

  throw error;
};

const ensureActiveAdminRemains = async (userId: string, nextRole?: UserRole, nextActive?: boolean) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'ADMIN' || user.active === false) return;

  const wouldRemoveAdminAccess = nextRole === 'JUDGE' || nextActive === false;
  if (!wouldRemoveAdminAccess) return;

  const otherAdmins = await prisma.user.count({
    where: {
      id: { not: userId },
      role: 'ADMIN',
      active: true
    }
  });

  if (otherAdmins === 0) {
    throw new ConflictError('Nie można usunąć dostępu ostatniemu aktywnemu administratorowi');
  }
};

const readAll = async (): Promise<PublicUser[]> => {
  const users = await prisma.user.findMany({
    orderBy: [{ active: 'desc' }, { role: 'asc' }, { name: 'asc' }]
  });

  return users.map(authRepository.publicUser);
};

const read = async (id: string): Promise<PublicUser | null> => {
  const user = await prisma.user.findUnique({ where: { id } });
  return user ? authRepository.publicUser(user) : null;
};

const create = async (input: CreateUserInput): Promise<PublicUser> => {
  try {
    const user = await prisma.user.create({
      data: {
        id: createObjectId(),
        email: normalizeEmail(input.email),
        name: input.name.trim(),
        role: input.role,
        passwordHash: await authRepository.hashPassword(input.temporaryPassword),
        mustChangePassword: true
      }
    });

    return authRepository.publicUser(user);
  } catch (error) {
    return handleUniqueError(error);
  }
};

const update = async (id: string, input: UpdateUserInput): Promise<PublicUser | null> => {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return null;

  await ensureActiveAdminRemains(id, input.role, input.active);

  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        email: input.email ? normalizeEmail(input.email) : undefined,
        name: input.name?.trim(),
        role: input.role,
        active: input.active
      }
    });

    if (input.active === false) {
      await prisma.userSession.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() }
      });
    }

    return authRepository.publicUser(user);
  } catch (error) {
    return handleUniqueError(error);
  }
};

const resetPassword = async (id: string, temporaryPassword: string): Promise<PublicUser | null> => {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return null;

  const user = await prisma.user.update({
    where: { id },
    data: {
      passwordHash: await authRepository.hashPassword(temporaryPassword),
      mustChangePassword: true
    }
  });

  await prisma.userSession.updateMany({
    where: { userId: id, revokedAt: null },
    data: { revokedAt: new Date() }
  });

  return authRepository.publicUser(user);
};

const setActive = async (id: string, active: boolean): Promise<PublicUser | null> => {
  return update(id, { active });
};

export default {
  readAll,
  read,
  create,
  update,
  resetPassword,
  setActive
};
