import { Request, Response } from "express";
import { tournamentRepository } from "../repositories/tournamentRepository";
import { notFound, serverError } from "./helpers";

export const createTournament = async (req: Request, res: Response) => {
  try {
    const tournament = await tournamentRepository.create({
      ...req.body,
      date: req.body.date || new Date()
    });
    return res.status(201).json(tournament);
  } catch (error) {
    return serverError(res, error);
  }
};

const readTournament = async (req: Request, res: Response) => {
    try {
        const tournament = await tournamentRepository.findById(req.params.tournamentId);
        return tournament ? res.status(200).json(tournament) : notFound(res);
    } catch (error) {
        return serverError(res, error);
    }
};

const readAll = async (req: Request, res: Response) => {
    try {
        const tournaments = await tournamentRepository.findAll();
        return res.status(200).json(tournaments);
    } catch (error) {
        return serverError(res, error);
    }
};

const updateTournament = async (req: Request, res: Response) => {
    try {
        const tournament = await tournamentRepository.update(req.params.tournamentId, req.body);
        return tournament ? res.status(200).json(tournament) : notFound(res);
    } catch (error) {
        return serverError(res, error);
    }
};

const updateStatus = async (req: Request, res: Response) => {
    try {
        const tournament = await tournamentRepository.updateStatus(req.params.tournamentId, req.body.status);
        return tournament ? res.status(200).json(tournament) : notFound(res);
    } catch (error) {
        return serverError(res, error);
    }
};

const deleteTournament = async (req: Request, res: Response) => {
    try {
        const tournament = await tournamentRepository.delete(req.params.tournamentId);
        return tournament ? res.status(200).json({ message: "usunięto" }) : notFound(res);
    } catch (error) {
        return serverError(res, error);
    }
};

const readAllForLeague = async (req: Request, res: Response) => {
    try {
        const tournaments = await tournamentRepository.findAllForLeague(req.params.leagueId);
        return res.status(200).json(tournaments);
    } catch (error) {
        return serverError(res, error);
    }
};

const readBattles = async (req: Request, res: Response) => {
    try {
        const battles = await tournamentRepository.findBattles(req.params.tournamentId);
        return res.status(200).json(battles);
    } catch (error) {
        return serverError(res, error);
    }
};

const updateBattles = async (req: Request, res: Response) => {
    try {
        const battles = await tournamentRepository.replaceBattles(req.params.tournamentId, req.body.battles);
        return battles ? res.status(200).json(battles) : notFound(res);
    } catch (error) {
        return serverError(res, error);
    }
};

export default { createTournament, readAll, readTournament, updateTournament, updateStatus, deleteTournament, readAllForLeague, readBattles, updateBattles };
