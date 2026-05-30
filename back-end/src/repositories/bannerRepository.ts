import { Prisma } from '@prisma/client';
import { prisma } from '../database/prisma';
import { createObjectId } from './ids';
import { mapBanner } from './prismaMappers';
import { ConflictError } from './errors';

type BannerInput = {
  name: string;
  city?: string;
};

const normalize = (input: BannerInput) => ({
  name: input.name.trim(),
  city: (input.city || '').trim()
});

const duplicateError = new ConflictError('Chorągiew o tej nazwie i mieście już istnieje');

const handlePrismaError = (error: unknown) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    throw duplicateError;
  }

  throw error;
};

export const bannerRepository = {
  async create(input: BannerInput) {
    try {
      const data = normalize(input);
      const banner = await prisma.banner.create({
        data: {
          id: createObjectId(),
          name: data.name,
          city: data.city
        }
      });

      return mapBanner(banner);
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async findById(id: string) {
    const banner = await prisma.banner.findUnique({ where: { id } });
    return banner ? mapBanner(banner) : null;
  },

  async findAll() {
    const banners = await prisma.banner.findMany({
      orderBy: [{ name: 'asc' }, { city: 'asc' }]
    });
    return banners.map(mapBanner);
  },

  async update(id: string, input: Partial<BannerInput>) {
    const existing = await prisma.banner.findUnique({ where: { id } });
    if (!existing) return null;

    try {
      const data = {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.city !== undefined ? { city: input.city.trim() } : {})
      };

      const banner = await prisma.$transaction(async (tx) => {
        const updated = await tx.banner.update({
          where: { id },
          data
        });

        await tx.player.updateMany({
          where: { bannerId: id },
          data: { flag: updated.name }
        });

        await tx.tournamentPlayer.updateMany({
          where: { bannerId: id },
          data: { flag: updated.name }
        });

        return updated;
      });

      return mapBanner(banner);
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async delete(id: string) {
    const existing = await prisma.banner.findUnique({ where: { id } });
    if (!existing) return null;

    await prisma.$transaction(async (tx) => {
      await tx.player.updateMany({
        where: { bannerId: id },
        data: {
          bannerId: null,
          flag: existing.name
        }
      });

      await tx.tournamentPlayer.updateMany({
        where: { bannerId: id },
        data: {
          bannerId: null,
          flag: existing.name
        }
      });

      await tx.banner.delete({ where: { id } });
    });

    return existing;
  }
};
