"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const AccountModel_1 = __importDefault(require("../models/AccountModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const Logging_1 = __importDefault(require("../library/Logging"));
const signJWT_1 = __importDefault(require("../functions/signJWT"));
const config_1 = require("../config/config");
const UserPermissionModel_1 = __importDefault(require("../models/UserPermissionModel"));
// const jwt_decode = require('jwt-decode');
const NAMESPACE = 'Account';
const validateToken = (req, res, next) => {
    Logging_1.default.info(NAMESPACE + ' Token validated, account authorized.');
    return res.status(200).json({
        message: 'Token(s) validated'
    });
};
const register = (req, res, next) => {
    let { username, password, isAdmin, token } = req.body;
    bcryptjs_1.default.hash(password, 10, (hashError, hash) => {
        if (hashError) {
            return res.status(401).json({
                message: hashError.message,
                error: hashError
            });
        }
        const _account = new AccountModel_1.default({
            _id: new mongoose_1.default.Types.ObjectId(),
            username,
            password: hash,
            isAdmin,
            token
        });
        return _account
            .save()
            .then((account) => {
            const _userPermission = new UserPermissionModel_1.default({
                _id: new mongoose_1.default.Types.ObjectId(),
                userId: account._id,
                username: account.username,
                canComments: true,
                canRate: true,
                canShowBooks: true
            }).save()
                .catch((error) => { console.log("error while creating userPermission", error); });
            return res.status(201).json({
                account
            });
        })
            .catch((error) => {
            return res.status(500).json({
                message: error.message,
                error
            });
        });
    });
};
const login = (req, res, next) => {
    let { username, password } = req.body;
    AccountModel_1.default.find({ username })
        .exec()
        .then((accounts) => {
        if (accounts.length !== 1) {
            return res.status(401).json({
                message: 'Unauthorized'
            });
        }
        bcryptjs_1.default.compare(password, accounts[0].password, (error, result) => {
            if (error) {
                return res.status(401).json({
                    message: 'Password Mismatch'
                });
            }
            else if (result) {
                (0, signJWT_1.default)(accounts[0], (_error, token) => {
                    if (_error) {
                        return res.status(500).json({
                            message: _error.message,
                            error: _error
                        });
                    }
                    else if (token) {
                        return res.status(200).json({
                            message: 'Auth successful',
                            refreshToken: token,
                            token: jsonwebtoken_1.default.sign({}, config_1.config.token.secret, {
                                issuer: config_1.config.token.issuer,
                                algorithm: "HS256",
                                expiresIn: '15m',
                            }),
                            account: accounts[0]
                        });
                    }
                });
            }
        });
    })
        .catch((err) => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });
};
const getAllAccounts = (req, res, next) => {
    AccountModel_1.default.find()
        .select('-password')
        .exec()
        .then((accounts) => {
        return res.status(200).json(accounts);
    })
        .catch((error) => {
        return res.status(500).json({
            message: error.message,
            error
        });
    });
};
const getRefreshToken = (req, res, next) => {
    const token = req.headers.authorization;
    const username = JSON.parse(atob(token.split('.')[1]))['username'];
    AccountModel_1.default.find({ username })
        .exec()
        .then((accounts) => {
        if (accounts.length !== 1) {
            return res.status(401).json({
                message: 'Cannot find user'
            });
        }
        return res.status(200).json({
            message: 'Token',
            token: jsonwebtoken_1.default.sign({}, config_1.config.token.secret, {
                issuer: config_1.config.token.issuer,
                algorithm: "HS256",
                expiresIn: '15m',
            }),
        });
    })
        .catch((err) => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });
};
exports.default = { validateToken, register, login, getAllAccounts, getRefreshToken };
