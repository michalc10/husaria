import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import Account from "../models/AccountModel";
import mongoose from "mongoose";
import bcryptjs from 'bcryptjs';
import Logging from "../library/Logging";
import signJWT from '../functions/signJWT';
import { config } from "../config/config";
import UserPermission from "../models/UserPermissionModel";
// const jwt_decode = require('jwt-decode');

const NAMESPACE = 'Account';

const validateToken = (req: Request, res: Response, next: NextFunction) => {
    Logging.info(NAMESPACE + ' Token validated, account authorized.');

    return res.status(200).json({
        message: 'Token(s) validated'
    });
};

const register = (req: Request, res: Response, next: NextFunction) => {
    let { username, password, isAdmin, token } = req.body;

    bcryptjs.hash(password, 10, (hashError, hash) => {
        if (hashError) {
            return res.status(401).json({
                message: hashError.message,
                error: hashError
            });
        }

        const _account = new Account({
            _id: new mongoose.Types.ObjectId(),
            username,
            password: hash,
            isAdmin,
            token
        });

        return _account
            .save()
            .then((account) => {

                const _userPermission = new UserPermission({
                    _id: new mongoose.Types.ObjectId(),
                    userId: account._id,
                    username: account.username,
                    canComments: true,
                    canRate: true,
                    canShowBooks: true
                }).save()
                    .catch((error) => { console.log("error while creating userPermission", error) })

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

const login = (req: Request, res: Response, next: NextFunction) => {
    let { username, password } = req.body;

    Account.find({ username })
        .exec()
        .then((accounts) => {
            if (accounts.length !== 1) {
                return res.status(401).json({
                    message: 'Unauthorized'
                });
            }

            bcryptjs.compare(password, accounts[0].password, (error, result) => {
                if (error) {
                    return res.status(401).json({
                        message: 'Password Mismatch'
                    });
                } else if (result) {
                    signJWT(accounts[0], (_error: any, token: any) => {
                        if (_error) {
                            return res.status(500).json({
                                message: _error.message,
                                error: _error
                            });
                        } else if (token) {
                            return res.status(200).json({
                                message: 'Auth successful',
                                refreshToken: token,
                                token: jwt.sign({}, config.token.secret,
                                    {
                                        issuer: config.token.issuer,
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

const getAllAccounts = (req: Request, res: Response, next: NextFunction) => {
    Account.find()
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


const getRefreshToken = (req: Request, res: Response, next: NextFunction) => {


    const token = req.headers.authorization!
    const username = JSON.parse(atob(token.split('.')[1]))['username'];

    Account.find({ username })
        .exec()
        .then((accounts) => {
            if (accounts.length !== 1) {
                return res.status(401).json({
                    message: 'Cannot find user'
                });
            }
            return res.status(200).json({
                message: 'Token',
                token: jwt.sign({}, config.token.secret,
                    {
                        issuer: config.token.issuer,
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

}


export default { validateToken, register, login, getAllAccounts, getRefreshToken };