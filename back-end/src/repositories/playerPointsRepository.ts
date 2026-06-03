import { Prisma } from '@prisma/client';
import { prisma } from '../database/prisma';
import { createObjectId, createStableObjectId } from './ids';
import { mapBattleResult, mapTournamentPlayer, toNumber } from './prismaMappers';

type PlayerPointsInput = {
  tournamentId: string;
  playerName: string;
  horse: string;
  flag?: string;
  bannerId?: string | null;
  playerId: string;
  order?: number;
};

type BattleResultUpdateInput = {
  extraPoints?: number;
  time?: number;
  obstacleResults?: Array<{ obstacleId: string; value: string }>;
  penaltyResults?: Array<{ penaltyId: string; selected: boolean }>;
};

const participantInclude = {
  banner: true,
  battleResults: {
    include: {
      battle: true,
      obstacleResults: true,
      penaltyResults: true
    }
  }
} satisfies Prisma.TournamentPlayerInclude;

const battleDefinitionInclude = {
  categories: {
    include: {
      obstacles: true
    }
  },
  penalties: true
} satisfies Prisma.BattleInclude;

const scoreOptions = (value: unknown): Array<{ code: string; score: number }> => {
  if (!Array.isArray(value)) return [];
  return value.map((entry: any) => ({ code: String(entry.code), score: Number(entry.score || 0) }));
};

const scoreObstacleValue = (obstacle: any, value: string) => {
  if (obstacle.inputType === 'select') {
    return scoreOptions(obstacle.scoreOptions).find((option) => option.code === value)?.score || 0;
  }

  return value === '1' ? toNumber(obstacle.score) : 0;
};

const scorePenaltyValue = (penalty: any, selected: boolean) => (selected ? toNumber(penalty.score) : 0);

const createEmptyResultsForParticipant = async (tx: Prisma.TransactionClient, tournamentPlayerId: string, tournamentId: string) => {
  const battles = await tx.battle.findMany({
    where: { tournamentId },
    include: battleDefinitionInclude
  });

  for (const battle of battles) {
    const battleResultId = createStableObjectId('battle-result', tournamentPlayerId, battle.id);

    await tx.battleResult.create({
      data: {
        id: battleResultId,
        tournamentPlayerId,
        battleId: battle.id
      }
    });

    for (const category of battle.categories) {
      for (const obstacle of category.obstacles) {
        await tx.obstacleResult.create({
          data: {
            id: createStableObjectId('obstacle-result', battleResultId, obstacle.id),
            battleResultId,
            obstacleId: obstacle.id,
            value: '0',
            score: 0
          }
        });
      }
    }

    for (const penalty of battle.penalties) {
      await tx.penaltyResult.create({
        data: {
          id: createStableObjectId('penalty-result', battleResultId, penalty.id),
          battleResultId,
          penaltyId: penalty.id,
          selected: false,
          score: 0
        }
      });
    }
  }
};

const getParticipant = (id: string) =>
  prisma.tournamentPlayer.findUnique({
    where: { id },
    include: participantInclude
  });

export const playerPointsRepository = {
  async create(input: PlayerPointsInput) {
    return prisma.$transaction(async (tx) => {
      const player = await tx.player.findUnique({
        where: { id: input.playerId },
        include: { banner: true }
      });
      const bannerId = input.bannerId ?? player?.bannerId ?? null;
      const banner = bannerId ? await tx.banner.findUnique({ where: { id: bannerId } }) : null;

      if (!player || (bannerId && !banner)) {
        return null;
      }

      const flag = banner?.name || input.flag || player.flag;

      const participant = await tx.tournamentPlayer.create({
        data: {
          id: createObjectId(),
          tournamentId: input.tournamentId,
          playerId: input.playerId,
          playerName: input.playerName,
          horse: input.horse,
          bannerId: banner?.id ?? null,
          flag,
          order: input.order || 0
        }
      });

      await createEmptyResultsForParticipant(tx, participant.id, input.tournamentId);

      const withResults = await tx.tournamentPlayer.findUniqueOrThrow({
        where: { id: participant.id },
        include: participantInclude
      });
      return mapTournamentPlayer(withResults);
    });
  },

  async findById(id: string) {
    const participant = await getParticipant(id);
    return participant ? mapTournamentPlayer(participant) : null;
  },

  async findAllForTournament(tournamentId: string) {
    const participants = await prisma.tournamentPlayer.findMany({
      where: { tournamentId },
      include: participantInclude,
      orderBy: [{ order: 'asc' }, { playerName: 'asc' }]
    });
    return participants.map(mapTournamentPlayer);
  },

  async update(id: string, body: Record<string, unknown>) {
    const existing = await prisma.tournamentPlayer.findUnique({ where: { id } });
    if (!existing) return null;

    const banner = body.bannerId ? await prisma.banner.findUnique({ where: { id: String(body.bannerId) } }) : null;
    if (body.bannerId && !banner) return null;

    const participant = await prisma.tournamentPlayer.update({
      where: { id },
      data: {
        ...(body.tournamentId !== undefined ? { tournamentId: String(body.tournamentId) } : {}),
        ...(body.playerId !== undefined ? { playerId: String(body.playerId) } : {}),
        ...(body.playerName !== undefined ? { playerName: String(body.playerName) } : {}),
        ...(body.horse !== undefined ? { horse: String(body.horse) } : {}),
        ...(body.bannerId !== undefined
          ? { bannerId: banner?.id ?? null, flag: banner?.name ?? String(body.flag ?? existing.flag) }
          : {}),
        ...(body.flag !== undefined && body.bannerId === undefined ? { flag: String(body.flag) } : {}),
        ...(body.order !== undefined ? { order: Number(body.order) } : {}),
        revision: { increment: 1 }
      },
      include: participantInclude
    });
    return mapTournamentPlayer(participant);
  },

  async updateBattleResult(playerPointsId: string, battleId: string, body: BattleResultUpdateInput) {
    const battle = await prisma.battle.findUnique({
      where: { id: battleId },
      include: battleDefinitionInclude
    });
    const participant = await prisma.tournamentPlayer.findUnique({ where: { id: playerPointsId } });

    if (!battle || !participant) return null;

    return prisma.$transaction(async (tx) => {
      const battleResultId = createStableObjectId('battle-result', playerPointsId, battleId);
      const battleResult = await tx.battleResult.upsert({
        where: {
          tournamentPlayerId_battleId: {
            tournamentPlayerId: playerPointsId,
            battleId
          }
        },
        create: {
          id: battleResultId,
          tournamentPlayerId: playerPointsId,
          battleId,
          extraPoints: body.extraPoints || 0,
          time: body.time || 0,
          score: 0
        },
        update: {
          ...(body.extraPoints !== undefined ? { extraPoints: Number(body.extraPoints) } : {}),
          ...(body.time !== undefined ? { time: Number(body.time) } : {})
        }
      });

      for (const category of battle.categories) {
        for (const obstacle of category.obstacles) {
          const update = body.obstacleResults?.find((result) => result.obstacleId === obstacle.id);
          const value = update?.value ?? '0';

          await tx.obstacleResult.upsert({
            where: {
              battleResultId_obstacleId: {
                battleResultId: battleResult.id,
                obstacleId: obstacle.id
              }
            },
            create: {
              id: createStableObjectId('obstacle-result', battleResult.id, obstacle.id),
              battleResultId: battleResult.id,
              obstacleId: obstacle.id,
              value,
              score: scoreObstacleValue(obstacle, value)
            },
            update: update
              ? {
                  value,
                  score: scoreObstacleValue(obstacle, value)
                }
              : {}
          });
        }
      }

      for (const penalty of battle.penalties) {
        const update = body.penaltyResults?.find((result) => result.penaltyId === penalty.id);
        const selected = update?.selected ?? false;

        await tx.penaltyResult.upsert({
          where: {
            battleResultId_penaltyId: {
              battleResultId: battleResult.id,
              penaltyId: penalty.id
            }
          },
          create: {
            id: createStableObjectId('penalty-result', battleResult.id, penalty.id),
            battleResultId: battleResult.id,
            penaltyId: penalty.id,
            selected,
            score: scorePenaltyValue(penalty, selected)
          },
          update: update
            ? {
                selected,
                score: scorePenaltyValue(penalty, selected)
              }
            : {}
        });
      }

      const updated = await tx.battleResult.findUniqueOrThrow({
        where: { id: battleResult.id },
        include: {
          obstacleResults: true,
          penaltyResults: true
        }
      });
      const score =
        updated.obstacleResults.reduce((total, result) => total + toNumber(result.score), 0) +
        updated.penaltyResults.reduce((total, result) => total + toNumber(result.score), 0) +
        toNumber(updated.extraPoints) +
        toNumber(updated.time);

      const scored = await tx.battleResult.update({
        where: { id: battleResult.id },
        data: {
          score,
          revision: { increment: 1 }
        },
        include: {
          obstacleResults: true,
          penaltyResults: true
        }
      });

      return mapBattleResult(scored);
    });
  },

  async delete(id: string) {
    const existing = await prisma.tournamentPlayer.findUnique({ where: { id } });
    if (!existing) return null;

    await prisma.tournamentPlayer.delete({ where: { id } });
    return existing;
  }
};
