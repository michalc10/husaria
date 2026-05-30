import { Request, Response } from "express";
import { leagueRepository } from "../repositories/leagueRepository";
import { notFound, serverError } from "./helpers";

const createLeague = async (req: Request, res: Response) => {
  try {
    const league = await leagueRepository.create(req.body);
    return res.status(201).json(league);
  } catch (error) {
    return serverError(res, error);
  }
};

const readLeague = async (req: Request, res: Response) => {
    try {
        const league = await leagueRepository.findById(req.params.leagueId);
        return league ? res.status(200).json(league) : notFound(res);
    } catch (error) {
        return serverError(res, error);
    }
};

const readAll = async (req: Request, res: Response) => {
    try {
        const leagues = await leagueRepository.findAll();
        return res.status(200).json(leagues);
    } catch (error) {
        return serverError(res, error);
    }
};

const updateLeague = async (req: Request, res: Response) => {
    try {
        const league = await leagueRepository.update(req.params.leagueId, req.body);
        return league ? res.status(200).json(league) : notFound(res);
    } catch (error) {
        return serverError(res, error);
    }
};

const deleteLeague = async (req: Request, res: Response) => {
    try {
        const league = await leagueRepository.delete(req.params.leagueId);
        return league ? res.status(200).json({ message: "usunięto" }) : notFound(res);
    } catch (error) {
        return serverError(res, error);
    }
};


export default { createLeague, readAll, readLeague, updateLeague, deleteLeague };
