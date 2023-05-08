"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
const AccountControllers_1 = __importDefault(require("../controllers/AccountControllers"));
const extractJWT_1 = __importDefault(require("../middleware/extractJWT"));
const router = express_1.default.Router();
router.get('/validate', extractJWT_1.default.extractJWT, AccountControllers_1.default.validateToken);
router.post('/register', AccountControllers_1.default.register);
router.post('/login', AccountControllers_1.default.login);
router.get('/', AccountControllers_1.default.getAllAccounts);
router.post('/refreshToken', extractJWT_1.default.extractJWTRefresh, AccountControllers_1.default.getRefreshToken);
module.exports = router;
