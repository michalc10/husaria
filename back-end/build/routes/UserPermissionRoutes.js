"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
const UserPermissionControllers_1 = __importDefault(require("../controllers/UserPermissionControllers"));
const router = express_1.default.Router();
router.get('/', UserPermissionControllers_1.default.readAll);
router.get('/:userPermissionId', UserPermissionControllers_1.default.readUserPermission);
router.post('/', UserPermissionControllers_1.default.createUserPermission);
router.put('/:userPermissionId', UserPermissionControllers_1.default.updateUserPermission);
router.delete('/:userPermissionId', UserPermissionControllers_1.default.deleteUserPermission);
module.exports = router;
