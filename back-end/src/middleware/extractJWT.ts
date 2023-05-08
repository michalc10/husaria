import jwt from "jsonwebtoken";
import { config } from "../config/config";
import Logging from "../library/Logging";
import { Request, Response, NextFunction } from "express";

const NAMESPACE = "Auth";

const extractJWT = (req: Request, res: Response, next: NextFunction) => {
  Logging.info(NAMESPACE + " Validating token");

  let token = req.headers.authorization?.split(" ")[1];

  if (token) {
    jwt.verify(
      token,
      config.token.secret,
      (error: any, decoded: any) => {
        if (error) {
          return res.status(404).json({
            message: error.message,
            error,
          });
        } else {
          res.locals.jwt = decoded;
          next();
        }
      }
    );
  } else {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
};

const extractJWTRefresh = (req: Request, res: Response, next: NextFunction) => {
  Logging.info(NAMESPACE + " Validating refresh token");

  let token = req.headers.authorization?.split(" ")[1];
  if (token) {
    jwt.verify(
      token,
      config.token.refreshsecret,
      (error: any, decoded: any) => {
        if (error) {
          Logging.info(NAMESPACE + " Validating refresh token :(");
          return res.status(404).json({
            message: error.message,
            error,
          });
        } else {
          res.locals.jwt = decoded;
          next();
        }
      }
    );
  } else {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
};

export default {extractJWT, extractJWTRefresh};
