import crypto from 'crypto';
import { prisma } from '../database/prisma';
import { config } from '../config/config';
import { ConflictError } from './errors';
import { createObjectId } from './ids';
import { mapBattleLiveState, mapBattleResult, mapJudgeStation } from './prismaMappers';
import { playerPointsRepository } from './playerPointsRepository';
import { scoreChangeLogRepository } from './scoreChangeLogRepository';

type JudgeSessionResultInput = {
  liveStateVersion: number;
  obstacleResults: Array<{ obstacleId: string; value: string }>;
};

const categoryInclude = {
  obstacles: {
    orderBy: {
      order: 'asc' as const
    }
  }
};

const liveStateInclude = {
  activeTournamentPlayer: true
};

const createGuestToken = () => crypto.randomBytes(32).toString('base64url');

const hashToken = (token: string) =>
  crypto.createHmac('sha256', config.token.judgeSecret).update(token).digest('hex');

const guestUrl = (token: string) => `${config.server.publicFrontendUrl}/judge/${encodeURIComponent(token)}`;

const readBearerToken = (authorization = '') => {
  const [type, token] = authorization.split(' ');
  return type?.toLowerCase() === 'bearer' && token ? token.trim() : '';
};

const mapCategory = (category: any) => ({
  _id: category.id,
  battleId: category.battleId,
  name: category.name,
  order: category.order,
  obstacles: [...(category.obstacles || [])].map((obstacle) => ({
    _id: obstacle.id,
    categoryId: obstacle.categoryId,
    name: obstacle.name,
    order: obstacle.order,
    inputType: obstacle.inputType,
    score: Number(obstacle.score || 0),
    scoreRaw: obstacle.scoreRaw,
    scoreOptions: obstacle.scoreOptions || undefined
  }))
});

const stationFromToken = async (token: string) => {
  if (!token) return null;

  return prisma.judgeStation.findFirst({
    where: {
      tokenHash: hashToken(token),
      revokedAt: null
    },
    include: {
      category: {
        include: categoryInclude
      },
      battle: {
        include: {
          liveState: {
            include: liveStateInclude
          }
        }
      }
    }
  });
};

const activeResultForStation = async (station: any) => {
  const activeParticipantId = station.battle.liveState?.activeTournamentPlayerId;
  if (!activeParticipantId) return null;

  const result = await prisma.battleResult.findUnique({
    where: {
      tournamentPlayerId_battleId: {
        tournamentPlayerId: activeParticipantId,
        battleId: station.battleId
      }
    },
    include: {
      obstacleResults: true,
      penaltyResults: true
    }
  });

  return result ? mapBattleResult(result) : null;
};

const mapSession = async (station: any) => {
  const liveState = station.battle.liveState
    ? mapBattleLiveState(station.battle.liveState)
    : {
        battleId: station.battleId,
        activeTournamentPlayerId: null,
        activeParticipant: null,
        version: 0,
        updatedAt: null
      };

  return {
    station: mapJudgeStation(station),
    battle: {
      _id: station.battle.id,
      tournamentId: station.battle.tournamentId,
      name: station.battle.name,
      order: station.battle.order
    },
    category: mapCategory(station.category),
    liveState,
    result: await activeResultForStation(station)
  };
};

export const judgeStationRepository = {
  readBearerToken,

  async listForBattle(battleId: string) {
    const battle = await prisma.battle.findUnique({
      where: { id: battleId },
      include: {
        categories: {
          include: {
            ...categoryInclude,
            judgeStations: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    if (!battle) return null;

    return {
      battleId,
      categories: battle.categories.map((category) => {
        const station = category.judgeStations.find((item) => !item.revokedAt) || category.judgeStations[0] || null;
        return {
          category: mapCategory(category),
          station: station ? mapJudgeStation(station) : null
        };
      })
    };
  },

  async createOrRegenerate(battleId: string, categoryId: string) {
    const category = await prisma.battleCategory.findUnique({
      where: { id: categoryId },
      include: {
        battle: true
      }
    });

    if (!category || category.battleId !== battleId) return null;

    const token = createGuestToken();
    const station = await prisma.judgeStation.upsert({
      where: {
        battleId_categoryId: {
          battleId,
          categoryId
        }
      },
      create: {
        id: createObjectId(),
        tournamentId: category.battle.tournamentId,
        battleId,
        categoryId,
        label: category.name,
        tokenHash: hashToken(token)
      },
      update: {
        label: category.name,
        tokenHash: hashToken(token),
        revokedAt: null,
        lastSeenAt: null
      }
    });

    return mapJudgeStation(station, guestUrl(token));
  },

  async revoke(stationId: string) {
    const existing = await prisma.judgeStation.findUnique({ where: { id: stationId } });
    if (!existing) return null;

    const station = await prisma.judgeStation.update({
      where: { id: stationId },
      data: {
        revokedAt: new Date()
      }
    });
    return mapJudgeStation(station);
  },

  async setLiveState(battleId: string, activeTournamentPlayerId: string | null) {
    const battle = await prisma.battle.findUnique({ where: { id: battleId } });
    if (!battle) return null;

    if (activeTournamentPlayerId) {
      const participant = await prisma.tournamentPlayer.findUnique({ where: { id: activeTournamentPlayerId } });
      if (!participant || participant.tournamentId !== battle.tournamentId) return null;
    }

    const state = await prisma.battleLiveState.upsert({
      where: { battleId },
      create: {
        battleId,
        activeTournamentPlayerId,
        version: 1
      },
      update: {
        activeTournamentPlayerId,
        version: {
          increment: 1
        }
      },
      include: liveStateInclude
    });

    return mapBattleLiveState(state);
  },

  async getLiveState(battleId: string) {
    const state = await prisma.battleLiveState.findUnique({
      where: { battleId },
      include: liveStateInclude
    });

    return state ? mapBattleLiveState(state) : null;
  },

  async getSession(token: string) {
    const station = await stationFromToken(token);
    return station ? mapSession(station) : null;
  },

  async touchStation(token: string) {
    const station = await stationFromToken(token);
    if (!station) return null;

    const updated = await prisma.judgeStation.update({
      where: { id: station.id },
      data: {
        lastSeenAt: new Date()
      }
    });
    return mapJudgeStation(updated);
  },

  async updateSessionResult(token: string, input: JudgeSessionResultInput) {
    const station = await stationFromToken(token);
    if (!station) return null;

    const liveState = station.battle.liveState;
    if (!liveState?.activeTournamentPlayerId) {
      throw new ConflictError('Brak aktywnego zawodnika dla tej konkurencji');
    }

    if (Number(input.liveStateVersion) !== liveState.version) {
      throw new ConflictError('Zawodnik zmienił się w trakcie zapisu. Odśwież stanowisko.');
    }

    const allowedObstacleIds = new Set(station.category.obstacles.map((obstacle) => obstacle.id));
    const obstacleResults = input.obstacleResults.map((result) => {
      if (!allowedObstacleIds.has(result.obstacleId)) {
        throw new ConflictError('Stanowisko może zapisywać tylko własną kategorię');
      }

      return {
        obstacleId: result.obstacleId,
        value: result.value
      };
    });

    const updated = await playerPointsRepository.updateBattleResult(liveState.activeTournamentPlayerId, station.battleId, {
      obstacleResults
    });

    if (!updated) return null;

    await Promise.all([
      prisma.judgeStation.update({
        where: { id: station.id },
        data: {
          lastSeenAt: new Date()
        }
      }),
      scoreChangeLogRepository.create({
        battleId: station.battleId,
        tournamentPlayerId: liveState.activeTournamentPlayerId,
        judgeStationId: station.id,
        source: 'station',
        payload: {
          liveStateVersion: input.liveStateVersion,
          obstacleResults
        }
      })
    ]);

    return updated;
  }
};
