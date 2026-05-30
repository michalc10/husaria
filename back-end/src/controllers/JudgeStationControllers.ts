import { Request, Response } from 'express';
import { judgeStationRepository } from '../repositories/judgeStationRepository';
import { conflict, notFound, serverError } from './helpers';
import { emitBattleResultUpdated, emitLiveStateUpdated, emitStationRevoked } from '../realtime/liveScoreSocket';

const tokenFromRequest = (req: Request) => judgeStationRepository.readBearerToken(req.headers.authorization);

const listForBattle = async (req: Request, res: Response) => {
  try {
    const result = await judgeStationRepository.listForBattle(req.params.battleId);
    return result ? res.status(200).json(result) : notFound(res);
  } catch (error) {
    return serverError(res, error);
  }
};

const createOrRegenerate = async (req: Request, res: Response) => {
  try {
    const station = await judgeStationRepository.createOrRegenerate(req.params.battleId, req.params.categoryId);
    return station ? res.status(201).json(station) : notFound(res);
  } catch (error) {
    return serverError(res, error);
  }
};

const revoke = async (req: Request, res: Response) => {
  try {
    const station = await judgeStationRepository.revoke(req.params.stationId);
    if (!station) return notFound(res);

    emitStationRevoked(station._id, station.battleId);
    return res.status(200).json(station);
  } catch (error) {
    return serverError(res, error);
  }
};

const readSession = async (req: Request, res: Response) => {
  try {
    const session = await judgeStationRepository.getSession(tokenFromRequest(req));
    return session ? res.status(200).json(session) : res.status(401).json({ message: 'Nieprawidłowy link stanowiska' });
  } catch (error) {
    return serverError(res, error);
  }
};

const updateSessionResult = async (req: Request, res: Response) => {
  try {
    const result = await judgeStationRepository.updateSessionResult(tokenFromRequest(req), req.body);
    if (!result) return res.status(401).json({ message: 'Nieprawidłowy link stanowiska' });

    emitBattleResultUpdated(result.battleId, result);
    return res.status(200).json(result);
  } catch (error) {
    return serverError(res, error);
  }
};

const readLiveState = async (req: Request, res: Response) => {
  try {
    const state = await judgeStationRepository.getLiveState(req.params.battleId);
    return state
      ? res.status(200).json(state)
      : res.status(200).json({
          battleId: req.params.battleId,
          activeTournamentPlayerId: null,
          activeParticipant: null,
          version: 0,
          updatedAt: null
        });
  } catch (error) {
    return serverError(res, error);
  }
};

const updateLiveState = async (req: Request, res: Response) => {
  try {
    const state = await judgeStationRepository.setLiveState(req.params.battleId, req.body.activeTournamentPlayerId ?? null);
    if (!state) return notFound(res);

    emitLiveStateUpdated(req.params.battleId, state);
    return res.status(200).json(state);
  } catch (error) {
    return error instanceof Error && error.name === 'ConflictError' ? conflict(res, error.message) : serverError(res, error);
  }
};

export default {
  listForBattle,
  createOrRegenerate,
  revoke,
  readSession,
  updateSessionResult,
  readLiveState,
  updateLiveState
};
