"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const http_1 = __importDefault(require("http"));
const config_1 = require("./config/config");
const Logging_1 = __importDefault(require("./library/Logging"));
const AccountRoutes_1 = __importDefault(require("./routes/AccountRoutes"));
const BookRoutes_1 = __importDefault(require("./routes/BookRoutes"));
const BookDetailsRoutes_1 = __importDefault(require("./routes/BookDetailsRoutes"));
const BorrowBooksRoutes_1 = __importDefault(require("./routes/BorrowBooksRoutes"));
const extractJWT_1 = __importDefault(require("./middleware/extractJWT"));
const UserPermissionRoutes_1 = __importDefault(require("./routes/UserPermissionRoutes"));
const AdminPermissionRoutes_1 = __importDefault(require("./routes/AdminPermissionRoutes"));
const app = (0, express_1.default)();
mongoose_1.default.set("strictQuery", false);
mongoose_1.default
    .connect(config_1.config.mongo.url, { retryWrites: true, w: "majority" })
    .then(() => {
    Logging_1.default.info("Conected to MongoDB");
    StartServer();
})
    .catch((err) => {
    Logging_1.default.error("Unable to conect: MongoDB");
    Logging_1.default.error(err);
});
const StartServer = () => {
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use(express_1.default.json());
    app.use((req, res, next) => {
        Logging_1.default.info(`Incoming -> Method: [${req.method}] - Url: [${req.url}] - IP: [${req.socket.remoteAddress}]`);
        res.on("finish", () => {
            Logging_1.default.info(`Incoming -> Method: [${req.method}] - Url: [${req.url}] - IP: [${req.socket.remoteAddress}] - Status: [${res.statusCode}]`);
        });
        next();
    });
    app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
        if (req.method == "OPTIONS") {
            res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
            return res.status(200).json({});
        }
        next();
    });
    app.use('/account', AccountRoutes_1.default);
    app.use('/books', BookRoutes_1.default);
    app.use('/bookDetails', extractJWT_1.default.extractJWT, BookDetailsRoutes_1.default);
    app.use('/borrowBooks', extractJWT_1.default.extractJWT, BorrowBooksRoutes_1.default);
    app.use('/userPermission', extractJWT_1.default.extractJWT, UserPermissionRoutes_1.default);
    app.use('/adminPermission', extractJWT_1.default.extractJWT, AdminPermissionRoutes_1.default);
    app.get("/ping", (req, res, next) => res.status(200).json({ message: "pong" }));
    app.use((req, res, next) => {
        const error = new Error('Not found');
        Logging_1.default.error(error);
        return res.status(404).json({ message: error.message });
    });
    http_1.default.createServer(app).listen(config_1.config.server.port, () => Logging_1.default.info(`server is runing on port ${config_1.config.server.port}`));
};
