import { NextFunction, Request, Response } from "express";
import AdminPermission from "../models/AdminPermissionModel";
import mongoose from "mongoose";



const createAdminPermission = (req: Request, res: Response, next: NextFunction) => {
    const { userId, username, canAdd, canChange, canDelete, canShowBooks } = req.body;

    const adminPermission = new AdminPermission({
        _id: new mongoose.Types.ObjectId(),
        userId: userId,
        username: username,
        canAdd: canAdd,
        canChange: canChange,
        canDelete: canDelete,
        canShowBooks: canShowBooks

    });
    return adminPermission
        .save()
        .then((adminPermission) => res.status(201).json(adminPermission))
        .catch((err) => res.status(500).json({ err }));
};


const readAdminPermission = (req: Request, res: Response, next: NextFunction) => {
    const adminPermissionId = req.params.adminPermissionId;

    return AdminPermission.findById(adminPermissionId)
        .then((adminPermission) =>
            adminPermission
                ? res.status(200).json({ adminPermission })
                : res.status(404).json({ message: "Not found" })
        )
        .catch((err) => res.status(500).json({ err }));
};

const readAll = (req: Request, res: Response, next: NextFunction) => {
    return AdminPermission.find()
        .then((adminPermissions) => res.status(200).json(adminPermissions))
        .catch((error) => res.status(500).json({ error }));
};

const updateAdminPermission = (req: Request, res: Response, next: NextFunction) => {
    const adminPermissionId = req.params.adminPermissionId;

    return AdminPermission.findById(adminPermissionId)
        .then((adminPermission) => {
            if (adminPermission) {
                adminPermission.set(req.body);
                return adminPermission
                    .save()
                    .then((adminPermission) => res.status(201).json(adminPermission))
                    .catch((err) => res.status(500).json({ err }));
            } else {
                res.status(404).json({ message: "Not found" });
            }
        })
        .catch((err) => res.status(500).json({ err }));
};

const deleteAdminPermission = (req: Request, res: Response, next: NextFunction) => {
    const adminPermissionId = req.params.adminPermissionId;

    return AdminPermission.findByIdAndDelete(adminPermissionId)
        .then((adminPermission) =>
            adminPermission
                ? res.status(200).json({ message: "deleted" })
                : res.status(404).json({ message: "Not found" })
        )
        .catch((err) => res.status(500).json({ err }));
};


export default { createAdminPermission, readAll, readAdminPermission, updateAdminPermission, deleteAdminPermission };