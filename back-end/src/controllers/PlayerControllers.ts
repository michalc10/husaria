import { NextFunction, Request, Response, request } from "express";
import { Player } from "../models/PlayerModel";
import mongoose from "mongoose";



const createPlayer = (req: Request, res: Response, next: NextFunction) => {
    const { name, horse, flag } = req.body;
    console.log("hej")
    const player = new Player({
        _id: new mongoose.Types.ObjectId(),
        name: name,
        horse: horse,
        flag: flag,

    });
    return player
        .save()
        .then((player) => res.status(201).json(player))
        .catch((err) => res.status(500).json({ err }));
};


const readPlayer = (req: Request, res: Response, next: NextFunction) => {
    const playerId = req.params.playerId;

    return Player.findById(playerId)
        .then((player) =>
            player
                ? res.status(200).json(player)
                : res.status(404).json({ message: "Not found" })
        )
        .catch((err) => res.status(500).json({ err }));
};

const readAll = (req: Request, res: Response, next: NextFunction) => {
    return Player.find()
        .then((players) => res.status(200).json(players))
        .catch((error) => res.status(500).json({ error }));
};

const updatePlayer = (req: Request, res: Response, next: NextFunction) => {
    const playerId = req.params.playerId;
    return Player.findById(playerId)
        .then((player) => {
            if (player) {
                player.set(req.body);
                return player
                    .save()
                    .then((player) => res.status(201).json(player))
                    .catch((err) => res.status(500).json({ err }));
            } else {
                res.status(404).json({ message: "Not found" });
            }
        })
        .catch((err) => res.status(500).json({ err }));
};

const deletePlayer = (req: Request, res: Response, next: NextFunction) => {
    const playerId = req.params.playerId;

    return Player.findByIdAndDelete(playerId)
        .then((player) => {
            player
                ? res.status(200).json({ message: "deleted" })
                : res.status(404).json({ message: "Not found" })
        }


        )
        .catch((err) => res.status(500).json({ err }));
};


export default { createPlayer, readAll, readPlayer, updatePlayer, deletePlayer };