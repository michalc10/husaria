import { NextFunction, Request, Response, request } from "express";
import { Tournament } from "../models/TournamentModel";
import mongoose from "mongoose";



const createTournament = (req: Request, res: Response, next: NextFunction) => {
    const { leagueId, city, date } = req.body;
    const tournament = new Tournament({
        _id: new mongoose.Types.ObjectId(),
        leagueId: leagueId,
        city: city,
        date: date

    });
    return tournament
        .save()
        .then((tournament) => res.status(201).json(tournament))
        .catch((err) => res.status(500).json({ err }));
};


const readTournament = (req: Request, res: Response, next: NextFunction) => {
    const tournamentId = req.params.tournamentId;

    return Tournament.findById(tournamentId)
        .then((tournament) =>
            tournament
                ? res.status(200).json(tournament)
                : res.status(404).json({ message: "Not found" })
        )
        .catch((err) => res.status(500).json({ err }));
};

const readAll = (req: Request, res: Response, next: NextFunction) => {
    return Tournament.find()
        .then((tournaments) => res.status(200).json(tournaments))
        .catch((error) => res.status(500).json({ error }));
};

const updateTournament = (req: Request, res: Response, next: NextFunction) => {
    const tournamentId = req.params.tournamentId;
    return Tournament.findById(tournamentId)
        .then((tournament) => {
            if (tournament) {
                tournament.set(req.body);
                return tournament
                    .save()
                    .then((tournament) => res.status(201).json(tournament))
                    .catch((err) => res.status(500).json({ err }));
            } else {
                res.status(404).json({ message: "Not found" });
            }
        })
        .catch((err) => res.status(500).json({ err }));
};

const deleteTournament = (req: Request, res: Response, next: NextFunction) => {
    const tournamentId = req.params.tournamentId;

    return Tournament.findByIdAndDelete(tournamentId)
        .then((tournament) => {
            tournament
                ? res.status(200).json({ message: "deleted" })
                : res.status(404).json({ message: "Not found" })
        }


        )
        .catch((err) => res.status(500).json({ err }));
};

const readAllForLeague = (req: Request, res: Response, next: NextFunction) => {
    const leagueId = req.params.leagueId;
    return Tournament.find({ leagueId: leagueId })
        .then((tournaments) => res.status(200).json(tournaments))
        .catch((error) => res.status(500).json({ error }));
};

export default { createTournament, readAll, readTournament, updateTournament, deleteTournament, readAllForLeague };