import { Request, Response } from "express";
import { playerRepository } from "../repositories/playerRepository";
import { notFound, serverError } from "./helpers";

const createPlayer = async (req: Request, res: Response) => {
    try {
        const player = await playerRepository.create(req.body);
        return player ? res.status(201).json(player) : notFound(res);
    } catch (error) {
        return serverError(res, error);
    }
};

const readPlayer = async (req: Request, res: Response) => {
    try {
        const player = await playerRepository.findById(req.params.playerId);
        return player ? res.status(200).json(player) : notFound(res);
    } catch (error) {
        return serverError(res, error);
    }
};

const readAll = async (req: Request, res: Response) => {
    try {
        const players = await playerRepository.findAll();
        return res.status(200).json(players);
    } catch (error) {
        return serverError(res, error);
    }
};

const updatePlayer = async (req: Request, res: Response) => {
    try {
        const player = await playerRepository.update(req.params.playerId, req.body);
        return player ? res.status(200).json(player) : notFound(res);
    } catch (error) {
        return serverError(res, error);
    }
};

const deletePlayer = async (req: Request, res: Response) => {
    try {
        const player = await playerRepository.delete(req.params.playerId);
        return player ? res.status(200).json({ message: "usunięto" }) : notFound(res);
    } catch (error) {
        return serverError(res, error);
    }
};


export default { createPlayer, readAll, readPlayer, updatePlayer, deletePlayer };
