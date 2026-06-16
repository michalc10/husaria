import { Prisma } from '@prisma/client';
import { prisma } from '../database/prisma';
import { createObjectId } from './ids';
import { ConflictError } from './errors';
import { judgeStationRepository } from './judgeStationRepository';
import { playerPointsRepository } from './playerPointsRepository';
import { scoreChangeLogRepository } from './scoreChangeLogRepository';
import { tournamentRepository } from './tournamentRepository';
import { mapBattleResult } from './prismaMappers';

export type SyncMutationInput = {
  clientMutationId: string;
  type: string;
  entityId?: string;
  baseRevision?: number | null;
  payload: unknown;
  createdAt?: string | Date;
  deviceId?: string;
};

type SyncMutationRecordStatus = 'APPLIED' | 'CONFLICT' | 'FAILED';

const asJson = (value: unknown): Prisma.InputJsonValue => (value ?? {}) as Prisma.InputJsonValue;

const redactPayload = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(redactPayload);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((result, [key, item]) => {
    if (['token', 'authorization', 'password'].includes(key.toLowerCase())) {
      result[key] = '[redacted]';
      return result;
    }

    result[key] = redactPayload(item);
    return result;
  }, {});
};

const conflictDetails = (input: SyncMutationInput, reason: string, message: string, extra: Record<string, unknown> = {}) => ({
  reason,
  message,
  client: redactPayload(input.payload),
  ...extra
});

const mutationResult = (record: any) => ({
  clientMutationId: record.clientMutationId,
  type: record.type,
  entityId: record.entityId,
  status: record.status,
  result: record.result,
  conflict: record.conflict
});

const recordMutation = async (
  input: SyncMutationInput,
  status: SyncMutationRecordStatus,
  context: { userId?: string | null; judgeStationId?: string | null },
  result?: unknown,
  conflict?: unknown
) => {
  const record = await prisma.clientMutation.create({
    data: {
      id: createObjectId(),
      clientMutationId: input.clientMutationId,
      deviceId: input.deviceId || '',
      userId: context.userId || null,
      judgeStationId: context.judgeStationId || null,
      type: input.type,
      entityId: input.entityId || '',
      status,
      payload: asJson(redactPayload(input.payload)),
      result: result === undefined ? undefined : asJson(result),
      conflict: conflict === undefined ? undefined : asJson(conflict),
      processedAt: new Date()
    }
  });

  return mutationResult(record);
};

const currentBattleResult = (playerPointsId: string, battleId: string) =>
  prisma.battleResult.findUnique({
    where: {
      tournamentPlayerId_battleId: {
        tournamentPlayerId: playerPointsId,
        battleId
      }
    },
    include: {
      obstacleResults: true,
      penaltyResults: true
    }
  });

const processBattleResultMutation = async (
  input: SyncMutationInput,
  userId?: string | null
) => {
  if (!userId) {
    return recordMutation(input, 'FAILED', { userId }, undefined, {
      message: 'Wymagane logowanie do synchronizacji zapisu z panelu głównego'
    });
  }

  const payload = input.payload as any;
  const playerPointsId = String(payload?.playerPointsId || '');
  const battleId = String(payload?.battleId || '');
  const body = payload?.body || {};
  const baseRevision = Number(input.baseRevision ?? payload?.baseRevision);
  const current = playerPointsId && battleId ? await currentBattleResult(playerPointsId, battleId) : null;

  if (!playerPointsId || !battleId) {
    return recordMutation(input, 'FAILED', { userId }, undefined, {
      message: 'Brak identyfikatora zawodnika albo konkurencji'
    });
  }

  if (
    current &&
    Number.isFinite(baseRevision) &&
    current.revision !== baseRevision
  ) {
    return recordMutation(input, 'CONFLICT', { userId }, undefined, conflictDetails(input, 'STALE_REVISION', 'Wynik zmienił się na serwerze przed synchronizacją', {
      server: mapBattleResult(current),
      serverRevision: current.revision,
      entityLabel: `${playerPointsId}:${battleId}`
    }));
  }

  const result = await playerPointsRepository.updateBattleResult(playerPointsId, battleId, body);
  if (!result) {
    return recordMutation(input, 'FAILED', { userId }, undefined, {
      message: 'Nie znaleziono wyniku do synchronizacji'
    });
  }

  await scoreChangeLogRepository.create({
    battleId,
    tournamentPlayerId: playerPointsId,
    source: 'main',
    payload: {
      ...body,
      clientMutationId: input.clientMutationId,
      offlineSynced: true
    }
  });

  return recordMutation(input, 'APPLIED', { userId }, result);
};

const processJudgeSessionMutation = async (input: SyncMutationInput, judgeToken?: string | null) => {
  const payload = input.payload as any;
  const body = payload?.body;

  if (!judgeToken || !body) {
    return recordMutation(input, 'FAILED', {}, undefined, {
      message: 'Brak tokenu stanowiska QR albo danych zapisu'
    });
  }

  try {
    const update = await judgeStationRepository.updateSessionResult(judgeToken, body);
    if (!update) {
      return recordMutation(input, 'FAILED', {}, undefined, {
        message: 'Nieprawidłowy albo wygasły link stanowiska'
      });
    }

    return recordMutation(input, 'APPLIED', { judgeStationId: update.station._id }, update.result);
  } catch (error) {
    if (error instanceof ConflictError) {
      const session = await judgeStationRepository.getSession(judgeToken);
      const serverResult = session?.results?.find((result: any) => result.battleId === body?.battleId);

      return recordMutation(input, 'CONFLICT', { judgeStationId: session?.station?._id || null }, undefined, conflictDetails(input, 'JUDGE_SESSION_CONFLICT', error.message, {
        liveState: session?.liveState || null,
        server: serverResult || null,
        serverRevision: serverResult?.revision ?? null,
        entityLabel: session?.station?.label || 'Stanowisko QR'
      }));
    }

    throw error;
  }
};

const processTournamentLiveStateMutation = async (
  input: SyncMutationInput,
  userId?: string | null
) => {
  if (!userId) {
    return recordMutation(input, 'FAILED', { userId }, undefined, {
      message: 'Wymagane logowanie do synchronizacji aktywnego stanu turnieju'
    });
  }

  const payload = input.payload as any;
  const tournamentId = String(input.entityId || payload?.tournamentId || '');
  if (!tournamentId) {
    return recordMutation(input, 'FAILED', { userId }, undefined, {
      message: 'Brak identyfikatora turnieju'
    });
  }

  try {
    const result = await judgeStationRepository.setTournamentLiveState(tournamentId, {
      activeTournamentPlayerId: payload?.activeTournamentPlayerId,
      activeBattleId: payload?.activeBattleId
    });

    if (!result) {
      return recordMutation(input, 'FAILED', { userId }, undefined, {
        message: 'Nie znaleziono turnieju'
      });
    }

    return recordMutation(input, 'APPLIED', { userId }, result);
  } catch (error) {
    if (error instanceof ConflictError) {
      const serverState = await judgeStationRepository.getTournamentLiveState(tournamentId);

      return recordMutation(input, 'CONFLICT', { userId }, undefined, conflictDetails(input, 'LIVE_STATE_CONFLICT', error.message, {
        server: serverState,
        serverRevision: serverState?.version ?? null,
        entityLabel: tournamentId
      }));
    }

    throw error;
  }
};

export const syncRepository = {
  async bootstrap(tournamentId: string) {
    const tournament = await tournamentRepository.findById(tournamentId);
    if (!tournament) return null;

    const [battles, participants, liveState, stations] = await Promise.all([
      tournamentRepository.findBattles(tournamentId),
      playerPointsRepository.findAllForTournament(tournamentId),
      judgeStationRepository.getTournamentLiveState(tournamentId),
      judgeStationRepository.listForTournament(tournamentId)
    ]);

    return {
      tournament,
      battles,
      participants,
      liveState,
      stations: stations?.stations || [],
      snapshotVersion: new Date().toISOString()
    };
  },

  async processMutations(input: SyncMutationInput[], context: { userId?: string | null; judgeToken?: string | null } = {}) {
    const applied = [];
    const conflicts = [];
    const failed = [];

    for (const mutation of input) {
      const existing = await prisma.clientMutation.findUnique({
        where: { clientMutationId: mutation.clientMutationId }
      });
      let result;

      if (existing) {
        if ((existing.type === 'battleResult.update' || existing.type === 'tournamentLiveState.update') && !context.userId) {
          result = {
            clientMutationId: mutation.clientMutationId,
            type: mutation.type,
            entityId: mutation.entityId || '',
            status: 'FAILED',
            conflict: { message: 'Wymagane logowanie do synchronizacji zapisu z panelu głównego' }
          };
        } else if (existing.type === 'judgeSessionResult.update' && !context.judgeToken) {
          result = {
            clientMutationId: mutation.clientMutationId,
            type: mutation.type,
            entityId: mutation.entityId || '',
            status: 'FAILED',
            conflict: { message: 'Wymagany token stanowiska QR' }
          };
        } else {
          result = mutationResult(existing);
        }
      } else if (mutation.type === 'battleResult.update') {
        result = await processBattleResultMutation(mutation, context.userId);
      } else if (mutation.type === 'tournamentLiveState.update') {
        result = await processTournamentLiveStateMutation(mutation, context.userId);
      } else if (mutation.type === 'judgeSessionResult.update') {
        result = await processJudgeSessionMutation(mutation, context.judgeToken);
      } else {
        result = await recordMutation(mutation, 'FAILED', context, undefined, {
          message: `Nieznany typ mutacji: ${mutation.type}`
        });
      }

      if (result.status === 'APPLIED') applied.push(result);
      else if (result.status === 'CONFLICT') conflicts.push(result);
      else failed.push(result);
    }

    return {
      applied,
      conflicts,
      failed,
      serverSnapshotVersion: new Date().toISOString()
    };
  }
};
