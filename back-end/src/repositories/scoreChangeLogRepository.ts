import { Prisma } from '@prisma/client';
import { prisma } from '../database/prisma';
import { createObjectId } from './ids';

type ScoreChangeLogInput = {
  battleId: string;
  tournamentPlayerId: string;
  judgeStationId?: string | null;
  source: 'main' | 'station';
  payload: unknown;
};

export const scoreChangeLogRepository = {
  async create(input: ScoreChangeLogInput) {
    return prisma.scoreChangeLog.create({
      data: {
        id: createObjectId(),
        battleId: input.battleId,
        tournamentPlayerId: input.tournamentPlayerId,
        judgeStationId: input.judgeStationId ?? null,
        source: input.source,
        payload: input.payload as Prisma.InputJsonValue
      }
    });
  }
};
