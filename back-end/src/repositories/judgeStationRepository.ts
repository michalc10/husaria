import crypto from 'crypto';
import { prisma } from '../database/prisma';
import { config } from '../config/config';
import { ConflictError } from './errors';
import { createObjectId } from './ids';
import { mapBattle, mapBattleLiveState, mapBattleResult, mapJudgeStation, mapTournamentLiveState } from './prismaMappers';
import { playerPointsRepository } from './playerPointsRepository';
import { scoreChangeLogRepository } from './scoreChangeLogRepository';

type JudgeStationInput = {
  label?: string;
  assignments?: Array<{ battleId: string; categoryId: string }>;
  battleIds?: string[];
};

type JudgeSessionResultInput = {
  battleId: string;
  liveStateVersion: number;
  obstacleResults: Array<{ obstacleId: string; value: string }>;
};

type TournamentLiveStateInput = {
  activeTournamentPlayerId?: string | null;
  activeBattleId?: string | null;
};

const categoryInclude = {
  obstacles: {
    orderBy: {
      order: 'asc' as const
    }
  }
};

const battleDefinitionInclude = {
  categories: {
    include: categoryInclude,
    orderBy: {
      order: 'asc' as const
    }
  },
  penalties: {
    orderBy: {
      order: 'asc' as const
    }
  }
};

const liveStateInclude = {
  activeTournamentPlayer: true,
  activeBattle: true
};

const stationInclude = {
  assignments: {
    include: {
      battle: {
        include: battleDefinitionInclude
      },
      category: {
        include: categoryInclude
      }
    },
    orderBy: {
      createdAt: 'asc' as const
    }
  },
  tournament: {
    include: {
      liveState: {
        include: liveStateInclude
      }
    }
  }
};

const createGuestToken = () => crypto.randomBytes(32).toString('base64url');

const hashToken = (token: string) =>
  crypto.createHmac('sha256', config.token.judgeSecret).update(token).digest('hex');

const guestUrl = (token: string) => `${config.server.publicFrontendUrl}/judge/${encodeURIComponent(token)}`;

const readBearerToken = (authorization = '') => {
  const [type, token] = authorization.split(' ');
  return type?.toLowerCase() === 'bearer' && token ? token.trim() : '';
};

const defaultTournamentLiveState = (tournamentId: string) => ({
  tournamentId,
  activeTournamentPlayerId: null,
  activeBattleId: null,
  activeParticipant: null,
  activeBattle: null,
  version: 0,
  updatedAt: null
});

const firstTournamentParticipant = (tournamentId: string) =>
  prisma.tournamentPlayer.findFirst({
    where: { tournamentId },
    orderBy: [{ order: 'asc' }, { playerName: 'asc' }]
  });

const firstTournamentBattle = (tournamentId: string) =>
  prisma.battle.findFirst({
    where: { tournamentId },
    orderBy: [{ order: 'asc' }, { name: 'asc' }]
  });

const ensureTournamentLiveState = async (tournamentId: string) => {
  const state = await prisma.tournamentLiveState.findUnique({
    where: { tournamentId },
    include: liveStateInclude
  });

  if (state?.activeTournamentPlayerId && state?.activeBattleId) {
    return state;
  }

  const [firstParticipant, firstBattle] = await Promise.all([
    firstTournamentParticipant(tournamentId),
    firstTournamentBattle(tournamentId)
  ]);
  const activeTournamentPlayerId = state?.activeTournamentPlayerId || firstParticipant?.id || null;
  const activeBattleId = state?.activeBattleId || firstBattle?.id || null;

  if (!activeTournamentPlayerId && !activeBattleId) {
    return state;
  }

  return prisma.tournamentLiveState.upsert({
    where: { tournamentId },
    create: {
      tournamentId,
      activeTournamentPlayerId,
      activeBattleId,
      version: 1
    },
    update: {
      activeTournamentPlayerId,
      activeBattleId,
      version: {
        increment: 1
      }
    },
    include: liveStateInclude
  });
};

const mapStation = (station: any, token?: string) => mapJudgeStation(station, token ? guestUrl(token) : undefined);

const sortedAssignments = (station: any) =>
  [...(station.assignments || [])].sort((left, right) => {
    const battleOrder = (left.battle?.order || 0) - (right.battle?.order || 0);
    return battleOrder || (left.category?.order || 0) - (right.category?.order || 0);
  });

const assignedBattlesForStation = (station: any, activeBattleId?: string | null) => {
  const battlesById = new Map<string, any>();

  for (const assignment of sortedAssignments(station)) {
    if (!assignment.battle || !assignment.category) continue;
    if (activeBattleId && assignment.battleId !== activeBattleId) continue;

    const battle = battlesById.get(assignment.battleId) || {
      ...assignment.battle,
      categories: [],
      penalties: []
    };
    battle.categories.push(assignment.category);
    battlesById.set(assignment.battleId, battle);
  }

  return [...battlesById.values()].sort((left, right) => (left.order || 0) - (right.order || 0));
};

const stationWithAssignments = async (stationId: string) =>
  prisma.judgeStation.findUnique({
    where: { id: stationId },
    include: stationInclude
  });

const stationFromToken = async (token: string) => {
  if (!token) return null;

  return prisma.judgeStation.findFirst({
    where: {
      tokenHash: hashToken(token),
      revokedAt: null
    },
    include: stationInclude
  });
};

const validateBattleIds = async (tournamentId: string, battleIds: string[] = []) => {
  const uniqueBattleIds = [...new Set(battleIds.filter(Boolean))];
  if (!uniqueBattleIds.length) {
    throw new ConflictError('Stanowisko musi mieć co najmniej jedną konkurencję');
  }

  const battles = await prisma.battle.findMany({
    where: {
      id: {
        in: uniqueBattleIds
      },
      tournamentId
    },
    orderBy: {
      order: 'asc'
    }
  });

  if (battles.length !== uniqueBattleIds.length) {
    throw new ConflictError('Stanowisko może zawierać tylko konkurencje z tego turnieju');
  }

  return uniqueBattleIds;
};

const expandBattleIdsToAssignments = async (tournamentId: string, battleIds: string[] = []) => {
  const categories = await prisma.battleCategory.findMany({
    where: {
      battleId: {
        in: [...new Set(battleIds.filter(Boolean))]
      },
      battle: {
        tournamentId
      }
    },
    orderBy: [{ battle: { order: 'asc' } }, { order: 'asc' }]
  });

  return categories.map((category) => ({
    battleId: category.battleId,
    categoryId: category.id
  }));
};

const validateAssignments = async (
  tournamentId: string,
  assignments: Array<{ battleId: string; categoryId: string }> = [],
  stationId?: string
) => {
  const uniqueAssignments = [
    ...new Map(assignments.filter(item => item.battleId && item.categoryId).map(item => [item.categoryId, item])).values()
  ];

  if (!uniqueAssignments.length) {
    throw new ConflictError('Stanowisko musi mieć co najmniej jedną kategorię');
  }

  const categoryIds = uniqueAssignments.map((assignment) => assignment.categoryId);
  const categories = await prisma.battleCategory.findMany({
    where: {
      id: {
        in: categoryIds
      },
      battle: {
        tournamentId
      }
    },
    include: {
      battle: true
    }
  });

  if (categories.length !== uniqueAssignments.length) {
    throw new ConflictError('Stanowisko może zawierać tylko kategorie z tego turnieju');
  }

  const categoryById = new Map(categories.map((category) => [category.id, category]));
  for (const assignment of uniqueAssignments) {
    const category = categoryById.get(assignment.categoryId);
    if (!category || category.battleId !== assignment.battleId) {
      throw new ConflictError('Wybrana kategoria nie należy do tej konkurencji');
    }
  }

  const occupiedAssignment = await prisma.judgeStationAssignment.findFirst({
    where: {
      categoryId: {
        in: categoryIds
      },
      station: {
        tournamentId,
        revokedAt: null,
        ...(stationId ? { id: { not: stationId } } : {})
      }
    },
    include: {
      category: true,
      battle: true,
      station: true
    }
  });

  if (occupiedAssignment) {
    throw new ConflictError(
      `Kategoria "${occupiedAssignment.category.name}" w konkurencji "${occupiedAssignment.battle.name}" jest już przypisana do "${occupiedAssignment.station.label}"`
    );
  }

  return uniqueAssignments.map((assignment) => {
    const category = categoryById.get(assignment.categoryId)!;
    return {
      battleId: category.battleId,
      categoryId: category.id
    };
  });
};

const activeResultsForStation = async (station: any) => {
  const activeParticipantId = station.tournament.liveState?.activeTournamentPlayerId;
  if (!activeParticipantId) return [];

  const activeBattleId = station.tournament.liveState?.activeBattleId;
  const battleIds = [
    ...new Set(
      sortedAssignments(station)
        .filter((assignment) => !activeBattleId || assignment.battleId === activeBattleId)
        .map((assignment) => assignment.battleId)
    )
  ];
  if (!battleIds.length) return [];

  const results = await prisma.battleResult.findMany({
    where: {
      tournamentPlayerId: activeParticipantId,
      battleId: {
        in: battleIds
      }
    },
    include: {
      obstacleResults: true,
      penaltyResults: true
    }
  });

  return results.map(mapBattleResult);
};

const mapSession = async (station: any) => ({
  station: mapStation(station),
  battles: assignedBattlesForStation(station, station.tournament.liveState?.activeBattleId).map(mapBattle),
  liveState: station.tournament.liveState
    ? mapTournamentLiveState(station.tournament.liveState)
    : defaultTournamentLiveState(station.tournamentId),
  results: await activeResultsForStation(station)
});

export const judgeStationRepository = {
  readBearerToken,

  async listForTournament(tournamentId: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        battles: {
          include: battleDefinitionInclude,
          orderBy: {
            order: 'asc'
          }
        },
        judgeStations: {
          include: stationInclude,
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!tournament) return null;

    return {
      tournamentId,
      battles: tournament.battles.map(mapBattle),
      stations: tournament.judgeStations.map((station) => mapStation(station))
    };
  },

  async create(tournamentId: string, input: JudgeStationInput) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        battles: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    });
    if (!tournament) return null;

    const requestedAssignments = input.assignments ?? await expandBattleIdsToAssignments(tournamentId, input.battleIds || []);
    const assignments = await validateAssignments(tournamentId, requestedAssignments);
    const assignedBattleIds = [...new Set(assignments.map((assignment) => assignment.battleId))];
    const assignedBattles = tournament.battles.filter((battle) => assignedBattleIds.includes(battle.id));
    const token = createGuestToken();
    const stationId = createObjectId();
    const label =
      input.label?.trim() ||
      (assignedBattles.length === 1 ? assignedBattles[0].name : `Stanowisko QR (${assignments.length})`);

    await prisma.$transaction(async (tx) => {
      await tx.judgeStation.create({
        data: {
          id: stationId,
          tournamentId,
          label,
          tokenHash: hashToken(token)
        }
      });

      await tx.judgeStationAssignment.createMany({
        data: assignments.map((assignment) => ({
          stationId,
          battleId: assignment.battleId,
          categoryId: assignment.categoryId
        }))
      });
    });

    const station = await stationWithAssignments(stationId);
    return station ? mapStation(station, token) : null;
  },

  async update(stationId: string, input: JudgeStationInput) {
    const existing = await prisma.judgeStation.findUnique({
      where: { id: stationId },
      include: {
        assignments: true
      }
    });
    if (!existing) return null;

    const requestedAssignments = input.assignments
      ? input.assignments
      : input.battleIds
        ? await expandBattleIdsToAssignments(existing.tournamentId, input.battleIds)
        : null;
    const assignments = requestedAssignments
      ? await validateAssignments(existing.tournamentId, requestedAssignments, stationId)
      : null;

    await prisma.$transaction(async (tx) => {
      await tx.judgeStation.update({
        where: { id: stationId },
        data: {
          ...(input.label !== undefined ? { label: input.label.trim() || existing.label } : {})
        }
      });

      if (assignments) {
        await tx.judgeStationAssignment.deleteMany({
          where: { stationId }
        });
        await tx.judgeStationAssignment.createMany({
          data: assignments.map((assignment) => ({
            stationId,
            battleId: assignment.battleId,
            categoryId: assignment.categoryId
          }))
        });
      }
    });

    const station = await stationWithAssignments(stationId);
    return station ? mapStation(station) : null;
  },

  async regenerateToken(stationId: string) {
    const existing = await prisma.judgeStation.findUnique({ where: { id: stationId } });
    if (!existing) return null;

    const token = createGuestToken();
    await prisma.judgeStation.update({
      where: { id: stationId },
      data: {
        tokenHash: hashToken(token),
        revokedAt: null,
        lastSeenAt: null
      }
    });

    const station = await stationWithAssignments(stationId);
    return station ? mapStation(station, token) : null;
  },

  async revoke(stationId: string) {
    const existing = await prisma.judgeStation.findUnique({ where: { id: stationId } });
    if (!existing) return null;

    const station = await prisma.judgeStation.update({
      where: { id: stationId },
      data: {
        revokedAt: new Date()
      },
      include: stationInclude
    });
    return mapStation(station);
  },

  async setTournamentLiveState(tournamentId: string, input: TournamentLiveStateInput = {}) {
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) return null;

    const current = await prisma.tournamentLiveState.findUnique({
      where: { tournamentId },
      include: liveStateInclude
    });
    const [fallbackParticipant, fallbackBattle] = await Promise.all([
      input.activeTournamentPlayerId || current?.activeTournamentPlayerId ? null : firstTournamentParticipant(tournamentId),
      input.activeBattleId || current?.activeBattleId ? null : firstTournamentBattle(tournamentId)
    ]);
    const nextActiveTournamentPlayerId =
      input.activeTournamentPlayerId || current?.activeTournamentPlayerId || fallbackParticipant?.id || null;
    const nextActiveBattleId = input.activeBattleId || current?.activeBattleId || fallbackBattle?.id || null;

    if (nextActiveTournamentPlayerId) {
      const participant = await prisma.tournamentPlayer.findUnique({ where: { id: nextActiveTournamentPlayerId } });
      if (!participant || participant.tournamentId !== tournamentId) {
        throw new ConflictError('Wybrany zawodnik nie należy do tego turnieju');
      }
    }

    if (nextActiveBattleId) {
      const battle = await prisma.battle.findUnique({ where: { id: nextActiveBattleId } });
      if (!battle || battle.tournamentId !== tournamentId) {
        throw new ConflictError('Wybrana konkurencja nie należy do tego turnieju');
      }
    }

    const state = await prisma.tournamentLiveState.upsert({
      where: { tournamentId },
      create: {
        tournamentId,
        activeTournamentPlayerId: nextActiveTournamentPlayerId,
        activeBattleId: nextActiveBattleId,
        version: 1
      },
      update: {
        activeTournamentPlayerId: nextActiveTournamentPlayerId,
        activeBattleId: nextActiveBattleId,
        version: {
          increment: 1
        }
      },
      include: liveStateInclude
    });

    return mapTournamentLiveState(state);
  },

  async getTournamentLiveState(tournamentId: string) {
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) return null;

    const state = await ensureTournamentLiveState(tournamentId);

    return state ? mapTournamentLiveState(state) : defaultTournamentLiveState(tournamentId);
  },

  async setLiveState(battleId: string, activeTournamentPlayerId: string | null) {
    const battle = await prisma.battle.findUnique({ where: { id: battleId } });
    if (!battle) return null;

    const tournamentState = await this.setTournamentLiveState(battle.tournamentId, {
      activeTournamentPlayerId,
      activeBattleId: battleId
    });
    if (!tournamentState) return null;

    const legacyState = await prisma.battleLiveState.upsert({
      where: { battleId },
      create: {
        battleId,
        activeTournamentPlayerId: tournamentState.activeTournamentPlayerId,
        version: tournamentState.version
      },
      update: {
        activeTournamentPlayerId: tournamentState.activeTournamentPlayerId,
        version: tournamentState.version
      },
      include: liveStateInclude
    });

    return mapBattleLiveState(legacyState);
  },

  async getLiveState(battleId: string) {
    const battle = await prisma.battle.findUnique({ where: { id: battleId } });
    if (!battle) return null;

    const tournamentState = await this.getTournamentLiveState(battle.tournamentId);
    return tournamentState
      ? {
          battleId,
          activeTournamentPlayerId: tournamentState.activeTournamentPlayerId,
          activeParticipant: tournamentState.activeParticipant,
          version: tournamentState.version,
          updatedAt: tournamentState.updatedAt
        }
      : null;
  },

  async getSession(token: string) {
    const station = await stationFromToken(token);
    if (!station) return null;

    await ensureTournamentLiveState(station.tournamentId);
    const refreshedStation = await stationWithAssignments(station.id);
    return refreshedStation ? mapSession(refreshedStation) : null;
  },

  async touchStation(token: string) {
    const station = await stationFromToken(token);
    if (!station) return null;

    const updated = await prisma.judgeStation.update({
      where: { id: station.id },
      data: {
        lastSeenAt: new Date()
      },
      include: stationInclude
    });
    return mapStation(updated);
  },

  async updateSessionResult(token: string, input: JudgeSessionResultInput) {
    let station = await stationFromToken(token);
    if (!station) return null;

    await ensureTournamentLiveState(station.tournamentId);
    station = await stationWithAssignments(station.id);
    if (!station) return null;

    const liveState = station.tournament.liveState;
    if (!liveState?.activeTournamentPlayerId) {
      throw new ConflictError('Brak aktywnego zawodnika dla tego turnieju');
    }

    if (!liveState.activeBattleId) {
      throw new ConflictError('Brak aktywnej konkurencji dla tego turnieju');
    }

    if (Number(input.liveStateVersion) !== liveState.version) {
      throw new ConflictError('Zawodnik zmienił się w trakcie zapisu. Odśwież stanowisko.');
    }

    if (input.battleId !== liveState.activeBattleId) {
      throw new ConflictError('Konkurencja zmieniła się w trakcie zapisu. Odśwież stanowisko.');
    }

    const assignmentsForBattle = sortedAssignments(station).filter((item) => item.battleId === input.battleId);
    if (!assignmentsForBattle.length) {
      throw new ConflictError('To stanowisko nie może zapisywać tej konkurencji');
    }

    const allowedObstacleIds = new Set(
      assignmentsForBattle.flatMap((assignment) =>
        (assignment.category?.obstacles || []).map((obstacle: any) => obstacle.id)
      )
    );
    const obstacleResults = input.obstacleResults.map((result) => {
      if (!allowedObstacleIds.has(result.obstacleId)) {
        throw new ConflictError('Stanowisko może zapisywać tylko przypisane konkurencje');
      }

      return {
        obstacleId: result.obstacleId,
        value: result.value
      };
    });

    const updated = await playerPointsRepository.updateBattleResult(liveState.activeTournamentPlayerId, input.battleId, {
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
        battleId: input.battleId,
        tournamentPlayerId: liveState.activeTournamentPlayerId,
        judgeStationId: station.id,
        source: 'station',
        payload: {
          liveStateVersion: input.liveStateVersion,
          obstacleResults
        }
      })
    ]);

    return {
      result: updated,
      station: mapStation(station),
      savedAt: new Date()
    };
  }
};
