import { NextFunction, Request, Response, request } from "express";
import { PlayerPoints } from "../models/PlayerPointsModel";
import mongoose from "mongoose";



const createPlayerPoints = (req: Request, res: Response, next: NextFunction) => {
    const { tournamentId, playerName, horse, flag, playerId } = req.body;
    const playerPoints = new PlayerPoints({
        _id: new mongoose.Types.ObjectId(),
        tournamentId: tournamentId,
        playerName: playerName,
        horse: horse,
        flag: flag,
        playerId: playerId,

    });
    return playerPoints
        .save()
        .then((playerPoints) => res.status(201).json(playerPoints))
        .catch((err) => res.status(500).json({ err }));
};


const readPlayerPoints = (req: Request, res: Response, next: NextFunction) => {
    const playerPointsId = req.params.playerPointsId;

    return PlayerPoints.findById(playerPointsId)
        .then((playerPoints) =>
            playerPoints
                ? res.status(200).json(playerPoints)
                : res.status(404).json({ message: "Not found" })
        )
        .catch((err) => res.status(500).json({ err }));
};

const readAll = (req: Request, res: Response, next: NextFunction) => {
    const tournamentId = req.params.tournamentId;
    return PlayerPoints.find({tournamentId:tournamentId})
        .then((playerPointss) => res.status(200).json(playerPointss))
        .catch((error) => res.status(500).json({ error }));
};

const updatePlayerPoints = (req: Request, res: Response, next: NextFunction) => {
    const playerPointsId = req.params.playerPointsId;
    return PlayerPoints.findById(playerPointsId)
        .then((playerPoints) => {
            if (playerPoints) {
                playerPoints.set(req.body);
                return playerPoints
                    .save()
                    .then((playerPoints) => res.status(201).json(playerPoints))
                    .catch((err) => res.status(500).json({ err }));
            } else {
                res.status(404).json({ message: "Not found" });
            }
        })
        .catch((err) => res.status(500).json({ err }));
};

const deletePlayerPoints = (req: Request, res: Response, next: NextFunction) => {
    const playerPointsId = req.params.playerPointsId;

    return PlayerPoints.findByIdAndDelete(playerPointsId)
        .then((playerPoints) => {
            playerPoints
                ? res.status(200).json({ message: "deleted" })
                : res.status(404).json({ message: "Not found" })
        }


        )
        .catch((err) => res.status(500).json({ err }));
};

const readAllForLeague = (req: Request, res: Response, next: NextFunction) => {
    const leagueId = req.params.leagueId;
    return PlayerPoints.find({ leagueId: leagueId })
        .then((playerPointss) => res.status(200).json(playerPointss))
        .catch((error) => res.status(500).json({ error }));
};

export default { createPlayerPoints, readAll, readPlayerPoints, updatePlayerPoints, deletePlayerPoints, readAllForLeague };