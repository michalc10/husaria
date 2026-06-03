import { Request, Response } from 'express';
import { judgeStationRepository } from '../repositories/judgeStationRepository';
import { conflict, notFound, serverError } from './helpers';
import {
  emitBattleResultUpdated,
  emitLiveStateUpdated,
  emitStationResultSaved,
  emitStationRevoked,
  emitTournamentLiveStateUpdated
} from '../realtime/liveScoreSocket';

const tokenFromRequest = (req: Request) => judgeStationRepository.readBearerToken(req.headers.authorization);

const listForTournament = async (req: Request, res: Response) => {
  try {
    const result = await judgeStationRepository.listForTournament(req.params.tournamentId);
    return result ? res.status(200).json(result) : notFound(res);
  } catch (error) {
    return serverError(res, error);
  }
};

const create = async (req: Request, res: Response) => {
  try {
    const station = await judgeStationRepository.create(req.params.tournamentId, req.body);
    return station ? res.status(201).json(station) : notFound(res);
  } catch (error) {
    return serverError(res, error);
  }
};

const update = async (req: Request, res: Response) => {
  try {
    const station = await judgeStationRepository.update(req.params.stationId, req.body);
    return station ? res.status(200).json(station) : notFound(res);
  } catch (error) {
    return serverError(res, error);
  }
};

const regenerateToken = async (req: Request, res: Response) => {
  try {
    const station = await judgeStationRepository.regenerateToken(req.params.stationId);
    return station ? res.status(200).json(station) : notFound(res);
  } catch (error) {
    return serverError(res, error);
  }
};

const revoke = async (req: Request, res: Response) => {
  try {
    const station = await judgeStationRepository.revoke(req.params.stationId);
    if (!station) return notFound(res);

    emitStationRevoked(station._id, station.tournamentId, station.battleIds || []);
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
    const update = await judgeStationRepository.updateSessionResult(tokenFromRequest(req), req.body);
    if (!update) return res.status(401).json({ message: 'Nieprawidłowy link stanowiska' });

    emitBattleResultUpdated(update.result.battleId, update.result);
    emitStationResultSaved(update.station.tournamentId, {
      stationId: update.station._id,
      stationLabel: update.station.label,
      battleId: update.result.battleId,
      tournamentPlayerId: update.result.tournamentPlayerId,
      savedAt: update.savedAt
    });
    return res.status(200).json(update.result);
  } catch (error) {
    return error instanceof Error && error.name === 'ConflictError' ? conflict(res, error.message) : serverError(res, error);
  }
};

const readTournamentLiveState = async (req: Request, res: Response) => {
  try {
    const state = await judgeStationRepository.getTournamentLiveState(req.params.tournamentId);
    return state ? res.status(200).json(state) : notFound(res);
  } catch (error) {
    return serverError(res, error);
  }
};

const updateTournamentLiveState = async (req: Request, res: Response) => {
  try {
    const state = await judgeStationRepository.setTournamentLiveState(
      req.params.tournamentId,
      {
        activeTournamentPlayerId: req.body.activeTournamentPlayerId,
        activeBattleId: req.body.activeBattleId
      }
    );
    if (!state) return notFound(res);

    emitTournamentLiveStateUpdated(req.params.tournamentId, state);
    return res.status(200).json(state);
  } catch (error) {
    return error instanceof Error && error.name === 'ConflictError' ? conflict(res, error.message) : serverError(res, error);
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
  listForTournament,
  create,
  update,
  regenerateToken,
  revoke,
  readSession,
  updateSessionResult,
  readTournamentLiveState,
  updateTournamentLiveState,
  readLiveState,
  updateLiveState
};
