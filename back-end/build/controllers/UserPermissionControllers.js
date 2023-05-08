"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const UserPermissionModel_1 = __importDefault(require("../models/UserPermissionModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const createUserPermission = (req, res, next) => {
    const { userId, username, canComments, canRate, canShowBooks } = req.body;
    const userPermission = new UserPermissionModel_1.default({
        _id: new mongoose_1.default.Types.ObjectId(),
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
const readUserPermission = (req, res, next) => {
    const userPermissionId = req.params.userPermissionId;
    return UserPermissionModel_1.default.findById(userPermissionId)
        .then((userPermission) => userPermission
        ? res.status(200).json({ userPermission })
        : res.status(404).json({ message: "Not found" }))
        .catch((err) => res.status(500).json({ err }));
};
const readAll = (req, res, next) => {
    return UserPermissionModel_1.default.find()
        .then((userPermissions) => res.status(200).json(userPermissions))
        .catch((error) => res.status(500).json({ error }));
};
const updateUserPermission = (req, res, next) => {
    const userPermissionId = req.params.userPermissionId;
    return UserPermissionModel_1.default.findById(userPermissionId)
        .then((userPermission) => {
        if (userPermission) {
            userPermission.set(req.body);
            return userPermission
                .save()
                .then((userPermission) => res.status(201).json(userPermission))
                .catch((err) => res.status(500).json({ err }));
        }
        else {
            res.status(404).json({ message: "Not found" });
        }
    })
        .catch((err) => res.status(500).json({ err }));
};
const deleteUserPermission = (req, res, next) => {
    const userPermissionId = req.params.userPermissionId;
    return UserPermissionModel_1.default.findByIdAndDelete(userPermissionId)
        .then((userPermission) => userPermission
        ? res.status(200).json({ message: "deleted" })
        : res.status(404).json({ message: "Not found" }))
        .catch((err) => res.status(500).json({ err }));
};
exports.default = { createUserPermission, readAll, readUserPermission, updateUserPermission, deleteUserPermission };
