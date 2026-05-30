import { Request, Response } from "express";
import { playerPointsRepository } from "../repositories/playerPointsRepository";
import { scoreChangeLogRepository } from "../repositories/scoreChangeLogRepository";
import { emitBattleResultUpdated } from "../realtime/liveScoreSocket";
import { notFound, serverError } from "./helpers";

const createPlayerPoints = async (req: Request, res: Response) => {
    try {
        const playerPoints = await playerPointsRepository.create(req.body);
        return playerPoints ? res.status(201).json(playerPoints) : notFound(res);
    } catch (error) {
        return serverError(res, error);
    }
};

const readPlayerPoints = async (req: Request, res: Response) => {
    try {
        const playerPoints = await playerPointsRepository.findById(req.params.playerPointsId);
        return playerPoints ? res.status(200).json(playerPoints) : notFound(res);
    } catch (error) {
        return serverError(res, error);
    }
};

const readAll = async (req: Request, res: Response) => {
    try {
        const playerPoints = await playerPointsRepository.findAllForTournament(req.params.tournamentId);
        return res.status(200).json(playerPoints);
    } catch (error) {
        return serverError(res, error);
    }
};

const updatePlayerPoints = async (req: Request, res: Response) => {
    try {
        const playerPoints = await playerPointsRepository.update(req.params.playerPointsId, req.body);
        return playerPoints ? res.status(200).json(playerPoints) : notFound(res);
    } catch (error) {
        return serverError(res, error);
    }
};

const updateBattleResult = async (req: Request, res: Response) => {
    try {
        const battleResult = await playerPointsRepository.updateBattleResult(
            req.params.playerPointsId,
            req.params.battleId,
            req.body
        );
        if (!battleResult) return notFound(res);

        await scoreChangeLogRepository.create({
            battleId: req.params.battleId,
            tournamentPlayerId: req.params.playerPointsId,
            source: 'main',
            payload: req.body
        });
        emitBattleResultUpdated(req.params.battleId, battleResult);
        return res.status(200).json(battleResult);
    } catch (error) {
        return serverError(res, error);
    }
};

const deletePlayerPoints = async (req: Request, res: Response) => {
    try {
        const playerPoints = await playerPointsRepository.delete(req.params.playerPointsId);
        return playerPoints ? res.status(200).json({ message: "usunięto" }) : notFound(res);
    } catch (error) {
        return serverError(res, error);
    }
};


export default { createPlayerPoints, readAll, readPlayerPoints, updatePlayerPoints, updateBattleResult, deletePlayerPoints };
