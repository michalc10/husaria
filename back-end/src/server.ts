import express, { Express, Request, Response } from "express";
import mongoose from "mongoose";
import http from "http";
import { config } from "./config/config";
import Logging from "./library/Logging";
import accountRounte from './routes/AccountRoutes'
import bookRouter from './routes/BookRoutes'
import BookDetailsRoute from './routes/BookDetailsRoutes'
import BorrowBooksRoutes from './routes/BorrowBooksRoutes'
import extract from "./middleware/extractJWT";
import UserPermissionRoutes from "./routes/UserPermissionRoutes";
import AdminPermissionRoutes from "./routes/AdminPermissionRoutes";

const app: Express = express();



mongoose.set("strictQuery", false);
mongoose
  .connect(config.mongo.url, { retryWrites: true, w: "majority" })
  .then(() => {
    Logging.info("Conected to MongoDB");
    StartServer();
  })
  .catch((err) => {
    Logging.error("Unable to conect: MongoDB");
    Logging.error(err);
  });

const StartServer = () => {
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.use((req, res, next) => {
    Logging.info(
      `Incoming -> Method: [${req.method}] - Url: [${req.url}] - IP: [${req.socket.remoteAddress}]`
    );

    res.on("finish", () => {
      Logging.info(
        `Incoming -> Method: [${req.method}] - Url: [${req.url}] - IP: [${req.socket.remoteAddress}] - Status: [${res.statusCode}]`
      );
    });

    next();
  });

  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );

    if (req.method == "OPTIONS") {
      res.header(
        "Access-Control-Allow-Methods",
        "PUT, POST, PATCH, DELETE, GET"
      );
      return res.status(200).json({});
    }

    next();
  });
  app.use('/account', accountRounte);
  app.use('/books', bookRouter);
  app.use('/bookDetails', BookDetailsRoute);
  app.use('/borrowBooks', BorrowBooksRoutes);
  app.use('/userPermission', UserPermissionRoutes);
  app.use('/adminPermission', AdminPermissionRoutes);



  app.get("/ping", (req, res, next) =>
    res.status(200).json({ message: "pong" })
  );

  app.use((req, res, next) => {
    const error = new Error('Not found');
    Logging.error(error);

    return res.status(404).json({ message: error.message });
  })

  http.createServer(app).listen(config.server.port, () => Logging.info(`server is runing on port ${config.server.port}`));
};
