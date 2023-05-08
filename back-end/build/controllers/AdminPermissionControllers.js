"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AdminPermissionModel_1 = __importDefault(require("../models/AdminPermissionModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const createAdminPermission = (req, res, next) => {
    const { userId, username, canAdd, canChange, canDelete, canShowBooks } = req.body;
    const adminPermission = new AdminPermissionModel_1.default({
        _id: new mongoose_1.default.Types.ObjectId(),
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
const readAdminPermission = (req, res, next) => {
    const adminPermissionId = req.params.adminPermissionId;
    return AdminPermissionModel_1.default.findById(adminPermissionId)
        .then((adminPermission) => adminPermission
        ? res.status(200).json({ adminPermission })
        : res.status(404).json({ message: "Not found" }))
        .catch((err) => res.status(500).json({ err }));
};
const readAll = (req, res, next) => {
    return AdminPermissionModel_1.default.find()
        .then((adminPermissions) => res.status(200).json(adminPermissions))
        .catch((error) => res.status(500).json({ error }));
};
const updateAdminPermission = (req, res, next) => {
    const adminPermissionId = req.params.adminPermissionId;
    return AdminPermissionModel_1.default.findById(adminPermissionId)
        .then((adminPermission) => {
        if (adminPermission) {
            adminPermission.set(req.body);
            return adminPermission
                .save()
                .then((adminPermission) => res.status(201).json(adminPermission))
                .catch((err) => res.status(500).json({ err }));
        }
        else {
            res.status(404).json({ message: "Not found" });
        }
    })
        .catch((err) => res.status(500).json({ err }));
};
const deleteAdminPermission = (req, res, next) => {
    const adminPermissionId = req.params.adminPermissionId;
    return AdminPermissionModel_1.default.findByIdAndDelete(adminPermissionId)
        .then((adminPermission) => adminPermission
        ? res.status(200).json({ message: "deleted" })
        : res.status(404).json({ message: "Not found" }))
        .catch((err) => res.status(500).json({ err }));
};
exports.default = { createAdminPermission, readAll, readAdminPermission, updateAdminPermission, deleteAdminPermission };
