"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config/config");
const Logging_1 = __importDefault(require("../library/Logging"));
const NAMESPACE = "Auth";
const extractJWT = (req, res, next) => {
    var _a;
    Logging_1.default.info(NAMESPACE + " Validating token");
    let token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
    if (token) {
        jsonwebtoken_1.default.verify(token, config_1.config.token.secret, (error, decoded) => {
            if (error) {
                return res.status(404).json({
                    message: error.message,
                    error,
                });
            }
            else {
                res.locals.jwt = decoded;
                next();
            }
        });
    }
    else {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }
};
const extractJWTRefresh = (req, res, next) => {
    var _a;
    Logging_1.default.info(NAMESPACE + " Validating refresh token");
    let token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
    if (token) {
        jsonwebtoken_1.default.verify(token, config_1.config.token.refreshsecret, (error, decoded) => {
            if (error) {
                Logging_1.default.info(NAMESPACE + " Validating refresh token :(");
                return res.status(404).json({
                    message: error.message,
                    error,
                });
            }
            else {
                res.locals.jwt = decoded;
                next();
            }
        });
    }
    else {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }
};
exports.default = { extractJWT, extractJWTRefresh };
