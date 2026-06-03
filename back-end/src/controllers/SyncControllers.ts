import { Request, Response } from 'express';
import authRepository from '../repositories/authRepository';
import { readSessionCookie } from '../middleware/auth';
import { judgeStationRepository } from '../repositories/judgeStationRepository';
import { syncRepository } from '../repositories/syncRepository';
import { notFound, serverError } from './helpers';
import { emitBattleResultUpdated } from '../realtime/liveScoreSocket';

const bootstrap = async (req: Request, res: Response) => {
  try {
    const tournamentId = String(req.query.tournamentId || '');
    if (!tournamentId) return res.status(400).json({ message: 'Brak identyfikatora turnieju' });

    const snapshot = await syncRepository.bootstrap(tournamentId);
    return snapshot ? res.status(200).json(snapshot) : notFound(res);
  } catch (error) {
    return serverError(res, error);
  }
};

const mutations = async (req: Request, res: Response) => {
  try {
    const user = await authRepository.getSessionUser(readSessionCookie(req));
    const judgeToken = judgeStationRepository.readBearerToken(req.headers.authorization);
    const result = await syncRepository.processMutations(req.body.mutations || [], {
      userId: user?._id || null,
      judgeToken: judgeToken || null
    });
    result.applied.forEach((item: any) => {
      if (item?.result?.battleId) {
        emitBattleResultUpdated(item.result.battleId, item.result);
      }
    });
    return res.status(200).json(result);
  } catch (error) {
    return serverError(res, error);
  }
};

export default {
  bootstrap,
  mutations
};
