import { Prisma, TournamentStatus } from '@prisma/client';
import { prisma } from '../database/prisma';
import { createObjectId, createStableObjectId } from './ids';
import { mapBattle, mapTournament } from './prismaMappers';

type TournamentInput = {
  leagueId: string;
  city?: string;
  date?: Date;
  status?: TournamentStatus;
  countsInLeagueStandings?: boolean;
};

type BattleInput = {
  _id?: string;
  name: string;
  order: number;
  categories?: Array<{
    _id?: string;
    name: string;
    order: number;
    obstacles?: Array<{
      _id?: string;
      name: string;
      order: number;
      inputType?: string;
      score?: number;
      scoreRaw?: string;
      scoreOptions?: unknown;
    }>;
  }>;
  penalties?: Array<{
    _id?: string;
    name: string;
    order: number;
    score?: number;
  }>;
};

const battleInclude = {
  categories: {
    include: {
      obstacles: true
    },
    orderBy: {
      order: 'asc'
    }
  },
  penalties: {
    orderBy: {
      order: 'asc'
    }
  }
} satisfies Prisma.BattleInclude;

const scoreOptionsToJson = (value: unknown): Prisma.InputJsonValue | undefined => {
  if (!value) return undefined;
  return value as Prisma.InputJsonValue;
};

const getExistingResultSnapshot = async (tx: Prisma.TransactionClient, tournamentId: string) => {
  const results = await tx.battleResult.findMany({
    where: {
      battle: {
        tournamentId
      }
    },
    include: {
      obstacleResults: true,
      penaltyResults: true
    }
  });
  const resultByParticipantAndBattle = new Map<string, (typeof results)[number]>();
  const obstacleResultByResultAndObstacle = new Map<string, (typeof results)[number]['obstacleResults'][number]>();
  const penaltyResultByResultAndPenalty = new Map<string, (typeof results)[number]['penaltyResults'][number]>();

  results.forEach((result) => {
    resultByParticipantAndBattle.set(`${result.tournamentPlayerId}:${result.battleId}`, result);
    result.obstacleResults.forEach((obstacleResult) => {
      obstacleResultByResultAndObstacle.set(`${result.tournamentPlayerId}:${result.battleId}:${obstacleResult.obstacleId}`, obstacleResult);
    });
    result.penaltyResults.forEach((penaltyResult) => {
      penaltyResultByResultAndPenalty.set(`${result.tournamentPlayerId}:${result.battleId}:${penaltyResult.penaltyId}`, penaltyResult);
    });
  });

  return { resultByParticipantAndBattle, obstacleResultByResultAndObstacle, penaltyResultByResultAndPenalty };
};

export const tournamentRepository = {
  async create(input: TournamentInput) {
    const tournament = await prisma.tournament.create({
      data: {
        id: createObjectId(),
        leagueId: input.leagueId,
        city: input.city || '',
        date: input.date || new Date(),
        status: input.status || 'PLANNING',
        countsInLeagueStandings: input.countsInLeagueStandings ?? true
      }
    });
    return mapTournament(tournament);
  },

  async findById(id: string) {
    const tournament = await prisma.tournament.findUnique({ where: { id } });
    return tournament ? mapTournament(tournament) : null;
  },

  async findAll() {
    const tournaments = await prisma.tournament.findMany({ orderBy: { date: 'asc' } });
    return tournaments.map(mapTournament);
  },

  async findAllForLeague(leagueId: string) {
    const tournaments = await prisma.tournament.findMany({ where: { leagueId }, orderBy: { date: 'asc' } });
    return tournaments.map(mapTournament);
  },

  async update(id: string, body: Record<string, unknown>) {
    const existing = await prisma.tournament.findUnique({ where: { id } });
    if (!existing) return null;

    const tournament = await prisma.tournament.update({
      where: { id },
      data: {
        ...(body.leagueId !== undefined ? { leagueId: String(body.leagueId) } : {}),
        ...(body.city !== undefined ? { city: String(body.city) } : {}),
        ...(body.date !== undefined ? { date: new Date(String(body.date)) } : {}),
        ...(body.status !== undefined ? { status: body.status as TournamentStatus } : {}),
        ...(body.countsInLeagueStandings !== undefined ? { countsInLeagueStandings: Boolean(body.countsInLeagueStandings) } : {}),
        revision: { increment: 1 }
      }
    });
    return mapTournament(tournament);
  },

  async updateStatus(id: string, status: TournamentStatus) {
    const existing = await prisma.tournament.findUnique({ where: { id } });
    if (!existing) return null;

    const tournament = await prisma.tournament.update({
      where: { id },
      data: { status, revision: { increment: 1 } }
    });
    return mapTournament(tournament);
  },

  async delete(id: string) {
    const existing = await prisma.tournament.findUnique({ where: { id } });
    if (!existing) return null;

    await prisma.tournament.delete({ where: { id } });
    return existing;
  },

  async findBattles(tournamentId: string) {
    const battles = await prisma.battle.findMany({
      where: { tournamentId },
      include: battleInclude,
      orderBy: { order: 'asc' }
    });
    return battles.map(mapBattle);
  },

  async replaceBattles(tournamentId: string, battles: BattleInput[]) {
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) return null;

    return prisma.$transaction(async (tx) => {
      const participants = await tx.tournamentPlayer.findMany({ where: { tournamentId } });
      const snapshot = await getExistingResultSnapshot(tx, tournamentId);

      await tx.battle.deleteMany({ where: { tournamentId } });

      for (const [battleIndex, battle] of battles.entries()) {
        const battleOrder = battle.order || battleIndex + 1;
        const battleId = battle._id || createStableObjectId('battle', tournamentId, battleOrder);

        await tx.battle.create({
          data: {
            id: battleId,
            tournamentId,
            name: battle.name || `Konkurencja ${battleOrder}`,
            order: battleOrder,
            revision: 1
          }
        });

        for (const [categoryIndex, category] of (battle.categories || []).entries()) {
          const categoryOrder = category.order || categoryIndex + 1;
          const categoryId = category._id || createStableObjectId('battle-category', battleId, categoryOrder);

          await tx.battleCategory.create({
            data: {
              id: categoryId,
              battleId,
              name: category.name || `Kategoria ${categoryOrder}`,
              order: categoryOrder
            }
          });

          for (const [obstacleIndex, obstacle] of (category.obstacles || []).entries()) {
            const obstacleOrder = obstacle.order || obstacleIndex + 1;

            await tx.battleObstacle.create({
              data: {
                id: obstacle._id || createStableObjectId('battle-obstacle', categoryId, obstacleOrder),
                categoryId,
                name: obstacle.name || `Przeszkoda ${obstacleOrder}`,
                order: obstacleOrder,
                inputType: obstacle.inputType || 'toggle',
                score: Number(obstacle.score || 0),
                scoreRaw: obstacle.scoreRaw || String(obstacle.score || 0),
                scoreOptions: scoreOptionsToJson(obstacle.scoreOptions)
              }
            });
          }
        }

        for (const [penaltyIndex, penalty] of (battle.penalties || []).entries()) {
          const penaltyOrder = penalty.order || penaltyIndex + 1;

          await tx.battlePenalty.create({
            data: {
              id: penalty._id || createStableObjectId('battle-penalty', battleId, penaltyOrder),
              battleId,
              name: penalty.name || `Kara ${penaltyOrder}`,
              order: penaltyOrder,
              score: Number(penalty.score || 0)
            }
          });
        }

        const createdBattle = await tx.battle.findUniqueOrThrow({
          where: { id: battleId },
          include: battleInclude
        });

        for (const participant of participants) {
          const previousResult = snapshot.resultByParticipantAndBattle.get(`${participant.id}:${battleId}`);
          const battleResultId = previousResult?.id || createStableObjectId('battle-result', participant.id, battleId);

          await tx.battleResult.create({
            data: {
              id: battleResultId,
              tournamentPlayerId: participant.id,
              battleId,
              extraPoints: previousResult?.extraPoints || 0,
              time: previousResult?.time || 0,
              score: previousResult?.score || 0
            }
          });

          for (const category of createdBattle.categories) {
            for (const obstacle of category.obstacles) {
              const previousObstacle = snapshot.obstacleResultByResultAndObstacle.get(
                `${participant.id}:${battleId}:${obstacle.id}`
              );

              await tx.obstacleResult.create({
                data: {
                  id: previousObstacle?.id || createStableObjectId('obstacle-result', battleResultId, obstacle.id),
                  battleResultId,
                  obstacleId: obstacle.id,
                  value: previousObstacle?.value || '0',
                  score: previousObstacle?.score || 0
                }
              });
            }
          }

          for (const penalty of createdBattle.penalties) {
            const previousPenalty = snapshot.penaltyResultByResultAndPenalty.get(`${participant.id}:${battleId}:${penalty.id}`);

            await tx.penaltyResult.create({
              data: {
                id: previousPenalty?.id || createStableObjectId('penalty-result', battleResultId, penalty.id),
                battleResultId,
                penaltyId: penalty.id,
                selected: previousPenalty?.selected || false,
                score: previousPenalty?.score || 0
              }
            });
          }
        }
      }

      const updated = await tx.battle.findMany({
        where: { tournamentId },
        include: battleInclude,
        orderBy: { order: 'asc' }
      });
      await tx.tournament.update({
        where: { id: tournamentId },
        data: { revision: { increment: 1 } }
      });
      return updated.map(mapBattle);
    });
  }
};
