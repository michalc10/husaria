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

const readStandings = async (req: Request, res: Response) => {
    try {
        const countedTournaments = Number(req.query.countedTournaments);
        const standings = await leagueRepository.findStandings(req.params.leagueId, {
            countedTournaments: Number.isFinite(countedTournaments) ? countedTournaments : undefined
        });
        return standings ? res.status(200).json(standings) : notFound(res);
    } catch (error) {
        return serverError(res, error);
    }
};

const createFinalTournament = async (req: Request, res: Response) => {
    try {
        const result = await leagueRepository.createFinalTournament(req.params.leagueId, req.body);
        return result ? res.status(201).json(result) : notFound(res);
    } catch (error) {
        return serverError(res, error);
    }
};

const readTeamStandings = async (req: Request, res: Response) => {
    try {
        const countedTournaments = Number(req.query.countedTournaments);
        const teamSize = Number(req.query.teamSize);
        const standings = await leagueRepository.findTeamStandings(req.params.leagueId, {
            countedTournaments: Number.isFinite(countedTournaments) ? countedTournaments : undefined,
            teamSize: Number.isFinite(teamSize) ? teamSize : undefined
        });
        return standings ? res.status(200).json(standings) : notFound(res);
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


export default { createLeague, readAll, readLeague, readStandings, readTeamStandings, createFinalTournament, updateLeague, deleteLeague };
