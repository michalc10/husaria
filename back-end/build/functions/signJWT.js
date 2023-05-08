"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config/config");
const Logging_1 = __importDefault(require("../library/Logging"));
const UserPermissionModel_1 = __importDefault(require("../models/UserPermissionModel"));
const AdminPermissionModel_1 = __importDefault(require("../models/AdminPermissionModel"));
const NAMESPACE = "Auth ";
const signJWT = (account, callback) => {
    Logging_1.default.info(NAMESPACE + `Attempting to sign token for ${account._id}`);
    var timeSinceEpoch = new Date().getTime();
    var expirationTime = timeSinceEpoch + Number(config_1.config.token.expireTime) * 100000;
    var expirationTimeInSeconds = Math.floor(expirationTime / 1000);
    const id = account._id;
    let permissions = {};
    if (account.isAdmin === 'User') {
        UserPermissionModel_1.default.find({ userId: id })
            .then(data => {
            try {
                jsonwebtoken_1.default.sign({
                    idUser: account._id,
                    username: account.username,
                    role: account.isAdmin,
                    permissions: data[0]
                }, config_1.config.token.refreshsecret, {
                    issuer: config_1.config.token.issuer,
                    algorithm: "HS256",
                    expiresIn: expirationTimeInSeconds,
                }, (error, token) => {
                    if (error) {
                        callback(error, null);
                    }
                    else if (token) {
                        callback(null, token);
                    }
                });
            }
            catch (error) {
                Logging_1.default.error(NAMESPACE + error.message + ' ' + error);
                callback(error, null);
            }
        });
    }
    else {
        AdminPermissionModel_1.default.find({ userId: id })
            .then(data => {
            try {
                jsonwebtoken_1.default.sign({
                    idUser: account._id,
                    username: account.username,
                    role: account.isAdmin,
                    permissions: data[0]
                }, config_1.config.token.refreshsecret, {
                    issuer: config_1.config.token.issuer,
                    algorithm: "HS256",
                    expiresIn: expirationTimeInSeconds,
                }, (error, token) => {
                    if (error) {
                        callback(error, null);
                    }
                    else if (token) {
                        callback(null, token);
                    }
                });
            }
            catch (error) {
                Logging_1.default.error(NAMESPACE + error.message + ' ' + error);
                callback(error, null);
            }
        });
    }
    //
    //
};
exports.default = signJWT;
