import { NextFunction, Request, Response } from "express";
import UserPermission from "../models/UserPermissionModel";
import mongoose from "mongoose";



const createUserPermission = (req: Request, res: Response, next: NextFunction) => {
    const { userId, username, canComments, canRate, canShowBooks } = req.body;
    const userPermission = new UserPermission({
        _id: new mongoose.Types.ObjectId(),
        userId: userId,
        username: username,
        canComments: canComments,
        canRate: canRate,
        canShowBooks: canShowBooks

    });
    return userPermission
        .save()
        .then((userPermission) => res.status(201).json(userPermission))
        .catch((err) => res.status(500).json({ err }));
};


const readUserPermission = (req: Request, res: Response, next: NextFunction) => {
    const userPermissionId = req.params.userPermissionId;

    return UserPermission.findById(userPermissionId)
        .then((userPermission) =>
            userPermission
                ? res.status(200).json({ userPermission })
                : res.status(404).json({ message: "Not found" })
        )
        .catch((err) => res.status(500).json({ err }));
};

const readAll = (req: Request, res: Response, next: NextFunction) => {
    return UserPermission.find()
        .then((userPermissions) => res.status(200).json(userPermissions))
        .catch((error) => res.status(500).json({ error }));
};

const updateUserPermission = (req: Request, res: Response, next: NextFunction) => {
    const userPermissionId = req.params.userPermissionId;

    return UserPermission.findById(userPermissionId)
        .then((userPermission) => {
            if (userPermission) {
                userPermission.set(req.body);
                return userPermission
                    .save()
                    .then((userPermission) => res.status(201).json(userPermission))
                    .catch((err) => res.status(500).json({ err }));
            } else {
                res.status(404).json({ message: "Not found" });
            }
        })
        .catch((err) => res.status(500).json({ err }));
};

const deleteUserPermission = (req: Request, res: Response, next: NextFunction) => {
    const userPermissionId = req.params.userPermissionId;

    return UserPermission.findByIdAndDelete(userPermissionId)
        .then((userPermission) =>
            userPermission
                ? res.status(200).json({ message: "deleted" })
                : res.status(404).json({ message: "Not found" })
        )
        .catch((err) => res.status(500).json({ err }));
};


export default { createUserPermission, readAll, readUserPermission, updateUserPermission, deleteUserPermission };