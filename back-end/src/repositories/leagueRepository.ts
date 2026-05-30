import { prisma } from '../database/prisma';
import { createObjectId } from './ids';
import { mapLeague } from './prismaMappers';

type LeagueInput = {
  name: string;
  year: string;
  tournaments?: Array<{
    city?: string;
    date?: Date | string;
  }>;
};

export const leagueRepository = {
  async create(input: LeagueInput) {
    return prisma.$transaction(async (tx) => {
      const league = await tx.league.create({
        data: {
          id: createObjectId(),
          name: input.name,
          year: input.year
        }
      });

      for (const tournament of input.tournaments || []) {
        await tx.tournament.create({
          data: {
            id: createObjectId(),
            leagueId: league.id,
            city: tournament.city || '',
            date: tournament.date ? new Date(tournament.date) : new Date()
          }
        });
      }

      return mapLeague(league);
    });
  },

  async findById(id: string) {
    const league = await prisma.league.findUnique({ where: { id } });
    return league ? mapLeague(league) : null;
  },

  async findAll() {
    const leagues = await prisma.league.findMany({ orderBy: [{ year: 'desc' }, { name: 'asc' }] });
    return leagues.map(mapLeague);
  },

  async update(id: string, body: Partial<LeagueInput>) {
    const existing = await prisma.league.findUnique({ where: { id } });
    if (!existing) return null;

    const league = await prisma.league.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.year !== undefined ? { year: body.year } : {})
      }
    });
    return mapLeague(league);
  },

  async delete(id: string) {
    const existing = await prisma.league.findUnique({ where: { id } });
    if (!existing) return null;

    await prisma.league.delete({ where: { id } });
    return existing;
  }
};
