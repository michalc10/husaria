import { NextFunction, Request, Response, request } from "express";
import { League } from "../models/LeagueModel";
import mongoose from "mongoose";



const createLeague = (req: Request, res: Response, next: NextFunction) => {
    const { name, year } = req.body;
    const league = new League({
        _id: new mongoose.Types.ObjectId(),
        name: name,
        year: year,

    });
    return league
        .save()
        .then((league) => res.status(201).json(league))
        .catch((err) => res.status(500).json({ err }));
};


const readLeague = (req: Request, res: Response, next: NextFunction) => {
    const leagueId = req.params.leagueId;

    return League.findById(leagueId)
        .then((league) =>
            league
                ? res.status(200).json(league)
                : res.status(404).json({ message: "Not found" })
        )
        .catch((err) => res.status(500).json({ err }));
};

const readAll = (req: Request, res: Response, next: NextFunction) => {
    return League.find()
        .then((leagues) => res.status(200).json(leagues))
        .catch((error) => res.status(500).json({ error }));
};

const updateLeague = (req: Request, res: Response, next: NextFunction) => {
    const leagueId = req.params.leagueId;
    return League.findById(leagueId)
        .then((league) => {
            if (league) {
                league.set(req.body);
                return league
                    .save()
                    .then((league) => res.status(201).json(league))
                    .catch((err) => res.status(500).json({ err }));
            } else {
                res.status(404).json({ message: "Not found" });
            }
        })
        .catch((err) => res.status(500).json({ err }));
};

const deleteLeague = (req: Request, res: Response, next: NextFunction) => {
    const leagueId = req.params.leagueId;

    return League.findByIdAndDelete(leagueId)
        .then((league) => {
            league
                ? res.status(200).json({ message: "deleted" })
                : res.status(404).json({ message: "Not found" })
        }


        )
        .catch((err) => res.status(500).json({ err }));
};


export default { createLeague, readAll, readLeague, updateLeague, deleteLeague };