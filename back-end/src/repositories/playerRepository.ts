import { prisma } from '../database/prisma';
import { createObjectId } from './ids';
import { mapPlayer } from './prismaMappers';

type PlayerInput = {
  name: string;
  horse: string;
  bannerId?: string | null;
  flag?: string;
};

const playerInclude = {
  banner: true
};

export const playerRepository = {
  async create(input: PlayerInput) {
    if (!input.bannerId) return null;

    const banner = await prisma.banner.findUnique({ where: { id: input.bannerId } });
    if (!banner) return null;

    const player = await prisma.player.create({
      data: {
        id: createObjectId(),
        name: input.name,
        horse: input.horse,
        bannerId: banner.id,
        flag: banner.name
      },
      include: playerInclude
    });
    return mapPlayer(player);
  },

  async findById(id: string) {
    const player = await prisma.player.findUnique({ where: { id }, include: playerInclude });
    return player ? mapPlayer(player) : null;
  },

  async findAll() {
    const players = await prisma.player.findMany({
      include: playerInclude,
      orderBy: { name: 'asc' }
    });
    return players.map(mapPlayer);
  },

  async update(id: string, body: Partial<PlayerInput>) {
    const existing = await prisma.player.findUnique({ where: { id }, include: playerInclude });
    if (!existing) return null;

    const banner =
      body.bannerId !== undefined && body.bannerId !== null
        ? await prisma.banner.findUnique({ where: { id: body.bannerId } })
        : null;
    if (body.bannerId !== undefined && body.bannerId !== null && !banner) return null;

    const player = await prisma.$transaction(async (tx) => {
      const updated = await tx.player.update({
        where: { id },
        data: {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.horse !== undefined ? { horse: body.horse } : {}),
          ...(body.bannerId !== undefined
            ? {
                bannerId: banner?.id ?? null,
                flag: banner?.name ?? body.flag ?? existing.flag
              }
            : {})
        },
        include: playerInclude
      });

      if (body.bannerId !== undefined) {
        await tx.tournamentPlayer.updateMany({
          where: { playerId: id },
          data: {
            bannerId: banner?.id ?? null,
            flag: banner?.name ?? body.flag ?? existing.flag
          }
        });
      }

      return updated;
    });

    return mapPlayer(player);
  },

  async delete(id: string) {
    const existing = await prisma.player.findUnique({ where: { id } });
    if (!existing) return null;

    await prisma.player.delete({ where: { id } });
    return existing;
  }
};
